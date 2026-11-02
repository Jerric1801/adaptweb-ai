/**
 * IN-PAGE ENGINE — Workstream B.
 *
 * Public API (frozen contract with content/index.ts):
 *   snapshot(doc)                    → PageSnapshot (redacted)
 *   detect(doc)                      → Rule[]  (local heuristics, no network)
 *   apply(rules, settings, source)   → AppliedChange[]  (idempotent)
 *   computeTrueTotal(doc, rules)     → TrueTotal | null
 *   applyMode(mode)                  → void  (relayout for reading mode)
 *   undoAll()                        → void  (restore original page)
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
import { apply as applyRules, undoAll as undoAllChanges } from "./apply";
import { detect as detectDarkPatterns } from "./heuristics";
import { applyMode as applyReadingMode, clearReadingMode, setModeContext } from "./modes";
import { computeTrueTotal as computeTT, renderTrueTotalCard } from "./truetotal";
import { snapshot as generateSnapshot } from "./snapshot";

export function snapshot(doc: Document = document): PageSnapshot {
  return generateSnapshot(doc);
}

export function detect(doc: Document = document): Rule[] {
  return detectDarkPatterns(doc);
}

export function apply(
  rules: Rule[],
  settings: Settings,
  source: RuleSource,
  doc: Document = document,
): AppliedChange[] {
  return applyRules(rules, settings, source, doc);
}

export function computeTrueTotal(doc: Document = document, rules: Rule[] = []): TrueTotal | null {
  const result = computeTT(doc, rules);
  renderTrueTotalCard(doc, result);
  return result;
}

export function applyMode(mode: ReadingMode, doc: Document = document): void {
  applyReadingMode(mode, doc);
}

export function undoAll(doc: Document = document): void {
  undoAllChanges(doc);
  clearReadingMode(doc);
}

export { setModeContext } from "./modes";
export { renderTrueTotalCard } from "./truetotal";
export { uniqueSelector } from "./selector";
export { parsePrice, findHeadlinePrice } from "./price";
