// src/services/proactive/gates.cjs
//
// 主动消息触发判断
//
// 两类触发：
//   A. 登录触发（login proactive）  — 用户进入页面时判断
//   B. 时间窗口触发（window proactive）— 时间到达预设时刻时判断

const {
  DAILY_LIMIT,
  getTodayProactiveCount,
  hasUnreadProactiveMessage,
  getLoginTriggeredToday,
  updateWindowSlots,
} = require("./store.cjs");
const { getOrCreateDailyWindowSlots } = require("./scheduler.cjs");
const { pickProactiveContext } = require("./context.cjs");

// ===== In-memory 状态（进程内，重启清空，可接受）=====
// 兜底依靠 DB 的 daily count 上限

/** userId → 上次 page check 时间戳（用于 30 分钟冷却） */
const _lastCheckMs = new Map();

/** `${userId}:${sessionId}` → true（同一 session 只判断一次登录触发） */
const _checkedSessions = new Set();

/** userId → 上次登录触发成功时间戳（用于 window gate：刚发过登录触发则跳过窗口） */
const _lastLoginTriggerMs = new Map();

const LOGIN_COOLDOWN_MS = 30 * 60_000;      // 30 分钟：防刷新重复触发

const LOGIN_PROBABILITY = 0.60;

/**
 * shouldTriggerLoginProactive - 判断是否触发登录主动消息
 *
 * @param {object} db
 * @param {string} userId
 * @param {string} dayKey
 * @param {string} sessionId
 * @returns {Promise<boolean>}
 */
async function shouldTriggerLoginProactive(db, userId, dayKey, sessionId) {
  /* — core logic omitted for preview — */
}

/**
 * recordLoginTrigger - 登录触发成功后记录时间（供 window gate 使用）
 */
function recordLoginTrigger(userId) {
  /* — core logic omitted for preview — */
}

/**
 * shouldTriggerWindowProactive - 判断是否触发时间窗口主动消息
 *
 * @param {object} db
 * @param {string} userId
 * @param {string} dayKey
 * @param {string} tz
 * @returns {Promise<{ slot: object, context: object|null } | null>}
 */
async function shouldTriggerWindowProactive(db, userId, dayKey, tz) {
  /* — core logic omitted for preview — */
}

module.exports = {
  shouldTriggerLoginProactive,
  recordLoginTrigger,
  shouldTriggerWindowProactive,
};
