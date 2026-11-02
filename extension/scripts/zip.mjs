// Zips extension/dist → extension/adaptweb-extension.zip and copies it to web/public for download.
import { execSync } from "node:child_process";
import { copyFileSync, rmSync } from "node:fs";

rmSync("adaptweb-extension.zip", { force: true });
execSync("cd dist && zip -qr ../adaptweb-extension.zip .", { stdio: "inherit" });
copyFileSync("adaptweb-extension.zip", "../web/public/adaptweb-extension.zip");
console.log("✓ adaptweb-extension.zip → web/public/adaptweb-extension.zip");
