// src/services/session_nudge/gates.cjs
//
// session nudge 触发 gating：所有条件必须同时满足

const { hasNudgedThisSession } = require("./store.cjs");
const { hasUnreadProactiveMessage } = require("../proactive/store.cjs");

// 时间窗口：6～15 分钟沉默（给轮询间隔留余量）
const MIN_SILENCE_MS = 6 * 60_000;
const MAX_SILENCE_MS = 15 * 60_000;

// 触发概率 30%（避免机械）
const NUDGE_PROBABILITY = 0.30;

// 任务 / 约定类关键词 → 不触发
const TASK_KEYWORDS = /约定|计划|提醒|任务|答应|打算|记住|记得|不要忘|别忘|日程|安排/;

/**
 * 判断是否应触发 session nudge
 *
 * @param {object} db
 * @param {string} userId
 * @param {string} sessionId
 * @param {number} now        - Date.now()
 * @returns {Promise<boolean>}
 */
async function shouldTriggerSessionNudge(db, userId, sessionId, now) {
  /* — core logic omitted for preview — */
}

module.exports = { shouldTriggerSessionNudge };
