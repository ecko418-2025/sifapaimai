export function updateLifecycle(existing = { auctions: {}, assets: {} }, records = [], nowText) {
  const auctions = { ...(existing.auctions ?? {}) };
  const assets = { ...(existing.assets ?? {}) };

  for (const record of records) {
    if (!record.auctionId) continue;

    const previous = auctions[record.auctionId] ?? {
      auctionId: record.auctionId,
      firstSeenAt: record.firstSeenAt ?? nowText,
      firstPriceWan: record.priceWan ?? null,
      latest: null,
      snapshots: []
    };

    const snapshot = {
      capturedAt: record.capturedAt ?? nowText,
      priceWan: record.priceWan ?? null,
      valuationWan: record.valuationWan ?? null,
      startTime: record.startTime ?? null,
      endTime: record.endTime ?? null,
      status: record.status ?? null,
      signupCount: record.signupCount ?? null,
      watchCount: record.watchCount ?? null,
      soldPriceWan: record.soldPriceWan ?? null
    };

    auctions[record.auctionId] = {
      ...previous,
      latest: record,
      finalStatus: isFinalStatus(record.status) ? record.status : previous.finalStatus,
      soldPriceWan: record.soldPriceWan ?? previous.soldPriceWan ?? null,
      endedAt: record.endTime ?? previous.endedAt ?? null,
      snapshots: [...(previous.snapshots ?? []), snapshot]
    };

    if (record.assetFingerprint) {
      const asset = assets[record.assetFingerprint] ?? {
        assetFingerprint: record.assetFingerprint,
        titleSamples: [],
        auctionIds: []
      };
      assets[record.assetFingerprint] = {
        ...asset,
        titleSamples: unique([...asset.titleSamples, record.titleRaw].filter(Boolean)),
        auctionIds: unique([...asset.auctionIds, record.auctionId])
      };
    }
  }

  return { auctions, assets };
}

function isFinalStatus(status) {
  return ["已成交", "流拍", "结束", "撤回", "中止", "暂缓"].includes(status);
}

function unique(values) {
  return [...new Set(values)];
}
