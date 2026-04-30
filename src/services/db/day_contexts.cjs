// src/services/db/day_contexts.cjs
const crypto = require("crypto");
const { randomUUID } = crypto;
const { getDayKey } = require("../sessions/day_key.cjs");

/**
 * fun021. 创建新 session 时 upsert day_context
 * - 增加 session_count
 * - 更新 last_session_id
 * - 更新 first/last_interaction_at（已有则保留 first）
 */
async function upsertDayContextOnSessionCreated(db, userId, dayKey, sessionId, nowMs) {
  const id = randomUUID();

  await db.run(
    `INSERT INTO day_contexts
       (id, user_id, day_key, first_interaction_at, last_interaction_at, session_count, last_session_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)
     ON CONFLICT(user_id, day_key) DO UPDATE SET
       first_interaction_at = COALESCE(day_contexts.first_interaction_at, excluded.first_interaction_at),
       session_count = day_contexts.session_count + 1,
       last_session_id = excluded.last_session_id,
       last_interaction_at = excluded.last_interaction_at,
       updated_at = excluded.updated_at`,
    id, userId, dayKey, nowMs, nowMs, sessionId, nowMs, nowMs
  );
}

/**
 * fun022. 用户发消息时 touch day_context
 */
async function touchDayContextOnUserMessage(db, userId, dayKey, sessionId, nowMs) {
  const id = randomUUID();

  await db.run(
    `INSERT INTO day_contexts
       (id, user_id, day_key, first_interaction_at, last_interaction_at, session_count, last_session_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)
     ON CONFLICT(user_id, day_key) DO UPDATE SET
       first_interaction_at = COALESCE(day_contexts.first_interaction_at, excluded.first_interaction_at),
       last_interaction_at = excluded.last_interaction_at,
       last_session_id = excluded.last_session_id,
       updated_at = excluded.updated_at`,
    id, userId, dayKey, nowMs, nowMs, sessionId, nowMs, nowMs
  );
}

/**
 * fun028. 获取 day_context 的 meta 信息（用于 opener guard）
 */
async function getDayContextMeta(db, userId, tz, nowMs) {
  const dayKey = getDayKey(tz, nowMs);
  const row = await db.get(
    `SELECT first_interaction_at, last_interaction_at, session_count
     FROM day_contexts
     WHERE user_id = ? AND day_key = ?`,
    userId, dayKey
  );

  return {
    dayKey,
    firstInteractionAt: row?.first_interaction_at || null,
    lastInteractionAt: row?.last_interaction_at || null,
    sessionCount: row?.session_count || 0,
  };
}

/**
 * 更新当天的 day_summary 和 tone_hint（session 结束时调用）
 */
async function updateDaySummary(db, userId, dayKey, summary, toneHint) {
  const now = Date.now();
  await db.run(
    `UPDATE day_contexts
     SET day_summary = ?, tone_hint = ?, updated_at = ?
     WHERE user_id = ? AND day_key = ?`,
    summary, toneHint, now, userId, dayKey
  );
}

/**
 * 获取最近一天有 day_summary 的 day_context（排除今天）
 * 覆盖多天间隔场景（不再限定只查昨天）
 * @returns {{ daySummary: string, toneHint: string|null, dayKey: string } | null}
 */
async function getLastInteractionContext(db, userId, tz, nowMs) {
  const todayKey = getDayKey(tz, nowMs);

  const row = await db.get(
    `SELECT day_summary, tone_hint, day_key
     FROM day_contexts
     WHERE user_id = ? AND day_key < ? AND day_summary IS NOT NULL
     ORDER BY day_key DESC
     LIMIT 1`,
    userId, todayKey
  );

  if (!row || !row.day_summary) return null;

  return {
    daySummary: row.day_summary,
    toneHint: row.tone_hint,
    dayKey: row.day_key,
  };
}

// 向后兼容别名
const getYesterdayContext = getLastInteractionContext;

module.exports = {
  upsertDayContextOnSessionCreated,
  touchDayContextOnUserMessage,
  getDayContextMeta,
  updateDaySummary,
  getYesterdayContext,
  getLastInteractionContext,
};
