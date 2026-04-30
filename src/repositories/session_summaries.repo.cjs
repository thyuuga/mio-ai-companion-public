// src/repositories/session_summaries.repo.cjs

/**
 * 获取 session 摘要 (只读 session_summaries 表里某个 session_id 的 summary)
 * @param {*} db
 * @param {string} sessionId
 * @returns {Promise<string>}
 */
async function getSessionSummary(db, sessionId) {
  const row = await db.get(
    "SELECT summary FROM session_summaries WHERE session_id = ?",
    sessionId
  );
  return row?.summary || "";
}

/**
 * 写入/覆盖 session 摘要 (果没有就 insert，有就 update（SQLite 的 ON CONFLICT）upsert)
 * @param {*} db
 * @param {string} sessionId
 * @param {string} nextSummary
 */
async function upsertSessionSummary(db, sessionId, nextSummary) {
  const now = Date.now();
  await db.run(
    `INSERT INTO session_summaries (session_id, summary, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(session_id) DO UPDATE SET
       summary = excluded.summary,
       updated_at = excluded.updated_at`,
    sessionId,
    nextSummary,
    now
  );
}

/**
 * 读取 session 的 closing_summary
 */
async function getClosingSummary(db, sessionId) {
  const row = await db.get(
    "SELECT closing_summary FROM session_summaries WHERE session_id = ?",
    sessionId
  );
  return row?.closing_summary || "";
}

/**
 * 写入 closing_summary（session 结束时调用）
 * 如果 session_summaries 没有该 session 的记录，会插入一条（summary 为空字符串）
 */
async function upsertClosingSummary(db, sessionId, closingSummary) {
  const now = Date.now();
  await db.run(
    `INSERT INTO session_summaries (session_id, summary, closing_summary, updated_at)
     VALUES (?, '', ?, ?)
     ON CONFLICT(session_id) DO UPDATE SET
       closing_summary = excluded.closing_summary,
       updated_at = excluded.updated_at`,
    sessionId,
    closingSummary,
    now
  );
}

module.exports = {
  getSessionSummary,
  upsertSessionSummary,
  getClosingSummary,
  upsertClosingSummary,
};
