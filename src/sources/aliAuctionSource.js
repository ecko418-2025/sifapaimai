import { chromium } from "playwright";
import fs from "node:fs";
import { createEmptyAuctionRecord } from "./auctionSource.js";
import { createAddressFingerprint, parseAddressParts } from "../normalize/address.js";
import { calcDiscountRate, parsePriceWan } from "../normalize/price.js";
import { detectRiskKeywords } from "../normalize/risk.js";
import { normalizeStatus } from "../normalize/status.js";
import { isWithinLookahead, parseAuctionTime } from "../normalize/time.js";

const SEARCH_URL = "https://zc-paimai.taobao.com/wow/pm/default/pc/zichansearch?disableNav=YES&locationCodes=%5B%22310000%22%5D&page=1&keyword=%E6%B5%A6%E4%B8%9C%20%E4%BD%8F%E5%AE%85";
const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser"
].filter(Boolean);

export class AliAuctionSource {
  constructor({ config, logger, now = new Date(), runtime = "mac-dev", scriptVersion = "0.1.0" }) {
    this.config = config;
    this.logger = logger;
    this.now = now;
    this.runtime = runtime;
    this.scriptVersion = scriptVersion;
  }

  async fetch({ testMode = false } = {}) {
    const browser = await chromium.launch({
      headless: true,
      executablePath: findSystemChrome(),
      args: ["--no-sandbox", "--disable-dev-shm-usage"]
    });
    const page = await browser.newPage();
    try {
      const listings = await this.fetchListings({ page, testMode });
      const records = [];
      for (const listing of listings) {
        await delay(randomInt(this.config.detailDelayMs.min, this.config.detailDelayMs.max));
        records.push(await this.fetchDetail({ page, listing }));
      }
      return records;
    } finally {
      await browser.close();
    }
  }

  async fetchListings({ page, testMode }) {
    this.logger?.info("打开阿里资产搜索页", { url: SEARCH_URL });
    await page.goto(SEARCH_URL, { waitUntil: "networkidle", timeout: this.config.timeoutMinutes * 60 * 1000 });

    const links = await page.locator("a").evaluateAll((anchors) => anchors
      .map((anchor) => ({
        text: anchor.innerText.trim(),
        href: anchor.href
      }))
      .filter((item) => item.href.includes("item.taobao.com") && item.text.includes("浦东")));

    const uniqueLinks = dedupeBy(links, (item) => normalizeUrl(item.href));
    const parsed = uniqueLinks
      .map((item) => this.parseCard(item))
      .filter((record) => this.shouldKeepRecord(record));

    return testMode ? parsed.slice(0, this.config.testModeLimit) : parsed;
  }

