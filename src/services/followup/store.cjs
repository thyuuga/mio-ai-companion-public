// src/services/followup/store.cjs
//
// followup_nudges 的读写操作

const { randomUUID } = require("crypto");

// ===== 时间窗口配置 =====
// hint_after: 最早可触发（距创建时间）
// expire:     过期（距创建时间）

const TIMING = {
  sleep:    { hintAfterMs: 2   * 3600_000, expireMs: 24 * 3600_000 }, // 2h ~ 24h
  busy:     { hintAfterMs: 3   * 3600_000, expireMs: 24 * 3600_000 }, // 3h ~ 24h
  low_mood: { hintAfterMs: 1.5 * 3600_000, expireMs: 24 * 3600_000 }, // 1.5h ~ 24h
};

/**
 * saveFollowupNudge - 写入一条 follow-up 候选
 *
 * 写入前会把该用户所有 active（used=0）的旧条目标记为 used=1，
 * 避免堆叠多条未触发的 nudge。
 *
 * @param {object} db
 * @param {{ userId: string, sessionId: string, type: string, sourceMessageId: string, sourceText: string, now: number }} opts
 * @returns {Promise<string>} nudge id
 */
async function saveFollowupNudge(db, { userId, sessionId, type, sourceMessageId, sourceText, now }) {
  /* — core logic omitted for preview — */
}

/**
 * getActiveFollowup - 查询当前可触发的 follow-up
 *
 * 条件：used=0, now >= hint_after_ts, now < expire_ts
 * 只返回最新一条
 *
 * @param {object} db
 * @param {string} userId
 * @param {number} now - 当前时间戳（毫秒）
 * @returns {Promise<object|null>} { id, type, sourceText, createdAt } or null
 */
async function getActiveFollowup(db, userId, now) {
  /* — core logic omitted for preview — */
}

/**
 * markFollowupUsed - 标记一条 follow-up 为已触发
 *
 * @param {object} db
 * @param {string} nudgeId
 */
async function markFollowupUsed(db, nudgeId) {
  /* — core logic omitted for preview — */
}

module.exports = { saveFollowupNudge, getActiveFollowup, markFollowupUsed };
