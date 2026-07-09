import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { SubscriptionOrderForm, SubscriptionProofForm } from "@/components/forms/SubscriptionForms";
import { requireUser } from "@/lib/auth/session";
import { getPaymentSettings, getSubscriptionOrders, getSubscriptionPlans } from "@/lib/marketplace/queries";
import { formatMnt } from "@/components/marketplace/ListingCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Subscriptions" };

export default async function SubscriptionsPage() {
  await requireUser();
  const [plans, settings, orders] = await Promise.all([getSubscriptionPlans(), getPaymentSettings(), getSubscriptionOrders()]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-gold">Manual bank transfer</p>
        <h1 className="mt-3 text-4xl font-black text-white">Seller Pro & Moderator subscriptions</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">Select a Supabase-configured plan, transfer manually to the admin bank account, upload proof, then wait for admin approval.</p>
      </section>

      <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          {plans.data.length ? <SubscriptionOrderForm plans={plans.data} /> : <EmptyState title="No active plans" message={plans.error ?? "Ask an admin to configure subscription plans in Supabase."} />}
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-2xl font-black text-white">Your subscription orders</h2>
            <div className="mt-5 space-y-3">
              {orders.data.length ? orders.data.map((order) => (
                <div key={order.id} className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3"><strong className="text-white">{order.plan_type.replaceAll("_", " ")}</strong><StatusBadge status={order.status} /></div>
                  <p className="mt-2 text-sm text-zinc-400">Order ID: {order.id}</p>
                  <p className="text-sm text-zinc-400">Payment code: <strong className="text-gold">{order.payment_code}</strong></p>
                  <p className="text-sm text-zinc-400">Amount: {formatMnt(order.amount)}</p>
                </div>
              )) : <p className="text-sm text-zinc-500">No subscription orders yet.</p>}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[2rem] border border-gold/20 bg-gold/10 p-6">
            <h2 className="text-2xl font-black text-white">Admin bank account</h2>
            {settings.data ? (
              <div className="mt-4 space-y-3 text-sm text-zinc-200">
                <p>Bank: <strong>{settings.data.bank_name}</strong></p>
                <p>Account: <strong>{settings.data.account_number}</strong></p>
                <p>Holder: <strong>{settings.data.account_holder}</strong></p>
                <p className="leading-6 text-zinc-300">{settings.data.instructions}</p>
              </div>
            ) : <p className="mt-4 text-sm text-zinc-400">{settings.error ?? "Payment settings are not configured."}</p>}
          </div>
          <SubscriptionProofForm />
        </aside>
      </section>
    </main>
  );
}
