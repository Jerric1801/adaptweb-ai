import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** True when Supabase env is missing or NEXT_PUBLIC_MOCK=1 → pages use local sample data. */
export const MOCK = !url || !key || process.env.NEXT_PUBLIC_MOCK === "1";

// Placeholder values keep `next build` (prerender) from throwing when env is absent.
export const supabase = createClient(url || "http://localhost:54321", key || "mock-key", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
