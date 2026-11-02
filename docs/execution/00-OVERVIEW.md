# Execution Overview — 4 parallel workstreams

Goal: an installable AdaptWeb AI extension that strips dark patterns on **real sites** (SharkNinja + one site each in travel, ticketing, fast fashion, big retail). It shows the true total, re-lays pages in 3 reading modes, syncs with Supabase, and feeds a live web dashboard. All of it demoable at the pitch.

```
            ┌──────────────── contracts/types.ts (frozen v1) ────────────────┐
            │                                                                 │
  ┌─────────▼─────────┐  messages   ┌──────────────────┐  supabase-js  ┌──────▼──────────┐
  │ B  In-page engine │◀──────────▶│ C  Extension shell│◀────────────▶│ A  Supabase + AI│
  │ content script    │ GET_CONTEXT │ service worker    │ rules/events  │ tables, RLS,    │
  │ heuristics, apply │ ANALYZE     │ popup, auth,      │ realtime      │ Edge fn → Claude│
  │ true total, modes │ REPORT      │ cache, badge, zip │ functions     │ curated rules   │
  └───────────────────┘             └──────────────────┘               └──────▲──────────┘
                                                                              │ RPC / realtime
                                                                       ┌──────┴──────────┐
                                                                       │ D  Web + deploy │
                                                                       │ dashboard, auth,│
                                                                       │ install, privacy│
                                                                       └─────────────────┘
```

## Phase 0 — done (do not redo)

- `contracts/types.ts`: every cross-boundary type. Patterns, rules, snapshot, page state, settings, messages, Edge Function I/O, DB rows, RPC rows.
- `supabase/migrations/0001_waitlist.sql`, `0002_core.sql`: `site_rules`, `user_profiles` (+ signup trigger), `adaptation_events`, RLS, `dashboard_summary`, `dashboard_by_domain`, `seed_my_demo_events`, realtime publication. **Written, not yet applied** — A applies first.
- `extension/`: builds and loads today. Stubs: `src/engine/index.ts` (B), `src/content/index.ts` (B), `src/background/index.ts` (C), `src/popup/main.tsx` (C).
- `web/`: landing page live on Netlify — open access (download / install / dashboard / demo cards, no waitlist), brand tokens in `globals.css`.

## How to launch the terminals

Open 4 terminals at the repo root and start Claude Code in each (bypass-permissions mode recommended for speed). Paste one kickoff prompt per terminal:

**Terminal A**
```
You are workstream A (Supabase + AI rules) for AdaptWeb AI. Read CLAUDE.md, docs/execution/00-OVERVIEW.md and docs/execution/A-SUPABASE.md, then execute A-SUPABASE.md top to bottom autonomously. Push to main after every milestone and keep docs/execution/status/A.md current. Ask me only for things that need my credentials or dashboard access — batch them into one question.
```

**Terminal B**
```
You are workstream B (in-page engine) for AdaptWeb AI. Read CLAUDE.md, docs/execution/00-OVERVIEW.md and docs/execution/B-ENGINE.md, then execute B-ENGINE.md top to bottom autonomously. Push to main after every milestone and keep docs/execution/status/B.md current. Ask me only for things that need my credentials or dashboard access — batch them into one question.
```

**Terminal C**
```
You are workstream C (extension shell) for AdaptWeb AI. Read CLAUDE.md, docs/execution/00-OVERVIEW.md and docs/execution/C-EXTENSION-SHELL.md, then execute C-EXTENSION-SHELL.md top to bottom autonomously. Push to main after every milestone and keep docs/execution/status/C.md current. Ask me only for things that need my credentials or dashboard access — batch them into one question.
```

**Terminal D**
```
You are workstream D (web app + deploy) for AdaptWeb AI. Read CLAUDE.md, docs/execution/00-OVERVIEW.md and docs/execution/D-WEB.md, then execute D-WEB.md top to bottom autonomously. Push to main after every milestone and keep docs/execution/status/D.md current. Ask me only for things that need my credentials or dashboard access — batch them into one question.
```

