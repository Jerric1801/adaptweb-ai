// AdaptWeb extension build (esbuild). `node build.mjs [--watch]`
// Output: extension/dist  → load unpacked in chrome://extensions
import * as esbuild from "esbuild";
import { cp, mkdir, rm } from "node:fs/promises";

const watch = process.argv.includes("--watch");

// Public, client-safe values (publishable key). Override with env if needed.
const SUPABASE_URL = process.env.SUPABASE_URL ?? "https://pkfzydrmnagrxpkilufs.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_0WTKSufAZP6LbicrvMKhJA_X3SEkGtG";
const WEB_URL = process.env.WEB_URL ?? "https://adaptweb-ai.netlify.app";

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });

const common = {
  bundle: true,
  target: "chrome120",
  sourcemap: watch ? "inline" : false,
  minify: !watch,
  logLevel: "info",
  jsx: "automatic",
  jsxImportSource: "preact",
  define: {
    __SUPABASE_URL__: JSON.stringify(SUPABASE_URL),
    __SUPABASE_KEY__: JSON.stringify(SUPABASE_KEY),
    __WEB_URL__: JSON.stringify(WEB_URL),
    __DEV__: JSON.stringify(watch),
  },
};

const builds = [
  { entryPoints: { background: "src/background/index.ts" }, format: "esm" },
  { entryPoints: { content: "src/content/index.ts" }, format: "iife" },
  { entryPoints: { popup: "src/popup/main.tsx" }, format: "iife" },
];

const copyStatic = () => cp("static", "dist", { recursive: true });
await copyStatic();

if (watch) {
  for (const b of builds) {
    const ctx = await esbuild.context({ ...common, ...b, outdir: "dist" });
    await ctx.watch();
  }
  const { watch: fsWatch } = await import("node:fs");
  fsWatch("static", { recursive: true }, () => copyStatic().catch(console.error));
  console.log("watching… reload the extension in chrome://extensions after changes");
} else {
  await Promise.all(builds.map((b) => esbuild.build({ ...common, ...b, outdir: "dist" })));
}
