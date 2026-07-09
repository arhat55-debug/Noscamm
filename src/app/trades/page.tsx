import Link from "next/link";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { requireUser } from "@/lib/auth/session";
import { getUserTrades } from "@/lib/marketplace/queries";
import { formatMnt } from "@/components/marketplace/ListingCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Trades" };

export default async function TradesPage() {
  const { user, profile } = await requireUser();
  const trades = await getUserTrades(user.id, profile?.role);

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-gold">Escrow rooms</p>
        <h1 className="mt-3 text-4xl font-black text-white">Private trades</h1>
        <p className="mt-3 text-sm text-zinc-400">Only buyer, seller, assigned moderator, and admins can access each room via Supabase RLS.</p>
      </section>

      <section className="mt-8 grid gap-4">
        {trades.data.length ? trades.data.map((trade) => (
          <Link key={trade.id} href={`/trades/${trade.id}`} className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 transition hover:border-gold/50">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-white">{trade.listings?.title ?? "Trade room"}</h2>
                <p className="mt-1 text-sm text-zinc-500">Buyer: {trade.buyer?.username ?? trade.buyer_id} · Seller: {trade.seller?.username ?? trade.seller_id}</p>
              </div>
              <StatusBadge status={trade.status} />
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-sm text-zinc-400">
              <span>Amount: <strong className="text-gold">{formatMnt(trade.amount)}</strong></span>
              <span>Fee: <strong className="text-white">{formatMnt(trade.fee)}</strong></span>
              <span>Created: {new Date(trade.created_at).toLocaleDateString()}</span>
            </div>
          </Link>
        )) : <EmptyState title="No private trades" message={trades.error ?? "Buy an account or sell through a verified listing to open a trade room."} actionHref="/listings" actionLabel="Browse listings" />}
      </section>
    </main>
  );
}
