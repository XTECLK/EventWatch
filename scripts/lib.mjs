import { spawn } from "node:child_process";
import { access, readFile, writeFile, mkdir } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

export const ROOT = fileURLToPath(new URL("..", import.meta.url));
export const GOOGLE_DIR = `${ROOT}google`;
export const STATE_DIR = `${ROOT}.eventwatch`;
export const STATE_FILE = `${STATE_DIR}/app.json`;

export const exists = (file) => access(file).then(() => true, () => false);

// Everything the tooling learns (script ID, deployment, web app URL, sheet ID).
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

// The site reads config.json (a dot-folder like .eventwatch/ isn't uploaded by
// every host's CLI). It's made from app.json, with only what the browser needs.
export async function writeFrontendConfig() {
  const state = await readState();
  if (!state?.sheetId) throw new Error("No sheet yet: run npm run setup first.");
  const { sheetId, flagsTab, eventsTab, refresh } = state;
  await writeFile(`${ROOT}config.json`, `${JSON.stringify({ sheetId, flagsTab, eventsTab, refresh }, null, 2)}\n`);
}
