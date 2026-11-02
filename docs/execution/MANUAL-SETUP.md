# Manual setup — what only you can do (≈20 min)

Do these in order. ⏱ = rough time. Steps 1–5 unblock the terminals, so do them first.

## 1. Netlify (⏱ 3 min) — skip if already live
1. app.netlify.com → **Add new site → Import from Git → GitHub → `adaptweb-ai`**
2. Leave every setting as is (`netlify.toml` handles it) → **Deploy**
3. Optional: **Site configuration → Change site name** → `adaptweb-ai`
4. Copy the URL (e.g. `https://adaptweb-ai.netlify.app`). You need it in steps 4 and 6.

## 2. Launch the 4 terminals (⏱ 3 min)
- Open 4 terminals at the repo root and run `claude` in each (bypass-permissions mode is fastest).
- Paste the A / B / C / D kickoff prompts from `docs/execution/00-OVERVIEW.md`.

## 3. Terminal A asks for credentials (⏱ 3 min)
- When asked, type in terminal A: `! supabase login` → approve in the browser.
- DB password when `supabase link` asks: the one you set for the project. **Rotate it after the pitch** (Supabase → Project Settings → Database → Reset password).
- **Anthropic API key:** console.anthropic.com → API Keys → Create. Paste it into terminal A when it asks (it runs `supabase secrets set ANTHROPIC_API_KEY=…`). Never paste it into a file.

## 4. Supabase dashboard — Auth (⏱ 5 min)
supabase.com/dashboard → project `pkfzydrmnagrxpkilufs` → **Authentication**

| Where | Set |
|---|---|
| **Sign In / Providers** → Anonymous sign-ins | **ON** |
| **Sign In / Providers** → Email | ON · **Confirm email OFF** |
| **Emails → Templates → Magic Link** | Add a line to the body: `Your code: {{ .Token }}` → Save |
| **URL Configuration** → Site URL | your Netlify URL |
| **URL Configuration** → Redirect URLs | add `https://<your-netlify>/**` and `http://localhost:3000/**` |

Terminal A may have done some of this already (`supabase config push`). Check `docs/execution/status/A.md` first.

## 5. Tell the terminals your Netlify URL (⏱ 1 min)
Paste into **C** and **D**: `Our Netlify URL is https://<your-netlify>. Use it for WEB_URL / auth redirects.`

## 6. Load the extension for the demo (⏱ 2 min — once C says the build is ready)
1. Terminal: `cd extension && npm install && npm run build`
2. Chrome → `chrome://extensions` → **Developer mode** ON → **Load unpacked** → pick `extension/dist`
3. Pin AdaptWeb (puzzle icon → pin).
4. After any rebuild, click ↻ on the extension card.

## 7. Pitch account (⏱ 2 min — once D says the dashboard is live)
1. Open `https://<your-netlify>/login/` → your email → enter the 6-digit code.
2. Dashboard → **Load demo data** (fills 30 days of events).
3. Sign in to the **extension popup** with the same email, so the dashboard and extension are linked.

## 8. Before you walk on stage (⏱ 3 min)
- Visit each demo URL once with the extension on (warms the rule cache).
- **Record a backup video:** QuickTime → File → New Screen Recording. Capture: page with extension off → toggle on → modes → dashboard updating.
- Have the landing page's **live demo** (`#demo`) open in a tab. It works with no extension, no network and no backend: your zero-risk fallback.

## Can wait until after the pitch
- Chrome Web Store: developer account ($5) at chrome.google.com/webstore/devconsole → upload `extension/adaptweb-extension.zip` (C prepares the assets in `extension/store/`).
- Rotate the DB password (see step 3).
- Custom domain on Netlify.

---

**Only 30 minutes left in total?** Treat the landing page's live demo as the pitch demo. It already shows every pattern being stripped, the true total and all three modes. Let the terminals run, and show the real extension only if C reports ✅ in `status/C.md` before you present.
