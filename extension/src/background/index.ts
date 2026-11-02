/**
 * SERVICE WORKER — Workstream C owns src/background, src/popup, src/lib, static/ (except content.css).
 * Phase-0 stub: answers GET_CONTEXT with local settings and no rules.
 */
import {
  DEFAULT_SETTINGS,
  STORAGE_KEYS,
  type ContentToBackground,
  type ContextResponse,
  type PageState,
  type Settings,
} from "../shared/contracts";

const tabState = new Map<number, PageState>();

async function getSettings(): Promise<Settings> {
  const got = await chrome.storage.sync.get(STORAGE_KEYS.settings);
  return { ...DEFAULT_SETTINGS, ...(got[STORAGE_KEYS.settings] ?? {}) };
}

chrome.runtime.onMessage.addListener((msg: ContentToBackground, sender, reply) => {
  (async () => {
    switch (msg.type) {
      case "GET_CONTEXT": {
        const res: ContextResponse = { settings: await getSettings(), ruleSets: [] }; // TODO(C): Supabase rules
        reply(res);
        break;
      }
      case "ANALYZE":
        reply({ ruleSet: null, cached: false, error: "not implemented" }); // TODO(C): edge function
        break;
      case "REPORT":
        if (sender.tab?.id != null) tabState.set(sender.tab.id, msg.state);
        // TODO(C): badge count + queue events
        reply(true);
        break;
    }
  })();
  return true; // async reply
});
