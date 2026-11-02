# Workstream D — Web app (dashboard, auth, install) + deploy

**You own:** `web/**` except `web/public/adaptweb-extension.zip` (C writes that).
**Constraints:** Next.js **16** static export (`output: "export"`). That means **client components for anything auth/data**: no server actions, no route handlers, no middleware/proxy. Read `web/node_modules/next/dist/docs/` before using any Next API. Netlify auto-deploys on push to `main`.
**Contract:** `web/src/lib/contracts.ts` (copy of `contracts/types.ts`). Use `UserProfile`, `DashboardSummaryRow`, `DashboardDomainRow`, `AdaptationEvent`, `PATTERN_LABELS`.
**Design:** match the landing page exactly: tokens in `web/src/app/globals.css`, components in `web/src/components/`. Read `docs/brand/BRAND.md`. Load the `dataviz` skill before building charts.

---

## D1 — Supabase client + auth (first 40 min)

```bash
cd web && npm i @supabase/supabase-js
```
- `src/lib/supabase.ts`: `createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!)` (default localStorage session, `detectSessionInUrl: true`).
- `src/lib/useSession.ts`: hook returning `{ session, user, loading }` via `getSession()` + `onAuthStateChange`.
- `/login` page (client):
  1. Email field, then `signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: location.origin + "/dashboard/" } })`.
  2. 6-digit code field → `verifyOtp({ email, token, type: "email" })` → `router.push("/dashboard/")`.
  3. The magic link in the same email also works (`detectSessionInUrl`).
  4. Copy: calm, no urgency ("We'll email you a 6-digit code.").
- Nav (landing + app pages): add "Dashboard" (when signed in) / "Sign in". Keep the landing nav otherwise as is.

Until A's G1 lands, mock data behind `const MOCK = !process.env.NEXT_PUBLIC_SUPABASE_URL || …` toggles.

## D2 — `/dashboard` (H1–3) — the pitch screen

Client component, auth-gated (redirect to `/login/` if no session after loading). Layout follows the landing "Your month, unpressured" card style: 28px radius, soft shadows, Paper background, Lime/Amber/Forest accents.

1. **Header:** "Your web, unpressured" + range switch (7 / 30 days) + user email + sign out.
2. **Stat tiles (4):** patterns removed (sum of events), hidden fees surfaced (`sum(value_cents)` for drip + sneak → `$`), sites adapted (count of domains), most common pattern.
3. **Donut/gauge:** share by pattern from `rpc("dashboard_summary", { days })`, labelled with `PATTERN_LABELS`.
4. **Per-site table:** `rpc("dashboard_by_domain", { days })`, with domain, events, $ surfaced, last seen, plus a tiny hatched bar.
5. **Live feed:** last 20 rows of `adaptation_events` (newest first) plus a **realtime subscription** to `INSERT` on `adaptation_events` filtered `user_id=eq.{uid}`. New rows slide in, tiles increment, and a Lime pulse dot "Live" shows. This is the G4 demo moment.
6. **Reading mode card:** segmented Analytical / Minimalist / Visual → `update user_profiles set reading_mode`. The extension picks it up via realtime and re-lays the open tab. Show "Synced to your extension ✓".
7. **Empty state:** "No pages adapted yet" + install CTA + a **"Load demo data"** button → `rpc("seed_my_demo_events", { n: 180 })` → refetch. Keep the button available (small, in a menu) for the pitch account.

Charts: hand-built SVG (like the landing gauge) or a light lib. Follow the dataviz skill palette guidance, using brand colours.

## D3 — `/install` + landing download CTA (H2)

- `/install`: three steps with illustrations:
  1. Download `/adaptweb-extension.zip` and unzip
  2. `chrome://extensions` → Developer mode
  3. Load unpacked → pick the folder → pin it

  Plus a "Chrome Web Store — in review" badge and a "Sign in to sync with your dashboard" link.
- Landing: in the `#get` section, replace the "from your invite email" step with a real **Download (.zip)** button linking `/adaptweb-extension.zip` plus a link to `/install/`. Keep the waitlist. Hero secondary CTA → "Install the early build".
- Until C ships the zip, the link 404s. That's fine. Check `status/C.md`.

## D4 — `/privacy` (H2) — needed for Web Store

Short and plain:
- **What runs locally:** page analysis and changes.
- **What's sent:** domain + path for rule lookups; a redacted structural snapshot (no form values, no personal text) for AI analysis of unknown pages; counts of patterns removed per domain for your dashboard.
- **What we never collect:** browsing history, page contents beyond the snapshot, form inputs.
- **Accounts:** anonymous by default; email only if you sign in.
- **Deletion:** contact email.

Contact: `jomoai1808@gmail.com` (or ask the user).

## D5 — Deploy & polish (H3–4)

- Every push deploys. After each milestone open the Netlify URL and check `/`, `/login/`, `/dashboard/`, `/install/`, `/privacy/` at desktop and 390px.
- Static export + `trailingSlash: true` means links must end in `/` (`/dashboard/`).
- Ask the user for the final Netlify URL if you don't know it. Post it in `status/D.md` and in C's Requests (C bakes it into the extension). A needs it for the auth Site URL.
- `metadata` per page; OG image optional (static PNG in `public/`).
- Optional, if time: `/demo` page = full-screen version of `LiveDemo` for the pitch fallback.

## Definition of done

- [ ] OTP login works on the deployed site
- [ ] Dashboard renders real RPC data, demo-data button works, realtime feed ticks live
- [ ] Mode switch on dashboard updates `user_profiles` (and the extension re-lays — verify with C)
- [ ] `/install`, `/privacy` live; landing download CTA → zip
- [ ] Lint + build clean; deployed; checked on mobile
