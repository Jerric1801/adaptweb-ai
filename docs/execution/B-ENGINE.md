# Workstream B — In-page engine (content script)

**You own:** `extension/src/engine/**`, `extension/src/content/**`, `extension/static/content.css`, `extension/fixtures/**`.
**You never touch:** background, popup, manifest, build config. Those belong to C. If you need a manifest change (e.g. `web_accessible_resources`), add a Request in `status/C.md`.
**Contract:** `contracts/types.ts` via `extension/src/shared/contracts.ts`. Engine public API is defined at the top of `src/engine/index.ts`. Keep those function signatures.

You can run fully standalone: heuristics need no backend. C's Phase-0 background already answers `GET_CONTEXT` with default settings and no rules.

---

## Dev loop

```bash
cd extension && npm install && npm run dev        # rebuilds dist/ on save
# chrome://extensions → Developer mode → Load unpacked → extension/dist  (click ↻ after each rebuild)
python3 -m http.server 5500 -d extension/fixtures  # serve fixtures at http://localhost:5500
```

## B1 — Fixtures (first 20 min)

1. `fixtures/demo-store.html`: a static product page with **every** pattern, mirroring the landing demo (`web/src/components/LiveDemo.tsx`):
   - ember banner with a live countdown that resets
   - "37 people are looking at this right now" (jittering)
   - "Only 2 left in stock"
   - a pre-ticked "3-Year Protection Plan (+$29.99)"
   - price `$129.99` with "+ fees calculated at checkout"
   - text "Shipping $14.99" and "Service fee $9.99" somewhere lower (e.g. a delivery accordion)
   - "BUY NOW — before it's gone!" and "No thanks, I'd rather pay full price"
   - a "Sarah in Ohio just bought this" toast
   - a newsletter modal "Get 10% off — enter your email" on load
   - a collapsed spec accordion
   - a "You may also like" carousel
   - JSON-LD `Product`/`Offer` with price
2. `fixtures/real/` (gitignored): real DOM dumps from A, or capture them yourself with the headless Chrome `--dump-dom` command in A-SUPABASE.md §A4. Real sites often need the live page, so test the extension on the live URLs too.

## B2 — Snapshot + selectors (`engine/snapshot.ts`, `engine/selector.ts`)

- `uniqueSelector(el)`: try `#id` (if unique and not auto-generated like `:r1:`/long hashes), then `[data-testid=…]`/`[data-test]`/`[data-qa]`, then a tag+stable-class chain (drop classes matching `/^(css|sc|jsx|_)[-_]?[a-z0-9]{4,}$/i` or containing ≥3 digits), then `:nth-of-type` up to 5 ancestors. Verify `document.querySelector(sel) === el`.
- `snapshot(doc)` → `PageSnapshot`. Collect up to 250 nodes, prioritised:
  1. text-matching nodes (regexes in B3)
  2. checked checkboxes and their labels
  3. fixed/sticky overlays
  4. buttons/links with decline-ish text
  5. price nodes
  6. collapsed sections containing tables/dl
  7. headline elements (h1, product title)

  Set `flags` per the contract. Text: trim, collapse whitespace, ≤160 chars, redact emails/phone numbers. **Never read input values.**
- Prices: `parsePrice(text)` handles `$1,299.99`, `£`, `€`, `1.299,99 €`, `USD 12`. Headline price comes from JSON-LD `offers.price`, then `meta[itemprop=price]` / `[itemprop=price]`, then the largest-font price near the h1. `kind` comes from surrounding text: was/strikethrough → `was`; shipping/delivery → `shipping`; fee/service/booking/processing → `fee`; tax/VAT → `tax`; total → `total`.

## B3 — Heuristics (`engine/heuristics.ts`) → `detect(doc): Rule[]`

Produce `Rule`s with `confidence`. Apply only ≥ 0.6. Start with these regexes and tune on real sites:

