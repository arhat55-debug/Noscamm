import Link from "next/link";
import { ArrowRight, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { ListingCard, formatMnt } from "@/components/marketplace/ListingCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { MotionReveal } from "@/components/shared/MotionReveal";
import { StatCard } from "@/components/shared/StatCard";
import { getFeaturedListings, getMarketplaceStats, getPaymentSettings } from "@/lib/marketplace/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [listings, stats, paymentSettings] = await Promise.all([getFeaturedListings(6), getMarketplaceStats(), getPaymentSettings()]);
  const escrowListing = listings.data[0];
  const escrowFee = paymentSettings.data?.midman_fee;
  const escrowPayout = escrowListing && typeof escrowFee === "number" ? Math.max(escrowListing.price - escrowFee, 0) : null;

  return (
    <main>
      <section className="mx-auto grid min-h-[calc(100vh-76px)] max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:px-8">
        <MotionReveal>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-gold">
              <Sparkles size={14} /> Verified MLBB escrow
            </div>
            <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[0.95] tracking-tight text-white sm:text-7xl lg:text-8xl">
              Secure Mobile Legends account marketplace.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-300 sm:text-lg">
              Buy and sell MLBB accounts through manual KYC, verified sellers, Cloudinary-backed evidence, private Supabase realtime trade rooms, moderator midman workflow, and admin-controlled bank-transfer payments.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/listings" className="inline-flex items-center justify-center gap-2 rounded-full bg-gold px-6 py-4 text-sm font-black text-black transition hover:bg-white">
                Browse accounts <ArrowRight size={18} />
              </Link>
              <Link href="/verification" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-6 py-4 text-sm font-black text-white transition hover:bg-white/10">
                Become verified seller
              </Link>
            </div>
          </div>
        </MotionReveal>

        <MotionReveal delay={0.15}>
          <div className="relative rounded-[2.5rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/40 backdrop-blur">
            <div className="absolute -right-8 -top-8 size-32 rounded-full bg-gold/20 blur-3xl" />
            <div className="rounded-[2rem] border border-gold/20 bg-black p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-gold">Midman example</p>
                  <h2 className="mt-2 text-2xl font-black text-white">Escrow breakdown</h2>
                </div>
                <LockKeyhole className="text-gold" />
              </div>
              {escrowListing && typeof escrowFee === "number" && escrowPayout !== null ? (
                <div className="space-y-3">
                  <div className="flex justify-between rounded-2xl bg-white/[0.04] p-4"><span className="text-zinc-400">Live listing price</span><strong>{formatMnt(escrowListing.price)}</strong></div>
                  <div className="flex justify-between rounded-2xl bg-white/[0.04] p-4"><span className="text-zinc-400">Configured fee</span><strong>{formatMnt(escrowFee)}</strong></div>
                  <div className="flex justify-between rounded-2xl bg-gold p-4 text-black"><span className="font-bold">Seller payout</span><strong>{formatMnt(escrowPayout)}</strong></div>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-zinc-400">
                  Add active listings and payment settings in Supabase to render a live escrow payout breakdown.
                </div>
              )}
              <div className="mt-6 grid grid-cols-3 gap-3 text-center text-xs font-bold text-zinc-400">
                <span className="rounded-2xl border border-white/10 p-3"><ShieldCheck className="mx-auto mb-1 text-gold" size={18} />KYC</span>
                <span className="rounded-2xl border border-white/10 p-3"><LockKeyhole className="mx-auto mb-1 text-gold" size={18} />Private</span>
                <span className="rounded-2xl border border-white/10 p-3"><Sparkles className="mx-auto mb-1 text-gold" size={18} />Manual</span>
              </div>
            </div>
          </div>
        </MotionReveal>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        {stats.data.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.data.map((stat) => (
              <StatCard key={stat.label} label={stat.label} value={stat.label.toLowerCase().includes("revenue") ? formatMnt(stat.value) : stat.value} />
            ))}
          </div>
        ) : null}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-gold">Live inventory</p>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-5xl">Featured accounts</h2>
          </div>
          <Link href="/listings" className="inline-flex items-center gap-2 text-sm font-black text-gold hover:text-white">View all <ArrowRight size={16} /></Link>
        </div>

        {listings.data.length ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {listings.data.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
          </div>
        ) : (
          <EmptyState title="No live listings yet" message={listings.error ?? "Once verified sellers publish listings in Supabase, they will appear here automatically."} actionHref="/verification" actionLabel="Request seller verification" />
        )}
      </section>
    </main>
  );
}
