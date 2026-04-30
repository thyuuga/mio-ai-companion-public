// src/repositories/planned_events.repo.cjs
const { eventKeyHash } = require("../utils/events.cjs");
const { normalizeTitleNorm } = require("../services/planned_events/title_norm.cjs");
const { pickBetterTitle } = require("../services/planned_events/title_pick.cjs");

/**
 * findActiveDueTodayCandidates - 查询当天到期且未 nudge 的活跃事件
 *
 * @param {object} db
 * @param {{ userId: string, todayKey: string, limit?: number }} opts
 * @returns {Promise<Array<{ id: string, title: string, certainty: number }>>}
 */
async function findActiveDueTodayCandidates(db, { userId, todayKey, limit = 5 }) {
  return db.all(
    `SELECT id, title, certainty
     FROM planned_events
     WHERE user_id = ?
       AND status = 'active'
       AND due_day_key = ?
       AND (last_nudged_day_key IS NULL OR last_nudged_day_key != ?)
     ORDER BY certainty DESC, created_at DESC
     LIMIT ?`,
    userId, todayKey, todayKey, limit
  );
}

/**
 * markEventNudgedToday - 标记事件今日已 nudge
 *
 * @param {object} db
 * @param {{ userId: string, eventId: string, todayKey: string, now: number }} opts
 * @returns {Promise<void>}
 */
async function markEventNudgedToday(db, { userId, eventId, todayKey, now }) {
  await db.run(
    `UPDATE planned_events SET last_nudged_day_key = ?, updated_at = ? WHERE id = ? AND user_id = ?`,
    todayKey, now, eventId, userId
  );
}

/**
 * findActiveByDayTitleNorm - 查询同 (user_id, due_day_key, title_norm) 且 status='active' 的记录
 *
 * @param {object} db
 * @param {{ userId: string, dueDayKey: string, titleNorm: string }} opts
 * @returns {Promise<{ id: string, certainty: number, title: string, title_norm: string, created_at: number } | undefined>}
 */
async function findActiveByDayTitleNorm(db, { userId, dueDayKey, titleNorm }) {
  return db.get(
    `SELECT id, certainty, title, title_norm, created_at
     FROM planned_events
     WHERE user_id = ?
       AND due_day_key = ?
       AND title_norm = ?
       AND status = 'active'`,
    userId, dueDayKey, titleNorm
  );
}

/**
 * upsertActivePlannedEvent - 按 (user_id, due_day_key, title_norm) 去重 upsert
 *
 * 合并策略：
 * - 若存在 active 记录：
 *   - certainty 取 max
 *   - title 选择更具体的（pickBetterTitle）
 *   - title_norm 根据 nextTitle 重算
 *   - event_key 根据 nextTitle + nextCertainty 重算
 * - 若不存在：INSERT 新行
 *
 * @param {object} db
 * @param {{
 *   userId: string,
 *   dueDayKey: string,
 *   title: string,
 *   titleNorm: string,
 *   certainty: number,
 *   sourceMessageId: string,
 *   sourceText: string,
 *   eventKey: string,
 *   now: number,
 *   expiresAt: number,
 *   newId: string,
 * }} opts
 * @returns {Promise<{ action: 'inserted'|'merged', id: string, certainty: number, title: string }>}
 */
async function upsertActivePlannedEvent(db, {
  userId, dueDayKey, title, titleNorm, certainty,
  sourceMessageId, sourceText, eventKey, now, expiresAt, newId,
}) {
  const existing = await findActiveByDayTitleNorm(db, { userId, dueDayKey, titleNorm });

  if (existing) {
    // 合并：certainty 取 max，title 选择更具体的
    const nextCertainty = Math.max(existing.certainty, certainty);
    const nextTitle = pickBetterTitle(existing.title, title);
    const nextTitleNorm = normalizeTitleNorm(nextTitle);
    const nextEventKey = eventKeyHash(userId, dueDayKey, nextTitle, nextCertainty);

    await db.run(
      `UPDATE planned_events
       SET title = ?, title_norm = ?, certainty = ?,
           source_message_id = ?, source_text = ?, event_key = ?,
           updated_at = ?, expires_at = ?
       WHERE id = ? AND user_id = ?`,
      nextTitle, nextTitleNorm, nextCertainty,
      sourceMessageId, sourceText, nextEventKey,
      now, expiresAt,
      existing.id, userId
    );
    return { action: "merged", id: existing.id, certainty: nextCertainty, title: nextTitle };
  }

  // 新增
  await db.run(
    `INSERT INTO planned_events
     (id, user_id, due_day_key, title, title_norm, certainty,
      source_message_id, source_text, event_key,
      status, last_nudged_day_key, created_at, updated_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NULL, ?, ?, ?)`,
    newId, userId, dueDayKey, title, titleNorm, certainty,
    sourceMessageId, sourceText, eventKey,
    now, now, expiresAt
  );
  return { action: "inserted", id: newId, certainty, title };
}

module.exports = {
  findActiveDueTodayCandidates,
  markEventNudgedToday,
  findActiveByDayTitleNorm,
  upsertActivePlannedEvent,
};
