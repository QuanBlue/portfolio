-- Run this once in Supabase Dashboard -> SQL Editor.
-- Allows owner sign-in via Email (quannguyenthanh558@gmail.com) or GitHub (@QuanBlue).

-- 0. Owner check helper ------------------------------------------------------
create or replace function public.is_portfolio_owner()
returns boolean
language sql
stable
as $$
  select
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'quannguyenthanh558@gmail.com'
    or lower(coalesce(
      auth.jwt() -> 'user_metadata' ->> 'user_name',
      auth.jwt() -> 'user_metadata' ->> 'preferred_username',
      ''
    )) = 'quanblue';
$$;

-- 1. Content table (a single JSON document, row id = 'main') ----------------
create table if not exists public.portfolio_content (
  id         text primary key default 'main',
  data       jsonb       not null,
  updated_at timestamptz not null default now()
);

alter table public.portfolio_content enable row level security;

drop policy if exists "public can read content" on public.portfolio_content;
create policy "public can read content"
  on public.portfolio_content for select
  using (true);

drop policy if exists "owner can insert content" on public.portfolio_content;
create policy "owner can insert content"
  on public.portfolio_content for insert to authenticated
  with check (public.is_portfolio_owner());

drop policy if exists "owner can update content" on public.portfolio_content;
create policy "owner can update content"
  on public.portfolio_content for update to authenticated
  using      (public.is_portfolio_owner())
  with check (public.is_portfolio_owner());

-- 2. Image bucket (public read, owner-only write) ----------------------------
insert into storage.buckets (id, name, public)
values ('portfolio', 'portfolio', true)
on conflict (id) do nothing;

drop policy if exists "public can read images" on storage.objects;
create policy "public can read images"
  on storage.objects for select
  using (bucket_id = 'portfolio');

drop policy if exists "owner can upload images" on storage.objects;
create policy "owner can upload images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'portfolio' and public.is_portfolio_owner());

drop policy if exists "owner can update images" on storage.objects;
create policy "owner can update images"
  on storage.objects for update to authenticated
  using (bucket_id = 'portfolio' and public.is_portfolio_owner());

drop policy if exists "owner can delete images" on storage.objects;
create policy "owner can delete images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'portfolio' and public.is_portfolio_owner());