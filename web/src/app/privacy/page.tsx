import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Privacy — AdaptWeb AI",
  description: "What AdaptWeb AI runs locally, what it sends, and what it never collects.",
};

const CONTACT = "jomoai1808@gmail.com";

const SECTIONS: { title: string; body: React.ReactNode }[] = [
  {
    title: "What runs on your device",
    body: "Reading the page and making changes — removing countdowns, unticking add-ons, surfacing fees — all happens locally in your browser.",
  },
  {
    title: "What is sent",
    body: (
      <ul className="list-disc space-y-2 pl-5">
        <li>The <strong>domain and path</strong> of the page, to look up community rules.</li>
        <li>
          For pages we haven’t seen, a <strong>redacted structural snapshot</strong> for AI analysis: element types and
          short labels, with no form values and no personal text.
        </li>
        <li>
          <strong>Counts of patterns removed per domain</strong>, so your dashboard can show them.
        </li>
      </ul>
    ),
  },
  {
    title: "What we never collect",
    body: (
      <ul className="list-disc space-y-2 pl-5">
        <li>Your browsing history.</li>
        <li>Page contents beyond the redacted snapshot above.</li>
        <li>Anything you type into forms.</li>
      </ul>
    ),
  },
  {
    title: "Accounts",
    body: "Anonymous by default. We only hold your email if you choose to sign in to see your dashboard.",
  },
  {
    title: "Deleting your data",
    body: (
      <>
        Email{" "}
        <a className="font-semibold underline decoration-lime-deep decoration-2 underline-offset-4" href={`mailto:${CONTACT}`}>
          {CONTACT}
        </a>{" "}
        and we’ll delete your account and everything linked to it.
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 sm:py-20">
        <span className="mono-label text-[10px] text-forest">Privacy</span>
        <h1 className="mt-3 font-display text-[clamp(2.4rem,6vw,4.5rem)] font-semibold leading-[0.95] tracking-[-0.045em]">
          Plain-language privacy.
        </h1>
        <p className="mt-5 text-lg text-ink/70">The short version: your pages stay yours.</p>

        <div className="mt-10 space-y-4">
          {SECTIONS.map((s) => (
            <section key={s.title} className="soft-card rounded-[28px] bg-cream p-6 sm:p-8">
              <h2 className="font-display text-xl font-semibold tracking-tight">{s.title}</h2>
              <div className="mt-3 leading-relaxed text-ink/75">{s.body}</div>
            </section>
          ))}
        </div>
        <p className="mt-8 text-xs text-muted">Last updated 2 November 2026.</p>
      </main>
      <SiteFooter />
    </div>
  );
}
