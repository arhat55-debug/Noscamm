import { notFound } from "next/navigation";
import { RealtimeTradeMessages } from "@/components/trade/RealtimeTradeMessages";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SubmitButton } from "@/components/shared/SubmitButton";
import { canModerate, requireUser } from "@/lib/auth/session";
import { sendTradeMessageForm, updateTradeStatus } from "@/lib/marketplace/actions";
import { getPaymentSettings, getTradeRoom } from "@/lib/marketplace/queries";
import { formatMnt } from "@/components/marketplace/ListingCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Private trade room" };

const input = "rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-gold";

export default async function TradeRoomPage({ params }: { params: { id: string } }) {
  const { user, profile } = await requireUser();
  const [tradeResult, paymentSettings] = await Promise.all([getTradeRoom(params.id), getPaymentSettings()]);
  const trade = tradeResult.data;

  if (!trade) {
    notFound();
  }

  const isParticipant = trade.buyer_id === user.id || trade.seller_id === user.id || trade.moderator_id === user.id || profile?.role === "ADMIN";

  if (!isParticipant) {
    notFound();
  }

  const messages = trade.trade_messages ?? [];
  const moderator = canModerate(profile?.role);
  const buyer = trade.buyer_id === user.id;

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="grid gap-8 lg:grid-cols-[1fr_390px]">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-gold">Private room</p>
                <h1 className="mt-3 text-3xl font-black text-white">{trade.listings?.title ?? "Trade room"}</h1>
                <p className="mt-2 text-sm text-zinc-400">Buyer, seller, assigned moderator, and admins only.</p>
              </div>
              <StatusBadge status={trade.status} />
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-black/40 p-4"><p className="text-xs text-zinc-500">Amount</p><p className="text-xl font-black text-gold">{formatMnt(trade.amount)}</p></div>
              <div className="rounded-2xl bg-black/40 p-4"><p className="text-xs text-zinc-500">Midman fee</p><p className="text-xl font-black text-white">{formatMnt(trade.fee)}</p></div>
              <div className="rounded-2xl bg-black/40 p-4"><p className="text-xs text-zinc-500">Seller payout</p><p className="text-xl font-black text-white">{formatMnt(trade.amount - trade.fee)}</p></div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
            <h2 className="mb-4 text-2xl font-black text-white">Realtime chat</h2>
            <RealtimeTradeMessages tradeId={trade.id} initialMessages={messages} />
            <form action={sendTradeMessageForm} className="mt-5 space-y-3 border-t border-white/10 pt-5">
              <input type="hidden" name="trade_id" value={trade.id} />
              <textarea name="message" className={`${input} min-h-28 w-full`} placeholder="Send message inside private room" required />
              <input name="attachment" type="file" accept="image/*" className={`${input} w-full`} />
              <SubmitButton>Send message</SubmitButton>
            </form>
          </div>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-[2rem] border border-gold/20 bg-gold/10 p-6">
            <h2 className="text-2xl font-black text-white">Payment instructions</h2>
            {paymentSettings.data ? (
              <div className="mt-4 space-y-2 text-sm text-zinc-200">
                <p>Bank: <strong>{paymentSettings.data.bank_name}</strong></p>
                <p>Account: <strong>{paymentSettings.data.account_number}</strong></p>
                <p>Holder: <strong>{paymentSettings.data.account_holder}</strong></p>
                <p className="leading-6 text-zinc-300">{paymentSettings.data.instructions}</p>
              </div>
            ) : <p className="mt-4 text-sm text-zinc-400">Admin payment settings are not configured.</p>}
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-2xl font-black text-white">Trade timeline</h2>
            <ol className="mt-4 space-y-3 text-sm text-zinc-300">
              {[
                "Buyer transfers payment manually",
                "Moderator/Admin confirms payment",
                "Seller sends account details in room",
                "Buyer confirms account received",
                "Moderator completes trade and payout",
              ].map((step, index) => <li key={step} className="rounded-2xl bg-black/40 p-3"><strong className="text-gold">{index + 1}.</strong> {step}</li>)}
            </ol>
          </div>

          {buyer ? (
            <form action={updateTradeStatus} className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
              <input type="hidden" name="trade_id" value={trade.id} />
              <input type="hidden" name="status" value="BUYER_CONFIRM_PENDING" />
              <SubmitButton>Confirm account received</SubmitButton>
            </form>
          ) : null}

          {moderator ? (
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
              <h2 className="text-2xl font-black text-white">Moderator actions</h2>
              <div className="mt-4 grid gap-3">
                {["PAYMENT_CONFIRMED", "ACCOUNT_TRANSFER", "COMPLETED", "DISPUTE", "REFUNDED", "CANCELLED"].map((status) => (
                  <form key={status} action={updateTradeStatus}>
                    <input type="hidden" name="trade_id" value={trade.id} />
                    <input type="hidden" name="status" value={status} />
                    <button className="w-full rounded-2xl border border-white/10 px-4 py-3 text-left text-sm font-bold text-zinc-200 hover:border-gold/50 hover:text-gold">Set {status.replaceAll("_", " ")}</button>
                  </form>
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </section>
    </main>
  );
}
