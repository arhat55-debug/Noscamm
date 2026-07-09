import { Search } from "lucide-react";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { getListings } from "@/lib/marketplace/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Browse listings" };

export default async function ListingsPage({ searchParams }: { searchParams?: { q?: string; rank?: string; min?: string; max?: string } }) {
  const listings = await getListings({
    query: searchParams?.q,
    rank: searchParams?.rank,
    minPrice: searchParams?.min ? Number(searchParams.min) : undefined,
    maxPrice: searchParams?.max ? Number(searchParams.max) : undefined,
  });

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-gold">Marketplace</p>
        <h1 className="mt-3 text-4xl font-black text-white sm:text-6xl">Browse verified MLBB accounts</h1>
        <form className="mt-8 grid gap-3 md:grid-cols-[1fr_.7fr_.5fr_.5fr_auto]">
          <label className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input name="q" defaultValue={searchParams?.q} placeholder="Search title" className="w-full rounded-2xl border border-white/10 bg-black/40 py-3 pl-11 pr-4 text-white outline-none focus:border-gold" />
          </label>
          <input name="rank" defaultValue={searchParams?.rank} placeholder="Rank" className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-gold" />
          <input name="min" defaultValue={searchParams?.min} placeholder="Min" type="number" className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-gold" />
          <input name="max" defaultValue={searchParams?.max} placeholder="Max" type="number" className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-gold" />
          <button className="rounded-2xl bg-gold px-5 py-3 font-black text-black hover:bg-white">Filter</button>
        </form>
      </section>

      <section className="mt-8">
        {listings.data.length ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {listings.data.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
          </div>
        ) : (
          <EmptyState title="No matching accounts" message={listings.error ?? "Try another filter or check back when sellers publish new listings."} />
        )}
      </section>
    </main>
  );
}
