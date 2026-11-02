import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { OpenWindow, ScanLens, Sprout } from "@/components/Illustrations";

export const metadata: Metadata = {
  title: "Install — AdaptWeb AI",
  description: "Add AdaptWeb AI to Chrome, Edge, Arc or Brave in about a minute.",
};

const STEPS = [
  {
    n: "01",
    title: "Download and unzip",
    body: "Grab the extension as a .zip, then unzip it somewhere you won’t delete — Downloads is fine.",
    art: Sprout,
    action: (
      <a
        href="/adaptweb-extension.zip"
        download
        className="sticker mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-lime px-5 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-0.5"
      >
        adaptweb-extension.zip ↓
      </a>
    ),
  },
  {
    n: "02",
    title: "Turn on Developer mode",
    body: (
      <>
        Open <code className="rounded-md bg-ink/10 px-1.5 py-0.5 font-mono text-[0.85em]">chrome://extensions</code> and
        switch on <strong>Developer mode</strong> (top right).
      </>
    ),
    art: ScanLens,
  },
  {
    n: "03",
    title: "Load unpacked and pin it",
    body: "Click “Load unpacked”, choose the unzipped folder, then pin AdaptWeb from the puzzle-piece menu so it’s one click away.",
    art: OpenWindow,
  },
];

export default function InstallPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6 sm:py-20">
        <span className="mono-label text-[10px] text-forest">Install · about 60 seconds</span>
        <h1 className="mt-3 font-display text-[clamp(2.4rem,6vw,4.5rem)] font-semibold leading-[0.95] tracking-[-0.045em]">
          Three steps to a calmer web.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-ink/70">
          Works in Chrome, Edge, Arc and Brave. No account needed to start.
        </p>

        <ol className="mt-12 grid gap-5 md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="soft-card flex flex-col rounded-[28px] bg-cream p-6">
              <s.art className="h-36 w-full" />
              <span className="mono-label mt-5 text-[10px] text-forest">Step {s.n}</span>
              <h2 className="mt-2 font-display text-2xl font-semibold leading-tight tracking-tight">{s.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink/70">{s.body}</p>
              {s.action}
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <div className="inline-flex items-center gap-3 rounded-2xl border border-ink/15 px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-amber" />
            <span className="text-sm">Chrome Web Store</span>
            <span className="mono-label text-[10px] text-muted">In review</span>
          </div>
          <Link href="/login/" className="text-sm font-semibold underline decoration-lime-deep decoration-2 underline-offset-4 hover:text-forest">
            Sign in to sync with your dashboard →
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
