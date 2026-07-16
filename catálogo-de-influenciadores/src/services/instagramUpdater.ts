import cron from "node-cron";
import { db, storage } from "../lib/firebase.js";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { 
  dbGetAll, 
  dbUpdateApifyMatches, 
  getInfluencerPhoto 
} from "../lib/dbFallback.js";

// Helper to classify influencer based on followers count
function classifyInfluencer(followers: number): string {
  if (followers >= 0 && followers <= 999) return "Nanoinfluenciador";
  if (followers >= 1000 && followers <= 99999) return "Microinfluenciador";
  if (followers >= 100000 && followers <= 999999) return "Macro influencidor";
  return "Mega influenciador";
}

// Global state tracking the status of the sync
export let currentSync = {
  isSyncing: false,
  progress: 0,
  step: "idle", // 'idle' | 'extracting' | 'triggering' | 'polling' | 'saving' | 'success' | 'error'
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
  return (process.env.APIFY_TOKEN || process.env.APIFY_API_TOKEN || "apify_api_My1hkp7k9gnbagYQI1zHfNiAjsmjkh42aO5Z").trim();
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

export function extractCleanUsername(urlOrUsername: string): string {
  if (!urlOrUsername) return "";
  let input = urlOrUsername.trim();
  
  // If it's a URL, extract the last non-empty segment before query params
  if (input.includes("/") || input.includes("instagram.com")) {
    let cleanUrl = input.split("?")[0];
    cleanUrl = cleanUrl.replace(/\/+$/, "");
    const parts = cleanUrl.split("/");
    input = parts[parts.length - 1] || "";
  }
  
  // Clean @ character and any spaces, convert to lowercase
  return input.replace(/@/g, "").replace(/\s+/g, "").toLowerCase();
}

// Helper to download an image from a URL and upload it permanently to Firebase Storage
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
    
    // Clean and define the target path inside the Firebase Storage bucket
    const cleanId = influencerId.replace(/[^a-zA-Z0-9_-]/g, "");
    const storagePath = `influencers/${cleanId}_profile.jpg`;
    console.log(`[STORAGE] Fazendo upload do arquivo de imagem para Firebase Storage: ${storagePath}`);
    
    const storageRef = ref(storage, storagePath);
    const uploadResult = await uploadBytes(storageRef, buffer, {
      contentType: "image/jpeg",
      customMetadata: {
        downloadedAt: new Date().toISOString(),
        originalUrl: photoUrl,
        influencerId: influencerId
      }
    });
    
    const permanentUrl = await getDownloadURL(uploadResult.ref);
    console.log(`[STORAGE] Upload bem sucedido! URL permanente obtida: ${permanentUrl}`);
    return permanentUrl;
  } catch (err: any) {
    console.error(`[STORAGE] Erro ao baixar ou salvar imagem de perfil no Storage para o influenciador ${influencerId}:`, err.message || err);
    throw err;
  }
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
      // Incremental progress visualization
      if (currentSync.step === "polling" && currentSync.progress < 85) {
        currentSync.progress = Math.min(85, currentSync.progress + Math.ceil(Math.random() * 2));
      }
    }
  }, 1000);

  try {
    // 1. Validate API credentials at the very beginning
    validateApifyCredentials();
    const token = getApifyToken();

    console.log("[APIFY] Buscando URLs do banco de dados para sincronização...");
    
    // Extract and clean usernames
    const allInfluencers = await dbGetAll();
    const usernames = allInfluencers.map(inf => {
      return extractCleanUsername(inf.link_perfil || "");
    }).filter(Boolean);

    if (usernames.length === 0) {
      throw new Error("Nenhum influenciador cadastrado possui link de perfil para extrair username.");
    }

    currentSync.progress = 15;
    currentSync.step = "triggering";

    // 2. POST to trigger actor run
    const triggerUrl = `https://api.apify.com/v2/actor-runs/cmLiDQdn1NPjzKIGO?token=${token}`;
    console.log("[APIFY] Disparando execução do robô com usuários:", usernames);
    
    const triggerRes = await fetch(triggerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        includeAboutSection: false,
        usernames: usernames
      })
    });

    if (triggerRes.status === 401 || triggerRes.status === 403) {
      console.error("[APIFY] CHAVE DE API (TOKEN) REJEITADA PELO APIFY! Verifique se inseriu a chave real nas configurações do projeto. Status HTTP:", triggerRes.status);
      throw new Error(`Erro de Autenticação: A chave do Apify (API Token) enviada foi rejeitada (HTTP ${triggerRes.status}). Configure a chave real em APIFY_TOKEN nas configurações do projeto.`);
    }

    if (triggerRes.status === 402) {
      console.error("[APIFY] ERRO DE COTA/CRÉDITO NO APIFY! Limite de cota atingido ou assinatura expirada. Status HTTP 402");
      throw new Error("Erro de Cota: O limite de requisições ou créditos da conta do Apify foi excedido (HTTP 402). Por favor, verifique seus créditos no Apify.");
    }

    if (!triggerRes.ok) {
      console.error(`[APIFY] Falha ao disparar o robô. Status HTTP: ${triggerRes.status}`);
      throw new Error(`Falha ao disparar o robô no Apify: HTTP ${triggerRes.status}`);
    }

    currentSync.progress = 30;
    currentSync.step = "polling";

    // 3. Polling status check every 5 seconds (Max 120s timeout)
    const startTime = Date.now();
    let succeeded = false;

    while (Date.now() - startTime < 120000) {
      const getRunUrl = `https://api.apify.com/v2/actor-runs/cmLiDQdn1NPjzKIGO?token=${token}`;
      const statusRes = await fetch(getRunUrl);
      
      if (statusRes.status === 401 || statusRes.status === 403) {
        console.error("[APIFY] CHAVE DE API (TOKEN) REJEITADA DURANTE CONSULTA DE STATUS! Status HTTP:", statusRes.status);
        throw new Error(`Erro de Autenticação: A chave do Apify (API Token) foi rejeitada durante a consulta de status (HTTP ${statusRes.status}).`);
      }

      if (statusRes.status === 402) {
        console.error("[APIFY] ERRO DE COTA/CRÉDITO NO APIFY DURANTE CONSULTA DE STATUS! Status HTTP 402");
        throw new Error("Erro de Cota: Limite de cota ou créditos excedidos no Apify (HTTP 402).");
      }

      if (!statusRes.ok) {
        throw new Error(`Erro ao checar status da execução no Apify: HTTP ${statusRes.status}`);
      }

      const statusData = await statusRes.json() as any;
      const runStatus = statusData.status || (statusData.data && statusData.data.status);
      console.log(`[APIFY] Run status check: ${runStatus}`);

      if (runStatus === "SUCCEEDED") {
        succeeded = true;
        break;
      } else if (runStatus === "FAILED" || runStatus === "ABORTED") {
        throw new Error(`A execução do robô no Apify falhou ou foi abortada com status: ${runStatus}`);
      }

      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Abort Run Safety Timeout handling
    if (!succeeded) {
      console.warn("[APIFY] Polling ultrapassou o limite de 120s. Enviando comando de cancelamento...");
      const abortUrl = `https://api.apify.com/v2/actor-runs/cmLiDQdn1NPjzKIGO/abort?token=${token}`;
      try {
        await fetch(abortUrl, { method: "POST" });
        console.log("[APIFY] Comando de cancelamento enviado com sucesso.");
      } catch (abortErr: any) {
        console.error("[APIFY] Erro ao enviar comando de abortar:", abortErr.message);
      }
      throw new Error("Tempo limite de 120 segundos atingido para sincronização do robô.");
    }

    currentSync.progress = 85;
    currentSync.step = "saving";

    // 4. Collect dataset items
    const datasetUrl = `https://api.apify.com/v2/datasets/0S4dgMYjDWATz8kdE/items?token=${token}`;
    const datasetRes = await fetch(datasetUrl);
    
    if (datasetRes.status === 401 || datasetRes.status === 403) {
      console.error("[APIFY] CHAVE DE API (TOKEN) REJEITADA DURANTE OBTENÇÃO DO DATASET! Status HTTP:", datasetRes.status);
      throw new Error(`Erro de Autenticação: A chave do Apify (API Token) foi rejeitada ao coletar os resultados (HTTP ${datasetRes.status}).`);
    }

    if (datasetRes.status === 402) {
      console.error("[APIFY] ERRO DE COTA/CRÉDITO NO APIFY AO COLETAR DATASET! Status HTTP 402");
      throw new Error("Erro de Cota: Limite de cota ou créditos excedidos no Apify (HTTP 402).");
    }

    if (!datasetRes.ok) {
      throw new Error(`Falha ao obter itens do dataset do Apify: HTTP ${datasetRes.status}`);
    }

    const items = await datasetRes.json() as any[];
    console.log(`[APIFY] Buscou com sucesso ${items.length} itens do dataset. Processando atualizações...`);

    const updates: { id: string; seguidores: number; classificacao: string; foto_url?: string }[] = [];

    const normalizeUrl = (u: string) => {
      if (!u) return "";
      let clean = u.toLowerCase().trim().split("?")[0].replace(/\/$/, "");
      clean = clean.replace("www.", "").replace("https://", "").replace("http://", "");
      return clean;
    };

    const getHandle = (u: string) => {
      if (!u) return "";
      const norm = normalizeUrl(u);
      const parts = norm.split("/");
      let last = parts[parts.length - 1] || "";
      last = last.replace("@", "");
      return last;
    };

    for (const item of items) {
      let rawFollowers = item.followersCount ?? item.followers ?? item.followers_count ?? item.subscribers ?? item.subscribersCount ?? item.subscriberCount ?? item.fans ?? item.followerCount;
      if (rawFollowers === undefined && item.authorMeta && item.authorMeta.fans !== undefined) {
        rawFollowers = item.authorMeta.fans;
      }
      if (rawFollowers === undefined && item.stats && item.stats.followerCount !== undefined) {
        rawFollowers = item.stats.followerCount;
      }

      if (rawFollowers === undefined) continue;

      let followersCount = 0;
      if (typeof rawFollowers === "number") {
        followersCount = rawFollowers;
      } else if (typeof rawFollowers === "string") {
        let cleanStr = rawFollowers.trim().toUpperCase();
        let multiplier = 1;
        if (cleanStr.endsWith("M")) {
          multiplier = 1000000;
          cleanStr = cleanStr.replace("M", "");
        } else if (cleanStr.endsWith("K")) {
          multiplier = 1000;
          cleanStr = cleanStr.replace("K", "");
        }
        
        cleanStr = cleanStr.replace(/\s/g, "");
        if (cleanStr.includes(",") && cleanStr.includes(".")) {
          if (cleanStr.indexOf(",") < cleanStr.indexOf(".")) {
            cleanStr = cleanStr.replace(/,/g, "");
          } else {
            cleanStr = cleanStr.replace(/\./g, "").replace(/,/g, ".");
          }
        } else if (cleanStr.includes(",")) {
          const parts = cleanStr.split(",");
          if (parts[parts.length - 1].length === 3) {
            cleanStr = cleanStr.replace(/,/g, "");
          } else {
            cleanStr = cleanStr.replace(/,/g, ".");
          }
        } else if (cleanStr.includes(".")) {
          const parts = cleanStr.split(".");
          if (parts[parts.length - 1].length === 3) {
            cleanStr = cleanStr.replace(/\./g, "");
          }
        }
        followersCount = Math.round(parseFloat(cleanStr) * multiplier) || 0;
      }

      const matched = allInfluencers.find(inf => {
        const localNorm = normalizeUrl(inf.link_perfil);
        const itemUrl = item.instagramUrl || item.tiktokUrl || item.youtubeUrl || item.twitchUrl || item.facebookUrl || item.url || item.link || item.link_perfil || item.instagram_url;
        const itemNorm = itemUrl ? normalizeUrl(itemUrl) : "";
        
        if (localNorm && itemNorm && (localNorm.includes(itemNorm) || itemNorm.includes(localNorm))) {
          return true;
        }

        const localHandle = getHandle(inf.link_perfil);
        const itemHandle = item.username || item.handle || item.ownerUsername || item.id || (itemUrl ? getHandle(itemUrl) : "");
        if (localHandle && itemHandle && localHandle === String(itemHandle).toLowerCase().replace("@", "").trim()) {
          return true;
        }

        return false;
      });

      if (matched) {
        const newClass = classifyInfluencer(followersCount);
        const profilePic = item.profilePicUrl || item.profilePicUrlHD || item.profilePicUrlHd || item.profile_pic_url || item.avatar || item.avatarUrl || item.avatar_url || (item.authorMeta && item.authorMeta.avatar) || (item.author && item.author.avatar) || (item.owner && item.owner.profile_pic_url);
        
        let storagePhotoUrl = matched.foto_url;
        
        if (profilePic && profilePic.trim() !== "") {
          try {
            storagePhotoUrl = await downloadAndUploadProfilePic(matched.id, profilePic);
          } catch (picErr: any) {
            console.warn(`[APIFY] Falha ao baixar/uploadar foto original do Instagram para ${matched.nome}. Mantendo foto atual.`, picErr.message);
          }
        }

        updates.push({
          id: matched.id,
          seguidores: followersCount,
          classificacao: newClass,
          foto_url: storagePhotoUrl
        });
      }
    }

    let updatedCount = 0;
    if (updates.length > 0) {
      updatedCount = await dbUpdateApifyMatches(updates);
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

// Background cron scheduler to run automatically once a day at midnight ("0 0 * * *")
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
