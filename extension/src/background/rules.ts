/**
 * C2 — Rules: GET_CONTEXT + ANALYZE handlers.
 */
import { supabase } from "../lib/supabase";
import {
  RULE_CACHE_TTL_MS,
  STORAGE_KEYS,
  type AnalyzeResponse,
  type ContextResponse,
  type PageSnapshot,
  type Settings,
  type SiteRuleSet,
} from "../shared/contracts";

declare const __SUPABASE_URL__: string;
declare const __SUPABASE_KEY__: string;

/** Expand domain into candidate list: shop.x.com → ['shop.x.com', 'x.com'] */
function domainCandidates(domain: string): string[] {
  const candidates: string[] = [domain];
  const parts = domain.split(".");
  if (parts.length > 2) {
    candidates.push(parts.slice(1).join("."));
  }
  return candidates;
}

/** Match a path against a glob-style path_pattern (only "*" and prefix globs). */
function pathMatches(pathPattern: string, path: string): boolean {
  if (pathPattern === "*") return true;
  if (pathPattern.endsWith("/*")) {
    const prefix = pathPattern.slice(0, -2);
    return path.startsWith(prefix);
  }
  return path === pathPattern;
}

interface RuleCacheEntry {
  ruleSets: SiteRuleSet[];
  fetchedAt: number;
}

async function getSettings(): Promise<Settings> {
  const got = await chrome.storage.sync.get(STORAGE_KEYS.settings);
  const { DEFAULT_SETTINGS } = await import("../shared/contracts");
  return { ...DEFAULT_SETTINGS, ...(got[STORAGE_KEYS.settings] ?? {}) };
}

async function fetchRulesFromSupabase(
  candidates: string[],
  path: string
): Promise<SiteRuleSet[]> {
  try {
    const { data, error } = await supabase
      .from("site_rules")
      .select("*")
      .in("domain", candidates);
    if (error) throw error;
    const rows: SiteRuleSet[] = data ?? [];
    return rows.filter((r) => pathMatches(r.path_pattern, path));
  } catch (e) {
    console.warn("[AdaptWeb] fetchRules error:", e);
    return [];
  }
}

export async function handleGetContext(
  domain: string,
  path: string
): Promise<ContextResponse> {
  const settings = await getSettings();
  const cacheKey = STORAGE_KEYS.rulesCache + domain;

  // Check cache
  try {
    const stored = await chrome.storage.local.get(cacheKey);
    const entry: RuleCacheEntry | undefined = stored[cacheKey];
    if (entry && Date.now() - entry.fetchedAt < RULE_CACHE_TTL_MS) {
      const ruleSets = entry.ruleSets.filter((r) =>
        pathMatches(r.path_pattern, path)
      );
      return { settings, ruleSets };
    }
  } catch {}

  const candidates = domainCandidates(domain);
  const ruleSets = await fetchRulesFromSupabase(candidates, path);

  // Cache all rules for this domain (unfiltered by path)
  try {
    const allCandidates = domainCandidates(domain);
    const { data } = await supabase
      .from("site_rules")
      .select("*")
      .in("domain", allCandidates);
    const cacheEntry: RuleCacheEntry = {
      ruleSets: data ?? [],
      fetchedAt: Date.now(),
    };
    await chrome.storage.local.set({ [cacheKey]: cacheEntry });
  } catch {}

  return { settings, ruleSets };
}

// Dedupe in-flight analyze calls per domain+path
const analyzePending = new Map<string, Promise<AnalyzeResponse>>();

export async function handleAnalyze(
  snapshot: PageSnapshot
): Promise<AnalyzeResponse> {
  const key = `${snapshot.domain}:${snapshot.path}`;
  const existing = analyzePending.get(key);
  if (existing) return existing;

  const promise = (async (): Promise<AnalyzeResponse> => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token ?? __SUPABASE_KEY__;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25_000);

      const res = await fetch(
        `${__SUPABASE_URL__}/functions/v1/analyze-page`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: __SUPABASE_KEY__,
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ snapshot }),
          signal: controller.signal,
        }
      );
      clearTimeout(timeout);

      if (!res.ok) {
        return { ruleSet: null, cached: false, error: `HTTP ${res.status}` };
      }
      const result: AnalyzeResponse = await res.json();

      // If we got a ruleSet back, cache it
      if (result.ruleSet) {
        const cacheKey = STORAGE_KEYS.rulesCache + snapshot.domain;
        try {
          const stored = await chrome.storage.local.get(cacheKey);
          const entry: RuleCacheEntry = stored[cacheKey] ?? {
            ruleSets: [],
            fetchedAt: Date.now(),
          };
          // Replace/add the ruleSet
          const idx = entry.ruleSets.findIndex(
            (r) =>
              r.domain === result.ruleSet!.domain &&
              r.path_pattern === result.ruleSet!.path_pattern
          );
          if (idx >= 0) entry.ruleSets[idx] = result.ruleSet!;
          else entry.ruleSets.push(result.ruleSet!);
          entry.fetchedAt = Date.now();
          await chrome.storage.local.set({ [cacheKey]: entry });
        } catch {}
      }

      return result;
    } catch (e: any) {
      return {
        ruleSet: null,
        cached: false,
        error: e?.name === "AbortError" ? "timeout" : String(e),
      };
    } finally {
      analyzePending.delete(key);
    }
  })();

  analyzePending.set(key, promise);
  return promise;
}
