export type UserRole = "USER" | "VERIFIED_SELLER" | "MODERATOR" | "ADMIN";

export type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED";

export type ListingStatus = "ACTIVE" | "SOLD" | "HIDDEN" | "REMOVED";

export type TradeStatus =
  | "PENDING_PAYMENT"
  | "PAYMENT_CONFIRMED"
  | "MODERATOR_ASSIGNED"
  | "ACCOUNT_TRANSFER"
  | "BUYER_CONFIRM_PENDING"
  | "COMPLETED"
  | "DISPUTE"
  | "REFUNDED"
  | "CANCELLED";

export type PlanType = "SELLER_PRO" | "MODERATOR";

export type SubscriptionStatus = "ACTIVE" | "EXPIRED" | "CANCELLED";

export type SubscriptionOrderStatus =
  | "PENDING_PAYMENT"
  | "WAITING_ADMIN_REVIEW"
  | "APPROVED"
  | "DECLINED"
  | "EXPIRED";

export type TransactionType = "TRADE_ESCROW" | "MIDMAN_FEE" | "SELLER_PAYOUT" | "REFUND" | "SUBSCRIPTION";

export type TransactionStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "FAILED" | "CANCELLED";

export type Profile = {
  id: string;
  email: string | null;
  username: string | null;
  avatar_url: string | null;
  cover_url?: string | null;
  bio?: string | null;
  role: UserRole;
  bank_account: string | null;
  total_sales?: number | null;
  reviews?: number | null;
  success_rate?: number | null;
  rating?: number | null;
  active_subscription?: boolean | null;
  online_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type SellerSummary = Pick<
  Profile,
  "id" | "username" | "avatar_url" | "role" | "created_at" | "bank_account"
> & {
  total_sales?: number | null;
  reviews?: number | null;
  success_rate?: number | null;
  active_subscription?: boolean | null;
};

export type ListingImage = {
  id: string;
  listing_id: string;
  image_url: string;
  thumbnail_url?: string | null;
  cloudinary_public_id: string | null;
  sort_order: number | null;
  width?: number | null;
  height?: number | null;
  created_at: string;
};

export type Listing = {
  id: string;
  seller_id: string;
  title: string;
  price: number;
  description: string | null;
  rank: string;
  server_id: string | null;
  heroes: number;
  skins: number;
  status: ListingStatus;
  views: number;
  favorites: number;
  created_at: string;
  updated_at?: string | null;
  seller?: SellerSummary | null;
  listing_images?: ListingImage[] | null;
};

export type TradeMessage = {
  id: string;
  trade_id: string;
  sender_id: string | null;
  message: string;
  attachment: string | null;
  created_at: string;
  sender?: Pick<Profile, "id" | "username" | "avatar_url" | "role"> | null;
};

export type Trade = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  moderator_id: string | null;
  amount: number;
  fee: number;
  status: TradeStatus;
  created_at: string;
  completed_at: string | null;
  listings?: Pick<Listing, "id" | "title" | "rank" | "price" | "status"> | null;
  buyer?: SellerSummary | null;
  seller?: SellerSummary | null;
  moderator?: SellerSummary | null;
  trade_messages?: TradeMessage[] | null;
};

export type VerificationRequest = {
  id: string;
  user_id: string;
  id_front: string;
  id_back: string;
  selfie_video: string;
  liveness_evidence: Record<string, unknown> | null;
  status: VerificationStatus;
  reviewed_by: string | null;
  rejection_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
  user?: Profile | null;
};

export type PaymentSettings = {
  id: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  instructions: string;
  midman_fee: number;
  updated_at: string;
};

export type SubscriptionPlan = {
  id: string;
  plan_type: PlanType;
  name: string;
  amount: number;
  duration_days: number;
  benefits: string[] | null;
  active: boolean;
};

export type SubscriptionOrder = {
  id: string;
  user_id: string;
  plan_type: PlanType;
  amount: number;
  payment_code: string;
  payment_proof: string | null;
  status: SubscriptionOrderStatus;
  created_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  user?: Profile | null;
};

export type AppStat = {
  label: string;
  value: number;
};

export type ProfileStats = {
  totalListings: number;
  activeListings: number;
  soldAccounts: number;
  totalRevenue: number;
  totalReviews: number;
  followers: number;
  following: number;
  favorites: number;
  completedTrades: number;
  averageRating: number;
  positiveReviewPercentage: number;
};

export type Review = {
  id: string;
  seller_id: string;
  reviewer_id: string;
  trade_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer?: Pick<Profile, "id" | "username" | "avatar_url" | "role"> | null;
};

export type Achievement = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  rarity: string | null;
  earned_at?: string | null;
};

export type PublicProfile = {
  profile: Profile;
  stats: ProfileStats;
  listings: Listing[];
  reviews: Review[];
  achievements: Achievement[];
  tradeHistory: Trade[];
  favoriteListings: Listing[];
};

export type QueryResult<T> = {
  data: T;
  error?: string;
  configured: boolean;
};
