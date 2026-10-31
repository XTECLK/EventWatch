#!/usr/bin/env node
// Deploys the static frontend. Run `npm run deploy` any time to redeploy.
import { fileURLToPath } from "node:url";
import { ask, run, writeFrontendConfig } from "./lib.mjs";

export async function deploy() {
  await writeFrontendConfig();
  console.log("Deploy the frontend:\n  1) Vercel\n  2) Netlify\n  3) Skip (run locally with: npm start)");
  const choice = await ask("Choose [1-3]: ");
  if (choice === "1") await run("npx", ["--yes", "vercel", "deploy", "--prod"]);
  else if (choice === "2") {
    const netlify = (...args) => run("npx", ["--yes", "netlify-cli", ...args]);
    // Log in first (opens a browser); deploying without a session fails.
    // `status` may exit 0 even when logged out, so check its output.
    const status = await run("npx", ["--yes", "netlify-cli", "status"], { quiet: true }).catch(() => "");
    if (!/Current Netlify User|Email:/i.test(status)) await netlify("login");
    await netlify("deploy", "--prod", "--dir", ".");
  }
  else console.log("Skipped. Run it locally with: npm start");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  deploy().catch((e) => { console.error(e.message); process.exit(1); });
}
