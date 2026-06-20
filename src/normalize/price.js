export function parsePriceWan(text) {
  if (text === null || text === undefined || text === "") return null;
  const normalized = String(text).replace(/[,，\s]/g, "");
  const numberMatch = normalized.match(/(\d+(?:\.\d+)?)/);
  if (!numberMatch) return null;

  const value = Number(numberMatch[1]);
  if (Number.isNaN(value)) return null;

  if (normalized.includes("万")) return value;
  if (normalized.includes("元")) return Number((value / 10000).toFixed(2));
  return value;
}

export function calcDiscountRate(priceWan, valuationWan) {
  if (!priceWan || !valuationWan) return null;
  return Number(((priceWan / valuationWan) * 100).toFixed(1));
}

export function assignPriceBucket(priceWan, buckets) {
  if (priceWan === null || priceWan === undefined) return null;
  return buckets.find((bucket) => {
    const minOk = priceWan >= bucket.min;
    const maxOk = bucket.max === null ? true : priceWan < bucket.max;
    return minOk && maxOk;
  }) ?? null;
}
