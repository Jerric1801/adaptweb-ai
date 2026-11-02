/**
 * CONTENT SCRIPT ORCHESTRATOR — Workstream B.
 * Talks to background ONLY via the messages in contracts (ContentToBackground / ToContent).
 */
import * as engine from "../engine";
import {
  type AnalyzeResponse,
  type ContentToBackground,
  type ContextResponse,
  DEFAULT_SETTINGS,
  type PageState,
  type ReadingMode,
  type Rule,
  type Settings,
  type SiteRuleSet,
  type ToContent,
} from "../shared/contracts";

const send = <T>(msg: ContentToBackground) =>
  typeof chrome !== "undefined" && chrome.runtime?.sendMessage
    ? (chrome.runtime.sendMessage(msg) as Promise<T>)
    : Promise.reject(new Error("No chrome runtime"));

let currentSettings: Settings | null = null;
let currentRuleSets: SiteRuleSet[] = [];
const analyzedPaths = new Set<string>();

let state: PageState = {
  url: typeof location !== "undefined" ? location.origin + location.pathname : "",
  domain: typeof location !== "undefined" ? location.hostname.replace(/^www\./, "") : "",
  enabled: true,
  mode: "analytical",
  ruleSource: "none",
  changes: [],
  trueTotal: null,
  analyzing: false,
};

let reportTimer: ReturnType<typeof setTimeout> | null = null;
function debouncedReport() {
  if (reportTimer) clearTimeout(reportTimer);
  reportTimer = setTimeout(() => {
    void send({ type: "REPORT", state }).catch(() => {});
  }, 250);
}

function isProductOrCheckoutPage(): boolean {
  if (typeof document === "undefined") return false;
  const hasPrice = !!(
    document.querySelector("#headline-price, [itemprop='price'], h1 ~ * .price") ||
    document.querySelector("script[type='application/ld+json']")
  );
  const path = typeof location !== "undefined" ? location.pathname : "";
  const isMatch = hasPrice || /\/(product|item|dp|p|cart|checkout)\b/i.test(path);
  return isMatch;
}

async function run(providedSettings?: Settings) {
  state.url = location.origin + location.pathname;
  state.domain = location.hostname.replace(/^www\./, "");

  const ctx = await send<ContextResponse>({
    type: "GET_CONTEXT",
    domain: state.domain,
    path: location.pathname,
  }).catch(() => null);

  const settings = providedSettings || ctx?.settings || DEFAULT_SETTINGS;
  if (!settings) return;

  currentSettings = settings;
  currentRuleSets = ctx?.ruleSets || [];

  state.enabled = settings.enabled && !settings.disabledDomains.includes(state.domain);
  state.mode = settings.mode;

  if (!state.enabled) {
    state.changes = [];
    state.trueTotal = null;
    debouncedReport();
    return;
  }

  // 1. Fast first paint: Apply heuristics immediately
  const heuristics = engine.detect(document);
  state.changes = engine.apply(heuristics, settings, "heuristic");
  state.ruleSource = heuristics.length > 0 ? "heuristic" : "none";

  // 2. Apply existing ruleSets (curated before ai)
  const sortedRuleSets = [...currentRuleSets].sort((a, b) => {
    if (a.source === "curated") return -1;
    if (b.source === "curated") return 1;
    return 0;
  });

  for (const set of sortedRuleSets) {
    const changes = engine.apply(set.rules, settings, set.source);
    state.changes.push(...changes);
    if (changes.length > 0) {
      state.ruleSource = set.source;
    }
  }

  // 3. True Total
  const allRules: Rule[] = [
    ...heuristics,
    ...sortedRuleSets.flatMap((s) => s.rules),
  ];

  if (settings.showTrueTotal) {
    state.trueTotal = engine.computeTrueTotal(document, allRules);
  } else {
    state.trueTotal = null;
    engine.renderTrueTotalCard(document, null);
  }

  engine.setModeContext(state.trueTotal, state.changes);
  engine.applyMode(state.mode);
  debouncedReport();

  // 4. Trigger ANALYZE if needed: no ruleSets, product/checkout page, not analyzed this session
  const currentPath = location.pathname;
  if (
    currentRuleSets.length === 0 &&
    isProductOrCheckoutPage() &&
    !analyzedPaths.has(currentPath)
  ) {
    analyzedPaths.add(currentPath);
    state.analyzing = true;
    debouncedReport();

    const snapshot = engine.snapshot(document);
    const analyzeRes = await send<AnalyzeResponse>({
      type: "ANALYZE",
      snapshot,
    }).catch(() => null);

    state.analyzing = false;

    if (analyzeRes?.ruleSet?.rules && analyzeRes.ruleSet.rules.length > 0) {
      const aiRules = analyzeRes.ruleSet.rules;
      const aiChanges = engine.apply(aiRules, settings, analyzeRes.ruleSet.source || "ai");
      state.changes.push(...aiChanges);
      if (aiChanges.length > 0) {
        state.ruleSource = analyzeRes.ruleSet.source || "ai";
      }

      // Re-compute True Total if rules changed
      if (settings.showTrueTotal) {
        state.trueTotal = engine.computeTrueTotal(document, [...allRules, ...aiRules]);
      }
      engine.setModeContext(state.trueTotal, state.changes);
      engine.applyMode(state.mode);
    }

    debouncedReport();
  }
}

