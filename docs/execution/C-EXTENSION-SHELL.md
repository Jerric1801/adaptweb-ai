# Workstream C — Extension shell (service worker, popup, auth, packaging)

**You own:** everything in `extension/` **except** B's paths (`src/engine/**`, `src/content/**`, `static/content.css`, `fixtures/**`). That covers `build.mjs`, `package.json`, `static/manifest.json`, `static/popup.*`, icons, `src/background/**`, `src/popup/**`, `src/lib/**` and `scripts/**`. You may also write `web/public/adaptweb-extension.zip`.
**You are the integrator:** you drive the end-to-end demo rehearsal.
**Contract:** `contracts/types.ts`. Message shapes are fixed: `ContentToBackground`, `ContextResponse`, `ToContent`, `AnalyzeResponse`.

---

## Dev loop

```bash
cd extension && npm install && npm run dev
# chrome://extensions → Load unpacked → extension/dist ; ↻ after rebuilds
# SW logs: chrome://extensions → AdaptWeb → "service worker" link → DevTools
```

## C1 — Supabase client in the service worker (`src/lib/supabase.ts`)

```ts
import { createClient } from "@supabase/supabase-js";
const storage = {
  getItem: async (k: string) => (await chrome.storage.local.get(k))[k] ?? null,
  setItem: async (k: string, v: string) => chrome.storage.local.set({ [k]: v }),
  removeItem: async (k: string) => chrome.storage.local.remove(k),
};
export const supabase = createClient(__SUPABASE_URL__, __SUPABASE_KEY__, {
  auth: { storage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: "aw:session" },
});
export async function ensureSession() {
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session;
  const { data: anon, error } = await supabase.auth.signInAnonymously();
  if (error) console.warn("[aw] anon sign-in failed", error.message);   // works offline w/o session
  return anon?.session ?? null;
}
```
- Call `ensureSession()` on `chrome.runtime.onInstalled` and lazily before any DB call.
- Until A's G1 lands, wrap DB calls in try/catch and fall back to empty rules.
- If the bundle complains about `window`/`localStorage` in the SW, check the supabase-js docs for SW support. Realtime needs `WebSocket`, which exists in Chrome 116+ service workers.

## C2 — Rules + context (`src/background/rules.ts`)

`GET_CONTEXT(domain, path)` →
1. `settings` from `chrome.storage.sync[STORAGE_KEYS.settings]` merged over `DEFAULT_SETTINGS`.
2. Rules: check the cache `chrome.storage.local[STORAGE_KEYS.rulesCache + domain]`. If it's older than `RULE_CACHE_TTL_MS` or missing, query `supabase.from("site_rules").select("*").in("domain", candidates)`. Candidates are the domain plus its parent domains, e.g. `shop.sharkninja.com` → `[shop.sharkninja.com, sharkninja.com]`.
3. Keep sets whose `path_pattern` glob matches `path` (`*` matches all; `/products/*` → prefix). Sort curated → ai → community. Cache them and return `ContextResponse`.

`ANALYZE(snapshot)` → `supabase.functions.invoke("analyze-page", { body: { snapshot } })`. On success, write `ruleSet` into the domain cache and reply with an `AnalyzeResponse`. Timeout at 25s and reply `{ ruleSet: null, error: "timeout" }`. Dedupe concurrent calls per `domain+path`.

## C3 — Tab state, badge, events (`src/background/state.ts`, `events.ts`)

- `REPORT(state)`: store in `Map<tabId, PageState>` and mirror to `chrome.storage.session` so it survives SW restarts. The popup reads from there.
- Badge: `chrome.action.setBadgeText({ tabId, text: n ? String(n) : "" })`, background `#B8F28F`, text colour `#121412` (`setBadgeTextColor`). While analyzing, show `…`.
- Events: diff the new `changes` against the last reported ones by `id` → `EventInsert[]` with `value_cents`. Push them to `STORAGE_KEYS.pendingEvents`. Flush via `supabase.from("adaptation_events").insert(batch)` when the queue reaches 10, or 5s after the last report (use `chrome.alarms`; add the `"alarms"` permission). Keep the queue on failure. Only events per **new** page change: dedupe per tab+url.
- Clear tab state on `chrome.tabs.onRemoved` and on navigation (`chrome.tabs.onUpdated` with status `loading`).

## C4 — Settings sync + realtime (`src/background/profile.ts`)

