# AdaptWeb AI — Prototype Plan

> The web, without the pressure.
> A Chrome extension that strips dark patterns, surfaces the true total, and reshapes pages for how you read.

Status: **pitch prototype** · Last updated 2026-11-02

---

## 1. Decisions so far

| Topic | Decision | Why |
|---|---|---|
| Name | **AdaptWeb AI** | Chosen by founder |
| Client | **MV3 Chrome extension (content scripts)** + web dashboard | Avoids `chrome.debugger` infobar, native-messaging installs and Rust toolchain from the original spec |
| Backend | **Supabase** — Auth, Postgres, Realtime, Edge Functions | Required; covers identity, rule map, sync, AI proxy |
| Rules | **AI + cache** — AI classifies unknown sites and writes selectors; cached in `site_rules`; hand-curated rules override | Strong pitch story, community network effect |
| Features | Dark-pattern stripping · True total price · Reading modes (Analytical / Minimalist / Visual) · Savings dashboard | All four in scope |
| Install | Chrome Web Store (submit now) **+** `.zip` "Load unpacked" fallback | Web Store review is 1–7 days |
| Demo | **Real sites** (travel, ticketing, fast fashion, big retail) + **SharkNinja** worked example | High impact — see risk mitigations in CONSIDERATIONS.md |
| Brand | Greige paper, ink line, Lime (adapted) vs Ember (pressure); Bricolage Grotesque / Geist / Geist Mono | See `docs/brand/BRAND.md` and `/brand` |
| Site hosting | Next.js 16 **static export** on Netlify, from `/web` | Fastest reliable deploy; Supabase called client-side |

### Dropped from the original spec (and why)

- **Fake discount injection** ("-$15.00 Base Fee Waived") — fabricates claims on merchant pages; contradicts the product's honesty promise.
- **`chrome.debugger` / CDP** — yellow "is debugging this browser" bar on every tab; content scripts do the same DOM work.
- **Tauri + native messaging in the data path** — Chrome spawns a fresh host process per `connectNative`; the GUI app can't be the host as written. Extension talks to Supabase directly.
- **Exit-intent mouse tracking** — itself a dark-pattern technique; bad optics.

---

## 2. Architecture

```
┌──────────────────────────── Chrome ─────────────────────────────┐
│  Content script (per tab)                                        │
│   1. Snapshot DOM features (text, prices, timers, checkboxes)    │
│   2. Local heuristics (regex: "only N left", countdown, etc.)    │
│   3. Apply rules → hide / rewrite / annotate, log every change   │
│  Service worker                                                  │
│   · rule cache (chrome.storage) · auth session · telemetry batch │
│  Popup / side panel  · toggle · mode · per-page change log       │
└───────────────┬──────────────────────────────────────────────────┘
                │ HTTPS (supabase-js, user JWT)
┌───────────────▼──────────── Supabase ────────────────────────────┐
│  Auth            email magic link / Google                       │
│  Postgres        site_rules · user_profiles · adaptation_events  │
│                  waitlist                                        │
│  Realtime        push rule updates + profile changes             │
│  Edge Function   analyze-page → calls Claude, validates selectors│
└───────────────┬──────────────────────────────────────────────────┘
                │
        ┌───────▼────────┐           ┌──────────────────────────┐
        │  Claude API     │           │  Web (Next.js on Netlify)│
        │  pattern classify│          │  landing · /brand ·      │
        │  + selector gen │           │  /dashboard (auth)       │
        └────────────────┘           └──────────────────────────┘
```

### Request flow (unknown site)

1. Page loads → content script hashes domain + path template → checks local cache.
2. Miss → service worker queries `site_rules` for the domain.
3. Miss → calls Edge Function `analyze-page` with a **redacted structural snapshot** (no form values, no personal text; prices & labels only).
4. Edge Function asks Claude to classify patterns and return selectors + actions as JSON; validates against snapshot; stores in `site_rules` with `source = 'ai'`, `confidence`.
5. Rules apply; events logged to `adaptation_events` for the dashboard.
6. Local heuristics run immediately in parallel, so the user sees an effect before AI returns.

