import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabasePublicEnv, getSupabaseServiceEnv } from "@/lib/supabase/env";
import type {
  AppStat,
  Listing,
  PaymentSettings,
  Profile,
  QueryResult,
  SubscriptionOrder,
  SubscriptionPlan,
  Trade,
  TradeMessage,
  UserRole,
  VerificationRequest,
  PublicProfile,
  Review,
  Achievement,
} from "./types";

function emptyResult<T>(data: T, error?: string): QueryResult<T> {
  return { data, error, configured: getSupabasePublicEnv().configured };
}

function serviceConfigured() {
  return getSupabaseServiceEnv().serviceConfigured;
}

export async function getFeaturedListings(limit = 8): Promise<QueryResult<Listing[]>> {
  if (!getSupabasePublicEnv().configured) {
    return emptyResult([], "Connect Supabase to load live listings.");
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("listings")
      .select(
        "id,seller_id,title,price,description,rank,server_id,heroes,skins,status,views,favorites,created_at,updated_at, listing_images(id,listing_id,image_url,thumbnail_url,cloudinary_public_id,sort_order,width,height,created_at), seller:users!listings_seller_id_fkey(id,username,avatar_url,role,created_at,total_sales,reviews,success_rate,active_subscription)",
      )
      .eq("status", "ACTIVE")
      .order("active_subscription", { foreignTable: "seller", ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit)
      .returns<Listing[]>();

    if (error) {
      return emptyResult([], error.message);
    }

    return emptyResult(data ?? []);
  } catch (error) {
    return emptyResult([], error instanceof Error ? error.message : "Unable to load listings.");
  }
}

export async function getListings(input?: {
  query?: string;
  rank?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
}): Promise<QueryResult<Listing[]>> {
  if (!getSupabasePublicEnv().configured) {
    return emptyResult([], "Connect Supabase to browse live listings.");
  }

  try {
    const supabase = await createSupabaseServerClient();
    let query = supabase
      .from("listings")
      .select(
        "id,seller_id,title,price,description,rank,server_id,heroes,skins,status,views,favorites,created_at,updated_at, listing_images(id,listing_id,image_url,thumbnail_url,cloudinary_public_id,sort_order,width,height,created_at), seller:users!listings_seller_id_fkey(id,username,avatar_url,role,created_at,total_sales,reviews,success_rate,active_subscription)",
      )
      .eq("status", "ACTIVE");

    if (input?.query) {
      query = query.ilike("title", `%${input.query}%`);
    }

    if (input?.rank) {
      query = query.eq("rank", input.rank);
    }

    if (typeof input?.minPrice === "number") {
      query = query.gte("price", input.minPrice);
    }

    if (typeof input?.maxPrice === "number") {
      query = query.lte("price", input.maxPrice);
    }

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(input?.limit ?? 48)
      .returns<Listing[]>();

    if (error) {
      return emptyResult([], error.message);
    }

    return emptyResult(data ?? []);
  } catch (error) {
    return emptyResult([], error instanceof Error ? error.message : "Unable to load listings.");
  }
}

export async function getListingById(id: string): Promise<QueryResult<Listing | null>> {
  if (!getSupabasePublicEnv().configured) {
    return emptyResult(null, "Connect Supabase to view listings.");
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("listings")
      .select(
        "id,seller_id,title,price,description,rank,server_id,heroes,skins,status,views,favorites,created_at,updated_at, listing_images(id,listing_id,image_url,thumbnail_url,cloudinary_public_id,sort_order,width,height,created_at), seller:users!listings_seller_id_fkey(id,username,avatar_url,role,bank_account,created_at,total_sales,reviews,success_rate,active_subscription)",
      )
      .eq("id", id)
      .maybeSingle<Listing>();

    if (error) {
      return emptyResult(null, error.message);
    }

    if (data?.status === "ACTIVE") {
      await supabase.rpc("increment_listing_views", { listing_uuid: id });
    }

    return emptyResult(data ?? null);
  } catch (error) {
    return emptyResult(null, error instanceof Error ? error.message : "Unable to load listing.");
  }
}

export async function getMarketplaceStats(): Promise<QueryResult<AppStat[]>> {
  if (!serviceConfigured()) {
    return { data: [], configured: getSupabasePublicEnv().configured };
  }

  try {
    const supabase = createSupabaseAdminClient();
    const [listings, sellers, trades, revenue] = await Promise.all([
      supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "ACTIVE"),
      supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "VERIFIED_SELLER"),
      supabase.from("trades").select("id", { count: "exact", head: true }).eq("status", "COMPLETED"),
      supabase.from("transactions").select("amount").eq("type", "MIDMAN_FEE").eq("status", "COMPLETED"),
    ]);

    const revenueTotal =
      revenue.data?.reduce((sum, row: { amount: number }) => sum + Number(row.amount ?? 0), 0) ?? 0;

    return {
      data: [
        { label: "Active listings", value: listings.count ?? 0 },
        { label: "Verified sellers", value: sellers.count ?? 0 },
        { label: "Completed trades", value: trades.count ?? 0 },
        { label: "Platform revenue", value: revenueTotal },
      ],
      configured: true,
    };
  } catch (error) {
    return emptyResult([], error instanceof Error ? error.message : "Unable to load stats.");
  }
}

