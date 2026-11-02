"use client";

import { useEffect, useState } from "react";
import { AirFryer } from "./Illustrations";
import { LogoMark } from "./Logo";

type Mode = "analytical" | "minimalist" | "visual";

const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: "analytical", label: "Analytical", hint: "Specs, true cost, comparisons" },
  { id: "minimalist", label: "Minimalist", hint: "Only what decides the purchase" },
  { id: "visual", label: "Visual", hint: "Big imagery, icon facts" },
];

// Fictional store, fictional product: illustrative pricing only.
const PRICE = 129.99;
const WAS = 199.99;
const SHIPPING = 14.99;
const SERVICE_FEE = 9.99;
const PLAN = 29.99;
const TAX_RATE = 0.08;
const TAX = Math.round(PRICE * TAX_RATE * 100) / 100;
const TRUE_TOTAL = PRICE + SHIPPING + SERVICE_FEE + TAX;

const PATTERNS = [
  { key: "timer", label: "Fake countdown", why: "Resets on every visit" },
  { key: "viewers", label: "Live-viewer count", why: "Number is randomised" },
  { key: "scarcity", label: "False scarcity", why: "Stock claim unverifiable" },
  { key: "drip", label: "Drip pricing", why: "$34.98 in fees surfaced" },
  { key: "sneak", label: "Pre-ticked add-on", why: "Protection plan unticked" },
  { key: "shame", label: "Confirmshaming", why: "Decline link rewritten" },
  { key: "proof", label: "Fake social proof", why: "Unverifiable purchase toast" },
] as const;

const money = (n: number) => `$${n.toFixed(2)}`;

function useFakeTimer(active: boolean) {
  const [s, setS] = useState(599);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setS((x) => (x <= 1 ? 599 : x - 1)), 1000);
    return () => clearInterval(id);
  }, [active]);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function useJitter(active: boolean) {
  const [n, setN] = useState(37);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(
      () => setN((x) => Math.max(21, Math.min(58, x + Math.round((Math.random() - 0.45) * 6)))),
      1400,
    );
    return () => clearInterval(id);
  }, [active]);
  return n;
}

