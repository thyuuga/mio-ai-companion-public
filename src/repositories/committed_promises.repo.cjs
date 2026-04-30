// src/repositories/committed_promises.repo.cjs
const crypto = require("crypto");

/**
 * fun016. 判断当前消息是否可能与「约定」相关（gating）
 * 避免无关对话时也注入约定，导致 prompt 污染和模型被"牵引"
 */
function shouldInjectPromises(text) {
  const t = (text || "").trim();
  if (!t) return false;

  // 仅在明确"约定/计划/时间点/我们一起"的语境下注入，避免无关对话触发 prompt 污染
  const PROMISE_RELATED_PATTERNS = [
    /约|说定|说好|就这么定|一言为定|不见不散/,
    /一起|我们|咱们|咱俩/,
    /下次|下回|下周|下个月|明天|后天|周末|假期|今年|明年|后年|到时候/,
    /计划|安排|打算|行程/,
    /记得|还记得|之前说|说过/,
  ];

  for (const p of PROMISE_RELATED_PATTERNS) {
    if (p.test(t)) return true;
  }
  return false;
}

/**
 * fun017. 获取与当前话题可能相关的已承诺约定（用于注入 system prompt）
 * 规则：
 * 1. 先判断当前消息是否与约定相关（gating）
 * 2. 如果相关，按时间倒序取最多 limit 条
 * 3. 如果不相关，返回空数组（不注入 prompt）
 */
async function getRelevantPromises(db, userId, currentMessage, limit = 3, now = Date.now()) {
  if (!shouldInjectPromises(currentMessage)) return [];

  const rows = await db.all(
    `SELECT content, time_hint, committed_at
     FROM committed_promises
     WHERE user_id = ?
       AND (time_end_ts IS NULL OR time_end_ts > ?)
     ORDER BY committed_at DESC
     LIMIT ?`,
    userId,
    now,
    limit
  );

  return rows || [];
}

function contentHashOf(content) {
  return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

async function findCommittedPromiseByHash(db, userId, contentHash) {
  return db.get(
    `SELECT id FROM committed_promises WHERE user_id = ? AND content_hash = ?`,
    userId, contentHash
  );
}

async function insertCommittedPromise(db, row) {
  // row: { id, userId, sessionId, content, contentHash, timeHint, committedAt, sourceMessageId, confidence,
  //         timeText, timePrecision, timeYear, timeMonth, timeDay, timeHoliday, timeStartTs, timeEndTs }
  const result = await db.run(
    `INSERT INTO committed_promises
     (id, user_id, session_id, content, content_hash, time_hint, committed_at, source_message_id, confidence,
      time_text, time_precision, time_year, time_month, time_day, time_holiday, time_start_ts, time_end_ts)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    row.id, row.userId, row.sessionId,
    row.content, row.contentHash, row.timeHint, row.committedAt, row.sourceMessageId,
    row.confidence,
    row.timeText ?? null, row.timePrecision ?? null,
    row.timeYear ?? null, row.timeMonth ?? null, row.timeDay ?? null,
    row.timeHoliday ?? null, row.timeStartTs ?? null, row.timeEndTs ?? null
  );
  // 返回 { changes, lastID } 用于日志追踪
  return { changes: result?.changes, lastID: result?.lastID };
}

module.exports = {
  shouldInjectPromises,
  getRelevantPromises,
  contentHashOf,
  findCommittedPromiseByHash,
  insertCommittedPromise,
};
