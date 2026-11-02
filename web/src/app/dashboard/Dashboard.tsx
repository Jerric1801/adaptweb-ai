"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  PATTERN_LABELS,
  type AdaptationEvent,
  type PatternType,
  type ReadingMode,
} from "@/lib/contracts";
import {
  MONEY_PATTERNS,
  ago,
  fetchDashboard,
  fetchMode,
  mockEvent,
  saveMode,
  seedDemo,
  usd,
  type DashData,
} from "@/lib/dashboardData";
import { MOCK, supabase } from "@/lib/supabase";
import { useSession } from "@/lib/useSession";

const EMPTY: DashData = { summary: [], domains: [], feed: [] };
const FRESH_WINDOW_MS = 10 * 60 * 1000;

export default function Dashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useSession();
  const uid = user?.id;
  const email = user?.email ?? null;

  const [days, setDays] = useState<7 | 30>(30);
  const [data, setData] = useState<DashData>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [fresh, setFresh] = useState<number[]>([]);
  const [mode, setMode] = useState<ReadingMode>("analytical");
  const [synced, setSynced] = useState<"idle" | "saving" | "ok" | "error">("idle");
  const [seeding, setSeeding] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // auth gate
  useEffect(() => {
    if (!authLoading && !user) router.replace("/login/");
  }, [authLoading, user, router]);

  // relative-time clock
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(t);
  }, []);

  const load = useCallback(async () => {
    try {
      setError(null);
      setData(await fetchDashboard(days));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your data.");
    } finally {
      setLoaded(true);
    }
  }, [days]);

  useEffect(() => {
    if (!uid) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [uid, load]);

  useEffect(() => {
    if (!uid) return;
    let alive = true;
    fetchMode(uid).then((m) => alive && m && setMode(m));
    return () => {
      alive = false;
    };
  }, [uid]);

  // one realtime insert → feed row + tiles + bars all tick
  const onInsert = useCallback((e: AdaptationEvent) => {
    if (Date.now() - new Date(e.created_at).getTime() > FRESH_WINDOW_MS) return; // bulk/demo seeds → refetch instead
    setFresh((f) => [...f, e.id]);
    setData((d) => {
      const summary = [...d.summary];
      const si = summary.findIndex((r) => r.pattern === e.pattern);
      if (si >= 0) summary[si] = { ...summary[si], events: summary[si].events + 1, value_cents: summary[si].value_cents + (e.value_cents ?? 0) };
      else summary.push({ pattern: e.pattern, events: 1, value_cents: e.value_cents ?? 0 });
      summary.sort((a, b) => b.events - a.events);

      const domains = [...d.domains];
      const di = domains.findIndex((r) => r.domain === e.domain);
      if (di >= 0) domains[di] = { ...domains[di], events: domains[di].events + 1, value_cents: domains[di].value_cents + (e.value_cents ?? 0), last_seen: e.created_at };
      else domains.push({ domain: e.domain, events: 1, value_cents: e.value_cents ?? 0, last_seen: e.created_at });
      domains.sort((a, b) => b.events - a.events);

      return { summary, domains, feed: [e, ...d.feed.filter((x) => x.id !== e.id)].slice(0, 20) };
    });
  }, []);

  useEffect(() => {
    if (!uid) return;
    if (MOCK) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLive(true);
      const t = setInterval(() => onInsert(mockEvent()), 5000);
      return () => clearInterval(t);
    }
    const ch = supabase
      .channel(`dash-${uid}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "adaptation_events", filter: `user_id=eq.${uid}` },
        (p) => onInsert(p.new as AdaptationEvent),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "user_profiles", filter: `id=eq.${uid}` },
        (p) => setMode((p.new as { reading_mode: ReadingMode }).reading_mode),
      )
      .subscribe((status) => setLive(status === "SUBSCRIBED"));
    return () => {
      setLive(false);
      supabase.removeChannel(ch);
    };
  }, [uid, onInsert]);

  async function changeMode(m: ReadingMode) {
    if (!uid || m === mode) return;
    const prev = mode;
    setMode(m);
    setSynced("saving");
    try {
      await saveMode(uid, email, m);
      setSynced("ok");
    } catch {
      setMode(prev);
      setSynced("error");
    }
  }

  async function loadDemo() {
    setSeeding(true);
    try {
      await seedDemo(180);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load demo data.");
    } finally {
      setSeeding(false);
    }
  }

  async function signOut() {
    if (!MOCK) await supabase.auth.signOut();
    router.push(MOCK ? "/" : "/login/");
  }

  if (authLoading || !user) {
    return <p className="py-24 text-center text-muted">Loading your dashboard…</p>;
  }

  const total = data.summary.reduce((n, r) => n + r.events, 0);
  const surfaced = data.summary
    .filter((r) => MONEY_PATTERNS.includes(r.pattern))
    .reduce((n, r) => n + r.value_cents, 0);
  const top = data.summary[0];
  const empty = loaded && total === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="mono-label text-[10px] text-forest">Dashboard</span>
          <h1 className="mt-2 font-display text-4xl font-semibold leading-none tracking-[-0.04em] sm:text-5xl">
            Your web, unpressured
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div role="group" aria-label="Date range" className="flex rounded-full bg-cream p-1 text-sm font-semibold">
            {([7, 30] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                aria-pressed={days === d}
                className={`rounded-full px-4 py-1.5 transition-colors ${days === d ? "bg-ink text-cream" : "text-ink/60 hover:text-ink"}`}
              >
                {d} days
              </button>
            ))}
          </div>
          <span className="max-w-[12rem] truncate text-sm text-muted" title={email ?? ""}>
            {email}
          </span>
          <details className="relative">
            <summary className="grid h-9 w-9 cursor-pointer list-none place-items-center rounded-full bg-cream text-lg leading-none hover:bg-white" aria-label="More">
              ⋯
            </summary>
            <div className="soft-card absolute right-0 z-10 mt-2 w-48 rounded-2xl bg-cream p-2 text-sm">
              <button onClick={loadDemo} disabled={seeding} className="w-full rounded-xl px-3 py-2 text-left hover:bg-paper disabled:opacity-50">
                {seeding ? "Loading…" : "Load demo data"}
              </button>
              <button onClick={signOut} className="w-full rounded-xl px-3 py-2 text-left hover:bg-paper">
                Sign out
              </button>
            </div>
          </details>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-2xl bg-poppy/10 px-4 py-3 text-sm text-poppy">
          {error}
        </p>
      )}

      {empty ? (
        <EmptyState onDemo={loadDemo} seeding={seeding} />
      ) : (
        <>
          {/* Stat tiles */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Tile label="Patterns removed" value={total.toLocaleString()} tone="bg-lime" ready={loaded} />
            <Tile label="Hidden costs surfaced" value={usd(surfaced)} tone="bg-amber/60" ready={loaded} />
            <Tile label="Sites adapted" value={data.domains.length.toLocaleString()} tone="bg-cream" ready={loaded} />
            <Tile label="Most common" value={top ? PATTERN_LABELS[top.pattern] : "—"} tone="bg-cream" small ready={loaded} />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
            <div className="space-y-6">
              <PatternBars data={data} total={total} />
              <SiteTable data={data} now={now} />
            </div>
            <div className="space-y-6">
              <ModeCard mode={mode} synced={synced} onChange={changeMode} />
              <LiveFeed feed={data.feed} live={live} fresh={fresh} now={now} />
            </div>
          </div>
        </>
      )}

      {empty && (
        <div className="grid gap-6 lg:grid-cols-2">
          <ModeCard mode={mode} synced={synced} onChange={changeMode} />
          <LiveFeed feed={data.feed} live={live} fresh={fresh} now={now} />
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */

function Card({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="soft-card rounded-[28px] bg-cream p-5 sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold tracking-tight">{title}</h2>
        {aside}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Tile({ label, value, tone, small, ready }: { label: string; value: string; tone: string; small?: boolean; ready: boolean }) {
  return (
    <div className={`rounded-[28px] p-5 ${tone} soft-card`}>
      <p className="mono-label text-[10px] text-ink/60">{label}</p>
      <p
        className={`mt-3 font-display font-semibold leading-none tracking-[-0.04em] ${small ? "text-2xl sm:text-3xl" : "text-4xl sm:text-5xl"}`}
      >
        <span key={value} className="animate-tick">
          {ready ? value : "…"}
        </span>
      </p>
    </div>
  );
}

function PatternBars({ data, total }: { data: DashData; total: number }) {
  const max = Math.max(1, ...data.summary.map((r) => r.events));
  return (
    <Card title="What we removed" aside={<span className="mono-label text-[10px] text-muted">by pattern</span>}>
      <ul className="space-y-3.5">
        {data.summary.map((r) => (
          <li key={r.pattern}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium">{PATTERN_LABELS[r.pattern as PatternType] ?? r.pattern}</span>
              <span className="font-mono text-xs text-ink/70">
                {r.events.toLocaleString()} · {total ? Math.round((r.events / total) * 100) : 0}%
                {MONEY_PATTERNS.includes(r.pattern) && r.value_cents > 0 && <span className="text-forest"> · {usd(r.value_cents)}</span>}
              </span>
            </div>
            <div
              className="hatch mt-1.5 h-2.5 overflow-hidden rounded-full text-ink/15"
              role="img"
              aria-label={`${PATTERN_LABELS[r.pattern as PatternType] ?? r.pattern}: ${r.events} events`}
            >
              <div className="h-full rounded-full bg-forest transition-[width] duration-500" style={{ width: `${(r.events / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function SiteTable({ data, now }: { data: DashData; now: number }) {
  const max = Math.max(1, ...data.domains.map((r) => r.events));
  return (
    <Card title="By site">
      <div className="mono-label grid grid-cols-[1fr_auto_auto] gap-x-4 pb-2 text-[10px] text-muted sm:grid-cols-[1.4fr_5rem_5rem_5rem_6rem]">
        <span>Site</span>
        <span className="text-right">Events</span>
        <span className="hidden text-right sm:block">$ surfaced</span>
        <span className="hidden text-right sm:block">Last seen</span>
        <span className="text-right sm:text-left">Share</span>
      </div>
      <ul className="divide-y divide-ink/10">
        {data.domains.map((r) => (
          <li key={r.domain} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 py-3 text-sm sm:grid-cols-[1.4fr_5rem_5rem_5rem_6rem]">
            <span className="truncate font-medium">{r.domain}</span>
            <span className="text-right font-mono text-xs">{r.events.toLocaleString()}</span>
            <span className="hidden text-right font-mono text-xs sm:block">{r.value_cents ? usd(r.value_cents) : "—"}</span>
            <span className="hidden text-right text-xs text-muted sm:block">{ago(r.last_seen, now)}</span>
            <span className="hatch h-2 w-16 overflow-hidden rounded-full text-ink/15 sm:w-full" aria-hidden="true">
              <span className="block h-full rounded-full bg-lime-deep" style={{ width: `${(r.events / max) * 100}%` }} />
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

const MODES: { id: ReadingMode; label: string; hint: string }[] = [
  { id: "analytical", label: "Analytical", hint: "Specs and true totals up front." },
  { id: "minimalist", label: "Minimalist", hint: "Clutter hidden, one clear path." },
  { id: "visual", label: "Visual", hint: "Images and layout first." },
];

function ModeCard({ mode, synced, onChange }: { mode: ReadingMode; synced: string; onChange: (m: ReadingMode) => void }) {
  return (
    <Card title="Reading mode">
      <div role="radiogroup" aria-label="Reading mode" className="grid grid-cols-3 gap-1 rounded-full bg-paper p-1 text-sm font-semibold">
        {MODES.map((m) => (
          <button
            key={m.id}
            role="radio"
            aria-checked={mode === m.id}
            onClick={() => onChange(m.id)}
            className={`rounded-full px-2 py-2 transition-colors ${mode === m.id ? "sticker bg-lime" : "text-ink/60 hover:text-ink"}`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-sm text-ink/70">{MODES.find((m) => m.id === mode)?.hint}</p>
      <p className="mt-3 h-5 text-xs" aria-live="polite">
        {synced === "saving" && <span className="text-muted">Saving…</span>}
        {synced === "ok" && <span className="font-semibold text-forest">Synced to your extension ✓</span>}
        {synced === "error" && <span className="text-poppy">Couldn’t save — try again.</span>}
      </p>
    </Card>
  );
}

function LiveFeed({ feed, live, fresh, now }: { feed: AdaptationEvent[]; live: boolean; fresh: number[]; now: number }) {
  return (
    <Card
      title="Live feed"
      aside={
        <span className="inline-flex items-center gap-2 text-xs font-semibold">
          <span className={`h-2.5 w-2.5 rounded-full ${live ? "live-dot bg-lime-deep" : "bg-muted/40"}`} />
          {live ? "Live" : "Connecting…"}
        </span>
      }
    >
      {feed.length === 0 ? (
        <p className="text-sm text-muted">Waiting for your first adapted page. New ones appear here as they happen.</p>
      ) : (
        <ul className="-mx-2 max-h-[26rem] space-y-1 overflow-y-auto pr-1">
          {feed.map((e) => (
            <li
              key={e.id}
              className={`flex items-center justify-between gap-3 rounded-2xl px-2 py-2 text-sm ${fresh.includes(e.id) ? "animate-slide-in" : ""}`}
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">{PATTERN_LABELS[e.pattern] ?? e.pattern}</span>
                <span className="block truncate text-xs text-muted">
                  {e.domain}
                  {e.value_cents ? ` · ${usd(e.value_cents)}` : ""}
                </span>
              </span>
              <span className="shrink-0 text-xs text-muted">{ago(e.created_at, now)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function EmptyState({ onDemo, seeding }: { onDemo: () => void; seeding: boolean }) {
  return (
    <section className="soft-card rounded-[28px] bg-cream p-8 text-center sm:p-12">
      <h2 className="font-display text-3xl font-semibold tracking-[-0.03em]">No pages adapted yet</h2>
      <p className="mx-auto mt-3 max-w-md text-ink/70">
        Install the extension and browse as usual. What it removes shows up here, live.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link href="/install/" className="sticker rounded-full bg-lime px-6 py-3 font-semibold transition-transform hover:-translate-y-0.5">
          Install the extension
        </Link>
        <button onClick={onDemo} disabled={seeding} className="rounded-full px-4 py-3 text-sm font-semibold text-ink/70 hover:text-ink disabled:opacity-50">
          {seeding ? "Loading…" : "Load demo data"}
        </button>
      </div>
    </section>
  );
}