export async function getPaymentSettings(): Promise<QueryResult<PaymentSettings | null>> {
  if (!getSupabasePublicEnv().configured) {
    return emptyResult(null, "Connect Supabase to load payment settings.");
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("payment_settings")
      .select("id,bank_name,account_number,account_holder,instructions,midman_fee,updated_at")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle<PaymentSettings>();

    if (error) {
      return emptyResult(null, error.message);
    }

    return emptyResult(data ?? null);
  } catch (error) {
    return emptyResult(null, error instanceof Error ? error.message : "Unable to load settings.");
  }
}

export async function getSubscriptionPlans(): Promise<QueryResult<SubscriptionPlan[]>> {
  if (!getSupabasePublicEnv().configured) {
    return emptyResult([], "Connect Supabase to load subscription plans.");
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("subscription_plans")
      .select("id,plan_type,name,amount,duration_days,benefits,active")
      .eq("active", true)
      .order("amount", { ascending: true })
      .returns<SubscriptionPlan[]>();

    if (error) {
      return emptyResult([], error.message);
    }

    return emptyResult(data ?? []);
  } catch (error) {
    return emptyResult([], error instanceof Error ? error.message : "Unable to load plans.");
  }
}

export async function getUserTrades(userId: string, role?: UserRole | null): Promise<QueryResult<Trade[]>> {
  if (!getSupabasePublicEnv().configured) {
    return emptyResult([], "Connect Supabase to load trades.");
  }

  try {
    const supabase = await createSupabaseServerClient();
    let query = supabase
      .from("trades")
      .select(
        "id,listing_id,buyer_id,seller_id,moderator_id,amount,fee,status,created_at,completed_at, listings(id,title,rank,price,status), buyer:users!trades_buyer_id_fkey(id,username,avatar_url,role,created_at,total_sales,reviews,success_rate,active_subscription), seller:users!trades_seller_id_fkey(id,username,avatar_url,role,created_at,total_sales,reviews,success_rate,active_subscription), moderator:users!trades_moderator_id_fkey(id,username,avatar_url,role,created_at,total_sales,reviews,success_rate,active_subscription)",
      );

    if (role === "ADMIN") {
      query = query.order("created_at", { ascending: false });
    } else if (role === "MODERATOR") {
      query = query.or(`buyer_id.eq.${userId},seller_id.eq.${userId},moderator_id.eq.${userId}`);
    } else {
      query = query.or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);
    }

    const { data, error } = await query.order("created_at", { ascending: false }).returns<Trade[]>();

    if (error) {
      return emptyResult([], error.message);
    }

    return emptyResult(data ?? []);
  } catch (error) {
    return emptyResult([], error instanceof Error ? error.message : "Unable to load trades.");
  }
}

export async function getTradeRoom(tradeId: string): Promise<QueryResult<Trade | null>> {
  if (!getSupabasePublicEnv().configured) {
    return emptyResult(null, "Connect Supabase to load trade rooms.");
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("trades")
      .select(
        "id,listing_id,buyer_id,seller_id,moderator_id,amount,fee,status,created_at,completed_at, listings(id,title,rank,price,status), buyer:users!trades_buyer_id_fkey(id,username,avatar_url,role,created_at,total_sales,reviews,success_rate,active_subscription), seller:users!trades_seller_id_fkey(id,username,avatar_url,role,created_at,total_sales,reviews,success_rate,active_subscription), moderator:users!trades_moderator_id_fkey(id,username,avatar_url,role,created_at,total_sales,reviews,success_rate,active_subscription), trade_messages(id,trade_id,sender_id,message,attachment,created_at, sender:users!trade_messages_sender_id_fkey(id,username,avatar_url,role))",
      )
      .eq("id", tradeId)
      .order("created_at", { foreignTable: "trade_messages", ascending: true })
      .maybeSingle<Trade>();

    if (error) {
      return emptyResult(null, error.message);
    }

    return emptyResult(data ?? null);
  } catch (error) {
    return emptyResult(null, error instanceof Error ? error.message : "Unable to load trade room.");
  }
}

