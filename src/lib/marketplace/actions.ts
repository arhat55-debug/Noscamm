"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole, requireUser } from "@/lib/auth/session";
import { buildListingImageUrl, buildListingThumbnailUrl, uploadFileToCloudinary, validateUploadFile } from "@/lib/cloudinary/service";
import { sendMarketplaceEmail } from "@/lib/email/service";
import { writeAuditLog } from "@/lib/security/audit";
import { rateLimit } from "@/lib/security/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabasePublicEnv, getSupabaseServiceEnv } from "@/lib/supabase/env";
import { getNumericSetting, hasActiveSubscription } from "./settings";
import type { PlanType, TradeStatus, UserRole } from "./types";

export type ActionState = {
  ok: boolean;
  message: string;
};

const ok = (message: string): ActionState => ({ ok: true, message });
const fail = (message: string): ActionState => ({ ok: false, message });

function requireConfigured() {
  if (!getSupabasePublicEnv().configured) {
    throw new Error("Supabase is not configured. Add the required environment variables.");
  }
}

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function formFile(formData: FormData, key: string) {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 ? value : null;
}

export async function signInWithPassword(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    requireConfigured();
    const schema = z.object({ email: z.string().email(), password: z.string().min(6) });
    const input = schema.parse({ email: formString(formData, "email"), password: formString(formData, "password") });
    const limiter = rateLimit(`login:${input.email}`, 8, 60_000);

    if (!limiter.allowed) {
      return fail("Too many login attempts. Please wait a moment.");
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword(input);

    if (error) {
      return fail(error.message);
    }

    revalidatePath("/", "layout");
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to sign in.");
  }

  redirect("/dashboard");
}

export async function signUpWithPassword(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    requireConfigured();
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
      username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/),
    });
    const input = schema.parse({
      email: formString(formData, "email"),
      password: formString(formData, "password"),
      username: formString(formData, "username"),
    });

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: { username: input.username },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/auth/callback`,
      },
    });

    if (error) {
      return fail(error.message);
    }

    if (data.user) {
      await supabase.from("users").upsert({ id: data.user.id, email: input.email, username: input.username });
      await sendMarketplaceEmail({ to: input.email, template: "welcome", variables: { username: input.username } });
      await writeAuditLog({ actorId: data.user.id, action: "auth.signup", entityType: "user", entityId: data.user.id });
    }

    return ok("Account created. Check your email to verify your address.");
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to create account.");
  }
}

export async function signInWithGoogle() {
  requireConfigured();
  const supabase = await createSupabaseServerClient();
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });

  if (error) {
    redirect(`/auth/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect(data.url);
}

