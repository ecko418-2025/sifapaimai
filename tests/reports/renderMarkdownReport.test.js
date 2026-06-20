import { describe, expect, it } from "vitest";
import { renderMarkdownReport } from "../../src/reports/renderMarkdownReport.js";

describe("renderMarkdownReport", () => {
  it("renders summary, important changes, upcoming listings, ended listings, and price buckets", () => {
    const report = renderMarkdownReport({
      now: new Date("2026-06-20T23:00:00+08:00"),
      config: {
        priceBucketsWan: [
          { id: "under_500", label: "500 万以下", min: 0, max: 500 },
          { id: "500_to_1000", label: "500 万到 1000 万", min: 500, max: 1000 },
          { id: "over_1000", label: "1000 万以上", min: 1000, max: null }
        ],
        upcomingDays: 3,
        newListingDays: 3,
        recentEndedDays: 7
      },
      records: [
        {
          auctionId: "A1",
          titleRaw: "上海市浦东新区丁香路1299弄3号2601室",
          priceWan: 2609.6,
          valuationWan: 4660,
          discountRate: 56,
          startTime: "2026-06-22 10:00:00",
          status: "即将开始",
          signupCount: 1,
          watchCount: 430,
          court: "上海市浦东新区人民法院",
          normalizedUrl: "https://example.com/a1",
          firstSeenAt: "2026-06-20 11:00:00",
          riskKeywords: ["占用"]
        },
        {
          auctionId: "A2",
          titleRaw: "上海市浦东新区某路1号101室",
          priceWan: 450,
          valuationWan: 600,
          discountRate: 75,
          startTime: "2026-06-25 10:00:00",
          endTime: "2026-06-19 10:00:00",
          status: "已成交",
          signupCount: 2,
          watchCount: 900,
          court: "上海市浦东新区人民法院",
          normalizedUrl: "https://example.com/a2",
          firstSeenAt: "2026-06-18 11:00:00",
          riskKeywords: []
        }
      ],
      changes: [{ auctionId: "A1", titleRaw: "上海市浦东新区丁香路1299弄3号2601室", type: "signup_count_changed", previous: 0, current: 1 }],
      runInfo: { success: true, runCountToday: 2, hasErrorLog: false }
    });

    expect(report).toContain("# 浦东住宅法拍每日监控");
    expect(report).toContain("## 总览摘要");
    expect(report).toContain("## 当天重要变化");
    expect(report).toContain("## 未来 3 天即将开拍");
    expect(report).toContain("## 最近 7 天结束标的");
    expect(report).toContain("## 500 万以下");
    expect(report).toContain("## 500 万到 1000 万");
    expect(report).toContain("## 1000 万以上");
    expect(report).toContain("占用");
    expect(report).toContain("| 标的 | 价格 | 时间 | 热度 | 链接 |");
    expect(report).toContain("上海市浦东新区丁香路1299弄3号2601室<br>处置：上海市浦东新区人民法院<br>风险：占用");
    expect(report).toContain("2609.6 万<br>评估 4660 万<br>折扣 56%");
    expect(report).toContain("2026-06-22 10:00:00<br>即将开始");
    expect(report).toContain("报名 1<br>围观 430");
    expect(report).not.toContain("| 标题 / 地址 | 当前价 | 评估价 |");
    expect(report).not.toContain("### 上海市浦东新区丁香路1299弄3号2601室");
  });
});
