// src/services/queue/enqueue.cjs
const crypto = require("crypto");

const { logError } = require("../../../lib/logger.cjs");
const { computeContentHash } = require("../../utils/hash.cjs");

/**
 * 去掉括号内的动作描写（中英文括号都处理）
 * 例如："（轻轻点头）嗯，我在。" -> "嗯，我在。"
 */
function stripActions(text) {
  if (!text) return text;
  return text.replace(/[（(][^）)]*[）)]/g, "").trim();
}

/**
 * 统一入队函数：enqueueEmbedding
 * @param {object} db - 数据库连接
 * @param {string} userId - 用户 ID
 * @param {string} kind - 'message' | 'memory' | 'anchor' | 'promise' | 'plan'
 * @param {string} refId - message_id / memory_id / anchor_id / promise_id / plan_id
 * @param {string} content - 要生成 embedding 的内容
 * @param {object} extra - 额外元数据 { sessionId, role, memoryId, weight, expiresAt }
 * @returns {Promise<{enqueued: boolean, reason?: string}>}
 */
async function enqueueEmbedding(db, userId, kind, refId, content, extra = {}) {
  const now = Date.now();

  // 预处理：去掉括号内的动作描写（对 message 类型）
  const processedContent = (kind === "message") ? stripActions(content) : content;

  // 如果处理后为空，跳过
  if (!processedContent || processedContent.length < 2) {
    return { enqueued: false, reason: "action_only" };
  }

  const contentHash = computeContentHash(processedContent);
  const jobId = crypto.randomUUID();

  const {
    sessionId = null,
    role = null,
    memoryId = null,
    weight = 1.0,
    expiresAt = null,
  } = extra;

  try {
    const result = await db.run(
      `INSERT OR IGNORE INTO embedding_jobs
       (id, user_id, kind, ref_id, session_id, role, memory_id, content, content_hash, weight, expires_at, status, attempts, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, ?, ?)`,
      jobId, userId, kind, refId, sessionId, role, memoryId, processedContent, contentHash, weight, expiresAt, now, now
    );

    // result.changes === 0 表示 UNIQUE 约束导致 IGNORE（已存在）
    if (result && result.changes === 0) {
      return { enqueued: false, reason: "duplicate" };
    }
    return { enqueued: true };
  } catch (e) {
    // 如果表不存在等 schema 错误，降级处理
    if (e && e.message && e.message.includes("no such table")) {
      logError("[ENQUEUE_EMBEDDING] table not found, skipping:", e.message);
      return { enqueued: false, reason: "schema_error" };
    }
    throw e;
  }
}

module.exports = {
  enqueueEmbedding,
};