## Things only YOU (the user) can do — do these at kickoff

**Step-by-step version: [MANUAL-SETUP.md](MANUAL-SETUP.md)**

| # | Action | Who needs it | Where |
|---|---|---|---|
| U1 | `supabase login` in terminal A (type `! supabase login`) | A | CLI → browser |
| U2 | Give terminal A the DB password when `supabase link` asks | A | terminal |
| U3 | Anthropic API key → terminal A runs `supabase secrets set ANTHROPIC_API_KEY=…` | A | console.anthropic.com |
| U4 | Supabase → Authentication → Sign In / Providers: **enable Anonymous sign-ins**; keep Email on; turn **off** "Confirm email" | C, D | Supabase dashboard |
| U5 | Supabase → Authentication → Email Templates → Magic Link: add `Your code: {{ .Token }}` so emails carry a 6-digit code | C, D | Supabase dashboard |
| U6 | Supabase → Authentication → URL Configuration: Site URL = your Netlify URL; add redirect `https://<netlify>/**` and `http://localhost:3000/**` | D | Supabase dashboard |
| U7 | Tell C + D your final Netlify URL (C bakes it into the extension as `WEB_URL`) | C, D | — |
| U8 | Chrome Web Store developer account ($5) + submit the zip C produces | C | chrome.google.com/webstore/devconsole |

A may be able to do U4–U6 through `supabase config push`. If so it says so in `status/A.md`.

## Timeline & checkpoints

| When | A | B | C | D |
|---|---|---|---|---|
| **H0–1** | Link, push migrations ✅, auth config, REST smoke test | Fixtures (demo store + real dumps), snapshot + selector gen, heuristics v1 | Supabase client in SW, anon auth, rule fetch + cache, badge | Supabase client, `/login` OTP, `/dashboard` skeleton, `/install`, `/privacy` |
| **H1–2** | `analyze-page` Edge Function deployed, curl test | `apply` (remove/hide/uncheck/rewrite/dismiss) + ghosts + undo + observer | Popup v1 (toggle, count, change list, undo), event queue → `adaptation_events` | Dashboard tiles + charts from RPCs, demo-data button, mode switcher → `user_profiles` |
| **H2–3** | Curated rules for 5 demo sites, seeded | True total (JSON-LD + text) + card; ANALYZE path | ANALYZE wiring, realtime profile → SETTINGS_CHANGED, popup modes + true total | Realtime live counter, landing download CTA → zip, polish |
| **H3–4** | Pre-warm AI rules on demo URLs, tune prompt | Reading modes (side card + mode-scoped rules), live-site tuning | Icons, zip → `web/public`, Web Store assets | Final deploy, mobile check, demo script page |
| **H4+** | — **Joint demo rehearsal on live sites (C drives), record backup video** — | | | |

**Integration gates**
1. **G1 (A ✅ migrations):** C and D switch from mocks to real tables.
2. **G2 (B ✅ apply + C ✅ GET_CONTEXT):** extension visibly strips patterns on the fixture store.
3. **G3 (A ✅ analyze-page + C ✅ ANALYZE):** an unknown real site gets AI rules end to end.
4. **G4 (D ✅ dashboard + C ✅ events):** stripping a page bumps the dashboard live.
5. **G5:** all 5 demo URLs pass the demo checklist below.

## Demo checklist (G5)

For each demo URL: extension off → patterns visible → toggle on → each pattern stripped or ghosted, badge count right, true total sensible (or hidden if unknown), all 3 modes look good, "Show original" restores, dashboard ticks up live. Then record a backup screen video of the full flow.

## Git protocol

- Everyone works on `main`. Paths are disjoint, so conflicts should be rare.
- `git pull --rebase --autostash && git push` after each increment.
- Commit messages: `[A] edge fn: analyze-page deployed`.
- Never force-push. Never edit another workstream's paths. Use their status-file **Requests** section instead.
