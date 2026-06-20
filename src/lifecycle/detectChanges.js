export function detectChanges(previous, current, config = {}) {
  if (!previous) {
    return [{ type: "new_listing", current: current.auctionId }];
  }

  const changes = [];

  pushChanged(changes, "status_changed", previous.status, current.status);
  pushChanged(changes, "price_changed", previous.priceWan, current.priceWan);
  pushChanged(changes, "start_time_changed", previous.startTime, current.startTime);
  pushChanged(changes, "signup_count_changed", previous.signupCount, current.signupCount);

  if (isSignificantWatchChange(previous.watchCount, current.watchCount, config.watchCountChange)) {
    changes.push({ type: "watch_count_changed", previous: previous.watchCount, current: current.watchCount });
  }

  return changes;
}

export function describeChange(change) {
  const labels = {
    new_listing: "新增标的",
    status_changed: "状态变化",
    price_changed: "价格变化",
    start_time_changed: "开拍时间变化",
    signup_count_changed: "报名人数变化",
    watch_count_changed: "围观人数明显变化"
  };
  return labels[change.type] ?? change.type;
}

function pushChanged(changes, type, previous, current) {
  if (previous === undefined || current === undefined) return;
  if (previous === current) return;
  changes.push({ type, previous, current });
}

function isSignificantWatchChange(previous, current, rule = {}) {
  if (typeof previous !== "number" || typeof current !== "number") return false;
  if (current <= previous) return false;
  const increase = current - previous;
  const percent = previous === 0 ? 100 : (increase / previous) * 100;
  return increase > (rule.minIncrease ?? 100) && percent > (rule.minPercent ?? 20);
}
