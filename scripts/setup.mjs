#!/usr/bin/env node
// One command: npm run setup  (log in, make the script + Sheet, deploy frontend)
import { ask, readState, run } from "./lib.mjs";
import { create } from "./google-app.mjs";
import { deploy } from "./deploy.mjs";

try {
  if (!(await readState())) {
    await run("npx", ["clasp", "show-authorized-user"], { quiet: true }).catch(async () => {
      console.log("Log in to Google (a browser window opens)…");
      await run("npx", ["clasp", "login"]);
    });
    const title = (await ask("Dashboard name [My Event]: ")) || "My Event";
    await create(["--title", title]);
  } else {
    console.log("Google side already set up (.eventwatch/app.json); skipping.");
  }
  await deploy();
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
