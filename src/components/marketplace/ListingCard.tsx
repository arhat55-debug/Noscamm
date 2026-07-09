import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Eye, Heart, Swords } from "lucide-react";
import type { Listing } from "@/lib/marketplace/types";
import { StatusBadge } from "@/components/shared/StatusBadge";

export function formatMnt(value: number) {
  return new Intl.NumberFormat("mn-MN", { style: "currency", currency: "MNT", maximumFractionDigits: 0 }).format(value);
}

export function ListingCard({ listing }: { listing: Listing }) {
  const image = listing.listing_images?.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0];
  const isPremium = Boolean(listing.seller?.active_subscription);

  return (
    <Link href={`/listings/${listing.id}`} className="group overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/30 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-gold/50 hover:bg-white/[0.07] hover:shadow-gold/10">
      <div className="relative aspect-[4/3] overflow-hidden bg-zinc-900">
        {image ? (
          <Image src={image.thumbnail_url ?? image.image_url} alt={listing.title} fill sizes="(max-width:768px) 100vw, 33vw" className="object-cover transition duration-700 group-hover:scale-110" loading="lazy" />
        ) : (
          <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_center,#3a2a0b,transparent_55%)] text-gold">
            <Swords size={44} />
          </div>
        )}
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-black/75 px-3 py-1 text-xs font-black uppercase text-gold backdrop-blur">{listing.rank}</span>
          <StatusBadge status={listing.status} />
        </div>
        {isPremium ? <span className="absolute right-4 top-4 rounded-full bg-gold px-3 py-1 text-xs font-black text-black">PRO</span> : null}
      </div>
      <div className="space-y-4 p-5">
        <div>
          <h3 className="line-clamp-2 text-lg font-black text-white">{listing.title}</h3>
          <div className="mt-2 flex items-center gap-2 text-sm text-zinc-400">
            <BadgeCheck className="text-gold" size={16} />
            <span>{listing.seller?.username ?? "Verified seller"}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-white/[0.04] p-3">
            <p className="text-zinc-500">Heroes</p>
            <p className="font-black text-white">{listing.heroes}</p>
          </div>
          <div className="rounded-2xl bg-white/[0.04] p-3">
            <p className="text-zinc-500">Skins</p>
            <p className="font-black text-white">{listing.skins}</p>
          </div>
        </div>
        <div className="flex items-end justify-between gap-4 border-t border-white/10 pt-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Price</p>
            <p className="text-xl font-black text-gold">{formatMnt(listing.price)}</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1"><Eye size={14} />{listing.views}</span>
            <span className="inline-flex items-center gap-1"><Heart size={14} />{listing.favorites}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
