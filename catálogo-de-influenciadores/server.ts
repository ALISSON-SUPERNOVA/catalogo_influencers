import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { app, ensureDatabaseSeeded } from "./src/api/app.js";
import { setupBackgroundCron } from "./src/services/instagramUpdater.js";

const PORT = 3000;

// -----------------------------------------------------
// VITE AND STATIC SERVING MIDDLEWARES
// (only needed for traditional/local hosting — Vercel serves the Vite build directly
// and routes /api/** to api/[...path].ts, which mounts the same `app` from src/api/app.ts)
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
