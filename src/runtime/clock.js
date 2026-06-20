import { dateKey, formatDateTime } from "../normalize/time.js";

export function createRunClock(now = new Date()) {
  const stamp = formatDateTime(now).replace(/:/g, "-").replace(" ", "_");
  return {
    now,
    nowText: formatDateTime(now),
    dateKey: dateKey(now),
    stamp
  };
}
