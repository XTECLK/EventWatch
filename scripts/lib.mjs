import { spawn } from "node:child_process";
import { access, cp, readFile, writeFile, mkdir } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

export const ROOT = fileURLToPath(new URL("..", import.meta.url));
export const GOOGLE_DIR = `${ROOT}google`;
export const STATE_DIR = `${ROOT}.eventwatch`;
export const STATE_FILE = `${STATE_DIR}/app.json`;

export const exists = (file) => access(file).then(() => true, () => false);

// Everything the tooling learns (script ID, sheet ID and URL).
export async function readState() {
  try { return JSON.parse(await readFile(STATE_FILE, "utf8")); } catch { return null; }
}
export async function writeState(state) {
  await mkdir(STATE_DIR, { recursive: true });
  await writeFile(STATE_FILE, `${JSON.stringify(state, null, 2)}\n`);
}

// Runs a command, showing and returning its output.
export function run(command, args, { cwd = ROOT, input, quiet = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: [input === undefined ? "inherit" : "pipe", "pipe", "pipe"] });
    let output = "";
    for (const stream of [child.stdout, child.stderr]) {
      stream.on("data", (chunk) => {
        output += chunk;
        if (!quiet) (stream === child.stdout ? process.stdout : process.stderr).write(chunk);
      });
    }
    if (input !== undefined) child.stdin.end(input);
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) return resolve(output);
      const hint = /Apps Script API/i.test(output)
        ? "\nTurn on the Apps Script API at https://script.google.com/home/usersettings, then try again."
        : args.includes("clasp") && /login|credential|unauthenticated/i.test(output) ? "\nLog in first: npx clasp login" : "";
      reject(new Error(`${command} ${args.join(" ")} failed.${hint}`));
    });
  });
}

export const clasp = (...args) => run("npx", ["clasp", ...args], { cwd: GOOGLE_DIR });

export async function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try { return (await rl.question(question)).trim(); } finally { rl.close(); }
}

export function openUrl(url) {
  const cmd = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  spawn(cmd, [url], { stdio: "ignore", detached: true, shell: process.platform === "win32" }).on("error", () => {}).unref();
}

// Stages the site into public/ (gitignored): the static files plus config.json,
// made from .eventwatch/app.json with only what the browser needs. Files are
// overwritten in place so host links saved in public/ (.vercel, .netlify) survive.
export const SITE_FILES = ["index.html", "style.css", "script.js", "i18n.js", "config.js", "assets"];
export const PUBLIC_DIR = `${ROOT}public`;

export async function buildPublic() {
  const state = await readState();
  if (!state?.sheetId) throw new Error("No sheet yet: run npm run setup first.");
  await mkdir(PUBLIC_DIR, { recursive: true });
  for (const f of SITE_FILES) await cp(`${ROOT}${f}`, `${PUBLIC_DIR}/${f}`, { recursive: true });
  const { sheetId, flagsTab, eventsTab, refresh } = state;
  await writeFile(`${PUBLIC_DIR}/config.json`, `${JSON.stringify({ sheetId, flagsTab, eventsTab, refresh }, null, 2)}\n`);
}
