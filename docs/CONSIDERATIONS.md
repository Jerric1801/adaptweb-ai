# Considerations & Risks

## Demo risk (real sites only)

- **Sites change without notice.** Pre-warm `site_rules` for every demo URL the night before; re-run the morning of.
- **Record a backup video** of the full flow. Switch to it the moment anything stalls.
- **Network at the venue.** Cache rules in `chrome.storage` so the demo works offline after first load.
- **Geo / A-B tests.** Same URL can render differently; use the same browser profile and region as rehearsal.
- **Bot walls / CAPTCHAs.** Log in / warm cookies ahead of time.

## Honesty & legal

- Never inject invented prices, discounts or claims. Only remove, uncheck, reveal, or relabel with facts we can show.
- Don't publicly name a brand as "using dark patterns" unless verified on the live page — keep the landing page to categories.
- Client-side page modification for the user's own view is well-established (ad blockers, reader modes). Avoid touching checkout submission logic.
- "True total" must label estimates (e.g. tax) as estimates.

## Privacy & security

- Content scripts adapt pages **locally**. Only send a redacted structural snapshot to the AI Edge Function — never form values, emails, addresses or full page text.
- Store domains, not URLs with query strings, in `adaptation_events`.
- The Supabase **publishable key** is client-safe and lives in `netlify.toml`. The **DB password and secret/service keys must never be committed** — use Supabase dashboard / Edge Function secrets.
- The DB password was shared in chat during setup — **rotate it** in Supabase → Settings → Database before going public.
- RLS on every table; the waitlist is insert-only for `anon`.

## AI rule quality

- Validate AI-returned selectors against the snapshot before storing; drop any that match nothing or match `body`/`main`.
- Confidence threshold for auto-apply; low-confidence rules apply as "hide with ghost" so users see and can undo.
- Curated rules always override AI rules for the same domain/path.
- Rate-limit the Edge Function per user; cache aggressively (per domain + path template).

## Chrome Web Store

- Request minimal permissions: `storage`, `activeTab`, host permissions scoped (or optional host permissions). No `debugger`, no `nativeMessaging`.
- Single-purpose description and a clear privacy policy are needed for review.
- Ship the `.zip` fallback in parallel.

## Performance

- Run heuristics after `DOMContentLoaded` and on a debounced `MutationObserver` — SPAs re-render prices and timers.
- Apply CSS-based hides first (instant), heavier relayouts second.

## Brand assets

- `docs/brand/sample-deck.pdf` is a third-party confidential brand guide used only as a structural reference — gitignored, never redistribute.
- `docs/brand/vibe/` moodboard images are third-party — gitignored, reference only.
