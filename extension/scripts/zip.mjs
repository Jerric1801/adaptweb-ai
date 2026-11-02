// Zips extension/dist → extension/adaptweb-extension.zip (inside one folder, with INSTALL.txt)
// and copies it to web/public for download.
import { execSync } from "node:child_process";
import { copyFileSync, cpSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const stage = mkdtempSync(join(tmpdir(), "adaptweb-"));
const dir = join(stage, "adaptweb-extension");
cpSync("dist", dir, { recursive: true });
writeFileSync(
  join(dir, "INSTALL.txt"),
  `AdaptWeb AI — install (Chrome, Edge, Arc, Brave)

1. Keep this folder somewhere permanent (don't delete it after loading).
2. Open chrome://extensions and turn on "Developer mode" (top right).
3. Click "Load unpacked" and choose THIS folder (the one containing manifest.json).
4. Pin AdaptWeb from the puzzle-piece menu, then browse as usual.

Details and troubleshooting: see the Install page on the AdaptWeb site.
`,
);

rmSync("adaptweb-extension.zip", { force: true });
execSync(`cd "${stage}" && zip -qr "${process.cwd()}/adaptweb-extension.zip" adaptweb-extension`, { stdio: "inherit" });
rmSync(stage, { recursive: true, force: true });
copyFileSync("adaptweb-extension.zip", "../web/public/adaptweb-extension.zip");
console.log("✓ adaptweb-extension.zip → web/public/adaptweb-extension.zip");
