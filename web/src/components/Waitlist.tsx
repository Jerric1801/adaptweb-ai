"use client";

import { useState, type FormEvent } from "react";

type Mode = "analytical" | "minimalist" | "visual";
type Status = "idle" | "loading" | "done" | "duplicate" | "error";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export default function Waitlist() {
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<Mode>("analytical");
  const [status, setStatus] = useState<Status>("idle");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!SB_URL || !KEY) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch(`${SB_URL}/rest/v1/waitlist`, {
        method: "POST",
        headers: {
          apikey: KEY,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ email: email.trim().toLowerCase(), mode, source: "landing" }),
      });
      if (res.ok) setStatus("done");
      else if (res.status === 409) setStatus("duplicate");
      else setStatus("error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done" || status === "duplicate") {
    return (
      <div className="rounded-3xl bg-lime p-6 text-ink">
        <p className="mono-label text-xs text-forest">
          {status === "done" ? "You’re on the list" : "Already on the list"}
        </p>
        <p className="mt-2 font-display text-2xl font-semibold tracking-tight">
          We’ll email the early build to {email}.
        </p>
        <p className="mt-1 text-sm text-forest">No countdowns. No “only 3 spots left”. Promise.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <p className="mono-label mb-2 text-xs text-cream/60">How do you like to read?</p>
        <div className="flex flex-wrap gap-2">
          {(["analytical", "minimalist", "visual"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-full border px-4 py-1.5 text-sm capitalize transition-colors ${
                mode === m
                  ? "border-lime bg-lime text-ink"
                  : "border-cream/25 text-cream/80 hover:border-cream/60"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="email" className="sr-only">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="min-w-0 flex-1 rounded-full border-2 border-cream/20 bg-ink-soft px-5 py-3 text-cream placeholder:text-cream/40 focus:border-lime focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-full bg-lime px-6 py-3 font-semibold text-ink transition-transform hover:-translate-y-0.5 disabled:opacity-60"
        >
          {status === "loading" ? "Adding…" : "Get the early build"}
        </button>
      </div>
      {status === "error" && (
        <p className="text-sm text-amber">
          Couldn’t reach the list just now. Try again in a moment.
        </p>
      )}
    </form>
  );
}
