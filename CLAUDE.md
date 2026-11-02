# AdaptWeb AI — working rules for every terminal

Pitch prototype. **Speed over polish. Ship working increments to `main` constantly.**

## Who owns what (never edit outside your paths)

| WS | Name | Owns |
|---|---|---|
| A | Supabase + AI rules | `supabase/**` |
| B | In-page engine | `extension/src/engine/**`, `extension/src/content/**`, `extension/static/content.css`, `extension/fixtures/**` |
| C | Extension shell | `extension/**` except B's paths; may write `web/public/adaptweb-extension.zip` |
| D | Web app + deploy | `web/**` except `web/public/adaptweb-extension.zip` |

Shared, frozen: `contracts/types.ts`. Additive changes only, committed alone as `contracts: …`, logged in `contracts/CHANGELOG.md`, then re-copied to `supabase/functions/_shared/contracts.ts` and `web/src/lib/contracts.ts`.

Need something from another workstream? Add it under **Requests** in their `docs/execution/status/<WS>.md`, then carry on with a mock.

## Speed rules

- Commit + push to `main` after every working increment. Prefix commits `[A]`/`[B]`/`[C]`/`[D]`. Run `git pull --rebase --autostash` before every push.
- No PRs, no review rounds, no test suites. Smoke-test by running the thing (build, load unpacked, curl, open the page).
- Don't stop to ask about routine decisions — pick the sensible default, note it in your status file, keep going. Only stop for things only the user can do (logins, API keys, dashboard toggles) — list them in your status file and ask once.
- Mock anything another workstream hasn't delivered yet; swap in the real thing when their status says ✅.
- Update `docs/execution/status/<WS>.md` at every milestone (✅/⏳/❌ + one line).

## Non-negotiables (product, not process)

- Never invent prices, discounts or claims on a page. Remove, uncheck, reveal, relabel with facts only. Estimates are labelled "est.".
- No secrets in git: DB password, service-role/secret keys, Anthropic key → Supabase secrets / local env only. The publishable key is fine.
- Never commit `docs/brand/sample-deck.pdf` or `docs/brand/vibe/` (third-party).

## Key facts

- Supabase project ref `pkfzydrmnagrxpkilufs`, URL `https://pkfzydrmnagrxpkilufs.supabase.co`, publishable key in `netlify.toml`.
- Web: Next.js 16 static export in `web/` → Netlify (auto-deploy on push). Read `web/node_modules/next/dist/docs/` before using Next APIs — v16 differs from training data.
- Extension: MV3, esbuild, Preact popup. `cd extension && npm run dev`, load `extension/dist` unpacked.
- Brand: `docs/brand/BRAND.md`. Lime = adapted, Ember = pressure (never our CTA).
- Claude models: `claude-sonnet-5-5` (default), `claude-haiku-5-5` (fast). Load the `claude-api` skill before writing Claude API code.
