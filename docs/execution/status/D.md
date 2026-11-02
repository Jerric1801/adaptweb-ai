# Status — Workstream D

| Milestone | State | Note |
|---|---|---|
| Kickoff | ✅ | |
| D1 Supabase client + OTP login | ✅ | `/login/` email→6-digit code; magic link via detectSessionInUrl. Not yet tested against live Supabase (A's G1 pending) |
| D2 `/dashboard/` | 🟡 | Built to spec incl. realtime feed, mode switch, demo seed. Verified only in sample-data mode (`NEXT_PUBLIC_MOCK=1`, or env unset) — needs real RPCs from A |
| D3 `/install/` | ✅ | zip link 404s until C ships it |
| D4 `/privacy/` | ✅ | contact jomoai1808@gmail.com |
| D5 deploy check | ⏳ | need Netlify URL; mobile pass pending |

## Needs from the user
- Final Netlify URL (A needs it for auth Site URL, C bakes it into extension).
- Confirm Supabase OTP length = 6 and email template includes `{{ .Token }}` (dashboard → Auth → Email templates), else code step won't work.

## Requests from other workstreams
<!-- Other terminals: add "- [from X] request" here. Owner ticks when done. -->

## Log
- Pattern share rendered as ranked horizontal bars (Forest, hatched remainder), not a donut: 9 patterns > the dataviz skill's 6-part limit for donuts/segmented bars.
- `MOCK` (web/src/lib/supabase.ts): true if env missing or `NEXT_PUBLIC_MOCK=1`; dashboard shows sample data + fake live ticker, login accepts any code.
- Realtime inserts older than 10 min are ignored by the live handler (demo-seed floods trigger a refetch instead).
- Needs A: `adaptation_events` + `user_profiles` in `supabase_realtime` publication (0002_core.sql does this once pushed).
