-- AdaptWeb AI: landing-page waitlist
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 254),
  mode text check (mode in ('analytical', 'minimalist', 'visual')),
  source text default 'landing' check (length(source) <= 64),
  created_at timestamptz not null default now()
);

alter table public.waitlist enable row level security;

-- Anonymous visitors may add themselves; nobody can read the list via the public API.
drop policy if exists "waitlist_insert_anon" on public.waitlist;
create policy "waitlist_insert_anon" on public.waitlist
  for insert to anon, authenticated with check (true);

grant insert on public.waitlist to anon, authenticated;
revoke select, update, delete on public.waitlist from anon, authenticated;
