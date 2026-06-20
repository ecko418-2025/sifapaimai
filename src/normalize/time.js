const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function parseAuctionTime(text, now = new Date()) {
  if (!text) return null;
  const value = String(text).trim();

  const fullMatch = value.match(/(\d{4})[-/年](\d{1,2})[-/月](\d{1,2})日?\s*(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (fullMatch) {
    return formatDateTimeParts(fullMatch[1], fullMatch[2], fullMatch[3], fullMatch[4], fullMatch[5], fullMatch[6] ?? "00");
  }

  const monthDayMatch = value.match(/(\d{1,2})月(\d{1,2})日\s*(\d{1,2}):(\d{2})/);
  if (!monthDayMatch) return null;

  let year = now.getFullYear();
  const candidate = new Date(year, Number(monthDayMatch[1]) - 1, Number(monthDayMatch[2]), Number(monthDayMatch[3]), Number(monthDayMatch[4]), 0);
  if (candidate.getTime() < now.getTime() - MS_PER_DAY * 180) {
    year += 1;
  }

  return formatDateTimeParts(year, monthDayMatch[1], monthDayMatch[2], monthDayMatch[3], monthDayMatch[4], "00");
}

export function isWithinLookahead(dateTimeText, now = new Date(), lookaheadDays = 45) {
  if (!dateTimeText) return false;
  const parsed = parseDateTime(dateTimeText);
  if (!parsed) return false;
  const start = startOfLocalDay(now);
  const end = new Date(start.getTime() + lookaheadDays * MS_PER_DAY);
  return parsed >= start && parsed <= end;
}

export function formatDateTime(date = new Date()) {
  return formatDateTimeParts(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds()
  );
}

export function dateKey(date = new Date()) {
  return formatDateTime(date).slice(0, 10);
}

export function parseDateTime(dateTimeText) {
  if (!dateTimeText) return null;
  const match = String(dateTimeText).match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]), Number(match[6]));
}

function startOfLocalDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
}

function formatDateTimeParts(year, month, day, hour, minute, second) {
  return `${year}-${pad(month)}-${pad(day)} ${pad(hour)}:${pad(minute)}:${pad(second)}`;
}

function pad(value) {
  return String(value).padStart(2, "0");
}
