# Workstream A — Supabase backend + AI rule engine

**You own:** `supabase/**` (migrations, Edge Functions, seeds, config).
**You unblock:** C (rules, auth, events) and D (dashboard RPCs). Your first milestone (migrations live) is the most important thing in the whole project. Do it first.
**Contract:** `contracts/types.ts`. Your Deno copy lives at `supabase/functions/_shared/contracts.ts` (already copied).

---

## A1 — Link and apply migrations (target: first 20 min) 🔴 critical path

```bash
supabase --version                 # 2.62+ ok; `brew upgrade supabase` if a command is missing
supabase login                     # user runs this: `! supabase login`
cd <repo root>
[ -f supabase/config.toml ] || supabase init   # answer "N" to VS Code/Deno settings prompts
supabase link --project-ref pkfzydrmnagrxpkilufs   # asks for DB password → ask the user once
supabase db push                   # applies 0001_waitlist.sql + 0002_core.sql
```

If `db push` complains about migration naming, rename to `20261102000001_waitlist.sql`, `20261102000002_core.sql` and re-run.

**Smoke test (REST with publishable key):**
```bash
KEY=sb_publishable_0WTKSufAZP6LbicrvMKhJA_X3SEkGtG
URL=https://pkfzydrmnagrxpkilufs.supabase.co
curl -s "$URL/rest/v1/site_rules?select=*" -H "apikey: $KEY"           # → []
curl -s -X POST "$URL/rest/v1/waitlist" -H "apikey: $KEY" -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" -d '{"email":"smoke@test.dev","mode":"visual"}' -w "%{http_code}\n"   # → 201
```
Delete the smoke row in the SQL editor or with `supabase db query` if available.

✅ Mark **G1** in `status/A.md` and push.

## A2 — Auth config (target: +10 min)

The extension signs in **anonymously** on install. Users upgrade to email via a **6-digit OTP**. The dashboard uses the same OTP.

Try CLI first: in `supabase/config.toml` set

```toml
[auth]
site_url = "https://adaptweb-ai.netlify.app"   # replace with real Netlify URL when user gives it
additional_redirect_urls = ["http://localhost:3000/**", "https://*.netlify.app/**"]
enable_anonymous_sign_ins = true

[auth.email]
enable_confirmations = false
otp_length = 6
```

Then `supabase config push`. If that's unsupported or fails, ask the user to do U4–U6 from the overview in the dashboard. The email template needs `{{ .Token }}` so the email carries the code.

**Smoke test:** create an anonymous user via REST:
```bash
curl -s -X POST "$URL/auth/v1/signup" -H "apikey: $KEY" -H "Content-Type: application/json" -d '{}' | head -c 300
```
→ returns an `access_token`. Confirm a `user_profiles` row appeared via the trigger (SQL editor: `select * from user_profiles order by updated_at desc limit 1;`).

## A3 — `analyze-page` Edge Function (target: H1–2) 🔴 critical path

Load the `claude-api` skill first. Create `supabase/functions/analyze-page/index.ts`.

**I/O:** `AnalyzeRequest` → `AnalyzeResponse` (contracts). Called by C via `supabase.functions.invoke("analyze-page", { body: { snapshot } })`.

**Flow:**
1. CORS: respond to `OPTIONS` with `Access-Control-Allow-Origin: *`, allow headers `authorization, x-client-info, apikey, content-type`. Echo CORS on every response.
2. Parse body. Reject if no `snapshot.domain` or more than 300 nodes (truncate instead of rejecting if easier).
3. Derive `path_pattern`: first path segment + `/*` (e.g. `/products/abc` → `/products/*`), or `*` for `/`.
4. **Cache:** select from `site_rules` where `domain = snapshot.domain` and `path_pattern in (derived, '*')` and `source in ('curated','ai')`, newest first. If a `curated` row exists, return it. If an `ai` row exists that is under 7 days old, return it. In both cases `cached: true`.
5. **Claude call** (raw `fetch` to `https://api.anthropic.com/v1/messages`, headers `x-api-key: Deno.env.get("ANTHROPIC_API_KEY")`, `anthropic-version: 2023-06-01`):
   - model `Deno.env.get("ANTHROPIC_MODEL") ?? "claude-sonnet-5-5"`, `max_tokens` 2000, temperature 0.
   - Force structured JSON: use a tool definition `emit_rules` with an input schema matching `{ rules: Rule[], confidence: number }`, plus `tool_choice: { type: "tool", name: "emit_rules" }`. Follow the claude-api skill for exact syntax.
   - **System prompt** (keep tight):
     - You classify manipulative design ("dark patterns") on a web page from a redacted DOM snapshot.
     - Output only rules whose `selector` is copied exactly from a snapshot node.
     - Pattern → action mapping:
       - fake_urgency, false_scarcity, fake_social_proof → `remove`
       - sneak_into_basket → `uncheck` (selector must be the checkbox)
       - confirmshaming → `rewrite_text` with text "No thanks"
       - nagging_popup → `dismiss`
       - drip_pricing → `annotate_total` on the headline price, with extras such as `fee_values` and `shipping_value` only if stated on the page
       - buried_specs → `surface` with `modes: ["analytical"]`
       - clutter (recommendation carousels, promo strips) → `hide` with `modes: ["minimalist"]`
     - Never invent prices. Never target html/body/main/header/the product title/the add-to-cart button. Prefer precision over recall. Add a ≤8-word `reason` per rule. Set `confidence` 0–1 per rule and overall.
   - User message: `JSON.stringify(snapshot)`.
