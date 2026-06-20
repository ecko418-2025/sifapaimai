import fs from "node:fs";
import path from "node:path";

export function ensureProjectDirs(paths) {
  for (const dir of [
    paths.dataDir,
    paths.snapshotsDir,
    paths.dailyCsvDir,
    paths.lifecycleDir,
    paths.reportsDir,
    paths.logsDir
  ]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function readJsonFile(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function writeJsonFile(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmp = `${filePath}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  fs.renameSync(tmp, filePath);
}
