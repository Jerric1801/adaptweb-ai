/**
 * IN-PAGE ENGINE — Workstream B owns everything in src/engine and src/content.
 *
 * Public API (frozen; C never calls this directly, only content/index.ts does):
 *   snapshot(doc)                    → PageSnapshot (redacted)
 *   detect(doc)                      → Rule[]  (local heuristics, no network)
 *   apply(rules, settings, source)   → AppliedChange[]  (idempotent)
 *   computeTrueTotal(doc, rules)     → TrueTotal | null
 *   applyMode(mode)                  → void  (relayout for reading mode)
 *   undoAll()                        → void  (restore original page)
 *
 * Phase-0 stubs below return empty results so the pipeline runs end to end.
 */
import type {
  AppliedChange,
  PageSnapshot,
  ReadingMode,
  Rule,
  RuleSource,
  Settings,
  TrueTotal,
} from "../shared/contracts";

export function snapshot(doc: Document): PageSnapshot {
  return {
    url: location.origin + location.pathname,
    domain: location.hostname.replace(/^www\./, ""),
    path: location.pathname,
    title: doc.title.slice(0, 160),
    lang: doc.documentElement.lang || "en",
    nodes: [],
    prices: [],
  };
}

export function detect(_doc: Document): Rule[] {
  return []; // TODO(B): heuristics
}

export function apply(_rules: Rule[], _settings: Settings, _source: RuleSource): AppliedChange[] {
  return []; // TODO(B): rule applier
}

export function computeTrueTotal(_doc: Document, _rules: Rule[]): TrueTotal | null {
  return null; // TODO(B): drip pricing parser
}

export function applyMode(_mode: ReadingMode): void {
  // TODO(B): reading modes
}

export function undoAll(): void {
  // TODO(B): restore
}
