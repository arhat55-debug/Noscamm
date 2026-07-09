"use client";

import { motion } from "framer-motion";
import { CalendarDays, Heart, MessageSquareText, Swords, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { ListingCard, formatMnt } from "@/components/marketplace/ListingCard";
import { ManageListingRow } from "@/components/marketplace/ManageListingRow";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { PublicProfile } from "@/lib/marketplace/types";

const tabs = ["Listings", "Reviews", "Trade History", "Favorites", "About"] as const;

type Tab = (typeof tabs)[number];

type ListingAction = (formData: FormData) => void | Promise<void>;

function Stars({ rating }: { rating: number }) {
  const rounded = Math.round(rating);
  return (
    <span className="inline-flex text-gold" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => <span key={index}>{index < rounded ? "★" : "☆"}</span>)}
    </span>
  );
}

export function ProfileTabs({
  profile,
  isOwner = false,
  updateStatusAction,
  deleteAction,
}: {
  profile: PublicProfile;
  isOwner?: boolean;
  updateStatusAction?: ListingAction;
  deleteAction?: ListingAction;
}) {
  const [active, setActive] = useState<Tab>("Listings");
  const recentReviews = useMemo(() => profile.reviews.slice(0, 6), [profile.reviews]);

  return (
    <section className="rounded-[24px] border border-white/10 bg-white/[0.04] p-3 shadow-2xl shadow-black/25 backdrop-blur-xl sm:p-4">
      <div className="flex gap-2 overflow-x-auto rounded-[20px] border border-white/10 bg-black/30 p-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActive(tab)}
            className={`relative whitespace-nowrap rounded-2xl px-4 py-3 text-sm font-black transition ${active === tab ? "text-black" : "text-zinc-400 hover:text-white"}`}
          >
            {active === tab ? <motion.span layoutId="profile-active-tab" className="absolute inset-0 rounded-2xl bg-gold" transition={{ type: "spring", stiffness: 420, damping: 34 }} /> : null}
            <span className="relative">{tab}</span>
          </button>
        ))}
      </div>

      <div className="p-3 sm:p-4">
        {active === "Listings" ? (
          profile.listings.length ? (
            isOwner && updateStatusAction && deleteAction ? (
              <div className="space-y-3">
                {profile.listings.map((listing) => (
                  <ManageListingRow
                    key={listing.id}
                    listing={listing}
                    updateStatusAction={updateStatusAction}
                    deleteAction={deleteAction}
                  />
                ))}
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{profile.listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div>
            )
          ) : (
            <EmptyState title="No listings yet" message="This seller has not published listings visible to you." />
          )
        ) : null}

        {active === "Reviews" ? (
          <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
            <div className="rounded-[24px] border border-gold/20 bg-gold/10 p-6">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-gold">Seller rating</p>
              <p className="mt-3 text-5xl font-black text-white">{profile.stats.averageRating.toFixed(1)}</p>
              <div className="mt-2 text-2xl"><Stars rating={profile.stats.averageRating} /></div>
              <p className="mt-3 text-sm text-zinc-300">{profile.stats.totalReviews} reviews · {profile.stats.positiveReviewPercentage}% positive</p>
            </div>
            <div className="space-y-4">
              {recentReviews.length ? recentReviews.map((review) => (
                <article key={review.id} className="rounded-[24px] border border-white/10 bg-black/35 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-black text-white">{review.reviewer?.username ?? "Marketplace buyer"}</p>
                      <p className="text-xs text-zinc-500">{new Date(review.created_at).toLocaleDateString()}</p>
                    </div>
                    <Stars rating={review.rating} />
                  </div>
                  {review.comment ? <p className="mt-4 text-sm leading-6 text-zinc-300">{review.comment}</p> : null}
                </article>
              )) : <EmptyState title="No reviews yet" message="Completed buyers can leave reviews after trades finish." />}
            </div>
          </div>
        ) : null}

        {active === "Trade History" ? (
          profile.tradeHistory.length ? <div className="space-y-4">{profile.tradeHistory.map((trade) => (
            <div key={trade.id} className="rounded-[24px] border border-white/10 bg-black/35 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3"><strong className="text-white">{trade.listings?.title ?? "Completed trade"}</strong><StatusBadge status={trade.status} /></div>
              <p className="mt-2 text-sm text-zinc-400">Amount {formatMnt(trade.amount)} · Completed {trade.completed_at ? new Date(trade.completed_at).toLocaleDateString() : "—"}</p>
            </div>
          ))}</div> : <EmptyState title="No public trade history" message="Completed trades become visible here when Supabase policies allow public summaries." />
        ) : null}

        {active === "Favorites" ? (
          profile.favoriteListings.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{profile.favoriteListings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div> : <EmptyState title="No visible favorites" message="Favorites are private unless Supabase RLS allows them for this profile." />
        ) : null}

        {active === "About" ? (
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-black/35 p-5 lg:col-span-2">
              <div className="flex items-center gap-3 text-gold"><UserRound /><h3 className="text-xl font-black text-white">About seller</h3></div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-zinc-300">{profile.profile.bio || "This seller has not added an about section yet."}</p>
            </div>
            <div className="space-y-4">
              <div className="rounded-[24px] border border-white/10 bg-black/35 p-5"><Swords className="text-gold" /><p className="mt-3 text-sm text-zinc-400">Completed trades</p><p className="text-3xl font-black text-white">{profile.stats.completedTrades}</p></div>
              <div className="rounded-[24px] border border-white/10 bg-black/35 p-5"><Heart className="text-gold" /><p className="mt-3 text-sm text-zinc-400">Followers</p><p className="text-3xl font-black text-white">{profile.stats.followers}</p></div>
              <div className="rounded-[24px] border border-white/10 bg-black/35 p-5"><CalendarDays className="text-gold" /><p className="mt-3 text-sm text-zinc-400">Joined</p><p className="text-lg font-black text-white">{new Date(profile.profile.created_at).toLocaleDateString()}</p></div>
              <div className="rounded-[24px] border border-white/10 bg-black/35 p-5"><MessageSquareText className="text-gold" /><p className="mt-3 text-sm text-zinc-400">Positive reviews</p><p className="text-3xl font-black text-white">{profile.stats.positiveReviewPercentage}%</p></div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function RatingStars({ rating }: { rating: number }) {
  return <Stars rating={rating} />;
}
