import Link from "next/link";
import { BadgeCheck, Crown, ShieldCheck, Swords } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getUserTrades } from "@/lib/marketplace/queries";
import { StatusBadge } from "@/components/shared/StatusBadge";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard" };

const cards = [
  { href: "/profile", title: "Premium profile", description: "View profile, ratings, achievements, and activity", icon: BadgeCheck },
  { href: "/listings", title: "Browse accounts", description: "Find verified Mobile Legends accounts", icon: Swords },
  { href: "/verification", title: "Seller verification", description: "Submit KYC and liveness evidence", icon: ShieldCheck },
  { href: "/sell", title: "Create listing", description: "Available to verified sellers", icon: BadgeCheck },
  { href: "/subscriptions", title: "Subscriptions", description: "Seller Pro and Moderator plans", icon: Crown },
];

export default async function DashboardPage() {
  const { user, profile } = await requireUser();
  const trades = await getUserTrades(user.id, profile?.role);

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-gold">Command center</p>
        <h1 className="mt-3 text-4xl font-black text-white">Welcome, {profile?.username ?? profile?.email ?? "player"}</h1>
        <div className="mt-5 flex flex-wrap gap-3"><StatusBadge status={profile?.role ?? "USER"} /><span className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-zinc-300">Joined {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}</span></div>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.href} href={card.href} className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 transition hover:-translate-y-1 hover:border-gold/50">
              <Icon className="text-gold" />
              <h2 className="mt-5 text-xl font-black text-white">{card.title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{card.description}</p>
            </Link>
          );
        })}
      </section>

      <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
        <div className="flex items-center justify-between gap-4"><h2 className="text-2xl font-black text-white">Recent trades</h2><Link href="/trades" className="text-sm font-bold text-gold">View all</Link></div>
        <div className="mt-5 space-y-3">
          {trades.data.slice(0, 5).map((trade) => (
            <Link key={trade.id} href={`/trades/${trade.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/40 p-4 transition hover:border-gold/50">
              <span className="font-bold text-white">{trade.listings?.title ?? trade.id}</span>
              <StatusBadge status={trade.status} />
            </Link>
          ))}
          {!trades.data.length ? <p className="text-sm text-zinc-500">No trades yet.</p> : null}
        </div>
      </section>
    </main>
  );
}
