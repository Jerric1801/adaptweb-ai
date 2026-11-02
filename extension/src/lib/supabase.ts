/**
 * Supabase client for the extension service worker (C1).
 * Uses chrome.storage.local for session persistence — no localStorage in SW.
 */
declare const __SUPABASE_URL__: string;
declare const __SUPABASE_KEY__: string;

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { STORAGE_KEYS } from "../shared/contracts";

// Service workers have no localStorage; provide a chrome.storage.local adapter.
const chromeStorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    try {
      const result = await chrome.storage.local.get(key);
      return result[key] ?? null;
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      await chrome.storage.local.set({ [key]: value });
    } catch {}
  },
  async removeItem(key: string): Promise<void> {
    try {
      await chrome.storage.local.remove(key);
    } catch {}
  },
};

export const supabase: SupabaseClient = createClient(
  __SUPABASE_URL__,
  __SUPABASE_KEY__,
  {
    auth: {
      detectSessionInUrl: false,
      persistSession: true,
      storage: chromeStorageAdapter,
      storageKey: STORAGE_KEYS.session,
    },
  }
);

/**
 * Ensures a valid session exists. Signs in anonymously if not.
 * Always resolves — never throws.
 */
export async function ensureSession(): Promise<void> {
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session) return;
    // No session → sign in anonymously
    const { error } = await supabase.auth.signInAnonymously();
    if (error) console.warn("[AdaptWeb] anon sign-in failed:", error.message);
  } catch (e) {
    console.warn("[AdaptWeb] ensureSession error:", e);
  }
}
