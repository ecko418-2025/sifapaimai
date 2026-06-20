import fs from "node:fs";
import path from "node:path";
import { loadConfig } from "./config/loadConfig.js";
import { detectChanges } from "./lifecycle/detectChanges.js";
import { updateLifecycle } from "./lifecycle/updateLifecycle.js";
import { dateKey } from "./normalize/time.js";
import { renderMarkdownReport } from "./reports/renderMarkdownReport.js";
import { createRunClock } from "./runtime/clock.js";
import { createLogger } from "./runtime/logger.js";
import { createPaths } from "./runtime/paths.js";
import { AliAuctionSource } from "./sources/aliAuctionSource.js";
import { recordsToCsv } from "./storage/csvWriter.js";
import { ensureProjectDirs, readJsonFile, writeJsonFile } from "./storage/jsonStore.js";

export async function runFetch({ testMode = false, rootDir = process.cwd(), now = new Date() } = {}) {
  const paths = createPaths(rootDir);
  const config = loadConfig(paths.configFile);
  const clock = createRunClock(now);
  ensureProjectDirs(paths);

  const logFile = path.join(paths.logsDir, `${testMode ? "test" : "run"}-${clock.dateKey}.log`);
  const logger = createLogger(logFile);
  const startedAt = Date.now();
  logger.info("开始抓取", { testMode, now: clock.nowText });

  const source = new AliAuctionSource({
    config,
    logger,
    now,
    runtime: process.platform === "darwin" ? "mac-dev" : "linux-cron",
    scriptVersion: readPackageVersion(rootDir)
  });

  const records = await source.fetch({ testMode });
  const durationMs = Date.now() - startedAt;
  for (const record of records) {
    record.runDurationMs = durationMs;
  }

  if (testMode) {
    const testFile = path.join(paths.dataDir, "test-latest.json");
    writeJsonFile(testFile, {
      capturedAt: clock.nowText,
      count: records.length,
      records
    });
    logger.info("测试模式完成", { count: records.length, durationMs, output: testFile });
    return { mode: "test", count: records.length, durationMs, output: testFile };
  }

  const previousLatest = readJsonFile(paths.latestJson, { records: [] }).records ?? [];
  const abnormal = isAbnormalResult(records, previousLatest);
  const snapshotFile = path.join(paths.snapshotsDir, `${clock.stamp}.json`);
  writeJsonFile(snapshotFile, {
    capturedAt: clock.nowText,
    abnormal,
    count: records.length,
    records
  });

  if (abnormal) {
    logger.warn("本次抓取数量异常，不覆盖 latest 和日报", { current: records.length, previous: previousLatest.length });
    return { mode: "normal", count: records.length, abnormal: true, durationMs, snapshotFile };
  }

  const previousById = new Map(previousLatest.map((record) => [record.auctionId, record]));
  const changes = records.flatMap((record) => {
    const found = detectChanges(previousById.get(record.auctionId) ?? null, record, config);
    return found.map((change) => ({ ...change, auctionId: record.auctionId, titleRaw: record.titleRaw }));
  });

  const lifecycle = updateLifecycle({
    auctions: readJsonFile(paths.auctionsLifecycle, {}),
    assets: readJsonFile(paths.assetsLifecycle, {})
  }, records, clock.nowText);

  const enrichedRecords = records.map((record) => ({
    ...record,
    firstSeenAt: lifecycle.auctions[record.auctionId]?.firstSeenAt ?? clock.nowText
  }));

  writeJsonFile(paths.auctionsLifecycle, lifecycle.auctions);
  writeJsonFile(paths.assetsLifecycle, lifecycle.assets);
  writeJsonFile(paths.latestJson, {
    capturedAt: clock.nowText,
    count: enrichedRecords.length,
    records: enrichedRecords
  });

  fs.writeFileSync(paths.latestCsv, recordsToCsv(enrichedRecords), "utf8");
  fs.writeFileSync(path.join(paths.dailyCsvDir, `${clock.dateKey}.csv`), recordsToCsv(enrichedRecords), "utf8");

  const runCountToday = countLogLines(logFile, "开始抓取");
  const report = renderMarkdownReport({
    now,
    config,
    records: enrichedRecords,
    changes,
    runInfo: { success: true, runCountToday, hasErrorLog: false }
  });
  const reportFile = path.join(paths.reportsDir, `浦东住宅法拍每日监控_${clock.stamp}.md`);
  const latestReportFile = path.join(paths.reportsDir, "浦东住宅法拍每日监控_latest.md");
  fs.writeFileSync(reportFile, report, "utf8");
  fs.writeFileSync(latestReportFile, report, "utf8");

  logger.info("抓取完成", { count: records.length, changes: changes.length, durationMs, reportFile, latestReportFile });
  return { mode: "normal", count: records.length, changes: changes.length, durationMs, snapshotFile, reportFile, latestReportFile };
}

function isAbnormalResult(records, previousLatest) {
  if (records.length === 0) return true;
  if (previousLatest.length >= 10 && records.length < Math.max(2, previousLatest.length * 0.2)) return true;
  return false;
}

function readPackageVersion(rootDir) {
  try {
    return JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8")).version ?? "0.1.0";
  } catch {
    return "0.1.0";
  }
}

function countLogLines(logFile, message) {
  if (!fs.existsSync(logFile)) return 1;
  return fs.readFileSync(logFile, "utf8").split("\n").filter((line) => line.includes(message)).length;
}
