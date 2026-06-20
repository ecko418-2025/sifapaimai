import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ensureProjectDirs, readJsonFile, writeJsonFile } from "../../src/storage/jsonStore.js";
import { createPaths } from "../../src/runtime/paths.js";

describe("jsonStore", () => {
  it("writes and reads JSON files", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sifapaimai-json-"));
    const file = path.join(dir, "sample.json");

    writeJsonFile(file, { ok: true });

    expect(readJsonFile(file, { ok: false })).toEqual({ ok: true });
  });

  it("creates runtime directories", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sifapaimai-paths-"));
    const paths = createPaths(dir);

    ensureProjectDirs(paths);

    expect(fs.existsSync(paths.snapshotsDir)).toBe(true);
    expect(fs.existsSync(paths.dailyCsvDir)).toBe(true);
    expect(fs.existsSync(paths.lifecycleDir)).toBe(true);
    expect(fs.existsSync(paths.reportsDir)).toBe(true);
    expect(fs.existsSync(paths.logsDir)).toBe(true);
  });
});