  async fetchDetail({ page, listing }) {
    const record = { ...listing };
    try {
      await page.goto(record.normalizedUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(1500);
      const bodyText = await page.locator("body").innerText({ timeout: 5000 });
      if (/验证码|滑动验证|punish|baxia/i.test(bodyText)) {
        record.parseWarnings.push("详情页可能触发验证码，仅使用列表页字段");
        return record;
      }
      record.court = record.court ?? extractAfterLabel(bodyText, ["处置单位", "法院"]);
      record.riskKeywords = dedupeBy([...record.riskKeywords, ...detectRiskKeywords(bodyText, this.config.riskKeywords)], (value) => value);
    } catch (error) {
      record.parseWarnings.push(`详情页读取失败：${error.message}`);
      this.logger?.warn("详情页读取失败", { auctionId: record.auctionId, url: record.normalizedUrl, error: error.message });
    }
    return record;
  }

  parseCard({ text, href }) {
    const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
    const record = createEmptyAuctionRecord();
    const title = findTitle(lines);
    const metaLine = lines.find((line) => line.includes("浦东") && line.includes("上海") && line.includes("|")) ?? null;
    const priceLabelIndex = findFirstIndex(lines, ["起拍价", "当前价", "变卖价"]);
    const valuationLabelIndex = findFirstIndex(lines, ["评估价", "市场价"]);

    record.auctionId = extractAuctionId(href);
    record.source = "ali-auction";
    record.rawCardText = text;
    record.titleRaw = title;
    record.addressRaw = title;
    record.originalUrl = href;
    record.normalizedUrl = normalizeUrl(href);
    record.priceText = extractPriceText(lines, priceLabelIndex);
    record.priceWan = parsePriceWan(record.priceText);
    record.valuationText = extractPriceText(lines, valuationLabelIndex);
    record.valuationWan = parsePriceWan(record.valuationText);
    record.discountRate = calcDiscountRate(record.priceWan, record.valuationWan);
    record.startTime = extractStartTime(lines, this.now);
    record.endTime = extractEndTime(lines, this.now);
    record.status = normalizeStatus(lines.slice(-3).join(" ")) ?? inferStatus(lines);
    record.signupCount = parseCountBefore(lines, "人报名");
    record.watchCount = parseCountBefore(lines, "次围观");
    record.isSold = record.status === "已成交";
    record.soldPriceWan = record.isSold ? record.priceWan : null;
    record.bidderCount = record.signupCount;
    record.capturedAt = this.nowText;
    record.scriptVersion = this.scriptVersion;
    record.runtime = this.runtime;
    record.riskKeywords = detectRiskKeywords(text, this.config.riskKeywords);

    const addressParts = parseAddressParts(title);
    Object.assign(record, addressParts);
    record.assetFingerprint = createAddressFingerprint(title);

    if (!metaLine) record.parseWarnings.push("缺少列表页地址摘要");
    if (!record.priceWan) record.parseWarnings.push("缺少价格");
    if (!record.startTime && !record.endTime) record.parseWarnings.push("缺少时间");
    if (!record.auctionId) record.parseWarnings.push("缺少拍卖场次 ID");

    return record;
  }

  get nowText() {
    const pad = (value) => String(value).padStart(2, "0");
    return `${this.now.getFullYear()}-${pad(this.now.getMonth() + 1)}-${pad(this.now.getDate())} ${pad(this.now.getHours())}:${pad(this.now.getMinutes())}:${pad(this.now.getSeconds())}`;
  }

  shouldKeepRecord(record) {
    if (!record.titleRaw) return false;
    if (this.config.requireJudicialAuction && !record.rawCardText.includes("司法拍卖")) return false;
    if (!record.titleRaw.includes(this.config.region.district) && !record.titleRaw.includes("浦东")) return false;
    if (this.config.excludeKeywords.some((keyword) => record.titleRaw.includes(keyword))) {
      const isResidentialWithParking = this.config.keepResidentialWithParking && /室|住宅|房屋|别墅|公寓/.test(record.titleRaw) && /车位|车库/.test(record.titleRaw);
      if (!isResidentialWithParking) return false;
    }
    if (record.status === "正在进行") return true;
    if (!record.startTime) return true;
    return isWithinLookahead(record.startTime, this.now, this.config.lookaheadDays);
  }
}

function findSystemChrome() {
  return CHROME_CANDIDATES.find((candidate) => fs.existsSync(candidate));
}

function findTitle(lines) {
  return lines.find((line) => /浦东|上海市/.test(line) && !line.includes("|") && !/低于评估价|支持贷款|放心付/.test(line)) ?? null;
}

function findFirstIndex(lines, labels) {
  return lines.findIndex((line) => labels.includes(line));
}

function extractPriceText(lines, labelIndex) {
  if (labelIndex < 0) return null;
  const fragment = lines.slice(labelIndex, labelIndex + 5).join("");
  const match = fragment.match(/¥?(\d+(?:\.\d+)?)(万|元|亿)/);
  if (!match) return null;
  if (match[2] === "亿") return `${Number(match[1]) * 10000}万`;
  return `${match[1]}${match[2]}`;
}

function extractStartTime(lines, now) {
  const openIndex = lines.findIndex((line) => line === "开拍");
  if (openIndex >= 0) return parseAuctionTime(lines[openIndex + 1], now);
  return null;
}

function extractEndTime(lines, now) {
  const expectedIndex = lines.findIndex((line) => line === "预计");
  if (expectedIndex >= 0) return parseAuctionTime(lines[expectedIndex + 1], now);
  return null;
}

function inferStatus(lines) {
  if (lines.includes("正在进行")) return "正在进行";
  if (lines.includes("即将开始")) return "即将开始";
  if (lines.includes("已成交")) return "已成交";
  if (lines.includes("流拍")) return "流拍";
  return null;
}

function parseCountBefore(lines, label) {
  const index = lines.findIndex((line) => line === label);
  if (index <= 0) return null;
  const value = Number(String(lines[index - 1]).replace(/\D/g, ""));
  return Number.isNaN(value) ? null : value;
}

function extractAuctionId(url) {
  return url.match(/(?:sf_item|auction)\/(\d+)\.htm/)?.[1] ?? url.match(/[?&]id=(\d+)/)?.[1] ?? null;
}

function normalizeUrl(url) {
  const parsed = new URL(url);
  return `${parsed.origin}${parsed.pathname}`;
}

function extractAfterLabel(text, labels) {
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  for (const label of labels) {
    const index = lines.findIndex((line) => line.includes(label));
    if (index >= 0 && lines[index + 1]) return lines[index + 1];
  }
  return null;
}

function dedupeBy(items, getKey) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const key = getKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
