// src/repositories/promise_candidates.repo.cjs
const crypto = require("crypto");
const { randomUUID } = crypto;
const { debug, info } = require("../services/promises/log.cjs");

// 候选 TTL：15 分钟
const PROMISE_CANDIDATE_TTL_MS = 15 * 60 * 1000;

// 最大轮数：超过此轮数未判决则标记为 expired
const PROMISE_CANDIDATE_MAX_TURNS = 5;

/**
 * Upsert pending candidate.
 * 同一个 userId + contentHash 若已有 pending，则更新 updated_at/expires_at/time*；否则 insert 新行。
 */
async function upsertPendingCandidate(db, {
  userId, sessionId, content, contentHash, originalText,
  timeHint, timeText, timePrecision, timeYear, timeMonth, timeDay,
  timeHoliday, timeStartTs, timeEndTs,
  sourceMessageId, nowMs,
  signalsJson, candidateConfidence, candidateLang,
}) {
  const expiresAt = nowMs + PROMISE_CANDIDATE_TTL_MS;

  // 先查是否已有同 hash 的 pending
  const existing = await db.get(
    `SELECT id FROM promise_candidates
     WHERE user_id = ? AND content_hash = ? AND status = 'pending'`,
    userId, contentHash
  );

  if (existing) {
    await db.run(
      `UPDATE promise_candidates
       SET updated_at = ?, expires_at = ?,
           time_hint = ?, time_text = ?, time_precision = ?,
           time_year = ?, time_month = ?, time_day = ?,
           time_holiday = ?, time_start_ts = ?, time_end_ts = ?,
           session_id = ?, source_message_id = ?,
           signals_json = ?, candidate_confidence = ?, candidate_lang = ?
       WHERE id = ?`,
      nowMs, expiresAt,
      timeHint ?? null, timeText ?? null, timePrecision ?? null,
      timeYear ?? null, timeMonth ?? null, timeDay ?? null,
      timeHoliday ?? null, timeStartTs ?? null, timeEndTs ?? null,
      sessionId, sourceMessageId ?? null,
      signalsJson ?? "{}", candidateConfidence ?? null, candidateLang ?? null,
      existing.id
    );
    debug("[PROMISE_CANDIDATE] UPSERT_UPDATE", {
      id: existing.id, userId, hash: contentHash?.slice(0, 16), expiresAt,
    });
    return { id: existing.id, isNew: false };
  }

  const id = randomUUID();
  await db.run(
    `INSERT INTO promise_candidates
     (id, user_id, session_id, content, content_hash, original_text,
      time_hint, time_text, time_precision, time_year, time_month, time_day,
      time_holiday, time_start_ts, time_end_ts,
      source_message_id, status, created_at, updated_at, expires_at,
      signals_json, candidate_confidence, candidate_lang)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?)`,
    id, userId, sessionId, content, contentHash, originalText ?? null,
    timeHint ?? null, timeText ?? null, timePrecision ?? null,
    timeYear ?? null, timeMonth ?? null, timeDay ?? null,
    timeHoliday ?? null, timeStartTs ?? null, timeEndTs ?? null,
    sourceMessageId ?? null, nowMs, nowMs, expiresAt,
    signalsJson ?? "{}", candidateConfidence ?? null, candidateLang ?? null
  );
  debug("[PROMISE_CANDIDATE] UPSERT_INSERT", {
    id, userId, hash: contentHash?.slice(0, 16), expiresAt,
  });
  return { id, isNew: true };
}

/**
 * 取最新的 pending candidate（未过期）
 * 优先同 session，退化为同 user 最新 pending
 */
async function getLatestPendingCandidate(db, { userId, sessionId, nowMs }) {
  // 先尝试同 session
  let row = await db.get(
    `SELECT * FROM promise_candidates
     WHERE user_id = ? AND session_id = ? AND status = 'pending' AND expires_at > ?
     ORDER BY created_at DESC LIMIT 1`,
    userId, sessionId, nowMs
  );
  if (row) return row;

  // 退化：同 user 最新
  row = await db.get(
    `SELECT * FROM promise_candidates
     WHERE user_id = ? AND status = 'pending' AND expires_at > ?
     ORDER BY created_at DESC LIMIT 1`,
    userId, nowMs
  );
  return row ?? null;
}

/**
 * 更新候选状态
 */
async function markCandidateStatus(db, { id, status, nowMs }) {
  await db.run(
    `UPDATE promise_candidates SET status = ?, updated_at = ? WHERE id = ?`,
    status, nowMs, id
  );
}

/**
 * 标记候选为 superseded（被改案替换）
 */
async function markCandidateSuperseded(db, { id, nowMs }) {
  await markCandidateStatus(db, { id, status: "superseded", nowMs });
}

/**
 * 清理过期候选（轻量，每次 pair 流程调用）
 */
async function deleteExpiredCandidates(db, { nowMs }) {
  const result = await db.run(
    `UPDATE promise_candidates SET status = 'expired', updated_at = ?
     WHERE status = 'pending' AND expires_at <= ?`,
    nowMs, nowMs
  );
  if (result?.changes > 0) {
    info("[PROMISE_CANDIDATE] EXPIRED", { count: result.changes });
  }
}

/**
 * 检查 pending candidate 是否超过最大轮数
 * 通过查询从 candidate 创建以来的 user 消息数量
 * @returns {Promise<number>} 轮数（user 消息数量）
 */
async function countTurnsSinceCandidate(db, { userId, createdAt }) {
  const result = await db.get(
    `SELECT COUNT(*) as cnt FROM messages m
     JOIN sessions s ON m.session_id = s.id
     WHERE s.user_id = ? AND m.role = 'user' AND m.created_at > ?`,
    userId, createdAt
  );
  return result?.cnt || 0;
}

/**
 * 检查并标记超过轮数的 pending candidate 为 expired
 * @returns {Promise<boolean>} true 如果已标记为 expired
 */
async function expireCandidateIfTooManyTurns(db, { candidate, userId, nowMs }) {
  if (!candidate || candidate.status !== "pending") return false;

  const turns = await countTurnsSinceCandidate(db, {
    userId,
    createdAt: candidate.created_at,
  });

  if (turns >= PROMISE_CANDIDATE_MAX_TURNS) {
    await markCandidateStatus(db, { id: candidate.id, status: "expired", nowMs });
    info("[PROMISE_CANDIDATE] EXPIRED_BY_TURNS", {
      candidateId: candidate.id,
      turns,
      maxTurns: PROMISE_CANDIDATE_MAX_TURNS,
    });
    return true;
  }
  return false;
}

module.exports = {
  PROMISE_CANDIDATE_TTL_MS,
  PROMISE_CANDIDATE_MAX_TURNS,
  upsertPendingCandidate,
  getLatestPendingCandidate,
  markCandidateStatus,
  markCandidateSuperseded,
  deleteExpiredCandidates,
  countTurnsSinceCandidate,
  expireCandidateIfTooManyTurns,
};
