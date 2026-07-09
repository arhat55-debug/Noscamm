export function getSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return {
    url,
    anonKey,
    configured: Boolean(url && anonKey),
  };
}

export function getSupabaseServiceEnv() {
  const publicEnv = getSupabasePublicEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  return {
    ...publicEnv,
    serviceRoleKey,
    serviceConfigured: Boolean(publicEnv.url && serviceRoleKey),
  };
}

export function assertSupabasePublicEnv() {
  const env = getSupabasePublicEnv();

  if (!env.configured || !env.url || !env.anonKey) {
    throw new Error("Supabase public environment variables are not configured.");
  }

  return { url: env.url, anonKey: env.anonKey };
}

export function assertSupabaseServiceEnv() {
  const env = getSupabaseServiceEnv();

  if (!env.serviceConfigured || !env.url || !env.serviceRoleKey) {
    throw new Error("Supabase service role environment variables are not configured.");
  }

  return { url: env.url, serviceRoleKey: env.serviceRoleKey };
}
