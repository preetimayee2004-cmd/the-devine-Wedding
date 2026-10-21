-- Preeti & Shivashish: Blessing Wall + RSVP storage.
-- Run once in Supabase → SQL Editor, then set VITE_SUPABASE_URL and
-- VITE_SUPABASE_ANON_KEY (Project settings → API) where the site is built.
--
-- Access (row-level security, public anon key):
--   wishes  guests may add; everyone may read rows with status = 'visible'
--   rsvps   guests may add; nobody can read them from the site — the couple
--           reads acceptances in the dashboard (Table editor → rsvps)

-- ── Wishes ──────────────────────────────────────────────────────
create table if not exists public.wishes (
  id          uuid primary key,                       -- made by the browser, so a retry never duplicates
  name        text check (name is null or char_length(btrim(name)) between 1 and 60),
  message     text not null check (char_length(btrim(message)) between 2 and 280),
  -- Set a row to 'hidden' in the dashboard to take it off the wall.
  status      text not null default 'visible' check (status in ('visible', 'hidden')),
  created_at  timestamptz not null default now()
);

create index if not exists wishes_visible_recent on public.wishes (created_at desc) where status = 'visible';

alter table public.wishes enable row level security;

drop policy if exists "Anyone can read visible wishes" on public.wishes;
create policy "Anyone can read visible wishes"
  on public.wishes for select to anon
  using (status = 'visible');

drop policy if exists "Guests can add wishes" on public.wishes;
create policy "Guests can add wishes"
  on public.wishes for insert to anon
  with check (status = 'visible');

revoke update, delete on public.wishes from anon;

-- Light spam guard: the same wish from the same name twice in 10 minutes is refused.
create or replace function public.reject_duplicate_wish() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (
    select 1 from public.wishes
    where lower(btrim(message)) = lower(btrim(new.message))
      and coalesce(lower(btrim(name)), '') = coalesce(lower(btrim(new.name)), '')
      and created_at > now() - interval '10 minutes'
  ) then
    raise exception 'duplicate wish' using errcode = '23505';
  end if;
  return new;
end $$;

drop trigger if exists wishes_reject_duplicate on public.wishes;
create trigger wishes_reject_duplicate before insert on public.wishes
  for each row execute function public.reject_duplicate_wish();

-- ── RSVPs (one-tap acceptance) ──────────────────────────────────
create table if not exists public.rsvps (
  id          uuid primary key,                       -- made by the browser: a double tap is saved once
  guest_name  text not null check (char_length(btrim(guest_name)) between 1 and 80),
  guest_key   text check (guest_key is null or char_length(guest_key) <= 80),  -- the name from the personal link
  created_at  timestamptz not null default now()
);

alter table public.rsvps enable row level security;

drop policy if exists "Guests can accept" on public.rsvps;
create policy "Guests can accept"
  on public.rsvps for insert to anon
  with check (true);

revoke select, update, delete on public.rsvps from anon;
