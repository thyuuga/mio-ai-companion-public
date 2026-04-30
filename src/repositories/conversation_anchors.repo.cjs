// src/repositories/conversation_anchors.repo.cjs
const crypto = require("crypto");

/**
 * 计算 content 的哈希（用于去重）
 */
function computeContentHash(content) {
  return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

/**
 * 插入 anchor（去重：同 user + content_hash 只写一次）
 *
 * @param {object} db
 * @param {{
 *   id: string,
 *   userId: string,
 *   sessionId?: string,
 *   content: string,
 *   anchorType: string,      // plan:add | plan:reschedule | plan:cancel | promise:add | addr:set | boundary:add
 *   domain: string,          // plan | promise | addressing
 *   topic?: string,          // 关联的 title_norm 或 content_hash（用于冷却去重）
 *   refId?: string,          // 关联的 planned_event.id 或 committed_promise.id
 *   sourceMessageId?: string,
 *   weight?: number,         // 默认 1.0
 *   expiresAt?: number,      // 可选：过期时间（毫秒）
 *   createdAt: number,
 * }} opts
 * @returns {Promise<{ inserted: boolean, id: string, contentHash: string }>}
 */
async function insertIgnoreAnchor(db, {
  id,
  userId,
  sessionId = null,
  content,
  anchorType,
  domain,
  topic = null,
  refId = null,
  sourceMessageId = null,
  weight = 1.0,
  expiresAt = null,
  createdAt,
}) {
  const contentHash = computeContentHash(content);

  const result = await db.run(
    `INSERT OR IGNORE INTO conversation_anchors
     (id, user_id, session_id, content, anchor_type, domain, topic, ref_id, content_hash, source_message_id, weight, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id, userId, sessionId, content, anchorType, domain, topic, refId, contentHash, sourceMessageId, weight, expiresAt, createdAt
  );

  // result.changes === 0 表示 UNIQUE 约束导致 IGNORE（已存在）
  const inserted = result && result.changes > 0;
  return { inserted, id, contentHash };
}

/**
 * 检查冷却：同一 domain + topic 在 cooldownMs 内是否已有 anchor
 *
 * @param {object} db
 * @param {{ userId: string, domain: string, topic: string, cooldownMs: number, now: number }} opts
 * @returns {Promise<boolean>} true = 在冷却期内，应跳过
 */
async function isInCooldown(db, { userId, domain, topic, cooldownMs, now }) {
  if (!topic) return false; // 没有 topic 则不做冷却

  const cutoff = now - cooldownMs;
  const row = await db.get(
    `SELECT created_at FROM conversation_anchors
     WHERE user_id = ? AND domain = ? AND topic = ?
     ORDER BY created_at DESC
     LIMIT 1`,
    userId, domain, topic
  );

  if (!row) return false;
  return row.created_at > cutoff;
}

/**
 * 按 user + content_hash 查询是否已存在
 *
 * @param {object} db
 * @param {{ userId: string, contentHash: string }} opts
 * @returns {Promise<{ id: string, content: string } | undefined>}
 */
async function findByContentHash(db, { userId, contentHash }) {
  return db.get(
    `SELECT id, content FROM conversation_anchors
     WHERE user_id = ? AND content_hash = ?`,
    userId, contentHash
  );
}

/**
 * 获取用户最近的 anchors（用于调试/日志）
 *
 * @param {object} db
 * @param {{ userId: string, limit?: number }} opts
 * @returns {Promise<Array>}
 */
async function getRecentAnchors(db, { userId, limit = 20 }) {
  return db.all(
    `SELECT id, content, anchor_type, domain, topic, weight, created_at
     FROM conversation_anchors
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT ?`,
    userId, limit
  );
}

module.exports = {
  computeContentHash,
  insertIgnoreAnchor,
  isInCooldown,
  findByContentHash,
  getRecentAnchors,
};
