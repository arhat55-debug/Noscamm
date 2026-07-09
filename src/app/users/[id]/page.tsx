import Image from "next/image";
import { notFound } from "next/navigation";
import { BadgeCheck, Crown, Radio, Shield, ShieldCheck, Sparkles, Star, Trophy, Zap } from "lucide-react";
import { ListingCard, formatMnt } from "@/components/marketplace/ListingCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { ProfileTabs, RatingStars } from "@/components/profile/ProfileTabs";
import { ProfileEditControls } from "@/components/profile/ProfileEditControls";
import { getAuthContext } from "@/lib/auth/session";
import { getPublicProfile } from "@/lib/marketplace/queries";
import { deleteOwnListingForm, updateOwnListingStatusForm, updateProfileForm } from "@/lib/marketplace/actions";

export const dynamic = "force-dynamic";

function initials(username?: string | null) {
  return (username ?? "NX").slice(0, 2).toUpperCase();
}

function isOnline(onlineAt?: string | null) {
  if (!onlineAt) return false;
  return Date.now() - new Date(onlineAt).getTime() < 5 * 60_000;
}

function Badge({ children, tone = "gold" }: { children: React.ReactNode; tone?: "gold" | "blue" | "purple" | "green" }) {
  const tones = {
    gold: "border-gold/30 bg-gold/15 text-gold",
    blue: "border-sky-400/30 bg-sky-400/15 text-sky-200",
    purple: "border-purple-400/30 bg-purple-400/15 text-purple-200",
    green: "border-emerald-400/30 bg-emerald-400/15 text-emerald-200",
  };
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-wide backdrop-blur ${tones[tone]}`}>{children}</span>;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getPublicProfile(id);
  return { title: profile.data?.profile.username ? `${profile.data.profile.username} Profile` : "User profile" };
}

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getPublicProfile(id);

  if (!result.data) {
    notFound();
  }

  const data = result.data;
  const profile = data.profile;
  const online = isOnline(profile.online_at);
  const auth = await getAuthContext();
  const isOwner = Boolean(auth.user && auth.user.id === profile.id);
  const statCards = [
    ["Total Listings", data.stats.totalListings.toLocaleString()],
    ["Active Listings", data.stats.activeListings.toLocaleString()],
    ["Sold Accounts", data.stats.soldAccounts.toLocaleString()],
    ["Total Revenue", formatMnt(data.stats.totalRevenue)],
    ["Total Reviews", data.stats.totalReviews.toLocaleString()],
    ["Followers", data.stats.followers.toLocaleString()],
    ["Following", data.stats.following.toLocaleString()],
    ["Favorites", data.stats.favorites.toLocaleString()],
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="relative aspect-[16/9] max-h-[460px] min-h-[260px] overflow-hidden bg-[radial-gradient(circle_at_20%_20%,rgba(214,165,52,0.34),transparent_32%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.12),transparent_28%),linear-gradient(135deg,#080808,#1b1305_55%,#050505)]">
          {profile.cover_url ? <Image src={profile.cover_url} alt={`${profile.username ?? "User"} cover`} fill sizes="100vw" className="object-cover" priority /> : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
          <div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="relative size-28 overflow-hidden rounded-full border-4 border-black bg-zinc-900 shadow-2xl shadow-black/50 sm:size-36">
                {profile.avatar_url ? <Image src={profile.avatar_url} alt={profile.username ?? "Profile avatar"} fill sizes="144px" className="object-cover" /> : <div className="grid h-full place-items-center bg-gold/10 text-3xl font-black text-gold">{initials(profile.username)}</div>}
                <span className={`absolute bottom-3 right-3 size-5 rounded-full border-2 border-black ${online ? "bg-emerald-400" : "bg-zinc-500"}`} />
              </div>
              <div className="pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-black text-white sm:text-5xl">{profile.username ?? "NEXUS User"}</h1>
                  {profile.role === "VERIFIED_SELLER" || profile.role === "ADMIN" ? <Badge><BadgeCheck size={14} /> Verified Seller</Badge> : null}
                  {profile.active_subscription ? <Badge><Crown size={14} /> Seller Pro</Badge> : null}
                  {profile.role === "MODERATOR" ? <Badge tone="purple"><Shield size={14} /> Moderator</Badge> : null}
                  {profile.role === "ADMIN" ? <Badge tone="blue"><ShieldCheck size={14} /> Admin</Badge> : null}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-zinc-300">
                  <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 ${online ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-white/10 bg-white/5"}`}><Radio size={14} /> {online ? "Online" : "Offline"}</span>
                  <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                  <span>{data.stats.completedTrades} completed trades</span>
                </div>
                {isOwner ? (
                  <div className="mt-4">
                    <ProfileEditControls action={updateProfileForm} bankAccount={profile.bank_account} />
                  </div>
                ) : null}
              </div>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-black/45 p-4 text-right shadow-xl shadow-black/30 backdrop-blur-xl">
              <div className="flex items-center justify-end gap-2 text-xl"><RatingStars rating={data.stats.averageRating} /></div>
              <p className="mt-1 text-sm text-zinc-300">{data.stats.averageRating.toFixed(1)} average · {profile.success_rate ?? 0}% success</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(([label, value]) => (
          <div key={label} className="group rounded-[24px] border border-white/10 bg-white/[0.05] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-gold/40 hover:bg-white/[0.08]">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">{label}</p>
            <p className="mt-3 text-2xl font-black text-white sm:text-3xl">{value}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <ProfileTabs
            profile={data}
            isOwner={isOwner}
            updateStatusAction={updateOwnListingStatusForm}
            deleteAction={deleteOwnListingForm}
          />
        </div>

        <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-[24px] border border-gold/20 bg-gold/10 p-6 shadow-2xl shadow-gold/5 backdrop-blur-xl">
            <div className="flex items-center gap-3"><Star className="text-gold" /><h2 className="text-2xl font-black text-white">Seller Rating</h2></div>
            <p className="mt-5 text-6xl font-black text-white">{data.stats.averageRating.toFixed(1)}</p>
            <div className="mt-2 text-2xl"><RatingStars rating={data.stats.averageRating} /></div>
            <p className="mt-3 text-sm leading-6 text-zinc-300">{data.stats.totalReviews} total reviews with {data.stats.positiveReviewPercentage}% positive feedback.</p>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <div className="flex items-center gap-3"><Trophy className="text-gold" /><h2 className="text-2xl font-black text-white">Achievements</h2></div>
            {data.achievements.length ? (
              <div className="mt-5 grid grid-cols-2 gap-3">
                {data.achievements.map((achievement) => (
                  <div key={achievement.id} className="rounded-[20px] border border-white/10 bg-black/35 p-4 text-center transition hover:-translate-y-1 hover:border-gold/40">
                    <div className="mx-auto grid size-11 place-items-center rounded-2xl bg-gold/10 text-xl text-gold">{achievement.icon ?? "🏆"}</div>
                    <p className="mt-3 text-sm font-black text-white">{achievement.name}</p>
                    {achievement.rarity ? <p className="mt-1 text-[11px] uppercase tracking-wide text-gold">{achievement.rarity}</p> : null}
                  </div>
                ))}
              </div>
            ) : <EmptyState title="No achievements yet" message="Achievements are awarded from Supabase as sellers complete verified milestones." />}
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <div className="flex items-center gap-3"><Sparkles className="text-gold" /><h2 className="text-2xl font-black text-white">Featured listings</h2></div>
            <div className="mt-5 space-y-4">
              {data.listings.slice(0, 2).map((listing) => <ListingCard key={listing.id} listing={listing} />)}
              {!data.listings.length ? <p className="text-sm text-zinc-500">No visible listings.</p> : null}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <div className="flex items-center gap-3"><Zap className="text-gold" /><h2 className="text-2xl font-black text-white">Performance</h2></div>
            <div className="mt-5 space-y-3 text-sm text-zinc-300">
              <p className="flex justify-between rounded-2xl bg-black/35 p-3"><span>Success rate</span><strong className="text-white">{profile.success_rate ?? 0}%</strong></p>
              <p className="flex justify-between rounded-2xl bg-black/35 p-3"><span>Completed trades</span><strong className="text-white">{data.stats.completedTrades}</strong></p>
              <p className="flex justify-between rounded-2xl bg-black/35 p-3"><span>Sold accounts</span><strong className="text-white">{data.stats.soldAccounts}</strong></p>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
