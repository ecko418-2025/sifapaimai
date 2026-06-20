import fs from "node:fs";

export function loadConfig(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const config = JSON.parse(raw);

  if (!config.region?.district) {
    throw new Error("config.region.district is required");
  }
  if (!Array.isArray(config.priceBucketsWan) || config.priceBucketsWan.length === 0) {
    throw new Error("config.priceBucketsWan must contain at least one bucket");
  }
  if (!Array.isArray(config.schedule) || config.schedule.length === 0) {
    throw new Error("config.schedule must contain at least one run time");
  }

  return config;
}
