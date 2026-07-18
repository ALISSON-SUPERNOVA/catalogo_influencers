import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar configurados no .env");
}

export const PHOTOS_BUCKET = "fotos-perfil";

// Client scoped to the catalogo schema, used for all table reads/writes.
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: "catalogo" },
  auth: { persistSession: false }
});

// Storage isn't schema-scoped, so a plain (default "public" schema) client covers it too.
export const supabaseStorage = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

// Dedicated client for Supabase Auth calls (signInWithPassword, admin.*) only. Calling
// auth.signInWithPassword() on a client swaps that client's effective identity to the
// signed-in user's session for all subsequent requests — including .from() queries. Keeping
// auth calls on this separate instance means `supabase` above never loses its service_role
// access to the catalogo schema after someone logs in.
export const supabaseAuth = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});
