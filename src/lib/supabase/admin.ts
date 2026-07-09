import { createClient } from "@supabase/supabase-js";
import { assertSupabaseServiceEnv } from "./env";

export function createSupabaseAdminClient() {
  const { url, serviceRoleKey } = assertSupabaseServiceEnv();

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
