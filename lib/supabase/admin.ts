import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "@/lib/supabase/env";

export function createAdminClient() {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    requireEnv(
      "SUPABASE_SERVICE_ROLE_KEY",
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ),
    { auth: { persistSession: false } }
  );
}

/** Lets callers show a readable message instead of crashing with a 500. */
export function hasAdminCredentials() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
