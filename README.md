# AdaptWeb AI

**The web, without the pressure.** A Chrome extension that strips dark patterns, surfaces the true total, and reshapes pages for how you read. Pitch prototype.

## Repo

| Path | What |
|---|---|
| `web/` | Next.js 16 site — landing, dashboard, install. Static export → Netlify. |
| `extension/` | MV3 Chrome extension (esbuild + Preact). `npm run dev`, load `dist/` unpacked. |
| `contracts/` | Frozen shared types across all workstreams |
| `supabase/` | Migrations + Edge Functions (`supabase db push`, `supabase functions deploy`) |
| `docs/PLAN.md` | Product decisions, architecture, schema, phases, SharkNinja walkthrough |
| `docs/CONSIDERATIONS.md` | Risks: demo, honesty/legal, privacy, AI quality, Web Store |
| `docs/brand/BRAND.md` | Brand quick reference |
| `docs/execution/` | **4 parallel workstreams — start at `00-OVERVIEW.md`** |

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

Workstream A applies migrations with `supabase db push` — see `docs/execution/A-SUPABASE.md`.