- Signed-in non-anonymous user: on start and every GET_CONTEXT older than 60s, pull `user_profiles` (`reading_mode`, `strip_dark_patterns`, `show_true_total`) → merge into settings.
- Popup changes → write `chrome.storage.sync` + `update user_profiles` (when signed in).
- Realtime: `supabase.channel("profile").on("postgres_changes", { event: "UPDATE", schema: "public", table: "user_profiles", filter: \`id=eq.${uid}\` }, …)`. On change: update settings, then broadcast `SETTINGS_CHANGED` to every tab (`chrome.tabs.query({})` → `chrome.tabs.sendMessage`, ignore errors). **Demo moment:** change mode on the web dashboard → open product page re-lays live. Re-subscribe on SW wake. The polling fallback covers SW sleep.
- `chrome.storage.onChanged` (settings key) → broadcast `SETTINGS_CHANGED` too, so popup changes propagate.

## C5 — Popup (`src/popup/*`, `static/popup.css`) — Preact

Match the landing page's demo side panel (`web/src/components/LiveDemo.tsx`, the `<aside>`). 360px wide, Ink background.

1. **Header:** logo mark + "AdaptWeb" + big toggle (global `enabled`). Under it, a small "Pause on {domain}" switch (`disabledDomains`).
2. **Status card:**
   - Lime "Page adapted · **N** patterns removed"
   - Analyzing: lime outline, "AI is reading this page…" with a pulse
   - 0 changes: calm Cream card "Nothing to strip here"
   - Disabled: grey
3. **True total** (if `trueTotal`): big total + parts list, "+$X hidden" in Amber.
4. **Reading mode** segmented control (Analytical / Minimalist / Visual). Writes settings, and content re-lays.
5. **Change list:** pattern label + reason, Lime check. Click → `HIGHLIGHT` to the tab.
6. **Actions:** "Show original" (`UNDO_ALL`) / "Re-apply" (`REAPPLY`).
7. **Footer:**
   - Anonymous: "Sign in to sync" → email field → "Send code" (`signInWithOtp({ email, options: { shouldCreateUser: true } })`) → 6-digit field → `verifyOtp({ email, token, type: "email" })`.
   - Signed in: email + "Open dashboard ↗" (`__WEB_URL__/dashboard/`) + sign out.

Get state: `chrome.tabs.query({active:true,currentWindow:true})` → `chrome.tabs.sendMessage(tabId, {type:"GET_STATE"})`, falling back to the stored tab state. Fonts: system stack for UI; optional Bricolage Grotesque woff2 in `static/fonts/` for the headings.

## C6 — Icons, manifest, packaging (H3)

- Icons: `npm i -D sharp`, then `scripts/icons.mjs` renders `web/src/app/icon.svg` → `static/icons/{16,32,48,128}.png`. Add `"icons"` and `"action.default_icon"` to the manifest.
- Manifest: add the `"alarms"` permission (if used) and `"description"`. Keep permissions minimal: `storage`, `tabs`, `activeTab`, `alarms`. Bump the version on every zip.
- `WEB_URL`: set to the real Netlify URL in `build.mjs` once the user provides it.
- `npm run zip` → `web/public/adaptweb-extension.zip`. Commit the zip (`[C] zip v0.x`). D links to `/adaptweb-extension.zip`.
- Web Store assets in `extension/store/`: 128px icon, 1280×800 screenshots (before/after on the demo store), a short + long description (single purpose: "removes manipulative design patterns and shows true prices"), privacy policy URL `__WEB_URL__/privacy/` (D builds it). Tell the user it's ready to submit (U8).

## C7 — Integration & demo driver (H3+)

- G2: fixture store stripped (with B).
- G3: unknown real site → ANALYZE → rules applied → second visit cached (with A).
- G4: strip a page → dashboard counter moves (with D).
- G5: run the overview demo checklist on all 5 URLs, then record the backup video (QuickTime screen recording) of the full flow.

## Definition of done

- [ ] Anonymous session on install; OTP sign-in from popup works
- [ ] Rules fetched + cached; ANALYZE end to end; badge counts
- [ ] Events land in `adaptation_events` (check the dashboard)
- [ ] Mode change on dashboard re-lays open tab live
- [ ] Popup on-brand, all states covered
- [ ] Zip in `web/public`, icons, Web Store assets ready
