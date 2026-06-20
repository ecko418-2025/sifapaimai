export function createAddressFingerprint(text) {
  if (!text) return "";
  return String(text)
    .replace(/上海市/g, "")
    .replace(/浦东新区/g, "")
    .replace(/地下人防车位.*$/g, "")
    .replace(/及.*车位.*$/g, "")
    .replace(/[，,。\s]/g, "")
    .replace(/弄/g, "弄")
    .trim();
}

export function parseAddressParts(text) {
  const value = String(text ?? "").replace(/上海市/g, "").replace(/浦东新区/g, "");
  const road = value.match(/([\u4e00-\u9fa5A-Za-z0-9]+路)/)?.[1] ?? null;
  const laneNumber = value.match(/(\d+弄\d+号|\d+号|\d+弄)/)?.[1] ?? null;
  const buildingRoom = value.match(/(\d+室)/)?.[1] ?? null;
  const community = value.match(/，([^，,]+)$/)?.[1] ?? null;

  return {
    community,
    road,
    laneNumber,
    buildingRoom
  };
}
