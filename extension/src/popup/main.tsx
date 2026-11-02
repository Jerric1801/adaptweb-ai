/** C5 — Full Preact popup for AdaptWeb AI */
import { render, h, Fragment } from "preact";
import { useState, useEffect, useCallback } from "preact/hooks";
import {
  DEFAULT_SETTINGS,
  PATTERN_LABELS,
  STORAGE_KEYS,
  type PageState,
  type ReadingMode,
  type Settings,
} from "../shared/contracts";

// ── Types ─────────────────────────────────────────────────────────────

type AuthState =
  | { status: "loading" }
  | { status: "anon" }
  | { status: "otp_sent"; email: string }
  | { status: "signed_in"; email: string };

type PopupState = {
  settings: Settings;
  pageState: PageState | null;
  authState: AuthState;
  currentDomain: string;
  loading: boolean;
};

// ── Helpers ──────────────────────────────────────────────────────────

async function sendToContent<T>(msg: object): Promise<T | null> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return null;
    return await chrome.tabs.sendMessage(tab.id, msg);
  } catch {
    return null;
  }
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab ?? null;
}

function domainOf(url?: string): string {
  try {
    return new URL(url ?? "").hostname;
  } catch {
    return "";
  }
}

async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.sync.set({ [STORAGE_KEYS.settings]: settings });
}

// ── Sub-components ────────────────────────────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      class={`toggle ${on ? "toggle--on" : ""}`}
    >
      <span class="sr-only">Toggle</span>
      <span class="toggle__thumb" />
    </button>
  );
}

function SmallToggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      class={`small-toggle ${on ? "small-toggle--on" : ""}`}
    >
      <span class="small-toggle__thumb" />
    </button>
  );
}

function StatusCard({ state }: { state: PageState | null }) {
  if (!state || !state.enabled) {
    return (
      <div class="card card--grey">
        <span class="card__label">AdaptWeb disabled</span>
      </div>
    );
  }
  if (state.analyzing) {
    return (
      <div class="card card--lime-outline">
        <span class="pulse-dot" />
        <span class="card__label">AI is reading this page…</span>
      </div>
    );
  }
  if (state.changes.length > 0) {
    return (
      <div class="card card--lime">
        <span class="card__label">
          Page adapted · {state.changes.length} pattern
          {state.changes.length !== 1 ? "s" : ""} removed
        </span>
      </div>
    );
  }
  return (
    <div class="card card--cream">
      <span class="card__label">Nothing to strip here</span>
    </div>
  );
}

function TrueTotalCard({ state }: { state: PageState }) {
  const { trueTotal } = state;
  if (!trueTotal) return null;

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: trueTotal.currency || "USD",
    }).format(n);

  return (
    <div class="card card--total">
      <div class="total__headline">{fmt(trueTotal.total)}</div>
      <div class="total__parts">
        {trueTotal.parts.map((p) => (
          <div key={p.label} class="total__part">
            <span>{p.label}</span>
            <span>{fmt(p.value)}</span>
          </div>
        ))}
      </div>
      {trueTotal.hiddenDelta > 0 && (
        <div class="total__hidden">+{fmt(trueTotal.hiddenDelta)} hidden fees</div>
      )}
    </div>
  );
}

