# AdaptWeb AI

**The web, without the pressure.** A Chrome extension that strips dark patterns, surfaces the true total, and reshapes pages for how you read. Pitch prototype.

## Repo

| Path | What |
|---|---|
| `web/` | Next.js 16 marketing site — landing (`/`) and brand guidelines (`/brand`). Static export. |
| `supabase/migrations/` | SQL migrations (run in Supabase SQL editor) |
| `docs/PLAN.md` | Product decisions, architecture, schema, phases, SharkNinja walkthrough |
| `docs/CONSIDERATIONS.md` | Risks: demo, honesty/legal, privacy, AI quality, Web Store |
| `docs/brand/BRAND.md` | Brand quick reference |

## Run locally

```bash
cd web
cp .env.example .env.local   # fill in publishable Supabase values
npm install
npm run dev
```

## Deploy (Netlify)

Connect this repo in Netlify — `netlify.toml` sets base `web`, command `npm run build`, publish `out`, and the public Supabase env vars.

## Supabase setup

Run `supabase/migrations/0001_waitlist.sql` in the Supabase SQL editor to enable the waitlist form.
