"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MOCK, supabase } from "@/lib/supabase";
import { useSession } from "@/lib/useSession";

export default function LoginForm() {
  const router = useRouter();
  const { session, loading } = useSession();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already signed in (or magic link just completed) → straight to the dashboard.
  useEffect(() => {
    if (!loading && session) router.replace("/dashboard/");
  }, [loading, session, router]);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    if (MOCK) {
      setStep("code");
      setBusy(false);
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${location.origin}/dashboard/`,
      },
    });
    setBusy(false);
    if (error) setError(error.message);
    else setStep("code");
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    if (MOCK) {
      router.push("/dashboard/");
      return;
    }
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "email",
    });
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    router.push("/dashboard/");
  }

  return (
    <div className="soft-card w-full max-w-md rounded-[28px] bg-cream p-7 sm:p-9">
      <span className="mono-label text-[10px] text-forest">Sign in</span>
      <h1 className="mt-3 font-display text-4xl font-semibold leading-none tracking-[-0.04em]">
        {step === "email" ? "Welcome back." : "Check your inbox."}
      </h1>
      <p className="mt-3 text-ink/70">
        {step === "email"
          ? "We’ll email you a 6-digit code. No password to remember."
          : `We sent a 6-digit code to ${email.trim()}. The link in that email works too.`}
      </p>

      {MOCK && (
        <p className="mt-4 rounded-xl bg-amber/30 px-3 py-2 text-xs text-ink/80">
          Sample-data mode — no Supabase connected. Any code works.
        </p>
      )}

      {step === "email" ? (
        <form onSubmit={sendCode} className="mt-6 space-y-4">
          <label className="block text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoFocus
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-2xl border-2 border-ink/15 bg-white/60 px-4 py-3 outline-none focus:border-forest"
          />
          <button
            disabled={busy}
            className="sticker w-full rounded-full bg-lime px-6 py-3 font-semibold transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            {busy ? "Sending…" : "Email me a code"}
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="mt-6 space-y-4">
          <label className="block text-sm font-medium" htmlFor="code">
            6-digit code
          </label>
          <input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            autoFocus
            pattern="[0-9]{6,10}"
            maxLength={10}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="123456"
            className="w-full rounded-2xl border-2 border-ink/15 bg-white/60 px-4 py-3 text-center font-mono text-2xl tracking-[0.4em] outline-none focus:border-forest"
          />
          <button
            disabled={busy}
            className="sticker w-full rounded-full bg-lime px-6 py-3 font-semibold transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            {busy ? "Checking…" : "Sign in"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setCode("");
              setError(null);
            }}
            className="w-full text-sm text-muted hover:text-ink"
          >
            Use a different email
          </button>
        </form>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm text-poppy">
          {error}
        </p>
      )}
    </div>
  );
}