export async function signOut() {
  if (getSupabasePublicEnv().configured) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function sendPasswordReset(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    requireConfigured();
    const email = z.string().email().parse(formString(formData, "email"));
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/auth/reset-password`,
    });

    if (error) {
      return fail(error.message);
    }

    await sendMarketplaceEmail({ to: email, template: "passwordReset" });
    return ok("Password reset instructions were sent if the email exists.");
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to request password reset.");
  }
}

export async function submitVerificationForm(formData: FormData): Promise<void> {
  await submitVerification({ ok: false, message: "" }, formData);
}

export async function submitVerification(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { user, profile } = await requireUser();
    const limiter = rateLimit(`kyc:${user.id}`, 3, 60 * 60_000);

    if (!limiter.allowed) {
      return fail("You have submitted too many verification requests recently.");
    }

    const idFront = formFile(formData, "id_front");
    const idBack = formFile(formData, "id_back");
    const selfieVideo = formFile(formData, "selfie_video");
    const liveness = formString(formData, "liveness_evidence");

    if (!idFront || !idBack || !selfieVideo) {
      return fail("National ID front, ID back, and selfie/video evidence are required.");
    }

    validateUploadFile(idFront, 8_000_000, ["image/"]);
    validateUploadFile(idBack, 8_000_000, ["image/"]);
    validateUploadFile(selfieVideo, 60_000_000, ["image/", "video/"]);

    const [front, back, selfie] = await Promise.all([
      uploadFileToCloudinary(idFront, { folder: `nexus/kyc/${user.id}`, type: "authenticated" }),
      uploadFileToCloudinary(idBack, { folder: `nexus/kyc/${user.id}`, type: "authenticated" }),
      uploadFileToCloudinary(selfieVideo, { folder: `nexus/kyc/${user.id}`, type: "authenticated", resource_type: "auto" }),
    ]);

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("verification_requests").insert({
      user_id: user.id,
      id_front: front.secure_url,
      id_back: back.secure_url,
      selfie_video: selfie.secure_url,
      liveness_evidence: liveness ? JSON.parse(liveness) : {},
      status: "PENDING",
    });

    if (error) {
      return fail(error.message);
    }

    await sendMarketplaceEmail({ to: profile?.email, template: "verificationSubmitted", variables: { username: profile?.username } });
    await writeAuditLog({ actorId: user.id, action: "verification.submit", entityType: "verification_request" });
    revalidatePath("/verification");
    return ok("Verification submitted for manual review.");
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to submit verification.");
  }
}

export async function createListingForm(formData: FormData): Promise<void> {
  await createListing({ ok: false, message: "" }, formData);
}

export async function createListing(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { user, profile } = await requireRole(["VERIFIED_SELLER", "ADMIN"]);
    const schema = z.object({
      title: z.string().min(8).max(120),
      price: z.coerce.number().positive(),
      rank: z.string().min(2).max(40),
      server_id: z.string().min(1).max(32),
      heroes: z.coerce.number().int().nonnegative(),
      skins: z.coerce.number().int().nonnegative(),
      description: z.string().min(30).max(4000),
    });
    const input = schema.parse({
      title: formString(formData, "title"),
      price: formString(formData, "price"),
      rank: formString(formData, "rank"),
      server_id: formString(formData, "server_id"),
      heroes: formString(formData, "heroes"),
      skins: formString(formData, "skins"),
      description: formString(formData, "description"),
    });

    const files = formData.getAll("images").filter((item): item is File => item instanceof File && item.size > 0);
    const isPro = profile.role === "ADMIN" || (await hasActiveSubscription(user.id, "SELLER_PRO"));
    const imageLimit = isPro ? await getNumericSetting("seller_pro_image_limit") : await getNumericSetting("free_seller_image_limit");

    if (files.length === 0) {
      return fail("At least one listing image is required.");
    }

    if (files.length > imageLimit) {
      return fail(`Your current seller tier allows ${imageLimit} image(s) per listing.`);
    }

    const supabase = await createSupabaseServerClient();

    if (!isPro) {
      const dailyLimit = await getNumericSetting("free_seller_daily_listing_limit");
      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);
      const { count, error: countError } = await supabase
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("seller_id", user.id)
        .gte("created_at", dayStart.toISOString());

      if (countError) {
        return fail(countError.message);
      }

      if ((count ?? 0) >= dailyLimit) {
        return fail(`Daily free seller listing limit reached (${dailyLimit}). Upgrade to Seller Pro for unlimited listings.`);
      }
    }

    files.forEach((file) => validateUploadFile(file, 8_000_000, ["image/jpeg", "image/png", "image/webp"]));

    const { data: listing, error } = await supabase
      .from("listings")
      .insert({ seller_id: user.id, ...input, status: "ACTIVE" })
      .select("id")
      .single<{ id: string }>();

    if (error || !listing) {
      return fail(error?.message ?? "Unable to create listing.");
    }

    const uploaded = await Promise.all(
      files.map((file, index) =>
        uploadFileToCloudinary(file, {
          folder: `nexus/listings/${listing.id}`,
          context: `listing=${listing.id}|aspect_ratio=4:3`,
          public_id: `${Date.now()}-${index}`,
          resource_type: "image",
          transformation: [{ aspect_ratio: "4:3", crop: "fill", quality: "auto:good", fetch_format: "auto" }],
          eager: [{ aspect_ratio: "4:3", crop: "fill", width: 480, quality: "auto:eco", fetch_format: "auto" }],
        }),
      ),
    );

    const { error: imageError } = await supabase.from("listing_images").insert(
      uploaded.map((image, index) => ({
        listing_id: listing.id,
        image_url: buildListingImageUrl(image.secure_url),
        thumbnail_url: buildListingThumbnailUrl(image.secure_url),
        cloudinary_public_id: image.public_id,
        width: image.width ?? null,
        height: image.height ?? null,
        sort_order: index,
      })),
    );

    if (imageError) {
      return fail(imageError.message);
    }

    await writeAuditLog({ actorId: user.id, action: "listing.create", entityType: "listing", entityId: listing.id });
    revalidatePath("/");
    revalidatePath("/listings");
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to create listing.");
  }

  redirect("/listings");
}

export async function createTradeFromListing(listingId: string): Promise<ActionState> {
  try {
    const { user } = await requireUser();
    const supabase = await createSupabaseServerClient();
    const { data: listing, error } = await supabase
      .from("listings")
      .select("id,seller_id,price,title,status")
      .eq("id", listingId)
      .maybeSingle<{ id: string; seller_id: string; price: number; title: string; status: string }>();

    if (error || !listing || listing.status !== "ACTIVE") {
      return fail(error?.message ?? "Listing is not available.");
    }

    if (listing.seller_id === user.id) {
      return fail("You cannot buy your own listing.");
    }

    const fee = await getNumericSetting("midman_fee");
    const { data: trade, error: tradeError } = await supabase
      .from("trades")
      .insert({
        listing_id: listing.id,
        buyer_id: user.id,
        seller_id: listing.seller_id,
        amount: listing.price,
        fee,
        status: "PENDING_PAYMENT",
      })
      .select("id")
      .single<{ id: string }>();

    if (tradeError || !trade) {
      return fail(tradeError?.message ?? "Unable to create trade room.");
    }

    await supabase.from("trade_messages").insert({
      trade_id: trade.id,
      sender_id: null,
      message: "System: Private midman room created. Buyer must transfer payment to the admin bank account and upload proof.",
    });

    await sendMarketplaceEmail({ to: undefined, template: "tradeCreated", variables: { listing: listing.title } });
    await writeAuditLog({ actorId: user.id, action: "trade.create", entityType: "trade", entityId: trade.id });
    revalidatePath("/trades");
    return ok(`/trades/${trade.id}`);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to create trade.");
  }
}

export async function sendTradeMessageForm(formData: FormData): Promise<void> {
  await sendTradeMessage({ ok: false, message: "" }, formData);
}

export async function sendTradeMessage(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { user } = await requireUser();
    const tradeId = z.string().uuid().parse(formString(formData, "trade_id"));
    const message = z.string().min(1).max(2000).parse(formString(formData, "message"));
    const attachment = formFile(formData, "attachment");
    let attachmentUrl: string | null = null;

    if (attachment) {
      validateUploadFile(attachment, 8_000_000, ["image/"]);
      const uploaded = await uploadFileToCloudinary(attachment, { folder: `nexus/trades/${tradeId}` });
      attachmentUrl = uploaded.secure_url;
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("trade_messages").insert({
      trade_id: tradeId,
      sender_id: user.id,
      message,
      attachment: attachmentUrl,
    });

    if (error) {
      return fail(error.message);
    }

    revalidatePath(`/trades/${tradeId}`);
    return ok("Message sent.");
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to send message.");
  }
}

export async function updateTradeStatus(formData: FormData): Promise<void> {
  const status = z.enum([
    "PENDING_PAYMENT",
    "PAYMENT_CONFIRMED",
    "MODERATOR_ASSIGNED",
    "ACCOUNT_TRANSFER",
    "BUYER_CONFIRM_PENDING",
    "COMPLETED",
    "DISPUTE",
    "REFUNDED",
    "CANCELLED",
  ]).parse(formString(formData, "status")) as TradeStatus;
  const tradeId = z.string().uuid().parse(formString(formData, "trade_id"));
  const moderatorId = formString(formData, "moderator_id") || null;
  const { user, profile } = await requireUser();

  const adminStatuses: TradeStatus[] = ["PAYMENT_CONFIRMED", "MODERATOR_ASSIGNED", "COMPLETED", "REFUNDED", "CANCELLED"];
  const buyerStatuses: TradeStatus[] = ["BUYER_CONFIRM_PENDING", "DISPUTE"];

  if (adminStatuses.includes(status) && !["ADMIN", "MODERATOR"].includes(profile?.role ?? "USER")) {
    redirect(`/trades/${tradeId}?error=forbidden`);
  }

  const supabase = await createSupabaseServerClient();
  const update: Record<string, unknown> = { status };

  if (status === "MODERATOR_ASSIGNED" && moderatorId) {
    update.moderator_id = moderatorId;
  }

  if (status === "COMPLETED") {
    update.completed_at = new Date().toISOString();
  }

  if (buyerStatuses.includes(status)) {
    const { data: trade } = await supabase.from("trades").select("buyer_id").eq("id", tradeId).maybeSingle<{ buyer_id: string }>();
    if (trade?.buyer_id !== user.id) {
      redirect(`/trades/${tradeId}?error=forbidden`);
    }
  }

  await supabase.from("trades").update(update).eq("id", tradeId);
  await supabase.from("trade_messages").insert({
    trade_id: tradeId,
    sender_id: null,
    message: `System: Trade status changed to ${status}.`,
  });

  await writeAuditLog({ actorId: user.id, action: "trade.status_update", entityType: "trade", entityId: tradeId, metadata: { status } });
  revalidatePath(`/trades/${tradeId}`);
}

export async function createSubscriptionOrder(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { user } = await requireUser();
    const planType = z.enum(["SELLER_PRO", "MODERATOR"]).parse(formString(formData, "plan_type")) as PlanType;
    const supabase = await createSupabaseServerClient();
    const { data: plan, error } = await supabase
      .from("subscription_plans")
      .select("amount")
      .eq("plan_type", planType)
      .eq("active", true)
      .maybeSingle<{ amount: number }>();

    if (error || !plan) {
      return fail(error?.message ?? "Subscription plan is not configured.");
    }

    const paymentCode = `NX-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const { error: orderError } = await supabase.from("subscription_orders").insert({
      user_id: user.id,
      plan_type: planType,
      amount: plan.amount,
      payment_code: paymentCode,
      status: "PENDING_PAYMENT",
    });

    if (orderError) {
      return fail(orderError.message);
    }

    revalidatePath("/subscriptions");
    return ok(`Order created. Use payment code ${paymentCode} in your bank transfer description.`);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to create subscription order.");
  }
}

