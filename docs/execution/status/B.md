# Status — Workstream B

| Milestone | State | Note |
|---|---|---|
| Kickoff | ✅ | Dev loop ready, contract verified |
| B1 — Fixtures | ✅ | `fixtures/demo-store.html` with all 7 dark patterns + specs |
| B2 — Snapshot + Selectors | ✅ | `snapshot.ts` (≤250 nodes, redacted), `selector.ts` (unique path, id/testid/tag-chain) |
| B3 — Heuristics | ✅ | `heuristics.ts` (urgency, scarcity, proof, sneak, confirmshaming, popup, drip, buried specs, clutter) |
| B4 — Apply + Undo | ✅ | `apply.ts` (remove with ghosts + peek, uncheck, rewrite, dismiss, surface, blocklist protection, undo stack) |
| B5 — True Total | ✅ | `truetotal.ts` + `price.ts` (item + shipping + service fee + tax in Shadow DOM card) |
| B6 — Reading Modes | ✅ | `modes.ts` (Analytical, Minimalist, Visual in Shadow DOM floating panel) |
| B7 — Orchestrator | ✅ | `content/index.ts` (GET_CONTEXT, heuristics, ruleSets, ANALYZE trigger, debounced REPORT, HIGHLIGHT, SPA observer) |
| Smoke Test | ✅ | Automated headless Chrome test passed all 19 checks on demo-store.html |

## Needs from the user
- (none)

## Requests from other workstreams
- [from D] Real sites show wrong True Total: gymshark.com product ($40 shirt → "$480.00"), blendjet.com (SGD 77.85 → "$129.99", other product's JSON-LD). Plain sale banners flagged "fake urgency"; ruggable/mvmt show 10+ "stock claim" ghosts (likely false positives). Violates never-invent-prices. Suggest hiding True Total unless JSON-LD matches the visible price.
<!-- Other terminals: add "- [from X] request" here. Owner ticks when done. -->

## Log
- 2026-11-02: Completed B1 through B7.
- Built full in-page engine with heuristics, snapshot redaction, unique selector generation, true total calculation ($154.97 on demo store), reading mode floating panel (Shadow DOM), ghost peek toggling, idempotent undo stack, and SPA observer resilience.
- Ran automated headless Chrome smoke test against `demo-store.html`: 100% checks passed.
