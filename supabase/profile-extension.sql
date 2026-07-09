-- Incremental premium profile extension for an existing NEXUS MLBB Marketplace database.

alter table public.users add column if not exists cover_url text;
alter table public.users add column if not exists bio text;
alter table public.users add column if not exists rating numeric(3,2) not null default 0;
alter table public.users add column if not exists online_at timestamptz;

alter table public.listing_images add column if not exists thumbnail_url text;
alter table public.listing_images add column if not exists width integer;
alter table public.listing_images add column if not exists height integer;

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.users(id) on delete cascade,
  reviewer_id uuid not null references public.users(id) on delete cascade,
  trade_id uuid references public.trades(id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (trade_id, reviewer_id)
);

create table if not exists public.user_follows (
  follower_id uuid not null references public.users(id) on delete cascade,
  following_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table if not exists public.listing_favorites (
  user_id uuid not null references public.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  icon text,
  rarity text not null default 'standard',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.user_achievements (
  user_id uuid not null references public.users(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

create index if not exists reviews_seller_idx on public.reviews(seller_id, created_at desc);
create index if not exists reviews_reviewer_idx on public.reviews(reviewer_id, created_at desc);
create index if not exists user_follows_following_idx on public.user_follows(following_id, created_at desc);
create index if not exists listing_favorites_listing_idx on public.listing_favorites(listing_id, created_at desc);
create index if not exists user_achievements_user_idx on public.user_achievements(user_id, earned_at desc);

alter table public.reviews enable row level security;
alter table public.user_follows enable row level security;
alter table public.listing_favorites enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;

drop policy if exists "Anyone can read reviews" on public.reviews;
create policy "Anyone can read reviews" on public.reviews for select using (true);
drop policy if exists "Buyers review completed trades" on public.reviews;
create policy "Buyers review completed trades" on public.reviews for insert with check (reviewer_id = auth.uid() and exists (select 1 from public.trades t where t.id = trade_id and t.buyer_id = auth.uid() and t.seller_id = seller_id and t.status = 'COMPLETED'));
drop policy if exists "Reviewers update own reviews" on public.reviews;
create policy "Reviewers update own reviews" on public.reviews for update using (reviewer_id = auth.uid()) with check (reviewer_id = auth.uid());

drop policy if exists "Anyone can read follows" on public.user_follows;
create policy "Anyone can read follows" on public.user_follows for select using (true);
drop policy if exists "Users follow profiles" on public.user_follows;
create policy "Users follow profiles" on public.user_follows for insert with check (follower_id = auth.uid());
drop policy if exists "Users unfollow profiles" on public.user_follows;
create policy "Users unfollow profiles" on public.user_follows for delete using (follower_id = auth.uid());

drop policy if exists "Users read own favorites" on public.listing_favorites;
create policy "Users read own favorites" on public.listing_favorites for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "Users favorite listings" on public.listing_favorites;
create policy "Users favorite listings" on public.listing_favorites for insert with check (user_id = auth.uid());
drop policy if exists "Users remove favorites" on public.listing_favorites;
create policy "Users remove favorites" on public.listing_favorites for delete using (user_id = auth.uid());

drop policy if exists "Anyone can read active achievements" on public.achievements;
create policy "Anyone can read active achievements" on public.achievements for select using (active = true or public.is_admin());
drop policy if exists "Anyone can read user achievements" on public.user_achievements;
create policy "Anyone can read user achievements" on public.user_achievements for select using (true);
drop policy if exists "Admins award achievements" on public.user_achievements;
create policy "Admins award achievements" on public.user_achievements for all using (public.is_admin()) with check (public.is_admin());

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

drop trigger if exists on_listing_favorite_insert on public.listing_favorites;
create trigger on_listing_favorite_insert after insert on public.listing_favorites for each row execute function public.refresh_listing_favorite_count();
drop trigger if exists on_listing_favorite_delete on public.listing_favorites;
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

drop trigger if exists on_review_insert on public.reviews;
create trigger on_review_insert after insert on public.reviews for each row execute function public.refresh_seller_rating();
drop trigger if exists on_review_update on public.reviews;
create trigger on_review_update after update on public.reviews for each row execute function public.refresh_seller_rating();
drop trigger if exists on_review_delete on public.reviews;
create trigger on_review_delete after delete on public.reviews for each row execute function public.refresh_seller_rating();

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

drop trigger if exists on_trade_completed on public.trades;
create trigger on_trade_completed after update on public.trades for each row execute function public.mark_listing_sold_when_trade_completed();

insert into public.system_settings (key, value, description)
values ('seller_pro_image_limit', '10', 'Maximum images per listing for Seller Pro accounts')
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
