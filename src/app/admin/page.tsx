import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { getMarketplaceStats, getPaymentSettings, getSubscriptionOrders, getUserTrades, getUsersForAdmin, getVerificationQueue } from "@/lib/marketplace/queries";
import { reviewSubscriptionOrder, reviewVerification, updatePaymentSettings, updateUserRole } from "@/lib/marketplace/actions";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { StatCard } from "@/components/shared/StatCard";
import { formatMnt } from "@/components/marketplace/ListingCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin" };

const input = "rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-gold";

export default async function AdminPage() {
  const { user, profile } = await requireRole(["ADMIN"]);
  const [stats, users, queue, orders, trades, payment] = await Promise.all([
    getMarketplaceStats(),
    getUsersForAdmin(),
    getVerificationQueue(),
    getSubscriptionOrders(),
    getUserTrades(user.id, profile.role),
    getPaymentSettings(),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-gold">Platform command</p>
        <h1 className="mt-3 text-4xl font-black text-white">Admin dashboard</h1>
        <p className="mt-3 text-sm text-zinc-400">Manage users, moderators, verification, subscriptions, bank settings, trades, revenue, reports, audit-backed operations, and system settings.</p>
      </section>

      {stats.data.length ? <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{stats.data.map((stat) => <StatCard key={stat.label} label={stat.label} value={stat.label.toLowerCase().includes("revenue") ? formatMnt(stat.value) : stat.value} />)}</section> : null}

      <section className="mt-8 grid gap-8 xl:grid-cols-2">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-2xl font-black text-white">Payment settings</h2>
          {payment.data ? <p className="mt-2 text-sm text-zinc-400">Current: {payment.data.bank_name} · {payment.data.account_number} · Fee {formatMnt(payment.data.midman_fee)}</p> : null}
          <form action={updatePaymentSettings} className="mt-5 grid gap-3">
            <input className={input} name="bank_name" placeholder="Bank name" required />
            <input className={input} name="account_number" placeholder="Account number" required />
            <input className={input} name="account_holder" placeholder="Account holder" required />
            <input className={input} name="midman_fee" type="number" min="0" placeholder="Midman fee" required />
            <textarea className={`${input} min-h-28`} name="instructions" placeholder="Payment instructions" required />
            <button className="rounded-2xl bg-gold px-5 py-3 font-black text-black hover:bg-white">Save payment settings</button>
          </form>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-2xl font-black text-white">Subscription approvals</h2>
          <div className="mt-5 space-y-4">
            {orders.data.filter((order) => order.status === "WAITING_ADMIN_REVIEW").map((order) => (
              <div key={order.id} className="rounded-3xl border border-white/10 bg-black/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3"><strong>{order.user?.username ?? order.user?.email ?? order.user_id}</strong><StatusBadge status={order.status} /></div>
                <p className="mt-2 text-sm text-zinc-400">{order.plan_type} · {formatMnt(order.amount)} · Code {order.payment_code}</p>
                {order.payment_proof ? <a href={order.payment_proof} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm font-bold text-gold underline">Open proof</a> : null}
                <form action={reviewSubscriptionOrder} className="mt-4 grid gap-2 sm:grid-cols-2">
                  <input type="hidden" name="order_id" value={order.id} />
                  <input name="reason" placeholder="Decline reason" className="rounded-2xl border border-white/10 bg-black px-3 py-2 text-sm text-white sm:col-span-2" />
                  <button name="decision" value="APPROVED" className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-black text-black">Approve</button>
                  <button name="decision" value="DECLINED" className="rounded-2xl bg-red-500 px-4 py-2 text-sm font-black text-white">Decline</button>
                </form>
              </div>
            ))}
            {!orders.data.filter((order) => order.status === "WAITING_ADMIN_REVIEW").length ? <p className="text-sm text-zinc-500">No orders waiting for review.</p> : null}
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-8 xl:grid-cols-2">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-2xl font-black text-white">Seller verification</h2>
          <div className="mt-5 space-y-4">
            {queue.data.slice(0, 8).map((item) => (
              <div key={item.id} className="rounded-3xl border border-white/10 bg-black/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3"><strong>{item.user?.username ?? item.user?.email ?? item.user_id}</strong><StatusBadge status={item.status} /></div>
                <div className="mt-3 flex flex-wrap gap-3 text-sm"><a className="text-gold underline" href={item.id_front} target="_blank" rel="noreferrer">ID front</a><a className="text-gold underline" href={item.id_back} target="_blank" rel="noreferrer">ID back</a><a className="text-gold underline" href={item.selfie_video} target="_blank" rel="noreferrer">Selfie/video</a></div>
                {item.status === "PENDING" ? (
                  <form action={reviewVerification} className="mt-4 grid gap-2 sm:grid-cols-2">
                    <input type="hidden" name="request_id" value={item.id} />
                    <input name="reason" placeholder="Rejection reason" className="rounded-2xl border border-white/10 bg-black px-3 py-2 text-sm text-white sm:col-span-2" />
                    <button name="decision" value="APPROVED" className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-black text-black">Approve</button>
                    <button name="decision" value="REJECTED" className="rounded-2xl bg-red-500 px-4 py-2 text-sm font-black text-white">Reject</button>
                  </form>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-2xl font-black text-white">Trade management</h2>
          <div className="mt-5 space-y-4">
            {trades.data.slice(0, 10).map((trade) => (
              <Link key={trade.id} href={`/trades/${trade.id}`} className="block rounded-3xl border border-white/10 bg-black/40 p-4 transition hover:border-gold/50">
                <div className="flex flex-wrap items-center justify-between gap-3"><strong>{trade.listings?.title ?? trade.id}</strong><StatusBadge status={trade.status} /></div>
                <p className="mt-2 text-sm text-zinc-500">Amount {formatMnt(trade.amount)} · Fee {formatMnt(trade.fee)}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
        <h2 className="text-2xl font-black text-white">User & moderator management</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-zinc-500"><tr><th className="p-3">User</th><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">Joined</th><th className="p-3">Update role</th></tr></thead>
            <tbody>
              {users.data.map((item) => (
                <tr key={item.id} className="border-t border-white/10">
                  <td className="p-3 font-bold text-white">{item.username ?? item.id}</td>
                  <td className="p-3 text-zinc-400">{item.email}</td>
                  <td className="p-3"><StatusBadge status={item.role} /></td>
                  <td className="p-3 text-zinc-500">{new Date(item.created_at).toLocaleDateString()}</td>
                  <td className="p-3">
                    <form action={updateUserRole} className="flex gap-2">
                      <input type="hidden" name="user_id" value={item.id} />
                      <select name="role" defaultValue={item.role} className="rounded-xl border border-white/10 bg-black px-3 py-2 text-white">
                        <option>USER</option><option>VERIFIED_SELLER</option><option>MODERATOR</option><option>ADMIN</option>
                      </select>
                      <button className="rounded-xl bg-gold px-3 py-2 font-black text-black">Save</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
