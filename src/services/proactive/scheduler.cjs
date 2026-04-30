// src/services/proactive/scheduler.cjs
//
// 每日时间窗口随机时刻生成
//
// 每天为每个用户生成 3 个随机触发时刻（morning / noon / evening），
// 存入 proactive_daily_state.window_slots，惰性初始化（首次访问时生成）。

const { getDailyState, upsertWindowSlots } = require("./store.cjs");

// ===== 窗口配置 =====
// baseHour: 窗口开始小时（本地时间）
// windowMinutes: 窗口宽度（分钟）
// probability: 基础触发概率
const WINDOWS = [
  { name: "morning", baseHour: 8,  windowMinutes: 120, probability: 0.30 },
  { name: "noon",    baseHour: 12, windowMinutes: 120, probability: 0.15 },
  { name: "evening", baseHour: 21, windowMinutes: 120, probability: 0.35 },
];

/**
 * getDayStartMs - 获取指定 tz 下某天 00:00:00 的 UTC 毫秒时间戳
 *
 * 思路：用 Intl.DateTimeFormat 把 "今天00:00" 在目标 tz 下转成 UTC。
 * dayKey 格式 "YYYY-MM-DD"
 */
function getDayStartMs(dayKey, tz) {
  /* — core logic omitted for preview — */
}

/**
 * generateWindowSlots - 为指定 dayKey/tz 生成三个随机时间点
 *
 * @returns {Array<{ window: string, ts: number, probability: number, fired: boolean }>}
 */
function generateWindowSlots(dayKey, tz) {
  /* — core logic omitted for preview — */
}

/**
 * getOrCreateDailyWindowSlots - 读取或生成当日 slots
 *
 * @param {object} db
 * @param {string} userId
 * @param {string} dayKey
 * @param {string} tz
 * @returns {Promise<Array<{ window: string, ts: number, probability: number, fired: boolean }>>}
 */
async function getOrCreateDailyWindowSlots(db, userId, dayKey, tz) {
  /* — core logic omitted for preview — */
}

module.exports = { getOrCreateDailyWindowSlots, generateWindowSlots, getDayStartMs };
