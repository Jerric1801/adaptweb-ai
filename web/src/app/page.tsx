import Link from "next/link";
import LiveDemo from "@/components/LiveDemo";
import Waitlist from "@/components/Waitlist";
import { Logo, LogoMark } from "@/components/Logo";
import {
  CrackedHourglass,
  Network,
  OpenWindow,
  ScanLens,
  Sprout,
  TagLens,
  Wand,
} from "@/components/Illustrations";

const MARQUEE = [
  "Fake countdowns",
  "False scarcity",
  "Drip pricing",
  "Confirmshaming",
  "Pre-ticked add-ons",
  "Nagging pop-ups",
  "Fake social proof",
  "Hidden fees",
  "Roach-motel cancellations",
];

const PATTERNS = [
  {
    tag: "Fake urgency",
    before: "Sale ends in 09:59",
    after: "No real deadline — banner removed",
    art: CrackedHourglass,
  },
  {
    tag: "Drip pricing",
    before: "$129.99",
    after: "$165.37 true total, fees included",
    art: TagLens,
  },
  {
    tag: "False scarcity",
    before: "Only 2 left!",
    after: "Unverifiable stock claim hidden",
    art: ScanLens,
  },
  {
    tag: "Sneak into basket",
    before: "☑ Protection plan +$29.99",
    after: "☐ Unticked — your call",
    art: Wand,
  },
  {
    tag: "Confirmshaming",
    before: "No thanks, I hate saving money",
    after: "No thanks",
    art: Sprout,
  },
  {
    tag: "Fake social proof",
    before: "Sarah in Ohio just bought this",
    after: "Unverifiable toast removed",
    art: Network,
  },
];

const STEPS = [
  {
    n: "01",
    title: "Read",
    body: "The extension scans each page locally the moment it loads — layout, prices, timers, checkboxes.",
    art: ScanLens,
  },
  {
    n: "02",
    title: "Recognise",
    body: "Known site? Community rules arrive from the AdaptWeb map in milliseconds. New site? AI classifies the patterns and writes the fix — cached so everyone benefits.",
    art: Network,
  },
  {
    n: "03",
    title: "Reshape",
    body: "Pressure stripped, true cost surfaced, layout tuned to how you read. Every change logged, every change reversible.",
    art: Wand,
  },
];

