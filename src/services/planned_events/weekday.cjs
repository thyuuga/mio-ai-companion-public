// src/services/planned_events/weekday.cjs

// ISO weekday: Mon=1 ... Sun=7（从 YYYY-MM-DD 稳定计算，不依赖服务器时区）
function isoWeekdayFromDayKey(dayKey) {
  /* — core logic omitted for preview — */
}

// 转为本文件使用的体系：Sun=0, Mon=1..Sat=6
function weekday0FromDayKey(dayKey) {
  /* — core logic omitted for preview — */
}

module.exports = { isoWeekdayFromDayKey, weekday0FromDayKey };
