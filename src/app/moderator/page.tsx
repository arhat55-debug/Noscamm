import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { getUserTrades, getVerificationQueue } from "@/lib/marketplace/queries";
import { reviewVerification } from "@/lib/marketplace/actions";
import { StatusBadge } from "@/components/shared/StatusBadge";

export const dynamic = "force-dynamic";
export const metadata = { title: "Moderator" };

export default async function ModeratorPage() {
  const { user, profile } = await requireRole(["ADMIN", "MODERATOR"]);
  const [queue, trades] = await Promise.all([getVerificationQueue(), getUserTrades(user.id, profile.role)]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-gold">Moderator console</p>
        <h1 className="mt-3 text-4xl font-black text-white">Verification & midman operations</h1>
        <p className="mt-3 text-sm text-zinc-400">Moderators only see their assigned rooms plus queues allowed by RLS and server authorization.</p>
      </section>

      <section className="mt-8 grid gap-8 xl:grid-cols-2">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-2xl font-black text-white">Seller verification queue</h2>
          <div className="mt-5 space-y-4">
            {queue.data.filter((item) => item.status === "PENDING").map((item) => (
              <div key={item.id} className="rounded-3xl border border-white/10 bg-black/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3"><strong>{item.user?.username ?? item.user?.email ?? item.user_id}</strong><StatusBadge status={item.status} /></div>
                <div className="mt-3 flex flex-wrap gap-3 text-sm"><a className="text-gold underline" href={item.id_front} target="_blank" rel="noreferrer">ID front</a><a className="text-gold underline" href={item.id_back} target="_blank" rel="noreferrer">ID back</a><a className="text-gold underline" href={item.selfie_video} target="_blank" rel="noreferrer">Selfie/video</a></div>
                <form action={reviewVerification} className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr]">
                  <input type="hidden" name="request_id" value={item.id} />
                  <input name="reason" placeholder="Rejection reason (if any)" className="rounded-2xl border border-white/10 bg-black px-3 py-2 text-sm text-white sm:col-span-2" />
                  <button name="decision" value="APPROVED" className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-black text-black">Approve</button>
                  <button name="decision" value="REJECTED" className="rounded-2xl bg-red-500 px-4 py-2 text-sm font-black text-white">Reject</button>
                </form>
              </div>
            ))}
            {!queue.data.filter((item) => item.status === "PENDING").length ? <p className="text-sm text-zinc-500">No pending verification requests.</p> : null}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-2xl font-black text-white">Assigned trade rooms</h2>
          <div className="mt-5 space-y-4">
            {trades.data.map((trade) => (
              <Link key={trade.id} href={`/trades/${trade.id}`} className="block rounded-3xl border border-white/10 bg-black/40 p-4 transition hover:border-gold/50">
                <div className="flex flex-wrap items-center justify-between gap-3"><strong>{trade.listings?.title ?? trade.id}</strong><StatusBadge status={trade.status} /></div>
                <p className="mt-2 text-sm text-zinc-500">Buyer: {trade.buyer?.username ?? trade.buyer_id} · Seller: {trade.seller?.username ?? trade.seller_id}</p>
              </Link>
            ))}
            {!trades.data.length ? <p className="text-sm text-zinc-500">No assigned trade rooms.</p> : null}
          </div>
        </div>
      </section>
    </main>
  );
}
