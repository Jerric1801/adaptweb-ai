/**
 * C3 — Event queue: diff changes → EventInsert[], flush via Supabase.
 */
import { supabase } from "../lib/supabase";
import {
  STORAGE_KEYS,
  type AppliedChange,
  type EventInsert,
  type PageState,
} from "../shared/contracts";

const FLUSH_ALARM = "aw:flush-events";
const QUEUE_FLUSH_SIZE = 10;
const FLUSH_DELAY_SECS = 5;

/** Track last reported change ids per tab+url to avoid duplicate events. */
const lastReported = new Map<string, Set<string>>();

export function diffChanges(tabId: number, state: PageState): EventInsert[] {
  const key = `${tabId}:${state.url}`;
  const seen = lastReported.get(key) ?? new Set<string>();
  const newChanges = state.changes.filter((c) => !seen.has(c.id));

  if (newChanges.length === 0) return [];

  // Update seen set
  newChanges.forEach((c) => seen.add(c.id));
  lastReported.set(key, seen);

  return newChanges.map((c: AppliedChange): EventInsert => ({
    domain: state.domain,
    pattern: c.pattern,
    action: c.action,
    value_cents:
      state.trueTotal && c.pattern === "drip_pricing"
        ? Math.round(state.trueTotal.hiddenDelta * 100)
        : null,
  }));
}

export async function enqueueEvents(events: EventInsert[]): Promise<void> {
  if (events.length === 0) return;
  try {
    const stored = await chrome.storage.local.get(STORAGE_KEYS.pendingEvents);
    const queue: EventInsert[] = stored[STORAGE_KEYS.pendingEvents] ?? [];
    queue.push(...events);
    await chrome.storage.local.set({ [STORAGE_KEYS.pendingEvents]: queue });

    if (queue.length >= QUEUE_FLUSH_SIZE) {
      await flushEvents();
    } else {
      // Reset debounce alarm
      chrome.alarms.clear(FLUSH_ALARM, () => {
        chrome.alarms.create(FLUSH_ALARM, { delayInMinutes: FLUSH_DELAY_SECS / 60 });
      });
    }
  } catch (e) {
    console.warn("[AdaptWeb] enqueueEvents error:", e);
  }
}

export async function flushEvents(): Promise<void> {
  try {
    const stored = await chrome.storage.local.get(STORAGE_KEYS.pendingEvents);
    const queue: EventInsert[] = stored[STORAGE_KEYS.pendingEvents] ?? [];
    if (queue.length === 0) return;

    const { error } = await supabase.from("adaptation_events").insert(queue);
    if (error) {
      console.warn("[AdaptWeb] flushEvents insert error:", error.message);
      return; // Keep queue on failure
    }
    await chrome.storage.local.set({ [STORAGE_KEYS.pendingEvents]: [] });
  } catch (e) {
    console.warn("[AdaptWeb] flushEvents error:", e);
  }
}

export function clearTabEvents(tabId: number, url?: string): void {
  const prefix = `${tabId}:`;
  for (const key of lastReported.keys()) {
    if (url ? key === `${tabId}:${url}` : key.startsWith(prefix)) {
      lastReported.delete(key);
    }
  }
}
