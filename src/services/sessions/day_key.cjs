// src/services/sessions/day_key.cjs

/**
 * fun020. 获取用户时区下的日期 key (YYYY-MM-DD)
 */
function getDayKey(tz, nowMs) {
  const d = new Date(nowMs);
  // 使用 Intl.DateTimeFormat 获取用户时区下的年月日
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);

  const year = parts.find(p => p.type === "year")?.value || "0000";
  const month = parts.find(p => p.type === "month")?.value || "01";
  const day = parts.find(p => p.type === "day")?.value || "01";

  return `${year}-${month}-${day}`;
}

module.exports = { getDayKey };
