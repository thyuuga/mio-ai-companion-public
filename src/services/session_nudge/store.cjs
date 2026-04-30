// src/services/session_nudge/store.cjs
//
// 会话内轻触发（session nudge）的 DB 操作。
// 状态直接存在 sessions 表（三列），不新建表。

/**
 * 该 session 是否已经触发过 nudge
 * @param {object} db
 * @param {string} sessionId
 * @returns {Promise<boolean>}
 */
async function hasNudgedThisSession(db, sessionId) {
  /* — core logic omitted for preview — */
}

/**
 * 取该 session 已生成的 nudge 内容（幂等轮询用）
 * 若已触发且有内容，直接返回给前端，不重新生成
 * @param {object} db
 * @param {string} sessionId
 * @returns {Promise<string|null>}
 */
async function getNudgeForSession(db, sessionId) {
  /* — core logic omitted for preview — */
}

/**
 * 写入 nudge 触发记录
 * @param {object} db
 * @param {object} params
 * @param {string} params.sessionId
 * @param {string} params.content
 * @param {number} params.now
 */
async function saveSessionNudge(db, { sessionId, content, now }) {
  /* — core logic omitted for preview — */
}

module.exports = { hasNudgedThisSession, getNudgeForSession, saveSessionNudge };
