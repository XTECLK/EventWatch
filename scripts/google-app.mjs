#!/usr/bin/env node
// Creates the dashboard's Google Sheet with the Apps Script (google/Code.js)
// attached to it, using clasp, or pushes script changes.
//
//   npm run google:create [-- --title "My Event"]
//   npm run google:update
//
// Needs `npx clasp login` and the Apps Script API turned on at
// https://script.google.com/home/usersettings.
//
// The script is bound to the sheet, so it can only touch that one spreadsheet
// (scope spreadsheets.currentonly). The first time the sheet is opened it fills
// itself with the Flags and Events tabs; you share it once by hand.
// IDs are saved to .eventwatch/app.json (scriptId, sheetId, sheetUrl, ...).
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { GOOGLE_DIR, STATE_FILE, ask, clasp, exists, openUrl, readState, writeState } from "./lib.mjs";

const MANIFEST_FILE = `${GOOGLE_DIR}/appsscript.json`;
export const sheetUrlFor = (id) => `https://docs.google.com/spreadsheets/d/${id}/edit`;
export const csvUrlFor = (id, tab) =>
  `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&headers=1&sheet=${encodeURIComponent(tab)}`;

// clasp may overwrite appsscript.json with Google's default; keep ours.
async function push(manifest) {
  await writeFile(MANIFEST_FILE, manifest);
  await clasp("push", "--force");
}

// True once the Flags tab can be read without logging in (filled and shared).
async function isPublic(sheetId) {
  try {
    const res = await fetch(csvUrlFor(sheetId, "Flags"));
    const text = await res.text();
    return res.ok && /EventName/.test(text);
  } catch {
    return false;
  }
}

export async function create(args = []) {
  if (await exists(STATE_FILE)) throw new Error("Already set up (.eventwatch/app.json). Use npm run google:update to change the script.");
  const at = args.indexOf("--title");
  const title = (at !== -1 && args[at + 1]) || "EventWatch";
  const manifest = await readFile(MANIFEST_FILE, "utf8");

  console.log(`Creating the Google Sheet "${title}" with its script…`);
  await clasp("create-script", "--type", "sheets", "--title", title, "--rootDir", ".");
  const project = JSON.parse(await readFile(`${GOOGLE_DIR}/.clasp.json`, "utf8"));
  const sheetId = [].concat(project.parentId ?? [])[0];
  if (!sheetId) throw new Error("clasp didn't report the new spreadsheet's ID (parentId in google/.clasp.json).");
  await push(manifest);

  const state = { scriptId: project.scriptId, sheetId, sheetUrl: sheetUrlFor(sheetId), title, flagsTab: "Flags", eventsTab: "Events", refresh: 15000 };
  await writeState(state);

  console.log(`
Two quick steps in the sheet that opens:
  1. Wait a moment: it fills itself with the Flags and Events tabs.
  2. Click Share, then General access: "Anyone with the link" (Viewer).
     (The site reads the sheet as public CSV. It is never written to.)
  ${state.sheetUrl}
`);
  openUrl(state.sheetUrl);

  for (;;) {
    await ask("Press Enter when done… ");
    if (await isPublic(sheetId)) break;
    console.log("Can't read the Flags tab yet. Make sure the sheet has filled in (reload it) and is shared with \"Anyone with the link\".");
  }
  console.log("\nThe sheet is readable. IDs saved to .eventwatch/app.json.");
  return state;
}

export async function update() {
  const state = await readState();
  if (!state) throw new Error("Nothing to update: run npm run setup first.");
  if (!(await exists(`${GOOGLE_DIR}/.clasp.json`))) {
    await writeFile(`${GOOGLE_DIR}/.clasp.json`, `${JSON.stringify({ scriptId: state.scriptId, rootDir: "" }, null, 2)}\n`);
  }
  await push(await readFile(MANIFEST_FILE, "utf8"));
  console.log("Pushed google/ to the sheet's script. Reload the sheet to use it.");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [action, ...args] = process.argv.slice(2);
  const actions = { create, update };
  if (!actions[action]) { console.error("Use: node scripts/google-app.mjs create [--title T] | update"); process.exit(1); }
  actions[action](args).catch((e) => { console.error(e.message); process.exit(1); });
}
