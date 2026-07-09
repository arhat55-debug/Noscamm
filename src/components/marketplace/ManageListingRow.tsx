"use client";

import Link from "next/link";
import { formatMnt } from "@/components/marketplace/ListingCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { Listing } from "@/lib/marketplace/types";

type ListingAction = (formData: FormData) => void | Promise<void>;

export function ManageListingRow({
  listing,
  updateStatusAction,
  deleteAction,
}: {
  listing: Listing;
  updateStatusAction: ListingAction;
  deleteAction: ListingAction;
}) {
  const canToggle = listing.status === "ACTIVE" || listing.status === "HIDDEN";
  const canDelete = listing.status !== "SOLD" && listing.status !== "REMOVED";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-white/10 bg-black/35 p-4">
      <div>
        <Link href={`/listings/${listing.id}`} className="font-black text-white hover:text-gold">
          {listing.title}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          <span className="text-sm font-black text-gold">{formatMnt(listing.price)}</span>
          <span>👁 {listing.views} · ♥ {listing.favorites}</span>
          <StatusBadge status={listing.status} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/listings/${listing.id}`}
          className="rounded-full bg-gold px-3 py-1.5 text-xs font-black text-black transition hover:bg-white"
        >
          Дэлгэрэнгүй
        </Link>
        {canToggle ? (
          <form action={updateStatusAction}>
            <input type="hidden" name="listing_id" value={listing.id} />
            <input type="hidden" name="status" value={listing.status === "ACTIVE" ? "HIDDEN" : "ACTIVE"} />
            <button
              type="submit"
              className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold text-zinc-200 transition hover:border-gold/50 hover:text-gold"
            >
              {listing.status === "ACTIVE" ? "Нуух" : "Идэвхжүүлэх"}
            </button>
          </form>
        ) : null}
        {canDelete ? (
          <form
            action={deleteAction}
            onSubmit={(event) => {
              if (!window.confirm("Энэ зарыг устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.")) {
                event.preventDefault();
              }
            }}
          >
            <input type="hidden" name="listing_id" value={listing.id} />
            <button
              type="submit"
              className="rounded-full border border-red-500/30 px-3 py-1.5 text-xs font-bold text-red-300 transition hover:border-red-400 hover:bg-red-500/10"
            >
              Устгах
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
