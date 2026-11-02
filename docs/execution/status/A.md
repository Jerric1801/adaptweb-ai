# Status — Workstream A

| Milestone | State | Note |
|---|---|---|
| Kickoff | ✅ | `supabase init` done, config.toml auth set (anon on, OTP 6, site_url/redirects) |
| A1 migrations (G1) | ✅ | applied by user via SQL editor (5432 blocked on their network, so no `db push`; `supabase link` never succeeded). REST smoke passes: site_rules `[]`, waitlist 201, anon signup → profile row, seed_my_demo_events 180 rows, dashboard_summary OK |
| A2 auth config | ✅ | `config push` done; anon signup works; profile trigger fires. Email OTP template (`{{ .Token }}`) not yet verified |
| A3 analyze-page (G3-backend) | ✅ | deployed on **Gemini** (`gemini-2.5-flash`, secret `GEMINI_API_KEY`, override via `GEMINI_MODEL`). Fixture → 6 correct rules in 3.2s; 2nd call `cached: true` |
| A4 curated rules | ⏳ | 0003 must be applied via SQL editor (no db push) |
| A5 README/pre-warm | ⏳ | |

## Needs from the user
- Delete smoke row in SQL editor: `delete from waitlist where email='smoke@test.dev';`
- Real Netlify URL (config.toml uses placeholder `https://adaptweb-ai.netlify.app`).
- Function URL: https://pkfzydrmnagrxpkilufs.supabase.co/functions/v1/analyze-page

## Requests from other workstreams
<!-- Other terminals: add "- [from X] request" here. Owner ticks when done. -->

## Log
- Switched LLM from Claude to Gemini at user request. Replaced the Sonnet 5.5 note: no `tool_choice`/temperature issue now; uses `responseJsonSchema` + temperature 0, thinking budget 0.
- Test row `demo-store.example` (source=ai) exists in site_rules from fixture test; harmless, delete before demo if wanted.
