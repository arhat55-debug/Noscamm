import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!getSupabasePublicEnv().configured) {
    return NextResponse.redirect(new URL("/auth/login?error=Supabase%20is%20not%20configured", request.url));
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase.from("users").upsert({
        id: user.id,
        email: user.email,
        username: user.user_metadata?.username ?? user.user_metadata?.name ?? user.email?.split("@")[0] ?? null,
        avatar_url: user.user_metadata?.avatar_url ?? null,
      });
    }
  }

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