export async function uploadSubscriptionProof(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { user } = await requireUser();
    const orderId = z.string().uuid().parse(formString(formData, "order_id"));
    const proof = formFile(formData, "payment_proof");

    if (!proof) {
      return fail("Payment proof image is required.");
    }

    validateUploadFile(proof, 8_000_000, ["image/"]);
    const uploaded = await uploadFileToCloudinary(proof, { folder: `nexus/subscriptions/${user.id}` });
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("subscription_orders")
      .update({ payment_proof: uploaded.secure_url, status: "WAITING_ADMIN_REVIEW" })
      .eq("id", orderId)
      .eq("user_id", user.id);

    if (error) {
      return fail(error.message);
    }

    revalidatePath("/subscriptions");
    return ok("Payment proof uploaded for admin review.");
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to upload payment proof.");
  }
}

export async function reviewVerification(formData: FormData): Promise<void> {
  const { user } = await requireRole(["ADMIN", "MODERATOR"]);
  const requestId = z.string().uuid().parse(formString(formData, "request_id"));
  const decision = z.enum(["APPROVED", "REJECTED"]).parse(formString(formData, "decision"));
  const reason = formString(formData, "reason");
  const supabase = getSupabaseServiceEnv().serviceConfigured ? createSupabaseAdminClient() : await createSupabaseServerClient();

  const { data: request } = await supabase
    .from("verification_requests")
    .select("user_id, user:users!verification_requests_user_id_fkey(email,username)")
    .eq("id", requestId)
    .maybeSingle<{ user_id: string; user: { email: string | null; username: string | null } | null }>();

  await supabase
    .from("verification_requests")
    .update({ status: decision, reviewed_by: user.id, reviewed_at: new Date().toISOString(), rejection_reason: decision === "REJECTED" ? reason : null })
    .eq("id", requestId);

  if (decision === "APPROVED" && request?.user_id) {
    await supabase.from("users").update({ role: "VERIFIED_SELLER" }).eq("id", request.user_id);
    await supabase.rpc("award_achievement_by_code", { target_user_id: request.user_id, achievement_code: "VERIFIED_SELLER" });
  }

  await sendMarketplaceEmail({
    to: request?.user?.email,
    template: decision === "APPROVED" ? "verificationApproved" : "verificationRejected",
    variables: { username: request?.user?.username, reason },
  });
  await writeAuditLog({ actorId: user.id, action: `verification.${decision.toLowerCase()}`, entityType: "verification_request", entityId: requestId });
  revalidatePath("/admin");
  revalidatePath("/moderator");
}