export default function Home() {
  return (
    <main className="flex-1 overflow-x-clip">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-ink/5 bg-paper/80 backdrop-blur-md">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" aria-label="AdaptWeb AI home">
            <Logo />
          </Link>
          <div className="hidden items-center gap-7 text-sm text-ink/70 md:flex">
            <a href="#demo" className="hover:text-ink">Live demo</a>
            <a href="#patterns" className="hover:text-ink">What it removes</a>
            <a href="#how" className="hover:text-ink">How it works</a>
          </div>
          <a
            href="#get"
            className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-cream transition-transform hover:-translate-y-0.5"
          >
            Get early access
          </a>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-12 sm:px-6 md:grid-cols-[1.15fr_1fr] md:pt-20">
        <div>
          <span className="sticker inline-flex items-center gap-2 rounded-full bg-cream px-3 py-1 text-xs mono-label">
            <span className="h-2 w-2 rounded-full bg-lime-deep" /> AI layer for Chrome · Prototype
          </span>
          <h1 className="mt-6 font-display text-[clamp(2.8rem,7vw,5.6rem)] font-semibold leading-[0.95] tracking-[-0.045em]">
            The web,
            <br />
            without the{" "}
            <span className="relative inline-block">
              <span className="relative z-10">pressure.</span>
              <span className="absolute inset-x-[-4px] bottom-[0.08em] z-0 h-[0.38em] -rotate-1 rounded-md bg-lime" />
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/70">
            AdaptWeb AI strips fake countdowns, invented scarcity and hidden fees from any site —
            then reshapes the page for how <em className="not-italic font-semibold text-ink">you</em> think.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#demo"
              className="sticker rounded-full bg-lime px-6 py-3 font-semibold transition-transform hover:-translate-y-0.5"
            >
              See it strip a page ↓
            </a>
            <a
              href="#get"
              className="rounded-full border-2 border-ink px-6 py-3 font-semibold transition-colors hover:bg-ink hover:text-cream"
            >
              Join the early build
            </a>
          </div>
          <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-ink/10 pt-6">
            {[
              ["7", "pattern types"],
              ["<100ms", "to adapt"],
              ["1 click", "to undo"],
            ].map(([v, k]) => (
              <div key={k}>
                <dt className="font-display text-2xl font-semibold tracking-tight">{v}</dt>
                <dd className="mono-label text-[10px] text-muted">{k}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative mx-auto w-full max-w-md">
          <div className="absolute inset-6 -z-10 rounded-[40px] bg-cream" />
          <OpenWindow className="w-full" />
          <span
            className="sticker animate-float absolute -left-2 top-10 rounded-full bg-cream px-3 py-1.5 text-[11px] mono-label"
            style={{ ["--r" as string]: "-6deg" }}
          >
            <span className="text-poppy line-through">Ends in 09:59</span> · removed
          </span>
          <span
            className="sticker animate-float absolute -right-2 top-1/2 rounded-full bg-lime px-3 py-1.5 text-[11px] mono-label [animation-delay:1.2s]"
            style={{ ["--r" as string]: "5deg" }}
          >
            True total $165.37
          </span>
          <span
            className="sticker animate-float absolute bottom-4 left-6 rounded-full bg-amber px-3 py-1.5 text-[11px] mono-label [animation-delay:2.4s]"
            style={{ ["--r" as string]: "-3deg" }}
          >
            ☐ Add-on unticked
          </span>
        </div>
      </section>

      {/* Marquee */}
      <div className="border-y-2 border-ink bg-ink py-3 text-lime">
        <div className="flex w-max animate-marquee gap-8 whitespace-nowrap">
          {[...MARQUEE, ...MARQUEE].map((m, i) => (
            <span key={i} className="mono-label flex items-center gap-8 text-sm">
              {m} <span className="text-ember">✕</span>
            </span>
          ))}
        </div>
      </div>

      {/* Demo */}
      <section id="demo" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="mono-label text-xs text-forest">Live demo · try it</p>
            <h2 className="mt-3 font-display text-4xl font-semibold leading-[1.02] tracking-[-0.035em] sm:text-5xl">
              Flip the switch. Watch the pressure fall away.
            </h2>
          </div>
          <p className="max-w-sm text-ink/60">
            A typical product page, packed with the tricks real stores use. Turn AdaptWeb on, then try each
            reading mode.
          </p>
        </div>
        <LiveDemo />
      </section>

      {/* Patterns */}
      <section id="patterns" className="scroll-mt-20 bg-cream py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="mono-label text-xs text-forest">What it removes</p>
            <h2 className="mt-3 font-display text-4xl font-semibold leading-[1.02] tracking-[-0.035em] sm:text-5xl">
              Every trick has a tell. AdaptWeb knows them all.
            </h2>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PATTERNS.map(({ tag, before, after, art: Art }) => (
              <article
                key={tag}
                className="group flex flex-col rounded-[28px] border border-ink/10 bg-paper/60 p-6 transition-colors hover:bg-white"
              >
                <div className="flex items-start justify-between">
                  <span className="mono-label rounded-full bg-ink px-3 py-1 text-[10px] text-cream">{tag}</span>
                  <Art className="h-16 w-16 transition-transform group-hover:-rotate-6 group-hover:scale-110" />
                </div>
                <p className="mt-6 text-sm text-ember line-through decoration-2">{before}</p>
                <p className="mt-1 font-display text-xl font-semibold leading-snug tracking-tight">
                  <span className="mr-1.5 text-lime-deep">→</span>
                  {after}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Modes */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          <div>
            <p className="mono-label text-xs text-forest">Reading modes</p>
            <h2 className="mt-3 font-display text-4xl font-semibold leading-[1.02] tracking-[-0.035em] sm:text-5xl">
              Same page. Shaped for your brain.
            </h2>
            <p className="mt-5 text-lg text-ink/65">
              Pick a mode once. AdaptWeb re-lays every site you visit around it — synced to your account, so
              it follows you to every machine.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                name: "Analytical",
                desc: "Spec tables surfaced, true cost per unit, buried details pulled up.",
                bg: "bg-forest text-cream",
                bars: ["w-full", "w-5/6", "w-full", "w-2/3", "w-4/5"],
              },
              {
                name: "Minimalist",
                desc: "Just the product, the real price and the button. Nothing else.",
                bg: "bg-white text-ink",
                bars: ["w-1/2", "w-1/3"],
              },
              {
                name: "Visual",
                desc: "Bigger imagery, icon facts, less reading.",
                bg: "bg-amber text-ink",
                bars: ["w-1/3"],
              },
            ].map((m) => (
              <div key={m.name} className={`soft-card flex flex-col rounded-[28px] p-5 ${m.bg}`}>
                <div className="mb-5 space-y-1.5 rounded-2xl bg-current/10 p-3">
                  {m.name === "Visual" && <div className="mb-2 h-16 rounded-xl bg-current/25" />}
                  {m.bars.map((b, i) => (
                    <div key={i} className={`h-2 rounded-full bg-current/40 ${b}`} />
                  ))}
                </div>
                <p className="font-display text-xl font-semibold tracking-tight">{m.name}</p>
                <p className="mt-1 text-sm opacity-75">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-20 bg-ink py-20 text-cream">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="mono-label text-xs text-lime">How it works</p>
          <h2 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-[1.02] tracking-[-0.035em] sm:text-5xl">
            Read. Recognise. Reshape. Before you notice.
          </h2>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {STEPS.map(({ n, title, body, art: Art }) => (
              <div key={n} className="rounded-[28px] bg-ink-soft p-6">
                <div className="flex items-center justify-between">
                  <span className="mono-label text-sm text-lime">{n}</span>
                  <div className="rounded-2xl bg-paper p-2">
                    <Art className="h-14 w-14" />
                  </div>
                </div>
                <h3 className="mt-6 font-display text-2xl font-semibold tracking-tight">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-cream/65">{body}</p>
              </div>
            ))}
          </div>

          {/* Architecture strip */}
          <div className="mt-6 grid items-center gap-3 rounded-[28px] border border-cream/10 p-5 text-sm md:grid-cols-[1fr_auto_1fr_auto_1fr]">
            {[
              ["Chrome extension", "Content scripts · runs locally"],
              ["Community rule map", "Supabase · realtime sync"],
              ["AI pattern engine", "Classifies unknown sites"],
            ].map(([t, d], i) => (
              <div key={t} className="contents">
                <div className="rounded-2xl bg-cream/5 p-4">
                  <p className="font-semibold">{t}</p>
                  <p className="mono-label mt-1 text-[10px] text-cream/50">{d}</p>
                </div>
                {i < 2 && <span className="hidden text-center text-lime md:block">⇄</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard teaser */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div className="soft-card rounded-[32px] bg-white p-6">
            <div className="flex items-center justify-between">
              <p className="font-display text-xl font-semibold tracking-tight">Your month, unpressured</p>
              <span className="mono-label rounded-full bg-paper px-2.5 py-1 text-[10px] text-muted">
                Illustrative
              </span>
            </div>
            <div className="mt-6 grid grid-cols-[auto_1fr] items-center gap-6">
              <div className="relative h-36 w-36">
                <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#ECE6DB" strokeWidth="12" />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#7FCB55"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${0.82 * 314} 314`}
                  />
                </svg>
                <div className="absolute inset-0 grid place-content-center text-center">
                  <span className="font-display text-3xl font-semibold">214</span>
                  <span className="mono-label text-[9px] text-muted">removed</span>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  ["Hidden fees surfaced", "$86.40", "w-3/4", "bg-amber", "text-amber"],
                  ["Fake timers killed", "61", "w-1/2", "bg-lime-deep", "text-lime-deep"],
                  ["Add-ons unticked", "12", "w-1/4", "bg-forest", "text-forest"],
                ].map(([k, v, w, bg, tx]) => (
                  <div key={k}>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">{k}</span>
                      <span className="font-semibold">{v}</span>
                    </div>
                    <div className={`mt-1.5 flex h-3 overflow-hidden rounded-full ${tx}`}>
                      <div className={`${w} rounded-full ${bg}`} />
                      <div className="hatch flex-1 opacity-30" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div>
            <p className="mono-label text-xs text-forest">Your dashboard</p>
            <h2 className="mt-3 font-display text-4xl font-semibold leading-[1.02] tracking-[-0.035em] sm:text-5xl">
              See what the web tried — and what you kept.
            </h2>
            <p className="mt-5 text-lg text-ink/65">
              A calm monthly view of every pattern stripped and every fee surfaced, site by site. Proof
              that the web got quieter.
            </p>
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="bg-lime py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="max-w-3xl font-display text-4xl font-semibold leading-[1.02] tracking-[-0.035em] sm:text-5xl">
            Your browser. Your rules. Our three promises.
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              ["Honest", "We never invent prices, discounts or claims. We only remove pressure and reveal what’s already true."],
              ["Reversible", "One click shows the original page. Every change is logged so you can see exactly what we did."],
              ["Private", "Pages are adapted on your device. Rule lookups use the domain — never your browsing history."],
            ].map(([t, d]) => (
              <div key={t} className="sticker rounded-[28px] bg-cream p-6">
                <LogoMark size={28} />
                <h3 className="mt-5 font-display text-2xl font-semibold tracking-tight">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/70">{d}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-2">
            {["Travel & booking", "Ticketing", "Fast fashion", "Big-box retail", "Home appliances"].map((c) => (
              <span key={c} className="rounded-full border-2 border-ink px-4 py-1.5 text-sm font-medium">
                {c}
              </span>
            ))}
            <span className="mono-label self-center px-2 text-xs text-forest">Tuned first for these →</span>
          </div>
        </div>
      </section>

      {/* Get */}
      <section id="get" className="scroll-mt-20 bg-ink py-20 text-cream">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 md:grid-cols-2">
          <div>
            <p className="mono-label text-xs text-lime">Get AdaptWeb</p>
            <h2 className="mt-3 font-display text-4xl font-semibold leading-[1.02] tracking-[-0.035em] sm:text-5xl">
              Take the pressure off your browser.
            </h2>
            <p className="mt-5 text-cream/65">
              The Chrome Web Store listing is in review. Join the list and we’ll send the early build with a
              60-second install guide.
            </p>
            <ol className="mt-8 space-y-3 text-sm">
              {[
                "Download the early build (.zip) from your invite email",
                "Open chrome://extensions and switch on Developer mode",
                "Click “Load unpacked”, pick the folder — done",
              ].map((s, i) => (
                <li key={s} className="flex gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-lime font-mono text-xs text-ink">
                    {i + 1}
                  </span>
                  <span className="text-cream/80">{s}</span>
                </li>
              ))}
            </ol>
            <div className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-cream/15 px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-amber" />
              <span className="text-sm">Chrome Web Store</span>
              <span className="mono-label text-[10px] text-cream/50">In review</span>
            </div>
          </div>
          <div className="rounded-[32px] bg-ink-soft p-6 sm:p-8">
            <Waitlist />
          </div>
        </div>
      </section>

      <footer className="border-t border-ink/10 bg-paper">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-muted sm:px-6">
          <Logo />
          <div className="flex gap-6">
            <a href="https://github.com/Jerric1801/adaptweb-ai" className="hover:text-ink">GitHub</a>
          </div>
          <p className="mono-label text-[10px]">Prototype · 2026</p>
        </div>
      </footer>
    </main>
  );
}
