import cron from "node-cron";
import { supabaseStorage, PHOTOS_BUCKET } from "../lib/supabase.js";
import {
  backfillInstagramHandles,
  getInstagramProfilesNeedingSync,
  applyApifySyncResult,
  extractHandle
} from "../lib/db.js";

// Profiles synced within the last SYNC_STALE_DAYS are skipped, so a manual
// admin trigger the same day the daily cron already ran doesn't burn extra
// Apify credits re-fetching profiles that are still fresh.
const SYNC_STALE_DAYS = 1;

const APIFY_ACTOR = "apify~instagram-profile-scraper";

// Global state tracking the status of the sync
export let currentSync = {
  isSyncing: false,
  progress: 0,
  step: "idle", // 'idle' | 'extracting' | 'syncing' | 'saving' | 'success' | 'error'
  elapsed: 0,
  error: null as string | null,
  updatedCount: 0
};

// Getter function for safe ESM access
export function getCurrentSyncState() {
  return currentSync;
}

// Helper to reset sync state
export function resetSyncState() {
  currentSync = {
    isSyncing: false,
    progress: 0,
    step: "idle",
    elapsed: 0,
    error: null,
    updatedCount: 0
  };
}

export function getApifyToken(): string {
  return (process.env.APIFY_TOKEN || process.env.APIFY_API_TOKEN || "").trim();
}

export function validateApifyCredentials() {
  const token = getApifyToken();
  if (!token || token === "") {
    console.error("[APIFY] ERRO CRÍTICO DE CREDENCIAIS: O token da API do Apify está ausente ou vazio.");
    throw new Error("Erro de Autenticação: O Token da API do Apify está ausente ou vazio. Configure a variável de ambiente APIFY_TOKEN ou APIFY_API_TOKEN.");
  }
  if (token === "YOUR_APIFY_TOKEN" || token === "placeholder") {
    console.error("[APIFY] ERRO CRÍTICO DE CREDENCIAIS: O token do Apify é um placeholder inválido.");
    throw new Error("Erro de Autenticação: O Token da API do Apify é um placeholder inválido. Forneça uma chave de API real.");
  }
}

export const extractCleanUsername = extractHandle;

// Helper to download an image from a URL and upload it permanently to Supabase Storage
export async function downloadAndUploadProfilePic(influencerId: string, photoUrl: string): Promise<string> {
  try {
    console.log(`[STORAGE] Iniciando download da imagem de perfil de: ${photoUrl}`);
    const response = await fetch(photoUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache"
      }
    });
    if (!response.ok) {
      throw new Error(`Erro ao buscar imagem externa: HTTP ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Clean and define the target path inside the Supabase Storage bucket
    const cleanId = influencerId.replace(/[^a-zA-Z0-9_-]/g, "");
    const storagePath = `influencers/${cleanId}_profile.jpg`;
    console.log(`[STORAGE] Fazendo upload do arquivo de imagem para Supabase Storage: ${storagePath}`);

    const { error: uploadError } = await supabaseStorage.storage
      .from(PHOTOS_BUCKET)
      .upload(storagePath, buffer, {
        contentType: "image/jpeg",
        upsert: true
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data: publicUrlData } = supabaseStorage.storage.from(PHOTOS_BUCKET).getPublicUrl(storagePath);
    console.log(`[STORAGE] Upload bem sucedido! URL permanente obtida: ${publicUrlData.publicUrl}`);
    return publicUrlData.publicUrl;
  } catch (err: any) {
    console.error(`[STORAGE] Erro ao baixar ou salvar imagem de perfil no Storage para o influenciador ${influencerId}:`, err.message || err);
    throw err;
  }
}

// Single blocking call: Apify runs the actor and hands back the dataset items directly,
// so there's no separate trigger/poll/fetch-dataset dance to manage here.
async function fetchInstagramProfiles(usernames: string[], token: string): Promise<any[]> {
  const url = `https://api.apify.com/v2/acts/${APIFY_ACTOR}/run-sync-get-dataset-items?token=${token}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usernames })
  });

  if (res.status === 401 || res.status === 403) {
    console.error("[APIFY] CHAVE DE API (TOKEN) REJEITADA PELO APIFY! Status HTTP:", res.status);
    throw new Error(`Erro de Autenticação: A chave do Apify (API Token) foi rejeitada (HTTP ${res.status}). Configure a chave real em APIFY_TOKEN.`);
  }

  if (res.status === 402) {
    console.error("[APIFY] ERRO DE COTA/CRÉDITO NO APIFY! Status HTTP 402");
    throw new Error("Erro de Cota: O limite de créditos da conta do Apify foi excedido (HTTP 402).");
  }

  if (!res.ok) {
    console.error(`[APIFY] Falha ao executar o Instagram Profile Scraper. Status HTTP: ${res.status}`);
    throw new Error(`Falha ao executar o Instagram Profile Scraper no Apify: HTTP ${res.status}`);
  }

  return await res.json() as any[];
}