function Removed({ label, why }: { label: string; why: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border-2 border-dashed border-lime-deep/70 bg-lime/25 px-3 py-1.5 text-[11px] text-forest">
      <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-forest text-[9px] font-bold text-lime">
        ✓
      </span>
      <span className="mono-label font-medium">{label} removed</span>
      <span className="truncate text-forest/70">· {why}</span>
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative h-9 w-16 shrink-0 rounded-full border-2 border-ink transition-colors ${
        on ? "bg-lime" : "bg-cream"
      }`}
    >
      <span className="sr-only">Toggle AdaptWeb</span>
      <span
        className={`absolute top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border-2 border-ink bg-ink transition-all ${
          on ? "left-[calc(100%-1.75rem)]" : "left-1 bg-cream"
        }`}
      />
    </button>
  );
}

export default function LiveDemo() {
  const [on, setOn] = useState(false);
  const [mode, setMode] = useState<Mode>("analytical");
  const timer = useFakeTimer(!on);
  const viewers = useJitter(!on);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      {/* Browser */}
      <div className="soft-card overflow-hidden rounded-[28px] border border-ink/10 bg-white">
        <div className="flex items-center gap-3 border-b border-ink/10 bg-cream px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-poppy/80" />
            <span className="h-3 w-3 rounded-full bg-amber" />
            <span className="h-3 w-3 rounded-full bg-lime-deep" />
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-paper/70 px-3 py-1.5 text-xs text-muted">
            <span aria-hidden>🔒</span>
            <span className="truncate">brightloop-home.example/products/aircrisp-pro</span>
          </div>
          <span
            className={`hidden items-center gap-1.5 rounded-full px-2 py-1 text-[10px] sm:flex mono-label ${
              on ? "bg-lime text-forest" : "bg-paper text-muted"
            }`}
          >
            <LogoMark size={14} />
            {on ? "Adapted" : "Off"}
          </span>
        </div>

        <div className="relative">
          {/* Urgency banner */}
          {on ? (
            <div className="px-5 pt-4">
              <Removed label="Fake countdown" why="timer restarts at 09:59 on every visit" />
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 bg-ember px-4 py-2.5 text-sm font-semibold text-white">
              <span aria-hidden>⚡</span> FLASH SALE ENDS IN{" "}
              <span className="rounded bg-ink/20 px-1.5 font-mono tabular-nums">{timer}</span>
            </div>
          )}

          <div
            className={`grid gap-6 p-5 sm:p-7 ${
              on && mode === "visual"
                ? "sm:grid-cols-1"
                : on && mode === "minimalist"
                  ? "sm:grid-cols-[140px_1fr]"
                  : "sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
            }`}
          >
            {/* Product image */}
            <div
              className={`relative grid place-items-center rounded-3xl bg-paper/70 ${
                on && mode === "visual" ? "aspect-[16/8]" : on && mode === "minimalist" ? "aspect-square" : "aspect-square"
              }`}
            >
              <AirFryer
                className={on && mode === "visual" ? "h-[85%]" : on && mode === "minimalist" ? "w-[80%]" : "w-[72%]"}
              />
              {!on && (
                <span className="absolute left-3 top-3 rotate-[-6deg] rounded-full bg-poppy px-3 py-1 text-xs font-bold text-white">
                  -35% TODAY ONLY
                </span>
              )}
            </div>

            {/* Product info */}
            <div className="flex min-w-0 flex-col gap-3">
              {!(on && mode === "minimalist") && (
                <p className="mono-label text-[11px] text-muted">Brightloop Home</p>
              )}
              <h3 className="font-display text-2xl font-semibold leading-tight tracking-[-0.02em] sm:text-[1.7rem]">
                AirCrisp Pro 6-Qt Air Fryer
              </h3>

              {!(on && mode === "minimalist") && (
                <p className="text-sm text-muted">
                  <span className="text-amber">★★★★★</span> 4.6 · 2,184 reviews
                </p>
              )}

              {on ? (
                <Removed label="Live-viewer count" why="number randomises every second" />
              ) : (
                <p className="flex items-center gap-2 text-sm font-medium text-ember">
                  <span className="h-2 w-2 rounded-full bg-ember animate-pulse-ring" />
                  {viewers} people are looking at this right now
                </p>
              )}

              {/* Price */}
              {on ? (
                <div className="rounded-2xl border-2 border-ink bg-cream p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="mono-label text-[11px] text-forest">True total</span>
                    <span className="font-display text-3xl font-semibold tracking-tight">
                      {money(TRUE_TOTAL)}
                    </span>
                  </div>
                  {mode !== "minimalist" && (
                    <dl className="mt-3 space-y-1 border-t border-ink/10 pt-3 text-xs text-muted">
                      {[
                        ["Item", PRICE],
                        ["Shipping (shown at step 3)", SHIPPING],
                        ["“Service fee” (shown at step 4)", SERVICE_FEE],
                        ["Est. tax (8%)", TAX],
                      ].map(([k, v]) => (
                        <div key={k as string} className="flex justify-between">
                          <dt>{k}</dt>
                          <dd className="font-mono tabular-nums text-ink">{money(v as number)}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-baseline gap-3">
                    <span className="font-display text-4xl font-semibold tracking-tight">{money(PRICE)}</span>
                    <span className="text-lg text-muted line-through">{money(WAS)}</span>
                  </div>
                  <p className="text-[11px] text-muted/70">+ applicable fees calculated at checkout</p>
                </div>
              )}

              {on ? (
                <Removed label="False scarcity" why="no stock data behind the claim" />
              ) : (
                <p className="rounded-lg bg-poppy/10 px-3 py-2 text-sm font-semibold text-poppy">
                  🔥 Only 2 left in stock — order soon!
                </p>
              )}

              {/* Mode-specific panels */}
              {on && mode === "analytical" && (
                <table className="w-full overflow-hidden rounded-2xl text-left text-xs">
                  <tbody>
                    {[
                      ["Capacity", "6 qt (5.7 L)"],
                      ["Power", "1,700 W"],
                      ["Footprint", "28 × 34 cm"],
                      ["Warranty", "1 year (included)"],
                      ["Cost per quart", money(TRUE_TOTAL / 6)],
                    ].map(([k, v], i) => (
                      <tr key={k} className={i % 2 ? "bg-paper/40" : "bg-paper/80"}>
                        <th className="px-3 py-2 font-medium text-muted">{k}</th>
                        <td className="px-3 py-2 text-right font-mono">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {on && mode === "visual" && (
                <div className="grid grid-cols-3 gap-2">
                  {[
                    ["6", "quarts"],
                    ["1.7k", "watts"],
                    ["1 yr", "warranty"],
                  ].map(([big, small]) => (
                    <div key={small} className="rounded-2xl bg-lime p-3 text-center">
                      <div className="font-display text-2xl font-semibold">{big}</div>
                      <div className="mono-label text-[10px] text-forest">{small}</div>
                    </div>
                  ))}
                </div>
              )}
              {on && mode === "minimalist" && (
                <p className="text-sm text-muted">6 qt · 1,700 W · 1-year warranty included</p>
              )}

              {/* Add-on */}
              <label
                className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-sm ${
                  on ? "border-ink/10 text-muted" : "border-ink/15"
                }`}
              >
                <input type="checkbox" readOnly checked={!on} className="mt-0.5 accent-ember" />
                <span>
                  Add 3-Year Protection Plan <span className="font-mono">(+{money(PLAN)})</span>
                  {on && (
                    <span className="mt-0.5 block mono-label text-[10px] text-forest">
                      ✓ Was pre-ticked — unticked for you
                    </span>
                  )}
                </span>
              </label>

              <button
                type="button"
                className={`rounded-full px-5 py-3 text-sm font-semibold transition-colors ${
                  on ? "bg-ink text-cream" : "bg-ember text-white"
                }`}
              >
                {on ? "Add to cart" : "BUY NOW — before it’s gone!"}
              </button>
              <p className="text-center text-xs text-muted underline decoration-dotted">
                {on ? "No thanks" : "No thanks, I’d rather pay full price"}
              </p>
            </div>
          </div>

          {/* Fake social-proof toast */}
          {!on && (
            <div className="pointer-events-none absolute bottom-4 left-4 hidden max-w-[240px] items-center gap-3 rounded-2xl bg-white p-3 text-xs shadow-xl ring-1 ring-ink/10 sm:flex">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-amber text-base">🛒</span>
              <span>
                <b>Sarah in Ohio</b> bought this
                <br />
                <span className="text-muted">2 minutes ago</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Extension panel */}
      <aside className="flex flex-col gap-4 rounded-[28px] bg-ink p-5 text-cream">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <LogoMark size={26} />
            <span className="font-display text-lg font-semibold tracking-tight">AdaptWeb</span>
          </div>
          <Toggle on={on} onChange={setOn} />
        </div>

        <div className={`rounded-2xl p-4 ${on ? "bg-lime text-ink" : "bg-ember text-white"}`}>
          <p className="mono-label text-[11px] opacity-80">{on ? "Page adapted" : "Pressure detected"}</p>
          <p className="mt-1 font-display text-4xl font-semibold tracking-tight">
            {PATTERNS.length}
            <span className="ml-2 text-base font-medium">
              {on ? "patterns removed" : "dark patterns"}
            </span>
          </p>
          {!on && (
            <p className="mt-2 text-xs opacity-90">Flip the switch to see this page without them →</p>
          )}
        </div>

        <div>
          <p className="mono-label mb-2 text-[11px] text-cream/50">Reading mode</p>
          <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-ink-soft p-1">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                disabled={!on}
                onClick={() => setMode(m.id)}
                className={`rounded-xl px-2 py-2 text-xs font-medium transition-colors disabled:opacity-40 ${
                  on && mode === m.id ? "bg-cream text-ink" : "text-cream/70 hover:text-cream"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-cream/50">
            {on ? MODES.find((m) => m.id === mode)?.hint : "Turn AdaptWeb on to choose how the page reads."}
          </p>
        </div>

        <ul className="space-y-1.5 text-xs">
          {PATTERNS.map((p) => (
            <li key={p.key} className="flex items-center gap-2">
              <span
                className={`grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px] font-bold ${
                  on ? "bg-lime text-ink" : "bg-ember/20 text-ember"
                }`}
              >
                {on ? "✓" : "!"}
              </span>
              <span className="font-medium">{p.label}</span>
              <span className="truncate text-cream/40">{on ? p.why : ""}</span>
            </li>
          ))}
        </ul>

        <p className="mt-auto border-t border-cream/10 pt-3 text-[11px] text-cream/40">
          Demo store is fictional. Every change is logged and reversible with one click.
        </p>
      </aside>
    </div>
  );
}
