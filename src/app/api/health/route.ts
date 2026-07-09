import { NextResponse } from "next/server";
import { getSupabasePublicEnv, getSupabaseServiceEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    app: "NEXUS MLBB Marketplace",
    supabaseConfigured: getSupabasePublicEnv().configured,
    serviceRoleConfigured: getSupabaseServiceEnv().serviceConfigured,
    resendConfigured: Boolean(process.env.RESEND_API_KEY),
    cloudinaryConfigured: Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET),
  });
}
