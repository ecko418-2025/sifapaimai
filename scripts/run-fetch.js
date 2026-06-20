#!/usr/bin/env node

import { runFetch } from "../src/index.js";

const testMode = process.argv.includes("--test");

try {
  const result = await runFetch({ testMode });
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
