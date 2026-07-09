-- NEXUS MLBB Marketplace Supabase schema
-- Run in Supabase SQL editor or via `supabase db push`.

create extension if not exists "pgcrypto";

create type public.user_role as enum ('USER', 'VERIFIED_SELLER', 'MODERATOR', 'ADMIN');
create type public.listing_status as enum ('ACTIVE', 'SOLD', 'HIDDEN', 'REMOVED');
create type public.verification_status as enum ('PENDING', 'APPROVED', 'REJECTED');
create type public.trade_status as enum ('PENDING_PAYMENT', 'PAYMENT_CONFIRMED', 'MODERATOR_ASSIGNED', 'ACCOUNT_TRANSFER', 'BUYER_CONFIRM_PENDING', 'COMPLETED', 'DISPUTE', 'REFUNDED', 'CANCELLED');
create type public.plan_type as enum ('SELLER_PRO', 'MODERATOR');
create type public.subscription_status as enum ('ACTIVE', 'EXPIRED', 'CANCELLED');
create type public.subscription_order_status as enum ('PENDING_PAYMENT', 'WAITING_ADMIN_REVIEW', 'APPROVED', 'DECLINED', 'EXPIRED');
create type public.transaction_type as enum ('TRADE_ESCROW', 'MIDMAN_FEE', 'SELLER_PAYOUT', 'REFUND', 'SUBSCRIPTION');
create type public.transaction_status as enum ('PENDING', 'CONFIRMED', 'COMPLETED', 'FAILED', 'CANCELLED');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  username text unique,
  avatar_url text,
  cover_url text,
  bio text,
  role public.user_role not null default 'USER',
  bank_account text,
  total_sales integer not null default 0,
  reviews integer not null default 0,
  success_rate numeric(5,2) not null default 0,
  rating numeric(3,2) not null default 0,
  active_subscription boolean not null default false,
  online_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payment_settings (
  id uuid primary key default gen_random_uuid(),
  bank_name text not null,
  account_number text not null,
  account_holder text not null,
  instructions text not null,
  midman_fee integer not null check (midman_fee >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.system_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz not null default now()
);

create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  plan_type public.plan_type not null unique,
  name text not null,
  amount integer not null check (amount >= 0),
  duration_days integer not null check (duration_days > 0),
  benefits text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  price integer not null check (price > 0),
  description text,
  rank text not null,
  server_id text,
  heroes integer not null default 0 check (heroes >= 0),
  skins integer not null default 0 check (skins >= 0),
  status public.listing_status not null default 'ACTIVE',
  views integer not null default 0,
  favorites integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  image_url text not null,
  thumbnail_url text,
  cloudinary_public_id text,
  width integer,
  height integer,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.trades (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete restrict,
  buyer_id uuid not null references public.users(id) on delete restrict,
  seller_id uuid not null references public.users(id) on delete restrict,
  moderator_id uuid references public.users(id) on delete set null,
  amount integer not null check (amount > 0),
  fee integer not null check (fee >= 0),
  status public.trade_status not null default 'PENDING_PAYMENT',
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.trade_messages (
  id uuid primary key default gen_random_uuid(),
  trade_id uuid not null references public.trades(id) on delete cascade,
  sender_id uuid references public.users(id) on delete set null,
  message text not null,
  attachment text,
  created_at timestamptz not null default now()
);

create table public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  id_front text not null,
  id_back text not null,
  selfie_video text not null,
  liveness_evidence jsonb not null default '{}',
  status public.verification_status not null default 'PENDING',
  reviewed_by uuid references public.users(id) on delete set null,
  rejection_reason text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  plan_type public.plan_type not null,
  status public.subscription_status not null default 'ACTIVE',
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  approved_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.subscription_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  plan_type public.plan_type not null references public.subscription_plans(plan_type),
  amount integer not null check (amount >= 0),
  payment_code text not null unique,
  payment_proof text,
  status public.subscription_order_status not null default 'PENDING_PAYMENT',
  reviewed_by uuid references public.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  trade_id uuid references public.trades(id) on delete set null,
  amount integer not null check (amount >= 0),
  type public.transaction_type not null,
  status public.transaction_status not null default 'PENDING',
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  activity text not null,
  ip_address inet,
  user_agent text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.users(id) on delete cascade,
  reviewer_id uuid not null references public.users(id) on delete cascade,
  trade_id uuid references public.trades(id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (trade_id, reviewer_id)
);

create table public.user_follows (
  follower_id uuid not null references public.users(id) on delete cascade,
  following_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table public.listing_favorites (
  user_id uuid not null references public.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  icon text,
  rarity text not null default 'standard',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.user_achievements (
  user_id uuid not null references public.users(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

create index listings_seller_idx on public.listings(seller_id, created_at desc);
create index listings_active_idx on public.listings(status, created_at desc);
create index listing_images_listing_idx on public.listing_images(listing_id, sort_order);
create index trades_participants_idx on public.trades(buyer_id, seller_id, moderator_id, status);
create index trade_messages_trade_idx on public.trade_messages(trade_id, created_at);
create index verification_status_idx on public.verification_requests(status, created_at desc);
create index subscription_orders_status_idx on public.subscription_orders(status, created_at desc);
create index subscriptions_user_status_idx on public.subscriptions(user_id, status, expires_at desc);
create index reviews_seller_idx on public.reviews(seller_id, created_at desc);
create index reviews_reviewer_idx on public.reviews(reviewer_id, created_at desc);
create index user_follows_following_idx on public.user_follows(following_id, created_at desc);
create index listing_favorites_listing_idx on public.listing_favorites(listing_id, created_at desc);
create index user_achievements_user_idx on public.user_achievements(user_id, earned_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_users_updated_at before update on public.users for each row execute function public.set_updated_at();
create trigger set_listings_updated_at before update on public.listings for each row execute function public.set_updated_at();
create trigger set_payment_settings_updated_at before update on public.payment_settings for each row execute function public.set_updated_at();
create trigger set_subscription_plans_updated_at before update on public.subscription_plans for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
  insert into public.users (id, email, username, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set
    email = excluded.email,
    avatar_url = coalesce(excluded.avatar_url, public.users.avatar_url),
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_auth_user();

create or replace function public.current_user_role()
returns public.user_role
stable
security definer
set search_path = public
language sql
as $$
  select coalesce((select role from public.users where id = auth.uid()), 'USER'::public.user_role);
$$;

create or replace function public.is_admin()
returns boolean
stable
security definer
set search_path = public
language sql
as $$
  select public.current_user_role() = 'ADMIN'::public.user_role;
$$;

create or replace function public.is_moderator_or_admin()
returns boolean
stable
security definer
set search_path = public
language sql
as $$
  select public.current_user_role() in ('MODERATOR'::public.user_role, 'ADMIN'::public.user_role);
$$;

create or replace function public.is_trade_participant(trade_uuid uuid)
returns boolean
stable
security definer
set search_path = public
language sql
as $$
  select exists (
    select 1 from public.trades t
    where t.id = trade_uuid
      and (t.buyer_id = auth.uid() or t.seller_id = auth.uid() or t.moderator_id = auth.uid() or public.is_admin())
  );
$$;

create or replace function public.increment_listing_views(listing_uuid uuid)
returns void
security definer
set search_path = public
language plpgsql
as $$
begin
  update public.listings set views = views + 1 where id = listing_uuid and status = 'ACTIVE';
end;
$$;

create or replace function public.award_achievement_by_code(target_user_id uuid, achievement_code text)
returns void
security definer
set search_path = public
language plpgsql
as $$
declare
  achievement_uuid uuid;
begin
  select id into achievement_uuid from public.achievements where code = achievement_code and active = true;
  if achievement_uuid is not null then
    insert into public.user_achievements (user_id, achievement_id)
    values (target_user_id, achievement_uuid)
    on conflict do nothing;
  end if;
end;
$$;

revoke execute on function public.award_achievement_by_code(uuid, text) from anon, authenticated;
grant execute on function public.award_achievement_by_code(uuid, text) to service_role;

create or replace function public.mark_listing_sold_when_trade_completed()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
declare
  seller_sales integer;
begin
  if new.status = 'COMPLETED' and old.status is distinct from new.status then
    update public.listings set status = 'SOLD' where id = new.listing_id;
    update public.users set total_sales = total_sales + 1, success_rate = 100 where id = new.seller_id returning total_sales into seller_sales;
    perform public.award_achievement_by_code(new.seller_id, 'FIRST_SALE');
    if seller_sales >= 10 then perform public.award_achievement_by_code(new.seller_id, 'TEN_SALES'); end if;
    if seller_sales >= 50 then perform public.award_achievement_by_code(new.seller_id, 'FIFTY_SALES'); end if;
    if seller_sales >= 100 then perform public.award_achievement_by_code(new.seller_id, 'HUNDRED_SALES'); end if;
    if seller_sales >= 50 then perform public.award_achievement_by_code(new.seller_id, 'TOP_SELLER'); end if;
    insert into public.transactions (trade_id, amount, type, status) values (new.id, new.fee, 'MIDMAN_FEE', 'COMPLETED');
    insert into public.transactions (trade_id, amount, type, status) values (new.id, greatest(new.amount - new.fee, 0), 'SELLER_PAYOUT', 'PENDING');
  end if;
  return new;
end;
$$;

create trigger on_trade_completed after update on public.trades for each row execute function public.mark_listing_sold_when_trade_completed();

create or replace function public.refresh_subscription_badge()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
  update public.users u
  set active_subscription = exists (
    select 1 from public.subscriptions s
    where s.user_id = new.user_id and s.status = 'ACTIVE' and s.expires_at > now()
  )
  where u.id = new.user_id;
  return new;
end;
$$;

create trigger on_subscription_badge after insert or update on public.subscriptions for each row execute function public.refresh_subscription_badge();

create or replace function public.refresh_listing_favorite_count()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update public.listings set favorites = favorites + 1 where id = new.listing_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.listings set favorites = greatest(favorites - 1, 0) where id = old.listing_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger on_listing_favorite_insert after insert on public.listing_favorites for each row execute function public.refresh_listing_favorite_count();
create trigger on_listing_favorite_delete after delete on public.listing_favorites for each row execute function public.refresh_listing_favorite_count();

create or replace function public.refresh_seller_rating()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
declare
  target_seller uuid;
begin
  target_seller = coalesce(new.seller_id, old.seller_id);
  update public.users u
  set
    reviews = coalesce((select count(*) from public.reviews r where r.seller_id = target_seller), 0),
    rating = coalesce((select avg(r.rating)::numeric(3,2) from public.reviews r where r.seller_id = target_seller), 0),
    success_rate = coalesce((select round((count(*) filter (where r.rating >= 4)::numeric / nullif(count(*), 0)) * 100, 2) from public.reviews r where r.seller_id = target_seller), u.success_rate)
  where u.id = target_seller;
  return coalesce(new, old);
end;
$$;

create trigger on_review_insert after insert on public.reviews for each row execute function public.refresh_seller_rating();
create trigger on_review_update after update on public.reviews for each row execute function public.refresh_seller_rating();
create trigger on_review_delete after delete on public.reviews for each row execute function public.refresh_seller_rating();

alter publication supabase_realtime add table public.trade_messages;
alter publication supabase_realtime add table public.trades;

alter table public.users enable row level security;
alter table public.payment_settings enable row level security;
alter table public.system_settings enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.listings enable row level security;
alter table public.listing_images enable row level security;
alter table public.trades enable row level security;
alter table public.trade_messages enable row level security;
alter table public.verification_requests enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_orders enable row level security;
alter table public.transactions enable row level security;
alter table public.audit_logs enable row level security;
alter table public.activity_logs enable row level security;
alter table public.reviews enable row level security;
alter table public.user_follows enable row level security;
alter table public.listing_favorites enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;

create policy "Public can read seller profile rows" on public.users for select using (role in ('VERIFIED_SELLER', 'MODERATOR', 'ADMIN') or id = auth.uid() or public.is_moderator_or_admin());
create policy "Users can update own safe profile" on public.users for update using (id = auth.uid()) with check (id = auth.uid());
create policy "Admins manage users" on public.users for all using (public.is_admin()) with check (public.is_admin());

create policy "Anyone can read active payment settings" on public.payment_settings for select using (true);
create policy "Admins manage payment settings" on public.payment_settings for all using (public.is_admin()) with check (public.is_admin());

create policy "Anyone can read active plans" on public.subscription_plans for select using (active = true or public.is_admin());
create policy "Admins manage plans" on public.subscription_plans for all using (public.is_admin()) with check (public.is_admin());

create policy "Admins read system settings" on public.system_settings for select using (public.is_admin());
create policy "Admins manage system settings" on public.system_settings for all using (public.is_admin()) with check (public.is_admin());

create policy "Anyone can read active listings" on public.listings for select using (status = 'ACTIVE' or seller_id = auth.uid() or public.is_moderator_or_admin());
create policy "Verified sellers create listings" on public.listings for insert with check (seller_id = auth.uid() and public.current_user_role() in ('VERIFIED_SELLER', 'ADMIN'));
create policy "Sellers manage own listings" on public.listings for update using (seller_id = auth.uid() or public.is_admin()) with check (seller_id = auth.uid() or public.is_admin());
create policy "Admins delete listings" on public.listings for delete using (public.is_admin());

create policy "Anyone can read active listing images" on public.listing_images for select using (exists (select 1 from public.listings l where l.id = listing_id and (l.status = 'ACTIVE' or l.seller_id = auth.uid() or public.is_moderator_or_admin())));
create policy "Listing owners add images" on public.listing_images for insert with check (exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = auth.uid()));
create policy "Listing owners manage images" on public.listing_images for delete using (exists (select 1 from public.listings l where l.id = listing_id and (l.seller_id = auth.uid() or public.is_admin())));

create policy "Trade participants can read trades" on public.trades for select using (buyer_id = auth.uid() or seller_id = auth.uid() or moderator_id = auth.uid() or public.is_admin());
create policy "Authenticated buyers create trades" on public.trades for insert with check (buyer_id = auth.uid());
create policy "Moderators and admins update trades" on public.trades for update using (public.is_moderator_or_admin() or buyer_id = auth.uid()) with check (public.is_moderator_or_admin() or buyer_id = auth.uid());

create policy "Trade participants read messages" on public.trade_messages for select using (public.is_trade_participant(trade_id));
create policy "Trade participants send messages" on public.trade_messages for insert with check ((sender_id = auth.uid() or sender_id is null) and public.is_trade_participant(trade_id));

create policy "Users create own verification" on public.verification_requests for insert with check (user_id = auth.uid());
create policy "Users and staff read verification" on public.verification_requests for select using (user_id = auth.uid() or public.is_moderator_or_admin());
create policy "Staff update verification" on public.verification_requests for update using (public.is_moderator_or_admin()) with check (public.is_moderator_or_admin());

create policy "Users read own subscriptions" on public.subscriptions for select using (user_id = auth.uid() or public.is_admin());
create policy "Admins manage subscriptions" on public.subscriptions for all using (public.is_admin()) with check (public.is_admin());

create policy "Users create own subscription orders" on public.subscription_orders for insert with check (user_id = auth.uid());
create policy "Users and admins read subscription orders" on public.subscription_orders for select using (user_id = auth.uid() or public.is_admin());
create policy "Users upload own payment proof" on public.subscription_orders for update using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

create policy "Admins read transactions" on public.transactions for select using (public.is_admin());
create policy "Admins manage transactions" on public.transactions for all using (public.is_admin()) with check (public.is_admin());

create policy "Admins read audit logs" on public.audit_logs for select using (public.is_admin());
create policy "Service/admin write audit logs" on public.audit_logs for insert with check (public.is_admin() or actor_id = auth.uid());

create policy "Users read own activity logs" on public.activity_logs for select using (user_id = auth.uid() or public.is_admin());
create policy "Users write own activity logs" on public.activity_logs for insert with check (user_id = auth.uid() or public.is_admin());

create policy "Anyone can read reviews" on public.reviews for select using (true);
create policy "Buyers review completed trades" on public.reviews for insert with check (reviewer_id = auth.uid() and exists (select 1 from public.trades t where t.id = trade_id and t.buyer_id = auth.uid() and t.seller_id = seller_id and t.status = 'COMPLETED'));
create policy "Reviewers update own reviews" on public.reviews for update using (reviewer_id = auth.uid()) with check (reviewer_id = auth.uid());
create policy "Admins manage reviews" on public.reviews for all using (public.is_admin()) with check (public.is_admin());

create policy "Anyone can read follows" on public.user_follows for select using (true);
create policy "Users follow profiles" on public.user_follows for insert with check (follower_id = auth.uid());
create policy "Users unfollow profiles" on public.user_follows for delete using (follower_id = auth.uid());

create policy "Users read own favorites" on public.listing_favorites for select using (user_id = auth.uid() or public.is_admin());
create policy "Users favorite listings" on public.listing_favorites for insert with check (user_id = auth.uid());
create policy "Users remove favorites" on public.listing_favorites for delete using (user_id = auth.uid());

create policy "Anyone can read active achievements" on public.achievements for select using (active = true or public.is_admin());
create policy "Admins manage achievements" on public.achievements for all using (public.is_admin()) with check (public.is_admin());
create policy "Anyone can read user achievements" on public.user_achievements for select using (true);
create policy "Admins award achievements" on public.user_achievements for all using (public.is_admin()) with check (public.is_admin());

insert into public.subscription_plans (plan_type, name, amount, duration_days, benefits)
values
  ('SELLER_PRO', 'Seller Pro', 65000, 30, array['Unlimited listings', 'More images per listing', 'Premium seller badge', 'Better visibility']),
  ('MODERATOR', 'Moderator', 100000, 30, array['Verification queue', 'Assigned trade rooms', 'Midman management', 'Dispute handling'])
on conflict (plan_type) do update set amount = excluded.amount, duration_days = excluded.duration_days, benefits = excluded.benefits, active = true;

insert into public.system_settings (key, value, description)
values
  ('free_seller_daily_listing_limit', '3', 'Maximum listings per day for free verified sellers'),
  ('free_seller_image_limit', '5', 'Maximum images per listing for free verified sellers'),
  ('seller_pro_image_limit', '10', 'Maximum images per listing for Seller Pro accounts'),
  ('midman_fee', '5000', 'Fixed platform fee deducted from completed trades')
on conflict (key) do update set value = excluded.value, description = excluded.description, updated_at = now();

insert into public.achievements (code, name, description, icon, rarity)
values
  ('FIRST_SALE', 'First Sale', 'Completed the first marketplace sale.', '🥇', 'standard'),
  ('TEN_SALES', '10 Sales', 'Completed 10 marketplace sales.', '🏅', 'rare'),
  ('FIFTY_SALES', '50 Sales', 'Completed 50 marketplace sales.', '💎', 'epic'),
  ('HUNDRED_SALES', '100 Sales', 'Completed 100 marketplace sales.', '👑', 'legendary'),
  ('VERIFIED_SELLER', 'Verified Seller', 'Passed manual seller KYC review.', '✅', 'standard'),
  ('SELLER_PRO', 'Seller Pro', 'Maintains an active Seller Pro subscription.', '⚡', 'rare'),
  ('TRUSTED_SELLER', 'Trusted Seller', 'Maintains strong buyer feedback.', '🛡️', 'epic'),
  ('TOP_SELLER', 'Top Seller', 'Ranks among top marketplace performers.', '🏆', 'legendary'),
  ('FAST_RESPONDER', 'Fast Responder', 'Responds quickly inside private trade rooms.', '🚀', 'rare')
on conflict (code) do update set name = excluded.name, description = excluded.description, icon = excluded.icon, rarity = excluded.rarity, active = true;
