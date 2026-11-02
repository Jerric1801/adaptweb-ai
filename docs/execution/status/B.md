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
<!-- Other terminals: add "- [from X] request" here. Owner ticks when done. -->

## Log
- 2026-11-02: Completed B1 through B7.
- Built full in-page engine with heuristics, snapshot redaction, unique selector generation, true total calculation ($154.97 on demo store), reading mode floating panel (Shadow DOM), ghost peek toggling, idempotent undo stack, and SPA observer resilience.
- Ran automated headless Chrome smoke test against `demo-store.html`: 100% checks passed.
