# NEXUS MLBB Marketplace

Production-ready Mobile Legends account marketplace built with Next.js App Router, TypeScript, Tailwind CSS, Supabase, Cloudinary, Resend, and Vercel.

## Core features

- Supabase Auth email/password and Google OAuth
- Automatic profile creation in `public.users`
- Role-based UX and server authorization: USER, VERIFIED_SELLER, MODERATOR, ADMIN
- Manual seller KYC with ID front, ID back, selfie/video, liveness evidence, and moderator/admin review
- Verified-seller-only listings with Cloudinary uploads
- Free seller and Seller Pro limits driven by Supabase `system_settings`
- Private midman trade rooms with Supabase Realtime chat and RLS
- Manual bank-transfer subscriptions and admin approval
- Admin dashboard for users, verification, subscriptions, trades, payment settings, and analytics
- Resend email service with reusable HTML templates
- Audit/activity log tables and server audit writer

## Environment variables

Set these in `.env.local` and in Vercel Project Settings:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
NEXT_PUBLIC_APP_URL=
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser. It is only used in server-side modules.

## Supabase setup

1. Create a Supabase project.
2. Enable Email Auth and Google OAuth in Supabase Auth providers.
3. Add site URL and redirect URL: `${NEXT_PUBLIC_APP_URL}/auth/callback`.
4. Run `supabase/schema.sql` in the SQL editor.
5. Confirm Realtime is enabled for `trade_messages` and `trades`.
6. Keep RLS enabled. Policies in the schema restrict private trade rooms and KYC evidence.
7. Update `payment_settings` from the Admin dashboard before accepting payments.

## Cloudinary setup

- Create a Cloudinary account.
- Add API credentials to env variables.
- Listing images are uploaded as normal assets.
- KYC evidence uploads use authenticated Cloudinary delivery type from server-side code.

## Resend setup

- Verify your sending domain in Resend.
- Set `RESEND_API_KEY` and optionally `RESEND_FROM_EMAIL`.
- DNS records should be configured for SPF, DKIM, and DMARC.

## Cloudflare security checklist

- Put the production domain behind Cloudflare DNS proxy.
- Enable WAF managed rules.
- Add rate limiting rules for `/auth/*`, `/api/cloudinary/upload`, and `/api/trades/*/messages`.
- Enable Bot Fight Mode or Super Bot Fight Mode.
- Add Turnstile to public forms if you want browser-side CAPTCHA; keep server-side rate limiting enabled.

## Vercel deployment

1. Import the repository into Vercel.
2. Add all environment variables.
3. Ensure Supabase redirect URL uses the deployed domain.
4. Deploy.

## Local development

```bash
npm install
npm run dev
```

The UI can build without Supabase env variables, but live marketplace data requires Supabase configuration.
