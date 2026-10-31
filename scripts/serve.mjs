#!/usr/bin/env node
// npm start: stage public/ and serve it locally.
import { buildPublic, PUBLIC_DIR, run } from "./lib.mjs";

try {
  await buildPublic();
  await run("npx", ["--yes", "serve", "."], { cwd: PUBLIC_DIR });
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
