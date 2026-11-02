/**
 * Standalone smoke test runner for Workstream B engine.
 */
import { execFile } from "node:child_process";
import { readFile, writeFile, unlink } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const demoHtmlPath = resolve(rootDir, "fixtures/demo-store.html");
const distContentJs = await readFile(resolve(rootDir, "dist/content.js"), "utf8");
const demoHtml = await readFile(demoHtmlPath, "utf8");

// The verification script executes synchronously after content.js
const testScript = `
  (function runChecks() {
    const res = { passed: true, tests: [] };
    const test = (name, cond, details = "") => {
      res.tests.push({ name, passed: !!cond, details: String(details) });
      if (!cond) res.passed = false;
    };

    const aw = window.__ADAPTWEB__;
    test("AdaptWeb engine loaded", !!aw);

    if (aw) {
      const state = aw.getState();
      test("State initialized", !!state);
      test("Changes recorded (>=5)", state.changes.length >= 5, "Count: " + state.changes.length);

      // Check banner
      const banner = document.getElementById("flash-sale-banner");
      test("Urgency banner hidden", banner?.classList.contains("aw-hidden"));

      // Check ghosts
      const ghosts = document.querySelectorAll(".aw-ghost");
      test("Ghosts inserted (>=3)", ghosts.length >= 3, "Count: " + ghosts.length);

      // Check scarcity
      const scarcity = document.getElementById("scarcity-pill");
      test("Scarcity hidden", scarcity?.classList.contains("aw-hidden"));

      // Check viewers
      const viewers = document.getElementById("viewer-count-wrap");
      test("Viewers hidden", viewers?.classList.contains("aw-hidden"));

      // Check addon checkbox
      const cb = document.getElementById("protection-plan-checkbox");
      test("Addon unticked", cb && !cb.checked);

      // Check confirmshaming
      const decline = document.getElementById("confirmshame-decline");
      test("Confirmshaming rewritten", decline?.textContent?.trim() === "No thanks", decline?.textContent?.trim());

      // Check modal
      const modal = document.getElementById("newsletter-modal");
      test("Modal dismissed", modal?.style?.display === "none");

      // Check true total
      test("True Total computed", !!state.trueTotal, JSON.stringify(state?.trueTotal?.parts));
      if (state.trueTotal) {
        test("True Total item price $129.99", state.trueTotal.shownPrice === 129.99, "Price: " + state.trueTotal.shownPrice);
        test("True Total total >= 154", state.trueTotal.total >= 154, "Total: " + state.trueTotal.total + " parts: " + JSON.stringify(state.trueTotal.parts));
      }

      // Check shadow dom hosts
      const ttHost = document.querySelector("adaptweb-true-total");
      test("True Total card host in DOM", !!ttHost);

      const panelHost = document.querySelector("adaptweb-mode-panel");
      test("Mode panel host in DOM", !!panelHost);

      // Test Mode switching
      aw.engine.applyMode("minimalist", document);
      const rec = document.getElementById("recommendations-section");
      test("Minimalist mode dims clutter", rec?.classList.contains("aw-dimmed"));

      aw.engine.applyMode("visual", document);
      const visualHost = document.querySelector("adaptweb-mode-panel");
      test("Visual mode host present", !!visualHost);
      const statGrid = visualHost?.shadowRoot?.querySelector(".stat-grid");
      test("Visual mode stat grid rendered", !!statGrid);

      aw.engine.applyMode("analytical", document);

      // Check snapshot
      const snap = aw.engine.snapshot(document);
      test("Snapshot nodes <= 250", snap.nodes.length > 5 && snap.nodes.length <= 250, "Nodes: " + snap.nodes.length);
      test("Snapshot title valid", snap.title.includes("AirCrisp"));

      // Test peek
      if (ghosts.length > 0) {
        const ghost = ghosts[0];
        const el = ghost.nextElementSibling;
        ghost.click();
        const unhidden = !el.classList.contains("aw-hidden");
        ghost.click();
        const rehidden = el.classList.contains("aw-hidden");
        test("Ghost peek toggle works", unhidden && rehidden);
      }

      // Test undoAll
      aw.engine.undoAll();
      test("Undo restores banner", !banner?.classList.contains("aw-hidden"));
      test("Undo restores decline text", decline?.textContent?.includes("rather pay full price"));
      test("Undo removes True Total host", !document.querySelector("adaptweb-true-total"));
      test("Undo removes Mode panel host", !document.querySelector("adaptweb-mode-panel"));
    }

    const out = document.createElement("div");
    out.id = "SMOKE_RESULTS";
    out.textContent = JSON.stringify(res);
    document.body.appendChild(out);
  })();
`;

// Inject content.js and testScript directly into HTML
const inlineTestHtml = demoHtml.replace(
  "</body>",
  `<script>${distContentJs}</script>
   <script>${testScript}</script>
   </body>`,
);

const tempHtmlPath = resolve(rootDir, "fixtures/inline-test.html");
await writeFile(tempHtmlPath, inlineTestHtml, "utf8");

execFile(
  chromePath,
  ["--headless=new", "--disable-gpu", "--no-sandbox", "--dump-dom", tempHtmlPath],
  { maxBuffer: 10 * 1024 * 1024 },
  async (err, stdout, stderr) => {
    await unlink(tempHtmlPath).catch(() => {});

    const match = stdout.match(/<div id="SMOKE_RESULTS">([\s\S]*?)<\/div>/);
    if (!match) {
      console.error("SMOKE_RESULTS div not found! Stdout snippet:\n", stdout.slice(-2000));
      process.exit(1);
    }

    const results = JSON.parse(match[1]);
    console.log("\n=================== SMOKE TEST RESULTS ===================");
    let allPassed = true;
    for (const t of results.tests) {
      const sym = t.passed ? "✅" : "❌";
      if (!t.passed) allPassed = false;
      console.log(`${sym} ${t.name}${t.details ? "  [" + t.details + "]" : ""}`);
    }
    console.log("==========================================================\n");

    if (allPassed) {
      console.log("🎯 ALL CHECKS PASSED!");
      process.exit(0);
    } else {
      console.error("❌ SOME CHECKS FAILED");
      process.exit(1);
    }
  },
);