### Rule format (JSON in `site_rules.rules`)

```json
[
  { "pattern": "fake_urgency", "selector": ".promo-countdown", "action": "remove", "reason": "Timer restarts on reload" },
  { "pattern": "sneak_into_basket", "selector": "#warranty-addon input", "action": "uncheck" },
  { "pattern": "drip_pricing", "selector": ".price-main", "action": "annotate_total",
    "extras": { "shipping_selector": ".ship-est", "fee_text_regex": "service fee.*?\\$([\\d.]+)" } }
]
```

Actions: `remove` · `hide` (keeps ghost) · `uncheck` · `rewrite_text` · `annotate_total` · `surface` (pull buried spec tables up) · `relayout:<mode>`.

---

## 3. Supabase schema (v1)

`supabase/migrations/0001_waitlist.sql` is live-ready. Next migration:

```sql
create table public.site_rules (
  id uuid primary key default gen_random_uuid(),
  domain text not null,
  path_pattern text not null default '*',
  rules jsonb not null,
  source text not null check (source in ('curated','ai','community')),
  confidence real check (confidence between 0 and 1),
  version int not null default 1,
  updated_at timestamptz not null default now(),
  unique (domain, path_pattern, source)
);

create table public.user_profiles (
  id uuid primary key references auth.users on delete cascade,
  reading_mode text not null default 'analytical'
    check (reading_mode in ('analytical','minimalist','visual')),
  strip_dark_patterns boolean not null default true,
  show_true_total boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.adaptation_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users on delete cascade,
  domain text not null,
  pattern text not null,
  value_cents int,              -- fee surfaced / add-on avoided
  created_at timestamptz not null default now()
);
```

RLS: `site_rules` readable by `authenticated`, writable only by service role (Edge Function). `user_profiles` and `adaptation_events` scoped to `auth.uid()`. Trigger creates a profile on signup.

---

## 4. Build phases

| # | Phase | Output | Status |
|---|---|---|---|
| 0 | Brand + landing | `/`, `/brand`, waitlist | ✅ shipped |
| 1 | Extension skeleton | MV3, popup toggle, local heuristics on 2 pattern types | ⏳ |
| 2 | Supabase core | schema above, auth in extension, Realtime profile sync | ⏳ |
| 3 | AI rules | `analyze-page` Edge Function + cache; curated overrides | ⏳ |
| 4 | True total + modes | drip-price parser, Analytical / Minimalist / Visual relayouts | ⏳ |
| 5 | Dashboard | `/dashboard` reading `adaptation_events` | ⏳ |
| 6 | Pitch hardening | pre-warmed rules for demo sites, backup video, Web Store submit | ⏳ |

---

## 5. Worked example — SharkNinja product page

Goal: show AdaptWeb on a real, well-known appliance store. **Verify every item on the live site the day before the pitch** — real pages change, and we must not claim a pattern that isn't there.

| Check on the live page | If present, AdaptWeb does | Mode showcase |
|---|---|---|
| Promo banner with a countdown | Remove if it restarts on reload (test: reload twice) | — |
| Newsletter / discount pop-up on entry | Dismiss and suppress for session | Minimalist |
| Bundles, accessories or protection plans pre-selected | Uncheck, annotate | — |
| Shipping cost or threshold shown only in cart | Compute true total on product page | Analytical |
| Spec table behind tabs / accordions | Surface above the fold | Analytical |
| Long marketing copy blocks | Collapse to 3 key facts | Minimalist |
| Product imagery carousel | Enlarge, icon-ify specs | Visual |

Demo script: open page with extension **off** → narrate what's on screen → toggle **on** → popup shows count + log → switch modes → open dashboard.

---

## 6. Open questions

- Team names / roles for the pitch deck credits?
- Pitch format & length (live demo minutes)?
- Which 1–2 additional real sites per category for the demo?
- Account required for v1, or anonymous mode with optional sync?
