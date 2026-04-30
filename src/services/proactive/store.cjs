// src/services/proactive/store.cjs
//
// proactive_messages / proactive_daily_state 的 DB 读写 helpers
//
// 两个已读状态的区别：
//   seen = 1  → 前端已展示给用户（展示即消费，用于 gate 判断）
//   read = 1  → 用户发消息"接住"了这条消息（记录对话接续行为）

const { randomUUID } = require("crypto");

const DAILY_LIMIT = 2;
const LOGIN_DAILY_LIMIT = 1;            // 每天登录触发最多 1 次
const UNSEEN_EXPIRY_MS = 12 * 3600_000; // unseen 消息超过 12h 视为过期，不再 block

/**
 * getTodayProactiveCount - 获取当日已发主动消息数
 */
async function getTodayProactiveCount(db, userId, dayKey) {
  /* — core logic omitted for preview — */
}

/**
 * hasUnreadProactiveMessage - 是否有"未展示"的主动消息（seen=0）
 *
 * 只看 12 小时内的消息，防止过期 unseen 消息永久 block。
 */
async function hasUnreadProactiveMessage(db, userId) {
  /* — core logic omitted for preview — */
}

/**
 * saveProactiveMessage - 写入主动消息 + 累计当日计数
 * @param {object} opts
 * @param {boolean} [opts.skipCount=false] - true 时不累计每日 count（login 触发用）
 */
async function saveProactiveMessage(db, { userId, sessionId, triggerType, content, now, dayKey, skipCount = false }) {
  /* — core logic omitted for preview — */
}

/**
 * markProactiveSeen - 前端展示后标记 seen=1（展示即消费）
 */
async function markProactiveSeen(db, proactiveId) {
  /* — core logic omitted for preview — */
}

/**
 * markAllProactiveRead - 用户发消息时标记所有消息 read=1（接住了对话）
 */
async function markAllProactiveRead(db, userId) {
  /* — core logic omitted for preview — */
}

/**
 * getLoginTriggeredToday - 今日是否已触发过登录 proactive
 */
async function getLoginTriggeredToday(db, userId, dayKey) {
  /* — core logic omitted for preview — */
}

/**
 * markLoginTriggeredToday - 记录今日登录 proactive 已触发
 */
async function markLoginTriggeredToday(db, userId, dayKey) {
  /* — core logic omitted for preview — */
}

/**
 * getDailyState - 读取当日状态（count + window_slots）
 */
async function getDailyState(db, userId, dayKey) {
  /* — core logic omitted for preview — */
}

/**
 * upsertWindowSlots - 写入/更新当日时间窗口 slots
 */
async function upsertWindowSlots(db, userId, dayKey, slots) {
  /* — core logic omitted for preview — */
}

/**
 * updateWindowSlots - 仅更新 slots（fired 标记变更后写回）
 */
async function updateWindowSlots(db, userId, dayKey, slots) {
  /* — core logic omitted for preview — */
}

/**
 * getActiveUsers - 获取最近有活跃 session 的用户（用于后台定时扫描）
 */
async function getActiveUsers(db, sinceMs) {
  /* — core logic omitted for preview — */
}

/**
 * getUnseenProactiveMessages - 获取用户所有未展示的主动消息（seen=0，12h 内）
 */
async function getUnseenProactiveMessages(db, userId) {
  /* — core logic omitted for preview — */
}

module.exports = {
  DAILY_LIMIT,
  getTodayProactiveCount,
  hasUnreadProactiveMessage,
  saveProactiveMessage,
  markProactiveSeen,
  markAllProactiveRead,
  getLoginTriggeredToday,
  markLoginTriggeredToday,
  getDailyState,
  upsertWindowSlots,
  updateWindowSlots,
  getActiveUsers,
  getUnseenProactiveMessages,
};
