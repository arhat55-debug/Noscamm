import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import type { Profile, UserRole } from "@/lib/marketplace/types";

export type AuthContext = {
  user: { id: string; email?: string | null } | null;
  profile: Profile | null;
};

export async function getAuthContext(): Promise<AuthContext> {
  if (!getSupabasePublicEnv().configured) {
    return { user: null, profile: null };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { user: null, profile: null };
    }

    const { data: profile } = await supabase
      .from("users")
      .select("id,email,username,avatar_url,role,bank_account,created_at,updated_at")
      .eq("id", user.id)
      .maybeSingle<Profile>();

    if (!profile) {
      await supabase.from("users").upsert({
        id: user.id,
        email: user.email,
        username: user.user_metadata?.user_name ?? user.email?.split("@")[0] ?? null,
        avatar_url: user.user_metadata?.avatar_url ?? null,
      });

      const { data: createdProfile } = await supabase
        .from("users")
        .select("id,email,username,avatar_url,role,bank_account,created_at,updated_at")
        .eq("id", user.id)
        .maybeSingle<Profile>();

      return { user: { id: user.id, email: user.email }, profile: createdProfile ?? null };
    }

    return { user: { id: user.id, email: user.email }, profile };
  } catch {
    return { user: null, profile: null };
  }
}

export async function requireUser() {
  const context = await getAuthContext();

  if (!context.user) {
    redirect("/auth/login");
  }

  return context as AuthContext & { user: NonNullable<AuthContext["user"]> };
}

export async function requireRole(allowedRoles: UserRole[]) {
  const context = await requireUser();

  if (!context.profile || !allowedRoles.includes(context.profile.role)) {
    redirect("/dashboard?error=forbidden");
  }

  return context as AuthContext & {
    user: NonNullable<AuthContext["user"]>;
    profile: NonNullable<AuthContext["profile"]>;
  };
}

export function canManagePlatform(role?: UserRole | null) {
  return role === "ADMIN";
}

export function canModerate(role?: UserRole | null) {
  return role === "ADMIN" || role === "MODERATOR";
}

export function canSell(role?: UserRole | null) {
  return role === "VERIFIED_SELLER" || role === "ADMIN";
}
