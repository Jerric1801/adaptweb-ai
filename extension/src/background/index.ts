/**
 * SERVICE WORKER — AdaptWeb AI (Workstream C)
 * Wires C1-C4 modules and handles all extension messages.
 */
import { ensureSession } from "../lib/supabase";
import { handleGetContext, handleAnalyze } from "./rules";
import { getTabState, setTabState, removeTabState, initStateListeners } from "./state";
import { diffChanges, enqueueEvents, flushEvents, clearTabEvents } from "./events";
import { syncProfile, subscribeProfile, onSettingsChanged } from "./profile";
import {
  DEFAULT_SETTINGS,
  STORAGE_KEYS,
  type ContentToBackground,
  type PageState,
  type Settings,
  type ToContent,
} from "../shared/contracts";

// ── Boot ────────────────────────────────────────────────────────────

async function boot() {
  await ensureSession();
  await syncProfile(true);
  subscribeProfile();
  initStateListeners();
}

chrome.runtime.onInstalled.addListener(() => {
  boot();
});

// Re-boot on SW wake (alarms or messages will trigger this)
boot();

// ── Alarms ──────────────────────────────────────────────────────────

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "aw:flush-events") {
    flushEvents();
  }
});

// ── Storage change → broadcast settings ─────────────────────────────

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes[STORAGE_KEYS.settings]) {
    const settings: Settings = {
      ...DEFAULT_SETTINGS,
      ...(changes[STORAGE_KEYS.settings].newValue ?? {}),
    };
    onSettingsChanged(settings);
  }
});

// ── Message handler ──────────────────────────────────────────────────

chrome.runtime.onMessage.addListener(
  (msg: ContentToBackground | { type: "GET_STATE" }, sender, reply) => {
    (async () => {
      switch (msg.type) {
        case "GET_CONTEXT": {
          // Refresh profile if stale (force=false uses TTL check)
          syncProfile(false);
          const res = await handleGetContext(msg.domain, msg.path);
          reply(res);
          break;
        }

        case "ANALYZE": {
          const res = await handleAnalyze(msg.snapshot);
          reply(res);
          break;
        }

        case "REPORT": {
          const tabId = sender.tab?.id;
          if (tabId != null) {
            const state: PageState = msg.state;
            const events = diffChanges(tabId, state);
            await setTabState(tabId, state);
            await enqueueEvents(events);
          }
          reply(true);
          break;
        }

        case "GET_STATE": {
          const tabId = sender.tab?.id;
          if (tabId != null) {
            const state = getTabState(tabId);
            reply(state ?? null);
          } else {
            reply(null);
          }
          break;
        }

        default:
          reply(null);
      }
    })();
    return true; // async reply
  }
);