export async function getTradeMessages(tradeId: string): Promise<QueryResult<TradeMessage[]>> {
  if (!getSupabasePublicEnv().configured) {
    return emptyResult([], "Connect Supabase to load messages.");
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("trade_messages")
      .select("id,trade_id,sender_id,message,attachment,created_at, sender:users!trade_messages_sender_id_fkey(id,username,avatar_url,role)")
      .eq("trade_id", tradeId)
      .order("created_at", { ascending: true })
      .returns<TradeMessage[]>();

    if (error) {
      return emptyResult([], error.message);
    }

    return emptyResult(data ?? []);
  } catch (error) {
    return emptyResult([], error instanceof Error ? error.message : "Unable to load messages.");
  }
}

export async function getVerificationQueue(): Promise<QueryResult<VerificationRequest[]>> {
  if (!getSupabasePublicEnv().configured) {
    return emptyResult([], "Connect Supabase to load verification queue.");
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("verification_requests")
      .select("id,user_id,id_front,id_back,selfie_video,liveness_evidence,status,reviewed_by,rejection_reason,created_at,reviewed_at, user:users!verification_requests_user_id_fkey(id,email,username,avatar_url,role,bank_account,created_at,updated_at)")
      .order("created_at", { ascending: false })
      .returns<VerificationRequest[]>();

    if (error) {
      return emptyResult([], error.message);
    }

    return emptyResult(data ?? []);
  } catch (error) {
    return emptyResult([], error instanceof Error ? error.message : "Unable to load verification queue.");
  }
}

export async function getSubscriptionOrders(): Promise<QueryResult<SubscriptionOrder[]>> {
  if (!getSupabasePublicEnv().configured) {
    return emptyResult([], "Connect Supabase to load subscription orders.");
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("subscription_orders")
      .select("id,user_id,plan_type,amount,payment_code,payment_proof,status,created_at,reviewed_by,reviewed_at, user:users!subscription_orders_user_id_fkey(id,email,username,avatar_url,role,bank_account,created_at,updated_at)")
      .order("created_at", { ascending: false })
      .returns<SubscriptionOrder[]>();

    if (error) {
      return emptyResult([], error.message);
    }

    return emptyResult(data ?? []);
  } catch (error) {
    return emptyResult([], error instanceof Error ? error.message : "Unable to load orders.");
  }
}

