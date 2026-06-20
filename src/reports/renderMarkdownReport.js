import { assignPriceBucket } from "../normalize/price.js";
import { parseDateTime } from "../normalize/time.js";
import { describeChange } from "../lifecycle/detectChanges.js";

export function renderMarkdownReport({ now = new Date(), config, records = [], changes = [], runInfo = {} }) {
  const today = formatDate(now);
  const priceBucketCounts = countPriceBuckets(records, config.priceBucketsWan);
  const upcoming = filterUpcoming(records, now, config.upcomingDays);
  const recentEnded = filterRecentEnded(records, now, config.recentEndedDays);
  const newListings = filterNewListings(records, now, config.newListingDays);

  const lines = [];
  lines.push(`# 浦东住宅法拍每日监控`);
  lines.push("");
  lines.push(`抓取日期：${today}`);
  lines.push("");
  lines.push("## 总览摘要");
  lines.push("");
  lines.push(`- 本次抓取时间：${formatDateTimeForReport(now)}`);
  lines.push(`- 今日抓取次数：${runInfo.runCountToday ?? 1}`);
  lines.push(`- 当前监控标的总数：${records.length}`);
  lines.push(`- 新增标的数量：${newListings.length}`);
  lines.push(`- 重要变化数量：${changes.length}`);
  lines.push(`- 报名人数变化数量：${changes.filter((change) => change.type === "signup_count_changed").length}`);
  lines.push(`- 围观人数明显变化数量：${changes.filter((change) => change.type === "watch_count_changed").length}`);
  lines.push(`- 最近 7 天结束数量：${recentEnded.length}`);
  for (const bucket of config.priceBucketsWan) {
    lines.push(`- ${bucket.label}：${priceBucketCounts[bucket.id] ?? 0}`);
  }
  lines.push(`- 抓取状态：${runInfo.success === false ? "失败" : "成功"}`);
  lines.push(`- 错误日志：${runInfo.hasErrorLog ? "有" : "无"}`);
  lines.push("");

  appendListingCards(lines, "最近 3 天新增标的", newListings);
  appendChanges(lines, changes);
  appendListingCards(lines, "未来 3 天即将开拍", upcoming);
  appendListingCards(lines, "最近 7 天结束标的", recentEnded);

  for (const bucket of config.priceBucketsWan) {
    const bucketRecords = records
      .filter((record) => assignPriceBucket(record.priceWan, config.priceBucketsWan)?.id === bucket.id)
      .sort(compareStartTime);
    appendListingCards(lines, bucket.label, bucketRecords);
  }

  return `${lines.join("\n")}\n`;
}

function appendChanges(lines, changes) {
  lines.push("## 当天重要变化");
  lines.push("");
  if (changes.length === 0) {
    lines.push("暂无重要变化。");
    lines.push("");
    return;
  }
  lines.push("| 标的 | 变化 | 原值 | 新值 |");
  lines.push("|---|---|---:|---:|");
  for (const change of changes) {
    lines.push(`| ${escapeCell(change.titleRaw ?? change.auctionId ?? "")} | ${describeChange(change)} | ${escapeCell(change.previous ?? "")} | ${escapeCell(change.current ?? "")} |`);
  }
  lines.push("");
}

function appendListingCards(lines, title, records) {
  lines.push(`## ${title}`);
  lines.push("");
  if (records.length === 0) {
    lines.push("暂无。");
    lines.push("");
    return;
  }
  lines.push("| 标的 | 价格 | 时间 | 热度 | 链接 |");
  lines.push("|---|---:|---|---:|---|");
  for (const record of records.sort(compareStartTime)) {
    appendListingRow(lines, record);
  }
  lines.push("");
}

function appendListingRow(lines, record) {
  const titleParts = [escapeCell(record.titleRaw ?? record.addressRaw ?? "未命名标的")];
  if (record.court) titleParts.push(`处置：${escapeCell(record.court)}`);
  if ((record.riskKeywords ?? []).length > 0) titleParts.push(`风险：${escapeCell(record.riskKeywords.join("、"))}`);
  const priceParts = [
    formatWan(record.priceWan),
    `评估 ${formatWan(record.valuationWan)}`,
    `折扣 ${formatPercent(record.discountRate)}`
  ];
  const timeParts = [
    record.startTime ?? record.endTime ?? "未获取",
    record.status ?? "未获取"
  ];
  const heatParts = [
    `报名 ${formatCount(record.signupCount)}`,
    `围观 ${formatCount(record.watchCount)}`
  ];
  lines.push(`| ${titleParts.join("<br>")} | ${priceParts.join("<br>")} | ${timeParts.join("<br>")} | ${heatParts.join("<br>")} | ${record.normalizedUrl ? `[详情](${record.normalizedUrl})` : ""} |`);
}

function countPriceBuckets(records, buckets) {
  const counts = Object.fromEntries(buckets.map((bucket) => [bucket.id, 0]));
  for (const record of records) {
    const bucket = assignPriceBucket(record.priceWan, buckets);
    if (bucket) counts[bucket.id] += 1;
  }
  return counts;
}

function filterUpcoming(records, now, days) {
  const nowTime = now.getTime();
  const end = nowTime + days * 24 * 60 * 60 * 1000;
  return records.filter((record) => {
    const start = parseDateTime(record.startTime);
    return start && start.getTime() >= nowTime && start.getTime() <= end;
  });
}

function filterRecentEnded(records, now, days) {
  const start = now.getTime() - days * 24 * 60 * 60 * 1000;
  return records.filter((record) => {
    if (!["已成交", "流拍", "结束"].includes(record.status)) return false;
    const endedAt = parseDateTime(record.endTime) ?? parseDateTime(record.soldAt);
    return endedAt && endedAt.getTime() >= start && endedAt.getTime() <= now.getTime();
  });
}

function filterNewListings(records, now, days) {
  const start = now.getTime() - days * 24 * 60 * 60 * 1000;
  return records.filter((record) => {
    const firstSeenAt = parseDateTime(record.firstSeenAt);
    return firstSeenAt && firstSeenAt.getTime() >= start && firstSeenAt.getTime() <= now.getTime();
  });
}

function compareStartTime(a, b) {
  const aTime = parseDateTime(a.startTime)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  const bTime = parseDateTime(b.startTime)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  return aTime - bTime;
}

function formatWan(value) {
  return value === null || value === undefined ? "未获取" : `${value} 万`;
}

function formatPercent(value) {
  return value === null || value === undefined ? "未获取" : `${value}%`;
}

function formatCount(value) {
  return value === null || value === undefined ? "未获取" : value;
}

function escapeCell(value) {
  return String(value).replace(/\|/g, "/");
}

function formatDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDateTimeForReport(date) {
  return `${formatDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function pad(value) {
  return String(value).padStart(2, "0");
}
