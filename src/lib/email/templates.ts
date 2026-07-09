export type EmailTemplateName =
  | "welcome"
  | "emailVerification"
  | "passwordReset"
  | "verificationSubmitted"
  | "verificationApproved"
  | "verificationRejected"
  | "tradeCreated"
  | "paymentConfirmed"
  | "moderatorAssigned"
  | "tradeCompleted"
  | "subscriptionApproved"
  | "subscriptionDeclined"
  | "subscriptionExpired";

const appName = "NEXUS MLBB Marketplace";

function layout(title: string, body: string) {
  return `
    <div style="background:#070707;color:#f8fafc;font-family:Inter,Arial,sans-serif;padding:32px">
      <div style="max-width:640px;margin:auto;border:1px solid #2f2410;border-radius:24px;overflow:hidden;background:#0d0d0f">
        <div style="padding:28px;background:linear-gradient(135deg,#111,#2a1f0a);border-bottom:1px solid #3b2b0c">
          <p style="margin:0;color:#d6a534;letter-spacing:.16em;font-size:12px;font-weight:700">${appName}</p>
          <h1 style="margin:10px 0 0;font-size:26px;line-height:1.2;color:#fff">${title}</h1>
        </div>
        <div style="padding:28px;color:#d7d7d7;font-size:16px;line-height:1.7">${body}</div>
        <div style="padding:20px 28px;color:#9ca3af;font-size:12px;border-top:1px solid #202020">
          Secure gaming account escrow, moderator-reviewed verification, and manual bank-transfer payments.
        </div>
      </div>
    </div>`;
}

export function renderEmailTemplate(
  name: EmailTemplateName,
  variables: Record<string, string | number | null | undefined> = {},
) {
  const username = variables.username ? String(variables.username) : "there";
  const listing = variables.listing ? String(variables.listing) : "your trade";
  const reason = variables.reason ? `<p><strong>Reason:</strong> ${variables.reason}</p>` : "";

  const templates: Record<EmailTemplateName, { subject: string; html: string }> = {
    welcome: {
      subject: `Welcome to ${appName}`,
      html: layout("Welcome to the arena", `<p>Hi ${username}, your marketplace profile is ready.</p><p>Verify your email and request seller KYC if you want to list Mobile Legends accounts.</p>`),
    },
    emailVerification: {
      subject: "Verify your NEXUS email",
      html: layout("Confirm your email", `<p>Hi ${username}, use the secure verification link from Supabase Auth to activate your account.</p>`),
    },
    passwordReset: {
      subject: "Reset your NEXUS password",
      html: layout("Password reset requested", `<p>Use your secure password reset link to set a new password. If this was not you, ignore this email.</p>`),
    },
    verificationSubmitted: {
      subject: "Seller verification submitted",
      html: layout("KYC evidence received", `<p>Hi ${username}, your identity and liveness evidence has been submitted for manual review.</p>`),
    },
    verificationApproved: {
      subject: "Seller verification approved",
      html: layout("You are now a verified seller", `<p>Congratulations ${username}. You can now create account listings.</p>`),
    },
    verificationRejected: {
      subject: "Seller verification rejected",
      html: layout("Verification needs attention", `<p>Hi ${username}, your request was rejected.</p>${reason}<p>Please submit clear ID images and liveness evidence without masks, sunglasses, filters, or obstruction.</p>`),
    },
    tradeCreated: {
      subject: "Private trade room created",
      html: layout("Trade room opened", `<p>A secure midman room has been created for ${listing}. Follow moderator instructions and never share account credentials outside the room.</p>`),
    },
    paymentConfirmed: {
      subject: "Trade payment confirmed",
      html: layout("Payment confirmed", `<p>Payment for ${listing} has been confirmed by platform staff. The seller may now transfer account details in the private room.</p>`),
    },
    moderatorAssigned: {
      subject: "Moderator assigned to trade",
      html: layout("Moderator assigned", `<p>A moderator has joined ${listing}. Continue the transfer only inside the private room.</p>`),
    },
    tradeCompleted: {
      subject: "Trade completed",
      html: layout("Trade completed", `<p>${listing} is complete. Seller payout can now be processed less the platform midman fee.</p>`),
    },
    subscriptionApproved: {
      subject: "Subscription approved",
      html: layout("Subscription active", `<p>Your ${variables.plan ?? "subscription"} is now active until ${variables.expiresAt ?? "the configured expiry date"}.</p>`),
    },
    subscriptionDeclined: {
      subject: "Subscription declined",
      html: layout("Subscription payment declined", `<p>Your payment proof could not be approved.</p>${reason}`),
    },
    subscriptionExpired: {
      subject: "Subscription expired",
      html: layout("Subscription expired", `<p>Your ${variables.plan ?? "subscription"} has expired. Renew anytime from your dashboard.</p>`),
    },
  };

  return templates[name];
}
