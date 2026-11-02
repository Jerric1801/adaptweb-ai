/**
 * C3 — Tab state management + badge updates.
 */
import { STORAGE_KEYS, type PageState } from "../shared/contracts";

const BADGE_BG_LIME = "#B8F28F";
const BADGE_TEXT = "#121412";

const tabState = new Map<number, PageState>();

async function persistTabState(tabId: number, state: PageState): Promise<void> {
  try {
    const key = `${STORAGE_KEYS.session}:tab:${tabId}`;
    await chrome.storage.session.set({ [key]: state });
  } catch {}
}

async function clearPersistedTabState(tabId: number): Promise<void> {
  try {
    const key = `${STORAGE_KEYS.session}:tab:${tabId}`;
    await chrome.storage.session.remove(key);
  } catch {}
}

export function getTabState(tabId: number): PageState | undefined {
  return tabState.get(tabId);
}

export async function setTabState(tabId: number, state: PageState): Promise<void> {
  tabState.set(tabId, state);
  await persistTabState(tabId, state);
  updateBadge(tabId, state);
}

export async function removeTabState(tabId: number): Promise<void> {
  tabState.delete(tabId);
  await clearPersistedTabState(tabId);
  try {
    await chrome.action.setBadgeText({ text: "", tabId });
  } catch {}
}

function updateBadge(tabId: number, state: PageState): void {
  try {
    if (!state.enabled) {
      chrome.action.setBadgeText({ text: "", tabId });
      return;
    }
    if (state.analyzing) {
      chrome.action.setBadgeBackgroundColor({ color: BADGE_BG_LIME, tabId });
      chrome.action.setBadgeTextColor({ color: BADGE_TEXT, tabId });
      chrome.action.setBadgeText({ text: "…", tabId });
      return;
    }
    const count = state.changes.length;
    if (count > 0) {
      chrome.action.setBadgeBackgroundColor({ color: BADGE_BG_LIME, tabId });
      chrome.action.setBadgeTextColor({ color: BADGE_TEXT, tabId });
      chrome.action.setBadgeText({ text: String(count), tabId });
    } else {
      chrome.action.setBadgeText({ text: "", tabId });
    }
  } catch {}
}

export function initStateListeners(): void {
  chrome.tabs.onRemoved.addListener((tabId) => {
    removeTabState(tabId);
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === "loading") {
      removeTabState(tabId);
    }
  });
}