| Pattern | Signal | Action |
|---|---|---|
| fake_urgency | text `/(ends?|ending|expires?|left|hurry|sale ends|offer ends|deal ends)[^]{0,40}\d{1,2}\s*[:h]\s*\d{2}/i`, or a node whose `mm:ss` text decreases between two samples 1.1s apart (strongest; confidence 0.95). Also "today only"/"limited time" banners containing a timer | `remove` the smallest container that holds the timer + its label (walk up while the parent text is <120 chars) |
| false_scarcity | `/only\s+\d+\s+(left|remaining|in stock)/i`, `/(selling fast|almost gone|low stock|high demand|last chance|\d+\s+(rooms?|seats?|tickets?)\s+left)/i` | `remove` |
| fake_social_proof | `/\d+\s+(people|others|shoppers|travell?ers|users)\s+(are\s+)?(viewing|looking|watching)/i`, `/(just|recently)\s+(bought|booked|purchased)/i`, `/booked\s+\d+\s+times\s+(today|in the last)/i` | `remove` |
| sneak_into_basket | `input[type=checkbox]:checked` (or `[aria-checked=true]`) whose label/nearby text matches `/(protect|warranty|insurance|cover|care|donat|tip|upgrade|priority|subscribe|newsletter|add\b)/i` | `uncheck`; `value_cents` = price parsed from the label |
| confirmshaming | button/link text `/^no,?\s*(thanks|thank you)?,?\s*i\s*('d| would)?\s*(rather|prefer|don'?t|do not|hate|like)/i` or `/i don'?t (want|like) (to save|deals|discounts)/i` | `rewrite_text` → "No thanks" |
| nagging_popup | element with `position: fixed`, `z-index ≥ 1000`, covering ≥30% of viewport, containing an email input or `/(\d+%\s*off|sign up|subscribe|newsletter|spin|unlock)/i` | `dismiss` (also hide sibling backdrops, restore `overflow` on html/body) |
| drip_pricing | headline price present and page text has `/(\+\s*)?(fees?|taxes|shipping)\s+(calculated|added|at checkout|extra|not included)/i`, or a `PriceHit` of kind fee/shipping | `annotate_total` on the headline price |
| buried_specs | a `table`/`dl`/list with ≥4 key:value rows, hidden or inside a collapsed `[aria-expanded=false]`/`details:not([open])` | `surface`, `modes: ["analytical"]` |

## B4 — Apply + undo (`engine/apply.ts`) → `apply(rules, settings, source): AppliedChange[]`

- Skip all rules if `settings.stripDarkPatterns === false` (still allow `annotate_total` if `showTrueTotal`).
- Skip rules whose `modes` doesn't include the current mode.
- For each matched element (cap 20 per rule), tag it with `data-aw-id` and push an undo closure onto a module-level stack. **Idempotent:** skip elements already tagged.
  - `remove`: add `.aw-hidden`. If `settings.showGhosts`, insert a ghost before it: `<div class="aw-ghost">✓ {PATTERN_LABEL} removed · {reason}</div>`. Clicking the ghost toggles the original back (peek).
  - `hide`: `.aw-hidden`, no ghost.
  - `uncheck`: if checked → `el.click()` (works with React/Vue controlled inputs); if still checked, set `.checked = false` and dispatch `input` + `change` events with `bubbles: true`. Add a small annotation "✓ Was pre-ticked — unticked for you".
  - `rewrite_text`: store the original `textContent`; replace the deepest text node; keep the element and its handlers.
  - `dismiss`: hide the overlay and any full-screen backdrop sibling; remove `overflow:hidden` on html/body; also try clicking a close button inside (`[aria-label*=close i]`, `.close`, `button:has(svg)` top-right).
  - `annotate_total`: delegate to the true-total module (B5).
  - `surface`: clone into the AdaptWeb panel (B6) in analytical mode; also expand originals (`details.open = true`, click `[aria-expanded=false]` toggles).
- Return `AppliedChange[]` with a stable `id` (`${pattern}:${selector}`), `reason`, `source`, `value_cents`.
- `undoAll()`: pop and run every undo closure, remove ghosts and panels, clear tags.
- **SPA resilience:** in `content/index.ts`, run a `MutationObserver` on `document.body` (subtree, childList, characterData), debounce 400ms, then re-run `detect` + re-apply the current rules (idempotency makes this safe). Re-run on `popstate` and when `location.pathname` changes (poll every 1s; history API patches are unreliable from an isolated world).

## B5 — True total (`engine/price.ts`, `engine/truetotal.ts`) → `computeTrueTotal`

