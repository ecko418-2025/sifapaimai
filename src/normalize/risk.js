export function detectRiskKeywords(text, keywords = []) {
  const value = String(text ?? "");
  return keywords.filter((keyword) => value.includes(keyword));
}
