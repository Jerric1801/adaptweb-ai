import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Logo, LogoMark } from "@/components/Logo";
import {
  CrackedHourglass,
  Network,
  OpenWindow,
  ScanLens,
  Sprout,
  TagLens,
  Wand,
  AirFryer,
} from "@/components/Illustrations";

export const metadata: Metadata = {
  title: "Brand Guidelines — AdaptWeb AI",
  description: "Identity, voice, colour, type and illustration for AdaptWeb AI.",
};

/* ---------- slide scaffolding ---------- */

type Tone = "paper" | "cream" | "ink" | "lime" | "forest" | "white";
const toneCls: Record<Tone, string> = {
  paper: "bg-paper text-ink",
  cream: "bg-cream text-ink",
  ink: "bg-ink text-cream",
  lime: "bg-lime text-ink",
  forest: "bg-forest text-cream",
  white: "bg-white text-ink",
};

function Slide({
  n,
  section,
  tone = "white",
  children,
  className = "",
}: {
  n: number;
  section: string;
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={`s${n}`}
      className={`relative flex min-h-[560px] w-full snap-start flex-col overflow-hidden rounded-[28px] p-6 sm:p-10 md:aspect-[16/9] md:min-h-0 md:p-14 ${toneCls[tone]} ${className}`}
    >
      <div className="mono-label flex justify-between text-[10px] opacity-60 sm:text-[11px]">
        <span>AdaptWeb AI / 2026</span>
        <span>
          {section} / {String(n).padStart(2, "0")}
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col pt-6 md:pt-8">{children}</div>
    </section>
  );
}

function H({ num, children }: { num: string; children: ReactNode }) {
  return (
    <p className="mono-label flex gap-6 text-xs font-semibold sm:text-sm">
      <span>{num}</span>
      <span>{children}</span>
    </p>
  );
}

function Big({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={`font-display text-[clamp(1.8rem,4.2vw,3.6rem)] font-semibold leading-[1.02] tracking-[-0.035em] ${className}`}
    >
      {children}
    </p>
  );
}

/* ---------- data ---------- */

const CORE = [
  { name: "Ink", hex: "#121412", rgb: "18 20 18", cls: "bg-ink text-cream", role: "Type, outlines, the frame" },
  { name: "Paper", hex: "#ECE6DB", rgb: "236 230 219", cls: "bg-paper text-ink", role: "Our default canvas" },
  { name: "Lime", hex: "#B8F28F", rgb: "184 242 143", cls: "bg-lime text-ink", role: "The honest layer — adapted" },
];
const SECONDARY = [
  { name: "Forest", hex: "#2D6A4F", cls: "bg-forest text-cream", role: "Depth, info, analytical" },
  { name: "Cream", hex: "#FAF6EF", cls: "bg-cream text-ink", role: "Cards, surfaces" },
  { name: "Amber", hex: "#FFC94D", cls: "bg-amber text-ink", role: "Caution, visual mode" },
];
const SEMANTIC = [
  { name: "Adapted", hex: "#7FCB55", cls: "bg-lime-deep", use: "Pattern removed, success" },
  { name: "Pressure", hex: "#FF7A2F", cls: "bg-ember", use: "Dark pattern detected — never our CTA" },
  { name: "Caution", hex: "#FFC94D", cls: "bg-amber", use: "Fee surfaced, needs a look" },
  { name: "Blocked", hex: "#E5484D", cls: "bg-poppy", use: "Errors, destructive actions" },
];

/* ---------- page ---------- */

