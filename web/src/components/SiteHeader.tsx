import Link from "next/link";
import { Logo } from "./Logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink/5 bg-paper/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" aria-label="AdaptWeb AI home">
          <Logo />
        </Link>
        <div className="flex items-center gap-1 text-sm font-semibold text-ink/70 sm:gap-2">
          <Link href="/install/" className="rounded-full px-3 py-2 hover:text-ink sm:px-4">
            Install
          </Link>
          <Link href="/dashboard/" className="rounded-full px-3 py-2 hover:text-ink sm:px-4">
            Dashboard
          </Link>
          <a
            href="/adaptweb-extension.zip"
            download
            className="hidden rounded-full bg-ink px-4 py-2 text-cream transition-transform hover:-translate-y-0.5 sm:block"
          >
            Download for Chrome
          </a>
        </div>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-ink/10 bg-paper">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-muted sm:px-6">
        <Logo />
        <div className="flex gap-6">
          <Link href="/install/" className="hover:text-ink">Install</Link>
          <Link href="/privacy/" className="hover:text-ink">Privacy</Link>
          <a href="https://github.com/Jerric1801/adaptweb-ai" className="hover:text-ink">GitHub</a>
        </div>
        <p className="mono-label text-[10px]">Prototype · 2026</p>
      </div>
    </footer>
  );
}
