import type {
  AdaptationEvent,
  DashboardDomainRow,
  DashboardSummaryRow,
  PatternType,
  ReadingMode,
  RuleAction,
  UserProfile,
} from "./contracts";
import { MOCK, supabase } from "./supabase";

export const MONEY_PATTERNS: PatternType[] = ["drip_pricing", "sneak_into_basket"];

const MOCK_DOMAINS = [
  "staybright.travel",
  "tixly.events",
  "fastthreads.shop",
  "megamart.store",
  "brightloop-home.com",
];
const MOCK_PATTERNS: [PatternType, RuleAction][] = [
  ["fake_urgency", "remove"],
  ["false_scarcity", "remove"],
  ["fake_social_proof", "remove"],
  ["drip_pricing", "annotate_total"],
  ["sneak_into_basket", "uncheck"],
  ["confirmshaming", "rewrite_text"],
  ["nagging_popup", "dismiss"],
];

let mockId = 1000;
export function mockEvent(ageMs = 0): AdaptationEvent {
  const [pattern, action] = MOCK_PATTERNS[Math.floor(Math.random() * MOCK_PATTERNS.length)];
  return {
    id: ++mockId,
    user_id: "mock",
    domain: MOCK_DOMAINS[Math.floor(Math.random() * MOCK_DOMAINS.length)],
    pattern,
    action,
    value_cents: MONEY_PATTERNS.includes(pattern) ? 500 + Math.floor(Math.random() * 4500) : null,
    created_at: new Date(Date.now() - ageMs).toISOString(),
  };
}

/** Roll raw events up exactly like the dashboard_* RPCs do. */
export function rollup(events: AdaptationEvent[]) {
  const byPattern = new Map<PatternType, DashboardSummaryRow>();
  const byDomain = new Map<string, DashboardDomainRow>();
  for (const e of events) {
    const p = byPattern.get(e.pattern) ?? { pattern: e.pattern, events: 0, value_cents: 0 };
    p.events++;
    p.value_cents += e.value_cents ?? 0;
    byPattern.set(e.pattern, p);
    const d = byDomain.get(e.domain) ?? { domain: e.domain, events: 0, value_cents: 0, last_seen: e.created_at };
    d.events++;
    d.value_cents += e.value_cents ?? 0;
    if (e.created_at > d.last_seen) d.last_seen = e.created_at;
    byDomain.set(e.domain, d);
  }
  return {
    summary: [...byPattern.values()].sort((a, b) => b.events - a.events),
    domains: [...byDomain.values()].sort((a, b) => b.events - a.events),
  };
}

export type DashData = {
  summary: DashboardSummaryRow[];
  domains: DashboardDomainRow[];
  feed: AdaptationEvent[];
};

export function mockData(n: number, days: number): DashData {
  const events = Array.from({ length: n }, () => mockEvent(Math.random() * days * 86_400_000));
  events.sort((a, b) => b.created_at.localeCompare(a.created_at));
  return { ...rollup(events), feed: events.slice(0, 20) };
}

export async function fetchDashboard(days: number): Promise<DashData> {
  if (MOCK) return mockData(180, days);
  const [s, d, f] = await Promise.all([
    supabase.rpc("dashboard_summary", { days }),
    supabase.rpc("dashboard_by_domain", { days }),
    supabase.from("adaptation_events").select("*").order("created_at", { ascending: false }).limit(20),
  ]);
  const err = s.error ?? d.error ?? f.error;
  if (err) throw new Error(err.message);
  return {
    summary: (s.data ?? []) as DashboardSummaryRow[],
    domains: (d.data ?? []) as DashboardDomainRow[],
    feed: (f.data ?? []) as AdaptationEvent[],
  };
}

export async function seedDemo(n = 180) {
  if (MOCK) return;
  const { error } = await supabase.rpc("seed_my_demo_events", { n });
  if (error) throw new Error(error.message);
}

export async function fetchMode(uid: string): Promise<ReadingMode | null> {
  if (MOCK) return "analytical";
  const { data } = await supabase.from("user_profiles").select("reading_mode").eq("id", uid).maybeSingle();
  return (data?.reading_mode as ReadingMode) ?? null;
}

export async function saveMode(uid: string, email: string | null, mode: ReadingMode) {
  if (MOCK) return;
  // upsert: covers the case where the profile-creation trigger hasn't produced a row yet
  const { error } = await supabase
    .from("user_profiles")
    .upsert({ id: uid, email, reading_mode: mode } satisfies Partial<UserProfile>);
  if (error) throw new Error(error.message);
}

export function usd(cents: number) {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  });
}

export function ago(iso: string, now: number) {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
