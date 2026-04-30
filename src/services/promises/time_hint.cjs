// src/services/promises/time_hint.cjs

const {
  FUTURE_TIME_PATTERNS,
  FIXED_HOLIDAYS,
  SEASON_MONTHS,
  RELATIVE_PATTERNS,
} = require("./constants.cjs");

// 中文月份 token 转数字 (1..12)
function monthTokenToNumber(token) {
  /* — core logic omitted for preview — */
}

// 中文日 token 转数字 (1..31)
function dayTokenToNumber(token) {
  /* — core logic omitted for preview — */
}

/**
 * 从文本中提取时间提示（旧版，保持兼容）
 * @param {string} text
 * @returns {{ timeHint: string|null, hasTimeFuture: boolean }}
 */
function extractTimeHint(text) {
  /* — core logic omitted for preview — */
}

// ===== extractTimeSpec: 结构化时间解析 =====

/**
 * 在指定时区下，获取 nowMs 的年/月/日
 */
function localDateParts(nowMs, tz) {
  /* — core logic omitted for preview — */
}

/**
 * 给定 year/month/day + tz，返回当天 00:00:00.000 的毫秒 timestamp
 */
function startOfDayMs(year, month, day, tz) {
  /* — core logic omitted for preview — */
}

/**
 * 给定 year/month + tz，返回该月最后一天的日期
 */
function lastDayOfMonth(year, month) {
  /* — core logic omitted for preview — */
}

/**
 * 推断年份：如果 month（+day）已过去，则取明年
 */
function inferYear(nowParts, month, day) {
  /* — core logic omitted for preview — */
}

/**
 * extractTimeSpec - 从文本中解析结构化时间
 *
 * 优先级：date > month > holiday > season > week/relative > none
 *
 * @param {string} text - 用户输入文本
 * @param {number} nowMs - 当前时间戳（毫秒）
 * @param {string} tz - 用户时区（如 'Asia/Tokyo'）
 * @returns {{ time_hint, time_text, time_precision, time_year, time_month, time_day, time_holiday, time_start_ts, time_end_ts }}
 */
function extractTimeSpec(text, nowMs, tz) {
  /* — core logic omitted for preview — */
}

module.exports = {
  FUTURE_TIME_PATTERNS,
  monthTokenToNumber,
  dayTokenToNumber,
  extractTimeHint,
  extractTimeSpec,
};
