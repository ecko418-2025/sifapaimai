import path from "node:path";

export function createPaths(rootDir = process.cwd()) {
  return {
    rootDir,
    configFile: path.join(rootDir, "config", "rules.json"),
    dataDir: path.join(rootDir, "data"),
    latestJson: path.join(rootDir, "data", "latest.json"),
    latestCsv: path.join(rootDir, "data", "latest.csv"),
    snapshotsDir: path.join(rootDir, "data", "snapshots"),
    dailyCsvDir: path.join(rootDir, "data", "daily"),
    lifecycleDir: path.join(rootDir, "data", "lifecycle"),
    auctionsLifecycle: path.join(rootDir, "data", "lifecycle", "auctions.json"),
    assetsLifecycle: path.join(rootDir, "data", "lifecycle", "assets.json"),
    reportsDir: path.join(rootDir, "outputs"),
    logsDir: path.join(rootDir, "logs")
  };
}
