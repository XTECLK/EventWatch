#!/usr/bin/env node
// Creates (or updates) the Google Apps Script web app that makes and manages
// the dashboard's Google Sheet, using clasp.
//
//   npm run google:create [-- --title "My Event"]
//   npm run google:update
//
// Needs `npx clasp login` and the Apps Script API turned on at
// https://script.google.com/home/usersettings.
//
// Everything learned is saved to .eventwatch/app.json (scriptId, deploymentId,
// web app url, sheetId, sheetUrl). The site reads public/config.json,
// made from it by buildPublic() on every deploy.
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { GOOGLE_DIR, STATE_FILE, ask, clasp, exists, openUrl, readState, writeState } from "./lib.mjs";

const MANIFEST_FILE = `${GOOGLE_DIR}/appsscript.json`;

export const webAppUrl = (id) => `https://script.google.com/macros/s/${id}/exec`;
// A project's @HEAD deployment serves unversioned code; we want the real one.
export const deploymentIdIn = (out) =>
  [...out.matchAll(/\b(AKfy[\w-]{20,})\b(?!\s*@HEAD)/g)].map(([, id]) => id).at(-1);

// clasp may overwrite appsscript.json with Google's default; keep ours.
async function push(manifest) {
  await writeFile(MANIFEST_FILE, manifest);
  await clasp("push", "--force");
}

async function call(url, action, extra = {}) {
  const res = await fetch(url, { method: "POST", body: JSON.stringify({ action, ...extra }), redirect: "follow" });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return null; } // HTML = not authorized yet
}

export async function create(args = []) {
  if (await exists(STATE_FILE)) throw new Error("Already set up (.eventwatch/app.json). Use npm run google:update to change the script.");
  const at = args.indexOf("--title");
  const title = (at !== -1 && args[at + 1]) || "EventWatch";
  const manifest = await readFile(MANIFEST_FILE, "utf8");

  console.log(`Creating the Apps Script project "${title}"…`);
  await clasp("create-script", "--type", "standalone", "--title", title, "--rootDir", ".");
  const { scriptId } = JSON.parse(await readFile(`${GOOGLE_DIR}/.clasp.json`, "utf8"));

  await push(manifest);

  console.log("Deploying the web app…");
  const deploymentId = deploymentIdIn(await clasp("create-deployment", "--description", "EventWatch"));
  if (!deploymentId) throw new Error("Couldn't find the deployment ID in clasp's output; see: npx clasp list-deployments");
  const state = { scriptId, deploymentId, url: webAppUrl(deploymentId), title, flagsTab: "Flags", eventsTab: "Events", refresh: 15000 };
  await writeState(state);

  console.log(`
One step only you can do: approve the script's access to Sheets and Drive.
In the editor that opens, pick the function "authorize", click Run, and allow it.
  https://script.google.com/d/${scriptId}/edit
`);
  openUrl(`https://script.google.com/d/${scriptId}/edit`);

  // Retry until authorization is done.
  for (;;) {
    await ask("Press Enter once you've authorized it… ");
    const result = await call(state.url, "init", { title });
    if (result?.ok) {
      Object.assign(state, { sheetId: result.sheetId, sheetUrl: result.sheetUrl });
      break;
    }
    console.log(result?.error ? `The script said: ${result.error}` : "Not authorized yet (or the deployment is still starting). Try again.");
  }
  await writeState(state);
  console.log(`\nCreated the Google Sheet: ${state.sheetUrl}\nSaved the IDs and config to .eventwatch/app.json.`);
  return state;
}

export async function update() {
  const state = await readState();
  if (!state) throw new Error("Nothing to update: run npm run google:create first.");
  if (!(await exists(`${GOOGLE_DIR}/.clasp.json`))) {
    await writeFile(`${GOOGLE_DIR}/.clasp.json`, `${JSON.stringify({ scriptId: state.scriptId, rootDir: "" }, null, 2)}\n`);
  }
  await push(await readFile(MANIFEST_FILE, "utf8"));
  await clasp("update-deployment", state.deploymentId, "--description", "EventWatch");
  console.log(`Updated the script at ${state.url}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [action, ...args] = process.argv.slice(2);
  const actions = { create, update };
  if (!actions[action]) { console.error("Use: node scripts/google-app.mjs create [--title T] | update"); process.exit(1); }
  actions[action](args).catch((e) => { console.error(e.message); process.exit(1); });
}
