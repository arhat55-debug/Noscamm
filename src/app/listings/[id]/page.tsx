import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BadgeCheck, CalendarDays, ShieldCheck } from "lucide-react";
import { PremiumGallery } from "@/components/marketplace/PremiumGallery";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SubmitButton } from "@/components/shared/SubmitButton";
import { createTradeFromListing } from "@/lib/marketplace/actions";
import { getListingById } from "@/lib/marketplace/queries";
import { formatMnt } from "@/components/marketplace/ListingCard";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await getListingById(id);
  return { title: listing.data?.title ?? "Listing" };
}

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listingResult = await getListingById(id);
  const listing = listingResult.data;

  if (!listing) {
    notFound();
  }

  async function buyAction() {
    "use server";
    const result = await createTradeFromListing(id);
    if (result.ok) {
      redirect(result.message);
    }
    redirect(`/listings/${id}?error=${encodeURIComponent(result.message)}`);
  }

  const images = listing.listing_images?.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)) ?? [];

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
        <PremiumGallery images={images} title={listing.title} />

        <aside className="rounded-[24px] border border-white/10 bg-white/[0.05] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl lg:sticky lg:top-28 lg:self-start">
          <div className="flex flex-wrap gap-2"><StatusBadge status={listing.status} /><span className="rounded-full bg-gold px-3 py-1 text-xs font-black text-black">{listing.rank}</span></div>
          <h1 className="mt-5 text-3xl font-black leading-tight text-white sm:text-5xl">{listing.title}</h1>
          <p className="mt-4 text-4xl font-black text-gold">{formatMnt(listing.price)}</p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-[20px] bg-black/40 p-4"><p className="text-xs text-zinc-500">Heroes</p><p className="text-xl font-black text-white">{listing.heroes}</p></div>
            <div className="rounded-[20px] bg-black/40 p-4"><p className="text-xs text-zinc-500">Skins</p><p className="text-xl font-black text-white">{listing.skins}</p></div>
            <div className="rounded-[20px] bg-black/40 p-4"><p className="text-xs text-zinc-500">Server ID</p><p className="text-xl font-black text-white">{listing.server_id ?? "—"}</p></div>
            <div className="rounded-[20px] bg-black/40 p-4"><p className="text-xs text-zinc-500">Views</p><p className="text-xl font-black text-white">{listing.views}</p></div>
          </div>

          <div className="mt-6 rounded-[20px] border border-gold/20 bg-gold/10 p-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-gold" />
              <div>
                <p className="font-black text-white">Private midman trade</p>
                <p className="text-sm text-zinc-400">Buyer, seller, assigned moderator, and admins only.</p>
              </div>
            </div>
          </div>

          <form action={buyAction} className="mt-6"><SubmitButton>Buy through midman</SubmitButton></form>
        </aside>
      </section>

      <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <h2 className="text-2xl font-black text-white">Description</h2>
          <p className="mt-4 whitespace-pre-wrap leading-8 text-zinc-300">{listing.description}</p>
        </div>
        <Link href={`/users/${listing.seller?.username ?? listing.seller_id}`} className="rounded-[24px] border border-white/10 bg-white/[0.05] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl transition hover:-translate-y-1 hover:border-gold/40">
          <h2 className="text-2xl font-black text-white">Seller</h2>
          <div className="mt-4 flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-2xl bg-gold/10 text-gold"><BadgeCheck /></div>
            <div>
              <p className="font-black text-white">{listing.seller?.username ?? "Verified seller"}</p>
              <p className="text-sm text-zinc-500">{listing.seller?.role?.replaceAll("_", " ")}</p>
            </div>
          </div>
          <div className="mt-5 space-y-3 text-sm text-zinc-400">
            <p className="flex items-center gap-2"><CalendarDays size={16} /> Joined {listing.seller?.created_at ? new Date(listing.seller.created_at).toLocaleDateString() : "—"}</p>
            <p>Total sales: <strong className="text-white">{listing.seller?.total_sales ?? 0}</strong></p>
            <p>Reviews: <strong className="text-white">{listing.seller?.reviews ?? 0}</strong></p>
            <p>Success rate: <strong className="text-white">{listing.seller?.success_rate ?? 0}%</strong></p>
            {listing.seller?.bank_account ? (
              <p className="rounded-[20px] border border-white/10 bg-black/35 p-3 text-zinc-300">
                Bank account (reference only): <strong className="text-white">{listing.seller.bank_account}</strong>
                <br />
                <span className="text-xs text-zinc-500">
                  For your protection, always pay through the midman trade room. Never transfer directly to a seller.
                </span>
              </p>
            ) : null}
          </div>
        </Link>
      </section>
    </main>
  );
}
