// src/utils/timezone.cjs
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

/**
 * fun017d. 把 YYYY-MM-DD 转成用户时区当天 23:59:59.999 的 UTC epoch ms
 */
function dayKeyToLocalEndMs(tz, dayKey) {
  const [year, month, day] = dayKey.split("-").map(Number);
  return makeEpochMsFromTzYMDHMS(tz, year, month, day, 23, 59, 59, 999);
}

/**
 * fun017c3. 从用户时区的本地时间 y-m-d hh:mm:ss.ms 构造 UTC epoch ms
 */
function makeEpochMsFromTzYMDHMS(tz, y, m, d, hh, mm, ss, ms) {
  // 先用 UTC 构造一个"假的"时间点（把本地时间当作 UTC）
  const fakeUtcMs = Date.UTC(y, m - 1, d, hh, mm, ss, ms);
  // 获取该时间点在目标时区的 offset
  const offsetMins = getTzOffsetMinutes(tz, fakeUtcMs);
  // 真正的 UTC 时间 = fakeUtc - offset
  return fakeUtcMs - offsetMins * 60 * 1000;
}

/**
 * fun017c2. 获取时区相对 UTC 的偏移分钟数（稳定方法）
 */
function getTzOffsetMinutes(tz, epochMs) {
  const d = new Date(epochMs);

  // 尝试 shortOffset（Node 14+ / 现代浏览器）
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    });
    const parts = fmt.formatToParts(d);
    const tzPart = parts.find(p => p.type === "timeZoneName");
    if (tzPart) {
      const val = tzPart.value;
      if (val === "GMT" || val === "UTC") return 0;
      const match = val.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
      if (match) {
        const sign = match[1] === "+" ? 1 : -1;
        const hours = parseInt(match[2], 10);
        const mins = parseInt(match[3] || "0", 10);
        return sign * (hours * 60 + mins);
      }
    }
  } catch (e) {
    // shortOffset 不可用，尝试 short fallback
  }

  // fallback: 尝试 timeZoneName:'short'（解析 JST, PST, GMT+9 等）
  try {
    const fmt2 = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "short",
    });
    const parts2 = fmt2.formatToParts(d);
    const tzPart2 = parts2.find(p => p.type === "timeZoneName");
    if (tzPart2) {
      const val = tzPart2.value;
      if (val === "GMT" || val === "UTC") return 0;
      // 尝试解析 GMT+9 / GMT-05:30 格式
      const match = val.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
      if (match) {
        const sign = match[1] === "+" ? 1 : -1;
        const hours = parseInt(match[2], 10);
        const mins = parseInt(match[3] || "0", 10);
        return sign * (hours * 60 + mins);
      }
      // 常见缩写映射（fallback 中的 fallback）
      // 注意：不映射 "CST"，因其在不同地区含义冲突（中国+8 vs 美国中部-6）
      const abbreviationMap = {
        "JST": 540, "KST": 540, "SGT": 480,
        "IST": 330, "CET": 60, "EET": 120, "WET": 0,
        "EST": -300, "EDT": -240, "CDT": -300,
        "MST": -420, "MDT": -360, "PST": -480, "PDT": -420,
      };
      if (abbreviationMap[val] !== undefined) {
        return abbreviationMap[val];
      }
    }
  } catch (e) {
    // 所有方法都失败，返回 0
  }

  return 0;
}

/**
 * fun017f. 从用户时区的今天日期偏移 offsetDays 计算新的 dayKey
 */
function getDayKeyWithOffset(tz, nowMs, offsetDays) {
  // 先拿用户时区的今天 dayKey
  const todayKey = getDayKey(tz, nowMs);
  const [year, month, day] = todayKey.split("-").map(Number);
  // 用 Date.UTC 安全地加天数
  const baseUtcMs = Date.UTC(year, month - 1, day, 12, 0, 0, 0);
  const newUtcMs = baseUtcMs + offsetDays * 24 * 60 * 60 * 1000;
  const newDate = new Date(newUtcMs);
  return `${newDate.getUTCFullYear()}-${String(newDate.getUTCMonth() + 1).padStart(2, "0")}-${String(newDate.getUTCDate()).padStart(2, "0")}`;
}

/**
 * fun017g. 解析用户时区下的星期几（0=周日, 1=周一, ..., 6=周六）
 */
function getLocalWeekday(tz, nowMs) {
  const d = new Date(nowMs);
  const dayStr = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" }).format(d);
  const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[dayStr] ?? 0;
}

module.exports = {
  getDayKey,
  dayKeyToLocalEndMs,
  makeEpochMsFromTzYMDHMS,
  getTzOffsetMinutes,
  getDayKeyWithOffset,
  getLocalWeekday,
};
