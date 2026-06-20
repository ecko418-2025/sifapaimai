const STATUS_KEYWORDS = ["即将开始", "正在进行", "已成交", "流拍", "中止", "暂缓", "撤回", "变卖", "结束"];

export function normalizeStatus(text) {
  if (!text) return null;
  const value = String(text);
  const matched = STATUS_KEYWORDS.find((keyword) => value.includes(keyword));
  if (matched === "结束") return "结束";
  return matched ?? value.trim();
}

export function isEndedStatus(status) {
  return ["已成交", "流拍", "结束", "撤回", "中止", "暂缓"].includes(status);
}