function ModeControl({
  mode,
  onChange,
}: {
  mode: ReadingMode;
  onChange: (m: ReadingMode) => void;
}) {
  const modes: { id: ReadingMode; label: string }[] = [
    { id: "analytical", label: "Analytical" },
    { id: "minimalist", label: "Minimalist" },
    { id: "visual", label: "Visual" },
  ];
  return (
    <div class="segmented">
      {modes.map((m) => (
        <button
          key={m.id}
          type="button"
          class={`segmented__btn ${mode === m.id ? "segmented__btn--active" : ""}`}
          onClick={() => onChange(m.id)}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

function ChangeList({
  state,
  onHighlight,
}: {
  state: PageState;
  onHighlight: (id: string) => void;
}) {
  if (state.changes.length === 0) return null;
  return (
    <div class="change-list">
      {state.changes.map((c) => (
        <button
          key={c.id}
          type="button"
          class="change-item"
          onClick={() => onHighlight(c.id)}
        >
          <span class="change-item__check">✓</span>
          <span class="change-item__body">
            <span class="change-item__label">{PATTERN_LABELS[c.pattern]}</span>
            {c.reason && <span class="change-item__reason">{c.reason}</span>}
          </span>
        </button>
      ))}
    </div>
  );
}

function FooterAnon() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sendCode = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await chrome.runtime.sendMessage({
        type: "AUTH_SEND_OTP",
        email,
      });
      if (res?.error) setError(res.error);
      else setSent(true);
    } catch (e) {
      setError("Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await chrome.runtime.sendMessage({
        type: "AUTH_VERIFY_OTP",
        email,
        token: otp,
      });
      if (res?.error) setError(res.error);
    } catch {
      setError("Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="footer-auth">
      {!sent ? (
        <>
          <input
            class="auth-input"
            type="email"
            placeholder="your@email.com"
            value={email}
            onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
          />
          <button class="btn btn--lime" onClick={sendCode} disabled={loading || !email}>
            {loading ? "Sending…" : "Send code"}
          </button>
        </>
      ) : (
        <>
          <input
            class="auth-input"
            type="text"
            placeholder="6-digit code"
            value={otp}
            onInput={(e) => setOtp((e.target as HTMLInputElement).value)}
            maxLength={6}
          />
          <button class="btn btn--lime" onClick={verify} disabled={loading || otp.length < 6}>
            {loading ? "Verifying…" : "Verify"}
          </button>
        </>
      )}
      {error && <span class="auth-error">{error}</span>}
    </div>
  );
}

function FooterSignedIn({
  email,
  onSignOut,
}: {
  email: string;
  onSignOut: () => void;
}) {
  return (
    <div class="footer-auth footer-auth--signed-in">
      <span class="footer-auth__email">{email}</span>
      <a
        class="btn btn--outline btn--sm"
        href={`${typeof __WEB_URL__ !== "undefined" ? __WEB_URL__ : "https://adaptweb-ai.netlify.app"}/dashboard`}
        target="_blank"
        rel="noopener"
      >
        Open dashboard ↗
      </a>
      <button class="btn btn--ghost btn--sm" onClick={onSignOut}>
        Sign out
      </button>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────

declare const __WEB_URL__: string;

function App() {
  const [popup, setPopup] = useState<PopupState>({
    settings: DEFAULT_SETTINGS,
    pageState: null,
    authState: { status: "loading" },
    currentDomain: "",
    loading: true,
  });

  // Load initial data
  useEffect(() => {
    (async () => {
      try {
        // Settings
        const stored = await chrome.storage.sync.get(STORAGE_KEYS.settings);
        const settings: Settings = {
          ...DEFAULT_SETTINGS,
          ...(stored[STORAGE_KEYS.settings] ?? {}),
        };

        // Active tab + page state
        const tab = await getActiveTab();
        const domain = domainOf(tab?.url);
        let pageState: PageState | null = null;

        if (tab?.id) {
          pageState = await sendToContent<PageState>({ type: "GET_STATE" });
          if (!pageState) {
            // Fallback to session storage
            const key = `${STORAGE_KEYS.session}:tab:${tab.id}`;
            const s = await chrome.storage.session.get(key);
            pageState = s[key] ?? null;
          }
        }

        // Auth state
        const authRes = await chrome.runtime.sendMessage({ type: "AUTH_GET_USER" });
        let authState: AuthState = { status: "anon" };
        if (authRes?.email) {
          authState = { status: "signed_in", email: authRes.email };
        }

        setPopup({
          settings,
          pageState,
          authState,
          currentDomain: domain,
          loading: false,
        });
      } catch {
        setPopup((p) => ({ ...p, loading: false }));
      }
    })();
  }, []);

  // Listen for storage changes while popup is open
  useEffect(() => {
    const handler = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area === "sync" && changes[STORAGE_KEYS.settings]) {
        const settings: Settings = {
          ...DEFAULT_SETTINGS,
          ...(changes[STORAGE_KEYS.settings].newValue ?? {}),
        };
        setPopup((p) => ({ ...p, settings }));
      }
    };
    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }, []);

  const updateSettings = useCallback(
    async (patch: Partial<Settings>) => {
      const next = { ...popup.settings, ...patch };
      setPopup((p) => ({ ...p, settings: next }));
      await saveSettings(next);
    },
    [popup.settings]
  );

  const handleHighlight = useCallback(async (changeId: string) => {
    await sendToContent({ type: "HIGHLIGHT", changeId });
  }, []);

  const handleUndoAll = useCallback(async () => {
    await sendToContent({ type: "UNDO_ALL" });
  }, []);

  const handleReapply = useCallback(async () => {
    await sendToContent({ type: "REAPPLY" });
  }, []);

  const handleSignOut = useCallback(async () => {
    await chrome.runtime.sendMessage({ type: "AUTH_SIGN_OUT" });
    setPopup((p) => ({ ...p, authState: { status: "anon" } }));
  }, []);

  const toggleGlobal = useCallback(
    (on: boolean) => updateSettings({ enabled: on }),
    [updateSettings]
  );

  const toggleDomain = useCallback(
    (pause: boolean) => {
      const disabledDomains = pause
        ? [...popup.settings.disabledDomains, popup.currentDomain].filter(Boolean)
        : popup.settings.disabledDomains.filter((d) => d !== popup.currentDomain);
      updateSettings({ disabledDomains });
    },
    [popup.settings, popup.currentDomain, updateSettings]
  );

  const domainPaused =
    popup.currentDomain
      ? popup.settings.disabledDomains.includes(popup.currentDomain)
      : false;

  if (popup.loading) {
    return (
      <main class="popup">
        <div class="loader">Loading…</div>
      </main>
    );
  }

  const { settings, pageState, authState, currentDomain } = popup;

  return (
    <main class="popup">
      {/* Header */}
      <header class="header">
        <div class="header__brand">
          <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="#B8F28F"/>
            <path d="M8 6h16a2 2 0 0 1 2 2v10l-8 8H8a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" fill="#FAF6EF" stroke="#121412" stroke-width="2.4" stroke-linejoin="round"/>
            <path d="M26 18c-5 0-8 3-8 8 1.6-3.6 4.4-6.4 8-8z" fill="#2D6A4F" stroke="#121412" stroke-width="2.4" stroke-linejoin="round"/>
            <path d="M10.5 12h9M10.5 16.5h5.5" stroke="#121412" stroke-width="2.4" stroke-linecap="round"/>
          </svg>
          <span class="header__title">AdaptWeb</span>
        </div>
        <Toggle on={settings.enabled} onChange={toggleGlobal} />
      </header>

      {/* Pause on domain */}
      {currentDomain && settings.enabled && (
        <div class="domain-row">
          <span class="domain-row__label">Pause on {currentDomain}</span>
          <SmallToggle on={domainPaused} onChange={toggleDomain} />
        </div>
      )}

      <div class="divider" />

      {/* Status card */}
      <StatusCard state={settings.enabled && !domainPaused ? pageState : null} />

      {/* True total */}
      {pageState && pageState.trueTotal && settings.showTrueTotal && (
        <TrueTotalCard state={pageState} />
      )}

      {/* Reading mode */}
      {settings.enabled && (
        <section class="section">
          <div class="section__label">Reading mode</div>
          <ModeControl
            mode={settings.mode}
            onChange={(m) => updateSettings({ mode: m })}
          />
        </section>
      )}

      {/* Change list */}
      {pageState && pageState.changes.length > 0 && settings.enabled && (
        <ChangeList state={pageState} onHighlight={handleHighlight} />
      )}

      {/* Actions */}
      {pageState && pageState.changes.length > 0 && (
        <div class="actions">
          <button class="btn btn--ghost" onClick={handleUndoAll}>
            Show original
          </button>
          <button class="btn btn--lime" onClick={handleReapply}>
            Re-apply
          </button>
        </div>
      )}

      <div class="divider" />

      {/* Footer auth */}
      {authState.status === "anon" || authState.status === "otp_sent" ? (
        <FooterAnon />
      ) : authState.status === "signed_in" ? (
        <FooterSignedIn email={authState.email} onSignOut={handleSignOut} />
      ) : null}
    </main>
  );
}

render(<App />, document.getElementById("app")!);