export async function getUsersForAdmin(): Promise<QueryResult<Profile[]>> {
  if (!getSupabasePublicEnv().configured) {
    return emptyResult([], "Connect Supabase to load users.");
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("users")
      .select("id,email,username,avatar_url,cover_url,bio,role,bank_account,total_sales,reviews,success_rate,rating,active_subscription,online_at,created_at,updated_at")
      .order("created_at", { ascending: false })
      .limit(100)
      .returns<Profile[]>();

    if (error) {
      return emptyResult([], error.message);
    }

    return emptyResult(data ?? []);
  } catch (error) {
    return emptyResult([], error instanceof Error ? error.message : "Unable to load users.");
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function getPublicProfile(identifier: string): Promise<QueryResult<PublicProfile | null>> {
  if (!getSupabasePublicEnv().configured) {
    return emptyResult(null, "Connect Supabase to load premium profiles.");
  }

  try {
    const supabase = await createSupabaseServerClient();
    const profileQuery = supabase
      .from("users")
      .select("id,email,username,avatar_url,cover_url,bio,role,bank_account,total_sales,reviews,success_rate,rating,active_subscription,online_at,created_at,updated_at");

    const { data: profile, error: profileError } = isUuid(identifier)
      ? await profileQuery.eq("id", identifier).maybeSingle<Profile>()
      : await profileQuery.eq("username", identifier).maybeSingle<Profile>();

    if (profileError) {
      return emptyResult(null, profileError.message);
    }

    if (!profile) {
      return emptyResult(null);
    }

    const clientForPrivateAggregates = serviceConfigured() ? createSupabaseAdminClient() : supabase;

    const [
      totalListings,
      activeListings,
      soldListings,
      sellerListings,
      sellerReviews,
      followers,
      following,
      favorites,
      completedTrades,
      payouts,
      achievements,
      favoriteRows,
    ] = await Promise.all([
      clientForPrivateAggregates.from("listings").select("id", { count: "exact", head: true }).eq("seller_id", profile.id),
      clientForPrivateAggregates.from("listings").select("id", { count: "exact", head: true }).eq("seller_id", profile.id).eq("status", "ACTIVE"),
      clientForPrivateAggregates.from("listings").select("id", { count: "exact", head: true }).eq("seller_id", profile.id).eq("status", "SOLD"),
      supabase
        .from("listings")
        .select("id,seller_id,title,price,description,rank,server_id,heroes,skins,status,views,favorites,created_at,updated_at, listing_images(id,listing_id,image_url,thumbnail_url,cloudinary_public_id,sort_order,width,height,created_at), seller:users!listings_seller_id_fkey(id,username,avatar_url,role,created_at,total_sales,reviews,success_rate,active_subscription)")
        .eq("seller_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(24)
        .returns<Listing[]>(),
      supabase
        .from("reviews")
        .select("id,seller_id,reviewer_id,trade_id,rating,comment,created_at, reviewer:users!reviews_reviewer_id_fkey(id,username,avatar_url,role)")
        .eq("seller_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(12)
        .returns<Review[]>(),
      clientForPrivateAggregates.from("user_follows").select("follower_id", { count: "exact", head: true }).eq("following_id", profile.id),
      clientForPrivateAggregates.from("user_follows").select("following_id", { count: "exact", head: true }).eq("follower_id", profile.id),
      clientForPrivateAggregates.from("listing_favorites").select("listing_id", { count: "exact", head: true }).eq("user_id", profile.id),
      clientForPrivateAggregates.from("trades").select("id,listing_id,buyer_id,seller_id,moderator_id,amount,fee,status,created_at,completed_at, listings(id,title,rank,price,status)", { count: "exact" }).eq("seller_id", profile.id).eq("status", "COMPLETED").order("completed_at", { ascending: false }).limit(12).returns<Trade[]>(),
      clientForPrivateAggregates.from("transactions").select("amount, trades!inner(seller_id)").eq("type", "SELLER_PAYOUT").eq("status", "COMPLETED").eq("trades.seller_id", profile.id),
      supabase
        .from("user_achievements")
        .select("earned_at, achievement:achievements(id,code,name,description,icon,rarity)")
        .eq("user_id", profile.id)
        .order("earned_at", { ascending: false }),
      supabase
        .from("listing_favorites")
        .select("listing:listings(id,seller_id,title,price,description,rank,server_id,heroes,skins,status,views,favorites,created_at,updated_at, listing_images(id,listing_id,image_url,thumbnail_url,cloudinary_public_id,sort_order,width,height,created_at), seller:users!listings_seller_id_fkey(id,username,avatar_url,role,created_at,total_sales,reviews,success_rate,active_subscription))")
        .eq("user_id", profile.id)
        .limit(12),
    ]);

    const reviews = sellerReviews.data ?? [];
    const positiveReviews = reviews.filter((review) => review.rating >= 4).length;
    const averageRating = reviews.length ? reviews.reduce((sum, review) => sum + Number(review.rating), 0) / reviews.length : Number(profile.rating ?? 0);
    const totalRevenue = payouts.data?.reduce((sum, row: { amount: number }) => sum + Number(row.amount ?? 0), 0) ?? 0;
    const achievementRows = (achievements.data ?? []) as Array<{ earned_at: string | null; achievement: Achievement | Achievement[] | null }>;
    const favoriteListingRows = (favoriteRows.data ?? []) as unknown as Array<{ listing: Listing | Listing[] | null }>;

    return emptyResult({
      profile,
      stats: {
        totalListings: totalListings.count ?? 0,
        activeListings: activeListings.count ?? 0,
        soldAccounts: soldListings.count ?? 0,
        totalRevenue,
        totalReviews: sellerReviews.count ?? reviews.length,
        followers: followers.count ?? 0,
        following: following.count ?? 0,
        favorites: favorites.count ?? 0,
        completedTrades: completedTrades.data?.length ?? 0,
        averageRating,
        positiveReviewPercentage: reviews.length ? Math.round((positiveReviews / reviews.length) * 100) : 0,
      },
      listings: sellerListings.data ?? [],
      reviews,
      achievements: achievementRows.flatMap((row) => {
        const achievement = Array.isArray(row.achievement) ? row.achievement[0] : row.achievement;
        return achievement ? [{ ...achievement, earned_at: row.earned_at }] : [];
      }),
      tradeHistory: completedTrades.data ?? [],
      favoriteListings: favoriteListingRows.flatMap((row) => (Array.isArray(row.listing) ? row.listing : row.listing ? [row.listing] : [])),
    });
  } catch (error) {
    return emptyResult(null, error instanceof Error ? error.message : "Unable to load profile.");
  }
}
