/**
 * C6 — Generate extension icons from web/src/app/icon.svg using sharp.
 * Run: node scripts/icons.mjs
 */
import sharp from "sharp";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

// Try to use the web icon; fall back to an inline SVG.
const WEB_ICON = join(__dirname, "../../web/src/app/icon.svg");
const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="8" fill="#B8F28F"/>
  <path d="M8 6h16a2 2 0 0 1 2 2v10l-8 8H8a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" fill="#FAF6EF" stroke="#121412" stroke-width="2.4" stroke-linejoin="round"/>
  <path d="M26 18c-5 0-8 3-8 8 1.6-3.6 4.4-6.4 8-8z" fill="#2D6A4F" stroke="#121412" stroke-width="2.4" stroke-linejoin="round"/>
  <path d="M10.5 12h9M10.5 16.5h5.5" stroke="#121412" stroke-width="2.4" stroke-linecap="round"/>
</svg>`;

const SIZES = [16, 32, 48, 128];
const OUT_DIR = join(rootDir, "static", "icons");

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  let svgBuffer;
  if (existsSync(WEB_ICON)) {
    svgBuffer = await readFile(WEB_ICON);
    console.log("Using web/src/app/icon.svg");
  } else {
    svgBuffer = Buffer.from(FALLBACK_SVG, "utf8");
    console.log("Using fallback SVG (web icon not found)");
  }

  await Promise.all(
    SIZES.map(async (size) => {
      const outPath = join(OUT_DIR, `icon${size}.png`);
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outPath);
      console.log(`✓ icons/icon${size}.png`);
    })
  );

  console.log("Icons generated →", OUT_DIR);
}

main().catch((e) => { console.error(e); process.exit(1); });