export async function reviewSubscriptionOrder(formData: FormData): Promise<void> {
  const { user } = await requireRole(["ADMIN"]);
  const orderId = z.string().uuid().parse(formString(formData, "order_id"));
  const decision = z.enum(["APPROVED", "DECLINED"]).parse(formString(formData, "decision"));
  const reason = formString(formData, "reason");
  const supabase = getSupabaseServiceEnv().serviceConfigured ? createSupabaseAdminClient() : await createSupabaseServerClient();

  const { data: order } = await supabase
    .from("subscription_orders")
    .select("id,user_id,plan_type,amount, user:users!subscription_orders_user_id_fkey(email,username), plan:subscription_plans!subscription_orders_plan_type_fkey(duration_days)")
    .eq("id", orderId)
    .maybeSingle<{ id: string; user_id: string; plan_type: PlanType; amount: number; user: { email: string | null; username: string | null } | null; plan: { duration_days: number } | null }>();

  if (!order) {
    revalidatePath("/admin");
    return;
  }

  await supabase
    .from("subscription_orders")
    .update({ status: decision, reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq("id", orderId);

  if (decision === "APPROVED") {
    const startedAt = new Date();
    const expiresAt = new Date(startedAt);
    expiresAt.setDate(expiresAt.getDate() + Number(order.plan?.duration_days ?? 30));
    await supabase.from("subscriptions").insert({
      user_id: order.user_id,
      plan_type: order.plan_type,
      status: "ACTIVE",
      started_at: startedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      approved_by: user.id,
    });

    if (order.plan_type === "MODERATOR") {
      await supabase.from("users").update({ role: "MODERATOR" }).eq("id", order.user_id).neq("role", "ADMIN");
    }

    if (order.plan_type === "SELLER_PRO") {
      await supabase.rpc("award_achievement_by_code", { target_user_id: order.user_id, achievement_code: "SELLER_PRO" });
    }

    await supabase.from("transactions").insert({ amount: order.amount, type: "SUBSCRIPTION", status: "COMPLETED" });
    await sendMarketplaceEmail({ to: order.user?.email, template: "subscriptionApproved", variables: { username: order.user?.username, plan: order.plan_type, expiresAt: expiresAt.toLocaleDateString() } });
  } else {
    await sendMarketplaceEmail({ to: order.user?.email, template: "subscriptionDeclined", variables: { username: order.user?.username, reason } });
  }

  await writeAuditLog({ actorId: user.id, action: `subscription.${decision.toLowerCase()}`, entityType: "subscription_order", entityId: orderId });
  revalidatePath("/admin");
}

export async function updateUserRole(formData: FormData): Promise<void> {
  const { user } = await requireRole(["ADMIN"]);
  const targetUserId = z.string().uuid().parse(formString(formData, "user_id"));
  const role = z.enum(["USER", "VERIFIED_SELLER", "MODERATOR", "ADMIN"]).parse(formString(formData, "role")) as UserRole;
  const supabase = getSupabaseServiceEnv().serviceConfigured ? createSupabaseAdminClient() : await createSupabaseServerClient();

  await supabase.from("users").update({ role }).eq("id", targetUserId);
  await writeAuditLog({ actorId: user.id, action: "user.role_update", entityType: "user", entityId: targetUserId, metadata: { role } });
  revalidatePath("/admin");
}

export async function updatePaymentSettings(formData: FormData): Promise<void> {
  const { user } = await requireRole(["ADMIN"]);
  const schema = z.object({
    bank_name: z.string().min(2),
    account_number: z.string().min(4),
    account_holder: z.string().min(2),
    instructions: z.string().min(10),
    midman_fee: z.coerce.number().nonnegative(),
  });
  const input = schema.parse({
    bank_name: formString(formData, "bank_name"),
    account_number: formString(formData, "account_number"),
    account_holder: formString(formData, "account_holder"),
    instructions: formString(formData, "instructions"),
    midman_fee: formString(formData, "midman_fee"),
  });
  const supabase = getSupabaseServiceEnv().serviceConfigured ? createSupabaseAdminClient() : await createSupabaseServerClient();

  await supabase.from("payment_settings").insert(input);
  await supabase.from("system_settings").upsert({ key: "midman_fee", value: input.midman_fee });
  await writeAuditLog({ actorId: user.id, action: "payment_settings.update", entityType: "payment_settings" });
  revalidatePath("/admin");
  revalidatePath("/subscriptions");
}

export async function updateProfileForm(formData: FormData): Promise<void> {
  await updateProfile({ ok: false, message: "" }, formData);
}

export async function updateProfile(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { user, profile } = await requireUser();
    const avatarFile = formFile(formData, "avatar");
    const bankAccountRaw = formString(formData, "bank_account");
    const bankAccount = bankAccountRaw.length > 0 ? bankAccountRaw.slice(0, 64) : null;

    const update: { avatar_url?: string; bank_account?: string | null } = {};

    if (avatarFile) {
      validateUploadFile(avatarFile, 5_000_000, ["image/"]);
      const uploaded = await uploadFileToCloudinary(avatarFile, {
        folder: `nexus/avatars/${user.id}`,
        public_id: `avatar-${Date.now()}`,
      });
      update.avatar_url = uploaded.secure_url;
    }

    if (formData.has("bank_account")) {
      update.bank_account = bankAccount;
    }

    if (Object.keys(update).length === 0) {
      return fail("Nothing to update.");
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("users").update(update).eq("id", user.id);

    if (error) {
      return fail(error.message);
    }

    await writeAuditLog({ actorId: user.id, action: "profile.update", entityType: "user", entityId: user.id });
    revalidatePath(`/users/${profile?.username ?? user.id}`);
    revalidatePath("/dashboard");
    revalidatePath("/listings");
    return ok("Profile updated.");
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to update profile.");
  }
}

export async function updateOwnListingStatusForm(formData: FormData): Promise<void> {
  try {
    const { user, profile } = await requireUser();
    const listingId = formString(formData, "listing_id");
    const nextStatus = formString(formData, "status");

    if (!listingId || (nextStatus !== "ACTIVE" && nextStatus !== "HIDDEN")) {
      return;
    }

    const supabase = await createSupabaseServerClient();
    const { data: listing, error: fetchError } = await supabase
      .from("listings")
      .select("id,seller_id,status")
      .eq("id", listingId)
      .maybeSingle<{ id: string; seller_id: string; status: string }>();

    if (fetchError || !listing || listing.seller_id !== user.id || listing.status === "SOLD" || listing.status === "REMOVED") {
      return;
    }

    const { error } = await supabase.from("listings").update({ status: nextStatus }).eq("id", listingId);

    if (!error) {
      await writeAuditLog({ actorId: user.id, action: "listing.status_update", entityType: "listing", entityId: listingId });
      revalidatePath(`/users/${profile?.username ?? user.id}`);
      revalidatePath("/dashboard");
      revalidatePath("/listings");
    }
  } catch {
    // Silently ignore — the profile page revalidation will just show the previous state.
  }
}

export async function deleteOwnListingForm(formData: FormData): Promise<void> {
  try {
    const { user, profile } = await requireUser();
    const listingId = formString(formData, "listing_id");

    if (!listingId) {
      return;
    }

    const supabase = await createSupabaseServerClient();
    const { data: listing, error: fetchError } = await supabase
      .from("listings")
      .select("id,seller_id,status")
      .eq("id", listingId)
      .maybeSingle<{ id: string; seller_id: string; status: string }>();

    // Only the owning seller can remove their own listing, and only while it
    // hasn't already been sold (a completed trade should keep its listing record).
    if (fetchError || !listing || listing.seller_id !== user.id || listing.status === "SOLD") {
      return;
    }

    const { error } = await supabase.from("listings").update({ status: "REMOVED" }).eq("id", listingId);

    if (!error) {
      await writeAuditLog({ actorId: user.id, action: "listing.delete", entityType: "listing", entityId: listingId });
      revalidatePath(`/users/${profile?.username ?? user.id}`);
      revalidatePath("/dashboard");
      revalidatePath("/listings");
    }
  } catch {
    // Silently ignore — the profile page revalidation will just show the previous state.
  }
}
