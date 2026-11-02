# Contracts changelog

Additive changes only. Commit contract changes alone (`contracts: ...`) and re-copy `types.ts` into:
- `supabase/functions/_shared/contracts.ts`
- `web/src/lib/contracts.ts`

## v1 — 2026-11-02
- Initial freeze: patterns, rule actions, snapshot, page state, settings, messages, edge function I/O, DB rows, dashboard RPCs.
- Added `clutter` pattern and optional `Rule.modes` (mode-scoped rules). Added `seed_my_demo_events(n)` RPC + realtime on adaptation_events.
