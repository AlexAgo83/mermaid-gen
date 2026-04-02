import { access } from "node:fs/promises";
import { constants } from "node:fs";

const required = [
  "dist/index.html",
  "dist/manifest.webmanifest",
  "dist/sw.js",
  "dist/icon.svg",
];

for (const file of required) {
  try {
    await access(file, constants.F_OK);
  } catch {
    console.error(`[quality:pwa] Missing build artifact: ${file}`);
    process.exit(1);
  }
}

console.log("[quality:pwa] Required PWA build artifacts are present.");
