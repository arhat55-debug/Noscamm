import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTradeMessages, getTradeRoom } from "@/lib/marketplace/queries";
import { rateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: Promise<{ tradeId: string }> }) {
  const { tradeId } = await params;
  const { user, profile } = await requireUser();
  const trade = await getTradeRoom(tradeId);

  if (!trade.data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const allowed = trade.data.buyer_id === user.id || trade.data.seller_id === user.id || trade.data.moderator_id === user.id || profile?.role === "ADMIN";
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const messages = await getTradeMessages(tradeId);
  return NextResponse.json({ messages: messages.data });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ tradeId: string }> }) {
  const { tradeId } = await params;
  const { user } = await requireUser();
  const limiter = rateLimit(`trade-message:${user.id}`, 60, 60_000);

  if (!limiter.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  const body = (await request.json()) as { message?: string; attachment?: string | null };

  if (!body.message || body.message.length > 2000) {
    return NextResponse.json({ error: "Message is required and must be under 2000 characters." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("trade_messages")
    .insert({ trade_id: tradeId, sender_id: user.id, message: body.message, attachment: body.attachment ?? null })
    .select("id,trade_id,sender_id,message,attachment,created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  return NextResponse.json({ message: data });
}