// Primary execution sync function
export async function runApifySync() {
  if (currentSync.isSyncing) {
    throw new Error("Uma sincronização já está em andamento.");
  }

  currentSync = {
    isSyncing: true,
    progress: 5,
    step: "extracting",
    elapsed: 0,
    error: null,
    updatedCount: 0
  };

  const timer = setInterval(() => {
    if (currentSync.isSyncing) {
      currentSync.elapsed += 1;
    }
  }, 1000);

  try {
    validateApifyCredentials();
    const token = getApifyToken();

    console.log("[APIFY] Preenchendo handle_normalizado ausente e buscando perfis do Instagram pendentes de sincronização...");
    await backfillInstagramHandles();
    const profiles = await getInstagramProfilesNeedingSync(SYNC_STALE_DAYS);

    if (profiles.length === 0) {
      console.log("[APIFY] Nenhum perfil do Instagram precisa de sincronização no momento.");
      currentSync.progress = 100;
      currentSync.step = "success";
      currentSync.updatedCount = 0;
      currentSync.isSyncing = false;
      clearInterval(timer);
      return { success: true, updatedCount: 0 };
    }

    currentSync.progress = 20;
    currentSync.step = "syncing";

    const usernames = profiles.map(p => p.handle_normalizado).filter(Boolean) as string[];
    console.log(`[APIFY] Disparando execução do robô com ${usernames.length} usuário(s):`, usernames);

    const items = await fetchInstagramProfiles(usernames, token);
    console.log(`[APIFY] Recebeu ${items.length} resultado(s) do dataset. Aplicando atualizações...`);

    currentSync.progress = 80;
    currentSync.step = "saving";

    const profileByHandle = new Map(profiles.map(p => [p.handle_normalizado, p]));
    const foundHandles = new Set<string>();
    let updatedCount = 0;

    for (const item of items) {
      const itemHandle = extractHandle(item.username || "");
      const profile = itemHandle ? profileByHandle.get(itemHandle) : undefined;
      if (!profile) continue;

      // Apify returns an item even for profiles it couldn't scrape (private, deleted,
      // wrong username), shaped like { error: "not_found", errorDescription: "..." }
      // with no followersCount. Treat that as not-found: skip, don't touch existing data.
      if (item.error || item.followersCount === undefined || item.followersCount === null) {
        console.warn(`[APIFY] Perfil @${itemHandle} não retornou dados válidos da Apify (${item.error || "sem followersCount"}: ${item.errorDescription || "sem detalhes"}). Dados existentes preservados.`);
        continue;
      }

      foundHandles.add(itemHandle);

      const followersCount = Number(item.followersCount) || 0;
      let fotoUrl = profile.foto_perfil_url || undefined;

      if (item.profilePicUrl) {
        try {
          fotoUrl = await downloadAndUploadProfilePic(profile.id, item.profilePicUrl);
        } catch (picErr: any) {
          console.warn(`[APIFY] Falha ao baixar/uploadar foto para @${itemHandle}. Mantendo foto atual.`, picErr.message);
        }
      }

      const fields: { seguidores: number; foto_perfil_url?: string; nome_completo?: string } = {
        seguidores: followersCount,
        foto_perfil_url: fotoUrl
      };

      // Only fill nome_completo if it's currently empty — never overwrite a manually typed name.
      if (!profile.nome_completo && item.fullName) {
        fields.nome_completo = item.fullName;
      }

      try {
        await applyApifySyncResult(profile.id, fields);
        updatedCount++;
      } catch (updateErr: any) {
        console.error(`[APIFY] Falha ao salvar sincronização para @${itemHandle}:`, updateErr.message);
      }
    }

    const notFound = profiles.filter(p => p.handle_normalizado && !foundHandles.has(p.handle_normalizado));
    if (notFound.length > 0) {
      console.warn(
        `[APIFY] ${notFound.length} perfil(is) não encontrado(s) pela Apify (privado, removido ou username incorreto). Dados existentes preservados:`,
        notFound.map(p => p.handle_normalizado).join(", ")
      );
    }

    currentSync.progress = 100;
    currentSync.step = "success";
    currentSync.updatedCount = updatedCount;
    currentSync.isSyncing = false;

    clearInterval(timer);
    return { success: true, updatedCount };
  } catch (err: any) {
    console.error("[APIFY] Falha total na sincronização de dados reais do Instagram:", err.message || err);
    currentSync.step = "error";
    currentSync.progress = 100;
    currentSync.error = err.message || "Erro desconhecido na sincronização.";
    currentSync.isSyncing = false;
    clearInterval(timer);
    throw err;
  }
}

// Background cron scheduler to run automatically once a day at midnight ("0 0 * * *").
// This is intentionally the only automatic trigger — the app never fires a sync on
// server startup or on public storefront visits, to avoid burning Apify credits.
export function setupBackgroundCron() {
  console.log("[CRON] Inicializando agendador de tarefas em segundo plano (Serviço de Atualização)...");

  cron.schedule("0 0 * * *", async () => {
    console.log("[CRON] Iniciando atualização automática diária de seguidores e fotos de perfil...");
    try {
      if (currentSync.isSyncing) {
        console.warn("[CRON] Uma sincronização já está em andamento. Ignorando execução diária automática.");
        return;
      }
      const result = await runApifySync();
      console.log(`[CRON] Sincronização automática diária concluída com sucesso! ${result.updatedCount} influenciadores atualizados.`);
    } catch (err: any) {
      console.error("[CRON] Erro na execução da tarefa diária agendada:", err.message || err);
    }
  });
  console.log("[CRON] Sincronização automática diária configurada com sucesso para as 00:00 (Meia-noite).");
}
