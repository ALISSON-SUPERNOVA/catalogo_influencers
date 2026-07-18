import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import {
  dbGetAll,
  dbCreate,
  dbToggleFavorite,
  dbDelete,
  dbBulkInsert,
  dbUpdate
} from "./src/lib/db.js";
import {
  getCurrentSyncState,
  runApifySync,
  setupBackgroundCron,
  resetSyncState
} from "./src/services/instagramUpdater.js";
import { supabaseStorage, supabaseAuth } from "./src/lib/supabase.js";

const USER_AVATARS_BUCKET = "user-avatars";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Helper to classify influencer based on followers count
function classifyInfluencer(followers: number): string {
  if (followers >= 0 && followers <= 999) return "Nanoinfluenciador";
  if (followers >= 1000 && followers <= 99999) return "Microinfluenciador";
  if (followers >= 100000 && followers <= 999999) return "Macro influencidor";
  return "Mega influenciador";
}

// Ensure database is seeded on first run against an empty Supabase table
async function ensureDatabaseSeeded() {
  await dbGetAll();
}

// Brute force protection state
const loginAttempts: Record<string, { count: number; lockUntil: number }> = {};

// -----------------------------------------------------
// API ENDPOINTS
// -----------------------------------------------------

// Get all influencers
app.get("/api/influencers", async (req, res) => {
  try {
    const influencers = await dbGetAll();
    res.json({ success: true, data: influencers });
  } catch (error: any) {
    console.error("[API] Error fetching influencers:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create influencer
app.post("/api/influencers", async (req, res) => {
  try {
    const { nome, link_perfil, seguidores, categoria_sobre, engajamento, preco_estimado, publico_alvo, rede_social, foto_url, grupo, media_valor } = req.body;
    
    if (!nome || !link_perfil) {
      return res.status(400).json({ success: false, error: "Nome e Link de Perfil são obrigatórios" });
    }

    const followersCount = Number(seguidores) || 0;
    const classificacaoValue = classifyInfluencer(followersCount);

    const influencerData = {
      nome,
      link_perfil,
      seguidores: followersCount,
      categoria_sobre: categoria_sobre || "Geral",
      classificacao: classificacaoValue,
      engajamento: Number(engajamento) || 0.0,
      preco_estimado: Number(preco_estimado) || 0.0,
      is_favorito: false,
      updated_at: new Date().toISOString(),
      publico_alvo: publico_alvo || "Geral",
      rede_social: rede_social || undefined,
      foto_url: foto_url || undefined,
      grupo: grupo || "catalogo",
      media_valor: media_valor || undefined
    };

    const newDoc = await dbCreate(influencerData);
    res.json({ success: true, data: newDoc });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update influencer favorite status
app.post("/api/influencers/toggle-favorite/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const isFavorito = await dbToggleFavorite(id);
    res.json({ success: true, is_favorito: isFavorito });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete influencer
app.delete("/api/influencers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await dbDelete(id);
    res.json({ success: true, message: "Influenciador removido com sucesso" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update influencer
app.put("/api/influencers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      nome, 
      link_perfil, 
      seguidores, 
      categoria_sobre, 
      engajamento, 
      preco_estimado, 
      publico_alvo, 
      rede_social, 
      foto_url, 
      grupo, 
      media_valor 
    } = req.body;

    const updatedFields: any = {};
    if (nome !== undefined) updatedFields.nome = nome;
    if (link_perfil !== undefined) updatedFields.link_perfil = link_perfil;
    
    if (seguidores !== undefined) {
      const followersCount = Number(seguidores) || 0;
      updatedFields.seguidores = followersCount;
      updatedFields.classificacao = classifyInfluencer(followersCount);
    }
    
    if (categoria_sobre !== undefined) updatedFields.categoria_sobre = categoria_sobre;
    if (engajamento !== undefined) updatedFields.engajamento = Number(engajamento) || 0.0;
    if (preco_estimado !== undefined) updatedFields.preco_estimado = Number(preco_estimado) || 0.0;
    if (publico_alvo !== undefined) updatedFields.publico_alvo = publico_alvo;
    if (rede_social !== undefined) updatedFields.rede_social = rede_social;
    if (foto_url !== undefined) updatedFields.foto_url = foto_url;
    if (grupo !== undefined) updatedFields.grupo = grupo;
    if (media_valor !== undefined) updatedFields.media_valor = media_valor;

    updatedFields.updated_at = new Date().toISOString();

    const updatedDoc = await dbUpdate(id, updatedFields);
    res.json({ success: true, data: updatedDoc });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bulk Insert (from validated client CSV parser)
app.post("/api/influencers/bulk", async (req, res) => {
  try {
    const { influencers } = req.body;
    if (!Array.isArray(influencers)) {
      return res.status(400).json({ success: false, error: "Lista de influenciadores inválida" });
    }
    
    const processed = influencers.map((inf: any) => {
      const followers = Number(inf.seguidores) || 0;
      return {
        nome: inf.nome,
        link_perfil: inf.link_perfil,
        seguidores: followers,
        categoria_sobre: inf.categoria_sobre || "Geral",
        classificacao: classifyInfluencer(followers),
        engajamento: Number(inf.engajamento) || 0.0,
        preco_estimado: Number(inf.preco_estimado) || 0.0,
        is_favorito: false,
        updated_at: new Date().toISOString(),
        publico_alvo: inf.publico_alvo || "Geral",
        foto_url: inf.foto_url || undefined,
        grupo: inf.grupo || "catalogo",
        media_valor: inf.media_valor || undefined
      };
    });

    const count = await dbBulkInsert(processed);
    res.json({ success: true, count });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Platform login (Supabase Auth), with brute-force protection by IP
app.post("/api/admin/login", async (req, res) => {
  const { email, password } = req.body;
  const ip = req.ip || "unknown";

  // Check lockout
  const attempt = loginAttempts[ip];
  if (attempt && attempt.lockUntil > Date.now()) {
    const waitTime = Math.ceil((attempt.lockUntil - Date.now()) / 1000);
    return res.status(429).json({
      success: false,
      error: `Muitas tentativas. Login bloqueado por mais ${waitTime} segundos.`
    });
  }

  const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });

  if (!error && data.user) {
    delete loginAttempts[ip];
    return res.json({ success: true, token: "session_token_supernova_max_rost" });
  }

  // Record failure
  if (!loginAttempts[ip]) {
    loginAttempts[ip] = { count: 1, lockUntil: 0 };
  } else {
    loginAttempts[ip].count += 1;
  }

  if (loginAttempts[ip].count >= 5) {
    loginAttempts[ip].lockUntil = Date.now() + 300 * 1000; // 5 minute lock
    return res.status(429).json({
      success: false,
      error: "Bloqueado por segurança. Limite de tentativas excedido (5 min de bloqueio)."
    });
  }

  const restAttempts = 5 - loginAttempts[ip].count;
  res.status(401).json({
    success: false,
    error: `Credenciais incorretas. Você tem mais ${restAttempts} tentativas.`
  });
});

// Change own password (Meu Perfil) — verifies the current password via Supabase Auth,
// then sets the new one via the Admin API.
app.post("/api/admin/change-password", async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, error: "A nova senha deve ter pelo menos 6 caracteres." });
  }

  const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password: currentPassword });
  if (error || !data.user) {
    return res.status(401).json({ success: false, error: "Senha atual incorreta." });
  }

  const { error: updateError } = await supabaseAuth.auth.admin.updateUserById(data.user.id, { password: newPassword });
  if (updateError) {
    return res.status(500).json({ success: false, error: updateError.message });
  }

  res.json({ success: true, message: "Senha atualizada com sucesso." });
});

// Create a new team member account (Adicionar Admin) via Supabase Auth Admin API
app.post("/api/admin/create-account", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !email.includes("@")) {
    return res.status(400).json({ success: false, error: "Insira um endereço de e-mail válido." });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, error: "A senha deve conter pelo menos 6 caracteres." });
  }

  const { data, error } = await supabaseAuth.auth.admin.createUser({ email, password, email_confirm: true });

  if (error) {
    if (error.message.toLowerCase().includes("already been registered") || (error as any).code === "email_exists") {
      return res.status(409).json({ success: false, error: "Já existe uma conta com este e-mail." });
    }
    return res.status(500).json({ success: false, error: error.message });
  }

  res.json({ success: true, user: { id: data.user?.id, email: data.user?.email } });
});

// Upload/replace own admin profile photo (Meu Perfil) — base64 data URL in the body
app.post("/api/admin/avatar", async (req, res) => {
  try {
    const { email, imageBase64 } = req.body;
    if (!email || !imageBase64) {
      return res.status(400).json({ success: false, error: "Dados de imagem ausentes." });
    }

    const matches = imageBase64.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ success: false, error: "Formato de imagem inválido." });
    }
    const contentType = matches[1];
    const buffer = Buffer.from(matches[2], "base64");
    const ext = contentType.split("/")[1] || "jpg";
    const cleanEmail = email.replace(/[^a-zA-Z0-9_-]/g, "_");
    const storagePath = `admins/${cleanEmail}.${ext}`;

    const { error: uploadError } = await supabaseStorage.storage
      .from(USER_AVATARS_BUCKET)
      .upload(storagePath, buffer, { contentType, upsert: true });

    if (uploadError) {
      return res.status(500).json({ success: false, error: uploadError.message });
    }

    const { data } = supabaseStorage.storage.from(USER_AVATARS_BUCKET).getPublicUrl(storagePath);
    res.json({ success: true, url: `${data.publicUrl}?t=${Date.now()}` });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// -----------------------------------------------------
// APIFY SYNC ENGINE & RECOVERY (DELEGATED TO INSTAGRAM UPDATER SERVICE)
// -----------------------------------------------------

// Apify trigger endpoint (non-blocking, returns immediately, client polls status)
app.post("/api/apify-sync", (req, res) => {
  const syncState = getCurrentSyncState();
  if (syncState.isSyncing) {
    return res.status(429).json({ success: false, error: "Uma sincronização já está em andamento." });
  }

  // Trigger background execution
  runApifySync().catch(err => {
    console.error("[BACKGROUND SYNC] Error running background sync:", err);
  });

  res.json({ success: true, message: "Sincronização iniciada com sucesso. Acompanhe o progresso." });
});

// Endpoint to fetch current real-time sync status
app.get("/api/sync-status", (req, res) => {
  res.json(getCurrentSyncState());
});

// Endpoint to reset sync state (useful for clearing error screen)
app.post("/api/sync-reset", (req, res) => {
  resetSyncState();
  res.json({ success: true, currentSync: getCurrentSyncState() });
});

// -----------------------------------------------------
// VITE AND STATIC SERVING MIDDLEWARES
// -----------------------------------------------------
async function startServer() {
  await ensureDatabaseSeeded();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SYSTEM] Server listening on http://0.0.0.0:${PORT}`);
    console.log(`[SYNC] Manual synchronization engine ready.`);
    // Apify only runs via the daily cron below or the admin's manual "Sincronizar" button —
    // never automatically on server startup or on public storefront visits, to control cost.
    setupBackgroundCron();
  });
}

startServer();
