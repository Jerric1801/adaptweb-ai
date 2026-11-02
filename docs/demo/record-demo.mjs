// Records the AdaptWeb demo video headlessly: extension loaded in Chromium, fixture store served under a
// fictional https domain, dashboard signed in as the extension's own anonymous user, captions + TTS voiceover.
//
// Usage (from any scratch dir with `npm i playwright && npx playwright install chromium`):
//   node record-demo.mjs <out.mp4>
// Needs: extension built (`cd extension && npm run build`), web built (`cd web && npm run build`), ffmpeg, macOS `say`.
import { chromium } from "playwright";
import { execFileSync, spawn } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, renameSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = process.env.AW_ROOT ?? resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const EXT = join(ROOT, "extension/dist");
const FIXTURE = readFileSync(join(ROOT, "extension/fixtures/demo-store.html"), "utf8");
const OUT = resolve(process.argv[2] ?? "adaptweb-demo.mp4");
const WEB = "http://localhost:8098";
const STORE = "https://www.brightloop-home.com/products/aircrisp-pro-6qt-air-fryer";
const SUPA_REF = "pkfzydrmnagrxpkilufs";
const work = mkdtempSync(join(tmpdir(), "aw-rec-"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// static server for web/out
const server = spawn("python3", ["-m", "http.server", "8098", "-d", join(ROOT, "web/out")], { stdio: "ignore" });
await sleep(800);

const ctx = await chromium.launchPersistentContext(join(work, "profile"), {
  channel: "chromium",
  headless: true,
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: join(work, "video"), size: { width: 1280, height: 720 } },
  args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`],
});
await ctx.route("https://www.brightloop-home.com/**", (r) => r.fulfill({ contentType: "text/html", body: FIXTURE }));

const page = ctx.pages()[0] ?? (await ctx.newPage());
await page.goto("about:blank");
const sw = ctx.serviceWorkers()[0] ?? (await ctx.waitForEvent("serviceworker"));

// extension needs its anonymous session before we start
let session;
for (let i = 0; i < 40 && !session; i++) {
  session = (await sw.evaluate(() => chrome.storage.local.get("aw:session")))["aw:session"];
  if (!session) await sleep(500);
}
if (!session) throw new Error("extension never signed in (is Anonymous sign-in enabled in Supabase?)");
const sessionJson = typeof session === "string" ? session : JSON.stringify(session);

const SETTINGS = { enabled: true, mode: "analytical", stripDarkPatterns: true, showTrueTotal: true, showGhosts: true, disabledDomains: [] };
const setSettings = (patch) =>
  sw.evaluate((s) => chrome.storage.sync.set({ "aw:settings": s }), { ...SETTINGS, ...patch });
const tabMsg = (msg) =>
  sw.evaluate(async (m) => {
    const tabs = await chrome.tabs.query({ url: "*://*.brightloop-home.com/*" });
    for (const t of tabs) await chrome.tabs.sendMessage(t.id, m).catch(() => {});
  }, msg);

await setSettings({ enabled: false });

/* ---- captions + voiceover ---- */
const clips = [];
let t0 = 0;
async function caption(text) {
  await page.evaluate((t) => {
    let el = document.getElementById("__cap");
    if (!el) {
      el = document.createElement("div");
      el.id = "__cap";
      el.style.cssText =
        "position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:2147483647;max-width:78%;padding:14px 24px;border-radius:999px;background:#121412;color:#faf6ef;font:600 20px/1.35 system-ui,sans-serif;text-align:center;box-shadow:0 8px 30px rgba(0,0,0,.35);border:2px solid #b8f28f";
      document.documentElement.appendChild(el);
    }
    el.textContent = t;
  }, text);
}
async function say(text, minMs = 0) {
  const file = join(work, `v${clips.length}.aiff`);
  execFileSync("say", ["-v", "Samantha", "-r", "170", "-o", file, text]);
  const dur = parseFloat(
    execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString(),
  ) * 1000;
  clips.push({ file, at: Date.now() - t0 });
  await caption(text);
  await sleep(Math.max(dur + 700, minMs));
}
async function scrollTo(y, ms = 1200) {
  await page.evaluate(([y, ms]) => {
    const start = scrollY, d = y - start, t = performance.now();
    return new Promise((res) => {
      const tick = (n) => {
        const k = Math.min(1, (n - t) / ms);
        scrollTo(0, start + d * (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2));
        k < 1 ? requestAnimationFrame(tick) : res();
      };
      requestAnimationFrame(tick);
    });
  }, [y, ms]);
}

t0 = Date.now();

/* 1 — intro */
await page.goto(`${WEB}/`);
await sleep(600);
await say("Online shopping is full of pressure. Fake countdowns, invented scarcity, and fees that appear at the last step.");

/* 2 — before */
await page.goto(STORE);
await sleep(1200);
await say("Here's a typical product page. A flash-sale timer, a viewer count, an add-on already ticked for me, and a pop-up begging for my email.", 2500);
await scrollTo(500, 1800);
await sleep(1500);
await scrollTo(0, 1200);

/* 3 — on */
await setSettings({ enabled: true });
await sleep(1500);
await say("Now with AdaptWeb on. The page is read locally, and the pressure is removed. Every change is marked, and nothing is hidden silently.", 3000);
await scrollTo(500, 1800);
await sleep(1500);
await scrollTo(0, 1200);

/* 4 — true total */
const total = page.getByText(/true total/i).first();
if (await total.count()) {
  await total.scrollIntoViewIfNeeded().catch(() => {});
  await say("It also shows the true cost, with fees added up and estimates clearly labelled.", 2500);
}

/* 5 — modes */
await scrollTo(0, 800);
for (const [mode, line] of [
  ["minimalist", "Minimalist mode strips the page down to what matters."],
  ["visual", "Visual mode puts the product first."],
  ["analytical", "And analytical mode brings the specs up front."],
]) {
  await setSettings({ mode });
  await sleep(800);
  await say(line, 2500);
}

/* 6 — undo */
await tabMsg({ type: "UNDO_ALL" });
await say("Everything is reversible. One click shows the original page.", 2500);
await tabMsg({ type: "REAPPLY" });
await sleep(1500);

// make sure the event queue reached Supabase before the dashboard shot
for (let i = 0; i < 40; i++) {
  const q = (await sw.evaluate(() => chrome.storage.local.get("aw:events")))["aw:events"] ?? [];
  if (!q.length) break;
  await sw.evaluate(() => chrome.alarms.getAll()).catch(() => {});
  await sleep(1000);
}

/* 7 — dashboard */
await page.goto(`${WEB}/login/`);
await page.evaluate(([k, v]) => localStorage.setItem(k, v), [`sb-${SUPA_REF}-auth-token`, sessionJson]);
await page.goto(`${WEB}/dashboard/`);
await page.waitForSelector("text=Live", { timeout: 20000 }).catch(() => {});
await sleep(1000);
await say("Everything is logged to a private dashboard. Patterns removed, sites adapted, and the hidden costs surfaced.", 3000);
await scrollTo(450, 1500);
await sleep(1500);

// fire fresh events from a second tab while the dashboard is on screen
const tab2 = await ctx.newPage();
await tab2.goto(STORE + "?second=1");
await tab2.waitForTimeout(500);
await page.bringToFront();
await say("And it updates live, as pages are adapted.", 4000);
for (let i = 0; i < 12; i++) await sleep(1000); // allow the event flush + realtime tick
await scrollTo(0, 1000);
await sleep(2500);

/* 8 — outro */
await page.goto(`${WEB}/install/`);
await sleep(600);
await say("AdaptWeb AI. The web, without the pressure. Download it free and install in about a minute.", 2500);
await sleep(1000);

const videoPath = await page.video().path();
await ctx.close();
server.kill();

/* mux */
const webm = join(work, "video", readdirSync(join(work, "video")).find((f) => videoPath.endsWith(f)) ?? "");
const args = ["-y", "-i", videoPath];
clips.forEach((c) => args.push("-i", c.file));
const filt =
  clips.map((c, i) => `[${i + 1}:a]adelay=${Math.round(c.at)}|${Math.round(c.at)}[a${i}]`).join(";") +
  `;${clips.map((_, i) => `[a${i}]`).join("")}amix=inputs=${clips.length}:normalize=0[aout]`;
args.push("-filter_complex", filt, "-map", "0:v", "-map", "[aout]", "-c:v", "libx264", "-preset", "medium", "-crf", "26", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", OUT);
execFileSync("ffmpeg", args, { stdio: "inherit" });
console.log("✓", OUT);