function recheckAndReapply() {
  if (!state.enabled || !currentSettings) return;

  const heuristics = engine.detect(document);
  const newChanges = engine.apply(heuristics, currentSettings, "heuristic");
  if (newChanges.length > 0) {
    state.changes.push(...newChanges);
  }

  for (const set of currentRuleSets) {
    const changes = engine.apply(set.rules, currentSettings, set.source);
    if (changes.length > 0) {
      state.changes.push(...changes);
    }
  }

  if (newChanges.length > 0) {
    engine.setModeContext(state.trueTotal, state.changes);
    debouncedReport();
  }
}

// SPA resilience: MutationObserver on document.body (debounced 400ms)
let mutationDebounceTimer: ReturnType<typeof setTimeout> | null = null;
const observer = new MutationObserver((mutations) => {
  const isOurMutation = mutations.every((m) => {
    const t = m.target as HTMLElement;
    return (
      t?.tagName?.toLowerCase()?.startsWith("adaptweb-") ||
      t?.classList?.contains("aw-ghost") ||
      t?.classList?.contains("aw-uncheck-note") ||
      t?.hasAttribute?.("data-aw-id")
    );
  });
  if (isOurMutation) return;

  if (mutationDebounceTimer) clearTimeout(mutationDebounceTimer);
  mutationDebounceTimer = setTimeout(() => {
    recheckAndReapply();
  }, 400);
});

function initObserver() {
  if (document.body) {
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      observer.observe(document.body, { subtree: true, childList: true, characterData: true });
    });
  }
}
initObserver();

// Path polling for SPA navigation
let lastPath = typeof location !== "undefined" ? location.pathname : "";
setInterval(() => {
  if (location.pathname !== lastPath) {
    lastPath = location.pathname;
    engine.undoAll();
    void run();
  }
}, 1000);

window.addEventListener("popstate", () => {
  if (location.pathname !== lastPath) {
    lastPath = location.pathname;
    engine.undoAll();
    void run();
  }
});

// Runtime messages
if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((msg: ToContent, _sender, reply) => {
    switch (msg.type) {
      case "GET_STATE":
        reply(state);
        return;

      case "UNDO_ALL":
        engine.undoAll();
        state = { ...state, enabled: false, changes: [], trueTotal: null };
        debouncedReport();
        return;

      case "REAPPLY":
        engine.undoAll();
        void run();
        return;

      case "SETTINGS_CHANGED":
        state.mode = msg.settings.mode;
        engine.undoAll();
        void run(msg.settings);
        return;

      case "RULES_UPDATED":
        currentRuleSets = msg.ruleSets;
        engine.undoAll();
        void run();
        return;

      case "HIGHLIGHT": {
        const change = state.changes.find((c) => c.id === msg.changeId);
        const sel = change ? change.selector : msg.changeId;
        let target: Element | null = null;

        try {
          target = document.querySelector(`[data-aw-id*="${CSS.escape(msg.changeId)}"]`);
        } catch {
          // ignore
        }

        if (!target && sel) {
          try {
            target = document.querySelector(sel);
          } catch {
            // ignore
          }
        }

        if (target && target.classList.contains("aw-hidden")) {
          const prev = target.previousElementSibling;
          if (prev && prev.classList.contains("aw-ghost")) {
            target = prev;
          }
        }

        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "center" });
          const el = target as HTMLElement;
          el.classList.add("aw-highlight");
          setTimeout(() => {
            el.classList.remove("aw-highlight");
          }, 1200);
        }
        return;
      }
    }
  });
}

// Expose state and engine for testability / dev
if (typeof window !== "undefined") {
  (window as any).__ADAPTWEB__ = {
    getState: () => state,
    engine,
    run,
  };
}

void run();
