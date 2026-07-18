import type { VercelRequest, VercelResponse } from "@vercel/node";
import { app, ensureDatabaseSeeded } from "../src/api/app.js";

// Seed the database at most once per cold start, not on every request.
let seedPromise: Promise<void> | null = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!seedPromise) {
    seedPromise = ensureDatabaseSeeded().catch(err => {
      seedPromise = null; // allow retrying on the next request if seeding failed
      throw err;
    });
  }
  await seedPromise;

  return app(req as any, res as any);
}
