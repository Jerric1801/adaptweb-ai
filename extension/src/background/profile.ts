/**
 * C4 — Profile sync: user_profiles → settings + Realtime subscription.
 */
import { supabase } from "../lib/supabase";
import {
  DEFAULT_SETTINGS,
  STORAGE_KEYS,
  type ReadingMode,
  type Settings,
  type UserProfile,
} from "../shared/contracts";

let lastProfileFetch = 0;
const PROFILE_TTL_MS = 60_000;
let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;

async function getSettings(): Promise<Settings> {
  const got = await chrome.storage.sync.get(STORAGE_KEYS.settings);
  return { ...DEFAULT_SETTINGS, ...(got[STORAGE_KEYS.settings] ?? {}) };
}

function mergeProfileIntoSettings(
  profile: UserProfile,
  current: Settings
): Settings {
  return {
    ...current,
    mode: profile.reading_mode as ReadingMode,
    stripDarkPatterns: profile.strip_dark_patterns,
    showTrueTotal: profile.show_true_total,
  };
}

async function broadcastSettingsToTabs(settings: Settings): Promise<void> {
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id == null) continue;
      chrome.tabs
        .sendMessage(tab.id, { type: "SETTINGS_CHANGED", settings })
        .catch(() => {}); // tab may not have content script
    }
  } catch {}
}

export async function syncProfile(force = false): Promise<void> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    if (!session) return;

    // Skip if anon user (no email/profile)
    const isAnon =
      !session.user.email &&
      session.user.app_metadata?.provider === "anonymous";
    if (isAnon) return;

    if (!force && Date.now() - lastProfileFetch < PROFILE_TTL_MS) return;

    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (error || !data) return;

    lastProfileFetch = Date.now();
    const profile = data as UserProfile;
    const current = await getSettings();
    const merged = mergeProfileIntoSettings(profile, current);
    await chrome.storage.sync.set({ [STORAGE_KEYS.settings]: merged });
  } catch (e) {
    console.warn("[AdaptWeb] syncProfile error:", e);
  }
}

export function subscribeProfile(): void {
  // Re-subscribe (cleanup old first)
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }

  (async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session) return;

      const userId = session.user.id;

      realtimeChannel = supabase
        .channel(`profile:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "user_profiles",
            filter: `id=eq.${userId}`,
          },
          async (payload) => {
            try {
              const profile = payload.new as UserProfile;
              const current = await getSettings();
              const merged = mergeProfileIntoSettings(profile, current);
              await chrome.storage.sync.set({ [STORAGE_KEYS.settings]: merged });
              await broadcastSettingsToTabs(merged);
            } catch {}
          }
        )
        .subscribe();
    } catch (e) {
      console.warn("[AdaptWeb] subscribeProfile error:", e);
    }
  })();
}

/** Called when chrome.storage.onChanged fires for the settings key */
export async function onSettingsChanged(settings: Settings): Promise<void> {
  await broadcastSettingsToTabs(settings);
}
