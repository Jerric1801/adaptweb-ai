-- AdaptWeb AI core schema (contracts v1). Workstream A owns further changes.

-- ---------- helpers ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ---------- site_rules ----------
create table if not exists public.site_rules (
  id uuid primary key default gen_random_uuid(),
  domain text not null,
  path_pattern text not null default '*',
  rules jsonb not null default '[]'::jsonb,
  source text not null check (source in ('curated', 'ai', 'community', 'heuristic')),
  confidence real check (confidence is null or (confidence >= 0 and confidence <= 1)),
  version int not null default 1,
  updated_at timestamptz not null default now(),
  unique (domain, path_pattern, source)
);
create index if not exists site_rules_domain_idx on public.site_rules (domain);
drop trigger if exists site_rules_touch on public.site_rules;
create trigger site_rules_touch before update on public.site_rules
  for each row execute function public.touch_updated_at();

alter table public.site_rules enable row level security;
drop policy if exists site_rules_read on public.site_rules;
create policy site_rules_read on public.site_rules for select to anon, authenticated using (true);
-- writes: service role only (Edge Function / SQL editor)

-- ---------- user_profiles ----------
create table if not exists public.user_profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  reading_mode text not null default 'analytical'
    check (reading_mode in ('analytical', 'minimalist', 'visual')),
  strip_dark_patterns boolean not null default true,
  show_true_total boolean not null default true,
  updated_at timestamptz not null default now()
);
drop trigger if exists user_profiles_touch on public.user_profiles;
create trigger user_profiles_touch before update on public.user_profiles
  for each row execute function public.touch_updated_at();

alter table public.user_profiles enable row level security;
drop policy if exists profiles_select_own on public.user_profiles;
create policy profiles_select_own on public.user_profiles for select to authenticated using (auth.uid() = id);
drop policy if exists profiles_update_own on public.user_profiles;
create policy profiles_update_own on public.user_profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists profiles_insert_own on public.user_profiles;
create policy profiles_insert_own on public.user_profiles for insert to authenticated with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_profiles (id, email) values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert or update of email on auth.users
  for each row execute function public.handle_new_user();

-- ---------- adaptation_events ----------
create table if not exists public.adaptation_events (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  domain text not null,
  pattern text not null,
  action text not null,
  value_cents int,
  created_at timestamptz not null default now()
);
create index if not exists events_user_time_idx on public.adaptation_events (user_id, created_at desc);

alter table public.adaptation_events enable row level security;
drop policy if exists events_insert_own on public.adaptation_events;
create policy events_insert_own on public.adaptation_events for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists events_select_own on public.adaptation_events;
create policy events_select_own on public.adaptation_events for select to authenticated using (auth.uid() = user_id);

-- ---------- dashboard RPCs ----------
create or replace function public.dashboard_summary(days int default 30)
returns table (pattern text, events bigint, value_cents bigint)
language sql stable security invoker as $$
  select e.pattern, count(*)::bigint, coalesce(sum(e.value_cents), 0)::bigint
  from public.adaptation_events e
  where e.user_id = auth.uid() and e.created_at > now() - make_interval(days => days)
  group by e.pattern
  order by 2 desc;
$$;

create or replace function public.dashboard_by_domain(days int default 30)
returns table (domain text, events bigint, value_cents bigint, last_seen timestamptz)
language sql stable security invoker as $$
  select e.domain, count(*)::bigint, coalesce(sum(e.value_cents), 0)::bigint, max(e.created_at)
  from public.adaptation_events e
  where e.user_id = auth.uid() and e.created_at > now() - make_interval(days => days)
  group by e.domain
  order by 2 desc;
$$;

grant execute on function public.dashboard_summary(int) to authenticated;
grant execute on function public.dashboard_by_domain(int) to authenticated;

-- ---------- realtime ----------
do $$ begin
  alter publication supabase_realtime add table public.user_profiles;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.site_rules;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.adaptation_events;
exception when duplicate_object then null; end $$;

-- ---------- demo data (pitch account) ----------
-- Inserts n fake events over the last 30 days for the CALLING user. Fictional domains.
create or replace function public.seed_my_demo_events(n int default 180)
returns int language plpgsql security invoker as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  insert into public.adaptation_events (user_id, domain, pattern, action, value_cents, created_at)
  select uid,
    (array['staybright.travel','tixly.events','fastthreads.shop','megamart.store','brightloop-home.com'])[1 + floor(random() * 5)::int],
    p.pattern, p.action,
    case when p.pattern in ('drip_pricing','sneak_into_basket') then (500 + floor(random() * 4500))::int end,
    now() - (random() * interval '30 days')
  from generate_series(1, n) g
  cross join lateral (
    select * from (values
      ('fake_urgency','remove'),('false_scarcity','remove'),('fake_social_proof','remove'),
      ('drip_pricing','annotate_total'),('sneak_into_basket','uncheck'),('confirmshaming','rewrite_text'),
      ('nagging_popup','dismiss')
    ) v(pattern, action)
    order by random() + g * 0 limit 1
  ) p;
  return n;
end $$;
grant execute on function public.seed_my_demo_events(int) to authenticated;