export default function BrandPage() {
  return (
    <main className="flex-1 bg-[#d9d2c5]">
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" aria-label="Back to AdaptWeb AI home">
            <Logo />
          </Link>
          <span className="mono-label text-[11px] text-muted">Brand identity guidelines · v0.1</span>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl snap-y flex-col gap-6 px-4 py-8 sm:px-6">
        {/* 01 Cover */}
        <Slide n={1} section="Cover" tone="lime">
          <div className="flex items-center gap-3">
            <LogoMark size={44} />
            <span className="font-display text-3xl font-semibold tracking-[-0.03em]">AdaptWeb AI</span>
          </div>
          <div className="mt-auto flex items-end justify-between gap-6">
            <h1 className="font-display text-[clamp(3rem,9vw,7.5rem)] font-semibold leading-[0.9] tracking-[-0.05em]">
              Brand Identity
              <br />
              Guidelines
            </h1>
            <OpenWindow className="hidden w-[24%] shrink-0 md:block" />
          </div>
        </Slide>

        {/* 02 Contents */}
        <Slide n={2} section="Contents" tone="ink">
          <Big>Table of Contents</Big>
          <div className="mt-auto grid gap-8 text-sm sm:grid-cols-3">
            {[
              ["1.0", "Overview", ["Brand at a glance"]],
              ["2.0", "Defining our brand", ["Who we are", "The role of AdaptWeb", "Values", "Personality", "Tone of voice"]],
              ["3.0", "Visual identity", ["Logo", "Colour", "Semantic colour", "Typeface", "Illustration", "UI language", "Brand in action", "Misapplication"]],
            ].map(([num, title, items]) => (
              <div key={num as string}>
                <p className="font-semibold">
                  <span className="mr-4">{num}</span>
                  {title}
                </p>
                <ul className="mt-3 space-y-1.5 text-cream/60">
                  {(items as string[]).map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Slide>

        {/* 03 Overview */}
        <Slide n={3} section="Overview">
          <H num="1.0">Overview</H>
          <div className="mt-6 grid flex-1 gap-8 text-sm md:grid-cols-3">
            <div className="space-y-5">
              {[
                ["Who we are", "AdaptWeb AI is the honest layer on the web. It strips the pressure out of every page and reshapes it for how you think."],
                ["Personality", "A calm guardian, a plain-spoken translator, and a quiet ally that always hands control back to you."],
                ["Tone of voice", "Calm, factual, on your side. We show; we never shout."],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="mono-label text-[11px] font-semibold">{k}</p>
                  <p className="mt-1 text-ink/70">{v}</p>
                </div>
              ))}
              <div className="flex flex-wrap gap-2 pt-2">
                {["Honesty", "Agency", "Clarity", "Calm"].map((v) => (
                  <span key={v} className="rounded-full border border-dashed border-forest px-3 py-1.5 text-xs">
                    {v}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <p className="mono-label text-[11px] font-semibold">Primary logo</p>
              <div className="grid flex-1 place-items-center rounded-2xl border border-ink/10">
                <Logo />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {["bg-cream", "bg-lime", "bg-ink"].map((b) => (
                  <div key={b} className={`grid h-14 place-items-center rounded-xl ${b} ${b === "bg-cream" ? "border border-ink/10" : ""}`}>
                    <LogoMark size={26} />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <p className="mono-label text-[11px] font-semibold">Typeface</p>
              <p className="font-display text-3xl font-semibold tracking-tight">Bricolage Grotesque</p>
              <p className="text-xl">Geist</p>
              <p className="mono-label">Geist Mono</p>
              <p className="mono-label mt-auto text-[11px] font-semibold">Colours</p>
              <div className="grid grid-cols-6 gap-1.5">
                {["bg-ink", "bg-paper", "bg-lime", "bg-forest", "bg-cream border border-ink/10", "bg-amber"].map((c) => (
                  <div key={c} className={`h-10 rounded-lg ${c}`} />
                ))}
              </div>
            </div>
          </div>
        </Slide>

        {/* 04 Divider */}
        <Slide n={4} section="Defining our brand" tone="forest">
          <span className="mono-label text-sm">2.0</span>
          <div className="mt-auto max-w-4xl">
            <h2 className="font-display text-[clamp(2.6rem,7vw,6rem)] font-semibold leading-[0.95] tracking-[-0.045em]">
              Defining Our Brand
            </h2>
            <p className="mt-6 text-lg text-cream/80 sm:text-2xl">
              What we stand for, why we choose the words we choose, and how we intend to make the web a calmer
              place.
            </p>
          </div>
        </Slide>

        {/* 05 Who we are */}
        <Slide n={5} section="Defining our brand">
          <H num="2.1">Who we are</H>
          <Big className="mt-auto max-w-5xl text-forest">
            AdaptWeb AI is your honest layer on the web — it strips the pressure out of every page and reshapes it
            for how you think.
          </Big>
          <div className="mt-8 grid gap-6 text-sm text-ink/70 md:grid-cols-2">
            <p>
              <b className="text-ink">Vision.</b> A web where every page tells you the truth by default — the real
              price, the real deadline, the real choice.
            </p>
            <p>
              <b className="text-ink">Mission.</b> Give every person a layer between them and manipulative design:
              one that removes pressure, surfaces what’s hidden, and adapts layout to how they read.
            </p>
          </div>
        </Slide>

        {/* 06 Role */}
        <Slide n={6} section="Defining our brand">
          <H num="2.2">The role of AdaptWeb</H>
          <div className="mt-8 grid flex-1 gap-6 text-sm md:grid-cols-3">
            {[
              ["Challenge", "Sites are engineered to rush us. Countdowns that reset, stock that never runs out, fees revealed on the last step, add-ons pre-ticked. One layout is forced on every kind of thinker.", "bg-paper"],
              ["Solution", "A Chrome extension that reads each page, recognises dark patterns from a community rule map (AI writes rules for new sites), strips them, surfaces the true total, and reshapes layout into Analytical, Minimalist or Visual mode.", "bg-lime"],
              ["Result", "People decide at their own pace, with the real numbers in front of them. Every change logged and reversible — the web gets quieter, and trust goes to the sites that never needed tricks.", "bg-cream"],
            ].map(([t, d, bg]) => (
              <div key={t} className={`flex flex-col rounded-3xl p-6 ${bg}`}>
                <p className="mono-label text-xs font-semibold text-forest">{t}</p>
                <p className="mt-3 leading-relaxed text-ink/80">{d}</p>
              </div>
            ))}
          </div>
        </Slide>

        {/* 07 Values */}
        <Slide n={7} section="Defining our brand">
          <H num="2.3">Brand values</H>
          <div className="mt-6 flex flex-1 flex-col justify-center divide-y divide-ink/10">
            {[
              ["Honesty", "We never invent prices, discounts or claims. We remove pressure and reveal what is already true.", "Truthful. Factual. Verifiable."],
              ["Agency", "Every change is visible, logged and reversible. You decide; we just clear the noise.", "Control. Choice. Undo."],
              ["Clarity", "Real totals, real specs, real deadlines — shaped for the way you read.", "Plain. Structured. Readable."],
              ["Calm", "No urgency, no alarms, no gotchas — including in our own product.", "Unhurried. Quiet. Steady."],
            ].map(([v, d, t]) => (
              <div key={v} className="grid items-baseline gap-2 py-3 md:grid-cols-[1fr_1.4fr_1fr] md:gap-8">
                <p className="font-display text-3xl font-semibold tracking-tight text-forest sm:text-4xl">{v}</p>
                <p className="text-sm text-ink/75">{d}</p>
                <p className="text-sm text-muted">{t}</p>
              </div>
            ))}
          </div>
        </Slide>

        {/* 08 Personality statement */}
        <Slide n={8} section="Defining our brand" tone="ink">
          <H num="2.4">Brand personality</H>
          <Big className="mt-auto max-w-5xl">
            Every page you visit has an agenda. <span className="text-lime">So do we: yours.</span>
          </Big>
        </Slide>

        {/* 09 Personality pillars */}
        <Slide n={9} section="Defining our brand" tone="paper">
          <H num="2.4">Brand personality</H>
          <div className="mt-8 grid flex-1 gap-4 md:grid-cols-3">
            {[
              ["01", "Calm Guardian", "We stand between you and the pressure — steady, never alarmist. We don’t panic about the web; we quietly fix it.", Sprout],
              ["02", "Plain-spoken Translator", "We turn “+ fees at checkout” into a number, and “only 2 left” into what we actually know. Facts, not drama.", TagLens],
              ["03", "Quiet Ally", "We are on your side and out of your way. We show our work, and we hand back control the moment you want it.", Network],
            ].map(([n, t, d, Art]) => {
              const A = Art as typeof Sprout;
              return (
                <div key={n as string} className="flex flex-col rounded-3xl bg-cream p-6">
                  <A className="h-16 w-16" />
                  <p className="mt-auto pt-6 font-display text-2xl font-semibold tracking-tight">
                    <span className="text-forest">{n as string}</span> {t as string}
                  </p>
                  <p className="mt-2 text-sm text-ink/70">{d as string}</p>
                </div>
              );
            })}
          </div>
        </Slide>

        {/* 10 Tone of voice */}
        <Slide n={10} section="Defining our brand">
          <H num="2.5">Tone of voice</H>
          <div className="mt-4 grid gap-6 md:grid-cols-[1fr_1.2fr]">
            <div>
              <Big className="text-forest">Calm. Factual. On your side.</Big>
              <p className="mt-4 text-sm text-ink/70">
                We are factual, but not cold. We are protective, but not alarmist. We are confident, but never
                pushy — we are the one brand on the page that will never rush you.
              </p>
            </div>
            <div className="space-y-3 text-sm">
              {[
                ["Removed a countdown that restarts on every visit.", "Gotcha! This site is LYING to you 🚨", "State what we did and why, without theatre."],
                ["True total: $165.37 incl. shipping and fees.", "You were about to get scammed.", "Give the number. Let it speak."],
                ["Showing the original page. Turn AdaptWeb back on anytime.", "Are you sure? You’ll be manipulated again.", "Never use the tricks we remove — not even jokingly."],
              ].map(([d, x, why]) => (
                <div key={d} className="grid gap-2 rounded-2xl bg-paper/60 p-4 sm:grid-cols-2">
                  <p>
                    <span className="mono-label mb-1 block text-[10px] font-semibold text-lime-deep">Do</span>
                    {d}
                  </p>
                  <p>
                    <span className="mono-label mb-1 block text-[10px] font-semibold text-poppy">Don’t</span>
                    <span className="text-ink/60">{x}</span>
                  </p>
                  <p className="text-xs text-muted sm:col-span-2">{why}</p>
                </div>
              ))}
            </div>
          </div>
        </Slide>

        {/* 11 Visual identity divider */}
        <Slide n={11} section="Visual identity" tone="ink">
          <span className="mono-label text-sm">3.0</span>
          <div className="mt-auto flex items-end justify-between gap-8">
            <h2 className="font-display text-[clamp(2.6rem,7vw,6rem)] font-semibold leading-[0.95] tracking-[-0.045em]">
              Visual
              <br />
              Identity
            </h2>
            <LogoMark size={160} className="hidden md:block" />
          </div>
        </Slide>

        {/* 12 Logo */}
        <Slide n={12} section="Visual identity">
          <H num="3.1">Logo — The Peel</H>
          <div className="mt-6 grid flex-1 gap-6 md:grid-cols-[1fr_1.3fr]">
            <div className="space-y-4 text-sm text-ink/75">
              <p>
                Our mark is a page with its corner lifting away — the pressure layer peeling back to reveal the
                honest web underneath, in Lime.
              </p>
              <p>
                Two lines stand for the page’s content: left intact, just clearer. The corner fold is always the
                accent colour; the outline is always Ink.
              </p>
              <ul className="space-y-1.5 pt-2">
                <li>· Minimum size: 16px mark, 96px lockup</li>
                <li>· Clear space: the height of the peel on every side</li>
                <li>· The “AI” tag sits in a Lime pill, Geist Mono</li>
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 grid place-items-center rounded-3xl border border-ink/10 bg-cream py-10">
                <Logo className="scale-150" />
              </div>
              <div className="grid place-items-center rounded-3xl bg-lime py-8">
                <LogoMark size={64} peel="#2D6A4F" />
              </div>
              <div className="grid place-items-center rounded-3xl bg-ink py-8">
                <LogoMark size={64} />
              </div>
            </div>
          </div>
        </Slide>

        {/* 13 Core colours */}
        <Slide n={13} section="Visual identity">
          <H num="3.2">Core colours</H>
          <div className="mt-6 grid flex-1 gap-6 md:grid-cols-[1fr_2fr]">
            <p className="text-sm text-ink/75">
              Ink and Paper do the quiet work. Lime is the brand’s signal: it marks the honest layer — anything
              AdaptWeb has adapted, revealed or made calmer.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {CORE.map((c) => (
                <div key={c.name} className={`flex flex-col rounded-2xl p-4 ${c.cls} ${c.name === "Paper" ? "ring-1 ring-ink/10" : ""}`}>
                  <p className="font-semibold">{c.name}</p>
                  <p className="mono-label mt-2 text-[10px] opacity-70">HEX {c.hex}</p>
                  <p className="mono-label text-[10px] opacity-70">RGB {c.rgb}</p>
                  <p className="mt-auto pt-10 text-xs opacity-80">{c.role}</p>
                </div>
              ))}
            </div>
          </div>
        </Slide>

        {/* 14 Secondary + semantic */}
        <Slide n={14} section="Visual identity">
          <H num="3.3">Secondary & semantic colour</H>
          <div className="mt-6 grid flex-1 gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-3">
              <p className="text-sm text-ink/75">Secondary colours support, never lead.</p>
              <div className="grid flex-1 grid-cols-3 gap-3">
                {SECONDARY.map((c) => (
                  <div key={c.name} className={`flex flex-col rounded-2xl p-4 ${c.cls} ${c.name === "Cream" ? "ring-1 ring-ink/10" : ""}`}>
                    <p className="font-semibold">{c.name}</p>
                    <p className="mono-label mt-2 text-[10px] opacity-70">{c.hex}</p>
                    <p className="mt-auto pt-6 text-xs opacity-80">{c.role}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-sm text-ink/75">
                Colour tells the product story. <b>Pressure is Ember; adapted is Lime.</b> Ember is reserved for
                pointing out dark patterns — we never use it on our own buttons.
              </p>
              <div className="space-y-2">
                {SEMANTIC.map((c) => (
                  <div key={c.name} className="flex items-center gap-3 rounded-2xl bg-paper/60 p-2.5">
                    <span className={`h-10 w-10 shrink-0 rounded-xl ${c.cls}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">
                        {c.name} <span className="mono-label ml-1 text-[10px] text-muted">{c.hex}</span>
                      </p>
                      <p className="text-xs text-muted">{c.use}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Slide>

        {/* 15 Colour combinations */}
        <Slide n={15} section="Visual identity">
          <H num="3.4">Colour combinations</H>
          <div className="mt-6 grid flex-1 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {[
              ["bg-paper text-ink", "Ink / Paper", true],
              ["bg-lime text-ink", "Ink / Lime", true],
              ["bg-ink text-lime", "Lime / Ink", true],
              ["bg-forest text-cream", "Cream / Forest", true],
              ["bg-cream text-forest", "Forest / Cream", true],
              ["bg-amber text-ink", "Ink / Amber", true],
              ["bg-lime text-cream", "Cream / Lime", false],
              ["bg-forest text-ink", "Ink / Forest", false],
              ["bg-ember text-lime", "Lime / Ember", false],
              ["bg-amber text-lime", "Lime / Amber", false],
              ["bg-paper text-cream", "Cream / Paper", false],
              ["bg-ember text-cream", "Ember as our CTA", false],
            ].map(([cls, label, ok]) => (
              <div key={label as string} className="flex flex-col gap-1.5">
                <div className={`relative grid flex-1 min-h-20 place-items-center rounded-2xl font-display text-3xl font-semibold ${cls} ring-1 ring-ink/5`}>
                  Aa
                  <span
                    className={`absolute left-2 top-2 grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold text-white ${
                      ok ? "bg-lime-deep" : "bg-poppy"
                    }`}
                  >
                    {ok ? "✓" : "✕"}
                  </span>
                </div>
                <p className="mono-label text-[9px] text-muted">{label as string}</p>
              </div>
            ))}
          </div>
        </Slide>

        {/* 16 Typeface statement */}
        <Slide n={16} section="Visual identity" tone="ink">
          <H num="3.5">Typeface</H>
          <Big className="mt-auto max-w-4xl">
            Typography is how we keep our voice <span className="text-lime">calm and certain</span> — big, warm
            and impossible to misread.
          </Big>
        </Slide>

        {/* 17 Type system */}
        <Slide n={17} section="Visual identity">
          <H num="3.6">Type system</H>
          <div className="mt-6 grid flex-1 gap-6 md:grid-cols-3">
            {[
              ["Primary · Display", "font-display text-5xl font-semibold tracking-[-0.04em]", "Bricolage Grotesque", "Headlines and big numbers. SemiBold, tracking −3% to −4.5%. Warm, slightly quirky — echoes the hand-drawn illustration."],
              ["Secondary · Body", "font-sans text-4xl", "Geist", "Body, UI and long-form. Regular and Medium. Neutral and highly legible at small sizes."],
              ["Tertiary · Label", "mono-label text-3xl", "Geist Mono", "Uppercase labels, data callouts and tags like “PATTERN REMOVED”. Never for headlines or paragraphs."],
            ].map(([k, cls, name, d]) => (
              <div key={k} className="flex flex-col rounded-3xl bg-paper/60 p-6">
                <p className="mono-label text-[10px] text-muted">{k}</p>
                <p className={`mt-4 ${cls}`}>{name}</p>
                <p className={`mt-3 text-lg opacity-70 ${cls.split(" ")[0]}`}>Aa Bb Cc 0123456789</p>
                <p className="mt-auto pt-6 text-sm text-ink/70">{d}</p>
              </div>
            ))}
          </div>
        </Slide>

        {/* 18 Hierarchy */}
        <Slide n={18} section="Visual identity">
          <H num="3.7">Typeface hierarchy</H>
          <div className="mt-6 flex flex-1 flex-col justify-center gap-5">
            <div>
              <p className="text-[11px] text-muted">Headline · Bricolage Grotesque SemiBold</p>
              <p className="font-display text-[clamp(2rem,5vw,4.2rem)] font-semibold leading-none tracking-[-0.045em]">
                The web, without the pressure.
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted">Sub-headline · Bricolage Grotesque Medium</p>
              <p className="font-display text-3xl font-medium tracking-tight">Read. Recognise. Reshape.</p>
            </div>
            <div>
              <p className="text-[11px] text-muted">Body · Geist Regular</p>
              <p className="max-w-3xl text-ink/80">
                AdaptWeb AI strips fake countdowns, invented scarcity and hidden fees from any site — then reshapes the
                page for how you think.
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted">Annotation · Geist Mono, uppercase</p>
              <p className="mono-label text-sm">Fake countdown removed · resets on every visit</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="rounded-full border-2 border-ink px-5 py-2 text-sm font-semibold">Learn more</span>
              <span className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-cream">Add to cart</span>
              <span className="sticker rounded-full bg-lime px-5 py-2 text-sm font-semibold">Get early access</span>
              <span className="rounded-full bg-cream px-5 py-2 text-sm font-semibold ring-1 ring-ink/10">Show original</span>
            </div>
          </div>
        </Slide>

        {/* 19 Illustration */}
        <Slide n={19} section="Visual identity" tone="paper">
          <H num="3.8">Illustration</H>
          <div className="mt-6 grid flex-1 gap-6 md:grid-cols-[1fr_2fr]">
            <div className="space-y-3 text-sm text-ink/75">
              <p>Hand-drawn, friendly objects with a thick Ink outline and flat fills from the palette.</p>
              <ul className="space-y-1.5">
                <li>· 3px round-capped Ink stroke at 120px</li>
                <li>· Flat fills: Lime, Forest, Cream, Amber — no gradients</li>
                <li>· Everyday objects as metaphors: windows, tags, lenses, sprouts</li>
                <li>· A little wobble; a little sparkle; never a frown</li>
              </ul>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[OpenWindow, CrackedHourglass, TagLens, ScanLens, Sprout, Network, Wand, AirFryer].map((A, i) => (
                <div key={i} className="grid aspect-square place-items-center rounded-2xl bg-cream p-3">
                  <A className="h-full w-full" />
                </div>
              ))}
            </div>
          </div>
        </Slide>

        {/* 20 UI language */}
        <Slide n={20} section="Visual identity">
          <H num="3.9">UI language</H>
          <div className="mt-6 grid flex-1 gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-3 rounded-3xl bg-paper/60 p-5">
              <p className="mono-label text-[10px] text-muted">Chips & stickers</p>
              <div className="flex flex-wrap gap-2">
                <span className="sticker rounded-full bg-lime px-3 py-1 mono-label text-[10px]">True total $165.37</span>
                <span className="sticker rounded-full bg-cream px-3 py-1 mono-label text-[10px]">Add-on unticked</span>
                <span className="rounded-full bg-ink px-3 py-1 mono-label text-[10px] text-cream">Drip pricing</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border-2 border-dashed border-lime-deep/70 bg-lime/25 px-3 py-1.5 text-[11px] text-forest">
                <span className="grid h-4 w-4 place-items-center rounded-full bg-forest text-[9px] text-lime">✓</span>
                <span className="mono-label">False scarcity removed</span>
              </div>
              <p className="mt-auto text-xs text-muted">
                Removed elements leave a dashed Lime ghost — we show what we took away.
              </p>
            </div>
            <div className="flex flex-col gap-3 rounded-3xl bg-paper/60 p-5">
              <p className="mono-label text-[10px] text-muted">Progress & gauges</p>
              <div className="flex h-3 overflow-hidden rounded-full text-lime-deep">
                <div className="w-2/3 rounded-full bg-lime-deep" />
                <div className="hatch flex-1 opacity-30" />
              </div>
              <div className="flex h-3 overflow-hidden rounded-full text-amber">
                <div className="w-1/3 rounded-full bg-amber" />
                <div className="hatch flex-1 opacity-30" />
              </div>
              <p className="mt-auto text-xs text-muted">Rounded bars, hatched remainder. Soft, never alarming.</p>
            </div>
            <div className="flex flex-col gap-3 rounded-3xl bg-ink p-5 text-cream">
              <p className="mono-label text-[10px] text-cream/50">Cards</p>
              <div className="rounded-2xl bg-lime p-4 text-ink">
                <p className="mono-label text-[10px]">Page adapted</p>
                <p className="font-display text-3xl font-semibold">7 <span className="text-sm">patterns removed</span></p>
              </div>
              <p className="mt-auto text-xs text-cream/50">28px radius, soft shadow; Ink for the extension chrome.</p>
            </div>
          </div>
        </Slide>

        {/* 21 Brand in action */}
        <Slide n={21} section="Visual identity" tone="ink">
          <H num="3.10">Brand in action</H>
          <div className="mt-6 grid flex-1 grid-cols-2 gap-3 md:grid-cols-4 md:grid-rows-2">
            <div className="flex flex-col rounded-3xl bg-lime p-5 text-ink md:row-span-2">
              <LogoMark size={28} />
              <p className="mt-4 font-display text-3xl font-semibold leading-none tracking-tight">Your calm layer on the web</p>
              <OpenWindow className="mt-auto w-full" />
            </div>
            <div className="col-span-2 flex flex-col justify-between rounded-3xl bg-cream p-5 text-ink">
              <Logo />
              <p className="font-display text-3xl font-semibold leading-none tracking-[-0.04em]">
                The web, without the <span className="bg-lime px-1">pressure.</span>
              </p>
            </div>
            <div className="flex flex-col rounded-3xl bg-forest p-5 text-cream md:row-span-2">
              <p className="font-display text-3xl font-semibold leading-none tracking-tight">See the true total</p>
              <TagLens className="mt-auto w-full" />
            </div>
            <div className="col-span-2 rounded-3xl bg-ink-soft p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-display font-semibold"><LogoMark size={20} />AdaptWeb</span>
                <span className="h-5 w-9 rounded-full bg-lime" />
              </div>
              <div className="mt-3 rounded-xl bg-lime px-3 py-2 text-ink">
                <span className="mono-label text-[10px]">Page adapted · 7 removed</span>
              </div>
            </div>
          </div>
        </Slide>

        {/* 22 Misapplication */}
        <Slide n={22} section="Visual identity">
          <H num="3.11">Brand misapplication</H>
          <div className="mt-6 grid flex-1 gap-6 md:grid-cols-[1fr_2fr]">
            <p className="text-sm text-ink/75">
              The fastest way to break this brand is to borrow the tricks we remove. If it would get stripped by
              AdaptWeb, it doesn’t belong in AdaptWeb.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["⚡ Only 3 invites left — join now!", "No urgency or scarcity copy. Ever.", "bg-ember text-white"],
                ["You saved $1,000,000,000!!", "No inflated or invented numbers.", "bg-amber text-ink"],
                ["Turn off? You’ll get scammed 😱", "No confirmshaming in our own UI.", "bg-poppy text-white"],
                ["AdaptWeb", "No outlined, glowing or gradient logos.", "bg-linear-to-r from-lime to-ember text-transparent bg-clip-text font-display text-3xl font-semibold"],
              ].map(([ex, rule, cls]) => (
                <div key={rule} className="flex flex-col gap-2">
                  <div className="relative grid min-h-24 flex-1 place-items-center rounded-2xl bg-paper/60 p-4 text-center">
                    <span className={`rounded-xl px-3 py-2 text-sm font-semibold ${cls}`}>{ex}</span>
                    <span className="absolute left-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-poppy text-[10px] font-bold text-white">
                      ✕
                    </span>
                  </div>
                  <p className="text-xs text-muted">{rule}</p>
                </div>
              ))}
            </div>
          </div>
        </Slide>

        {/* 23 Close */}
        <Slide n={23} section="Close" tone="lime" className="items-center text-center">
          <div className="m-auto flex flex-col items-center gap-5">
            <LogoMark size={72} />
            <p className="font-display text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">
              The web, without the pressure.
            </p>
            <Link href="/" className="sticker rounded-full bg-cream px-6 py-3 font-semibold">
              See the product →
            </Link>
          </div>
        </Slide>
      </div>
    </main>
  );
}
