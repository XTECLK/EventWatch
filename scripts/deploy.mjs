#!/usr/bin/env node
// Deploys the static frontend. Run `npm run deploy` any time to redeploy.
import { fileURLToPath } from "node:url";
import { ask, run } from "./lib.mjs";

export async function deploy() {
  console.log("Deploy the frontend:\n  1) Vercel\n  2) Netlify\n  3) Skip (run locally with: npm start)");
  const choice = await ask("Choose [1-3]: ");
  if (choice === "1") await run("npx", ["--yes", "vercel", "deploy", "--prod"]);
  else if (choice === "2") await run("npx", ["--yes", "netlify-cli", "deploy", "--prod", "--dir", "."]);
  else console.log("Skipped. Run it locally with: npm start");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  deploy().catch((e) => { console.error(e.message); process.exit(1); });
}
