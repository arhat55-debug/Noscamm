import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export async function getNumericSetting(key: string) {
  if (!getSupabasePublicEnv().configured) {
    throw new Error("Supabase is not configured.");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("system_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle<{ value: unknown }>();

  if (error) {
    throw new Error(error.message);
  }

  const value = Number(data?.value);

  if (!Number.isFinite(value)) {
    throw new Error(`Missing numeric system setting: ${key}`);
  }

  return value;
}

export async function hasActiveSubscription(userId: string, planType?: "SELLER_PRO" | "MODERATOR") {
  if (!getSupabasePublicEnv().configured) {
    return false;
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "ACTIVE")
    .gt("expires_at", new Date().toISOString())
    .limit(1);

  if (planType) {
    query = query.eq("plan_type", planType);
  }

  const { data } = await query;
  return Boolean(data?.length);
}
