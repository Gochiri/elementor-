import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

// Service role: bypassa RLS. Esta clave vive solo en el worker, nunca en el cliente.
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
