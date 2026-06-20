export const CSV_FIELDS = [
  "auctionId",
  "titleRaw",
  "addressRaw",
  "priceWan",
  "valuationWan",
  "discountRate",
  "startTime",
  "endTime",
  "status",
  "signupCount",
  "watchCount",
  "court",
  "isSold",
  "soldPriceWan",
  "bidderCount",
  "normalizedUrl",
  "source",
  "capturedAt"
];

export function recordsToCsv(records) {
  const lines = [CSV_FIELDS.join(",")];
  for (const record of records) {
    lines.push(CSV_FIELDS.map((field) => escapeCsv(record[field])).join(","));
  }
  return `${lines.join("\n")}\n`;
}

function escapeCsv(value) {
  if (value === null || value === undefined) return "";
  const text = Array.isArray(value) ? value.join("、") : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }
  return text;
}
