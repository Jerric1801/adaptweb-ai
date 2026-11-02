/**
 * CONTENT SCRIPT ORCHESTRATOR — Workstream B.
 * Talks to background ONLY via the messages in contracts (ContentToBackground / ToContent).
 */
import * as engine from "../engine";
import type {
  ContentToBackground,
  ContextResponse,
  PageState,
  ToContent,
} from "../shared/contracts";

const send = <T>(msg: ContentToBackground) => chrome.runtime.sendMessage(msg) as Promise<T>;

let state: PageState = {
  url: location.origin + location.pathname,
  domain: location.hostname.replace(/^www\./, ""),
  enabled: true,
  mode: "analytical",
  ruleSource: "none",
  changes: [],
  trueTotal: null,
  analyzing: false,
};

async function run() {
  const ctx = await send<ContextResponse>({
    type: "GET_CONTEXT",
    domain: state.domain,
    path: location.pathname,
  }).catch(() => null);
  if (!ctx) return;

  state.enabled = ctx.settings.enabled && !ctx.settings.disabledDomains.includes(state.domain);
  state.mode = ctx.settings.mode;
  if (!state.enabled) return report();

  const heuristics = engine.detect(document);
  state.changes = engine.apply(heuristics, ctx.settings, "heuristic");
  for (const set of ctx.ruleSets) {
    state.changes.push(...engine.apply(set.rules, ctx.settings, set.source));
    state.ruleSource = set.source;
  }
  state.trueTotal = ctx.settings.showTrueTotal
    ? engine.computeTrueTotal(document, ctx.ruleSets.flatMap((s) => s.rules))
    : null;
  engine.applyMode(state.mode);
  report();
}

function report() {
  void send({ type: "REPORT", state }).catch(() => {});
}

chrome.runtime.onMessage.addListener((msg: ToContent, _sender, reply) => {
  switch (msg.type) {
    case "GET_STATE":
      reply(state);
      return;
    case "UNDO_ALL":
      engine.undoAll();
      state = { ...state, enabled: false, changes: [] };
      report();
      return;
    case "REAPPLY":
    case "SETTINGS_CHANGED":
    case "RULES_UPDATED":
      engine.undoAll();
      void run();
      return;
  }
});

void run();