- Item = headline price.
- Shipping: rule `extras.shipping_value`, then JSON-LD `shippingDetails.shippingRate.value`, then page text `/(shipping|delivery)[^$£€\d]{0,30}([$£€]\s?\d[\d.,]*)/i` (ignore "free shipping over $X" when the item ≥ X → shipping 0; label "Free shipping (over $X)").
- Fees: rule `extras.fee_values`, then page text `/(service|booking|processing|convenience|facility|handling)\s+fee[^$£€\d]{0,20}([$£€]\s?\d[\d.,]*)/i`.
- Tax: only if `extras.tax_rate` is set → origin `estimate`, label "Est. tax".
- **If there are no extra parts, return `null`.** Never show a "true total" equal to a guess.
- Render a card **inside a Shadow DOM host** inserted after the headline price element. It uses brand styles: Cream background, 2px Ink border, 16px radius, "TRUE TOTAL" mono label in Forest, big total, parts list with origin tags. All injected UI lives in shadow roots so page CSS can't break it.

## B6 — Reading modes (`engine/modes.ts`) → `applyMode(mode)`

Relayouting arbitrary sites is fragile. Use a **floating AdaptWeb panel** (Shadow DOM, fixed right side, 340px, collapsible to a pill) plus **mode-scoped rules**:

- Product data: JSON-LD `Product` (name, image, brand, offers, `additionalProperty`), falling back to `og:title`/`og:image`/h1/largest image. Specs come from surfaced tables/dl.
- **Analytical** (Forest accent): title, true-total breakdown, full spec table (from `surface` rules or detected tables), unit price if size/qty is parseable (e.g. `6 qt` → $/qt), list of changes made.
- **Minimalist** (Cream/Ink): title, one image, true total, 3 key facts, a "Go to add to cart" button that scrolls to and focuses the page's real add-to-cart button. Apply `clutter` rules with `modes:["minimalist"]`, and dim (opacity .25) any `aside`, recommendation sections (`/(you may also like|recommended|customers also|sponsored)/i` headings) when no rules exist.
- **Visual** (Amber accent): large hero image, 3 icon fact tiles with big numbers, true total.
- Only show the panel on pages that look like a product/booking page (headline price + h1, or JSON-LD Product/Offer). Elsewhere, apply stripping only.
- Switching mode = remove panel + undo mode-scoped rules + re-apply for the new mode. Must be instant.

## B7 — Orchestrator (`content/index.ts`)

Extend the Phase-0 orchestrator:
1. `GET_CONTEXT` → settings + ruleSets.
2. Apply heuristics immediately (fast first paint).
3. Apply ruleSets (curated before ai).
4. If no ruleSets **and** the page looks like product/checkout **and** this path hasn't been analyzed this session, set `analyzing: true`, report, send `ANALYZE` with `snapshot(document)` → apply the returned `ruleSet.rules` → report.
5. `computeTrueTotal` → render card; `applyMode`.
6. `REPORT` after every change (debounced 250ms).
7. Handle `ToContent`: `GET_STATE`, `UNDO_ALL`, `REAPPLY`, `SETTINGS_CHANGED`, `RULES_UPDATED`, `HIGHLIGHT` (scroll the ghost/element into view and flash a 2px lime outline for 1.2s).

## B8 — Real-site tuning (H3+)

On each demo URL from `status/A.md`: run heuristics only (no rules), note false positives and negatives, and tune the regexes and the container walk-up. Hard rule: **never hide the product title, price, images or add-to-cart.** Keep a blocklist check in `apply` that refuses elements containing the h1 or the primary buy button.

## Definition of done

- [ ] `demo-store.html` fully stripped by heuristics alone; ghosts + undo work
- [ ] Snapshot ≤250 nodes, no input values, unique selectors verified
- [ ] True total correct on demo store ($165.37 with tax_rate .08 via rule extras, or $154.97 without tax); null when no extras
- [ ] 3 modes switch instantly, panel looks on-brand
- [ ] ANALYZE path works against A's function (through C)
- [ ] SPA re-render safe (test on one React-heavy real site)
- [ ] Zero false positives on the product title/price/buy button across all 5 demo URLs