6. **Validate:** drop rules whose selector isn't in `snapshot.nodes[].selector` (exception: `annotate_total` may use a `snapshot.prices[].selector`), unknown pattern/action, or confidence < 0.5.
7. **Upsert** with the service-role client (`createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"))`. If missing, check `Deno.env.toObject()` keys for the new secret-key name) into `site_rules` on conflict `(domain, path_pattern, source)` with `source: 'ai'`, increment `version`.
8. Return `{ ruleSet, cached: false, model, ms }`. On any error return 200 with `{ ruleSet: null, cached: false, error }` so the extension never breaks.

**Deploy (no JWT check, for speed):**
```bash
supabase secrets set ANTHROPIC_API_KEY=<from user>   # ask user once
supabase functions deploy analyze-page --no-verify-jwt
```

**Test fixture:** write `supabase/functions/analyze-page/fixtures/demo-store.json`. It's a hand-built `PageSnapshot` mirroring the landing demo: timer banner, "only 2 left", "37 people viewing", pre-ticked protection plan, "No thanks, I'd rather pay full price", price with "+ fees at checkout".
```bash
curl -s -X POST "$URL/functions/v1/analyze-page" -H "apikey: $KEY" -H "Content-Type: application/json" \
  -d @supabase/functions/analyze-page/fixtures/demo-store.json | jq
```
Expect about 6 rules. Second call → `cached: true`.

✅ Mark **G3-backend** in status.

## A4 — Curated rules for the 5 demo sites (target: H2–3)

The demo runs on real sites, so curated rules make it deterministic. AI is the fallback.

1. Pick URLs: **SharkNinja** (one product page, e.g. a popular air fryer or vacuum) plus one product/checkout-adjacent page each for **travel/booking**, **ticketing**, **fast fashion** and **big retail**. Prefer pages that render content server-side. Write the chosen URLs in `status/A.md` and tell B through B's Requests section.
2. Capture DOM for inspection, and save it for B too (gitignored folder):
   ```bash
   mkdir -p extension/fixtures/real
   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu \
     --virtual-time-budget=8000 --user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131 Safari/537.36" \
     --dump-dom "<URL>" > extension/fixtures/real/<slug>.html
   ```
3. For each page, find the elements that actually exist: promo countdowns, stock/viewer claims, pre-selected add-ons, entry pop-ups, shipping/fee disclosures, spec tabs, recommendation carousels. **Only write rules for what is really there.** Use stable selectors (ids, data-testids, semantic classes) over hashed class names.
4. Write `supabase/migrations/0003_curated_rules.sql`: upserts into `site_rules` with `source='curated'`, `confidence=0.95`. Include mode-scoped rules too: `surface` with `modes:['analytical']` and `hide` (pattern `clutter`) with `modes:['minimalist']`.
5. `supabase db push`. Re-run whenever you tweak rules; upserts make it idempotent.
6. After C's extension works (status C ✅ GET_CONTEXT), load it and visit each URL. Fix selectors until clean.

## A5 — Pre-warm & polish (H3–4)

- Visit 5–10 extra real pages per category with the extension on, so `ai` rules get cached. Review them in the `site_rules` table. Delete bad ones and tweak the prompt.
- Add `supabase/README.md`: how to push migrations, deploy the function, set secrets, re-seed curated rules.
- Optional: `community` source. Skip unless everything else is done.

## Definition of done

- [ ] Migrations 0001–0003 applied; REST smoke tests pass
- [ ] Anonymous + email OTP auth working; profile trigger fires
- [ ] `analyze-page` deployed and returning validated rules; cache hit on second call
- [ ] Curated rules for 5 demo URLs, verified live with the extension
- [ ] `seed_my_demo_events()` callable by a signed-in user (D uses it)
- [ ] `status/A.md` lists URLs, function URL, anything the user still has to do
