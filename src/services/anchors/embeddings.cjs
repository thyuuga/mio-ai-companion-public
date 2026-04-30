// src/services/anchors/embeddings.cjs
const crypto = require("crypto");
const { logError } = require("../../../lib/logger.cjs");
const { embedTexts } = require("../../../lib/embeddings.cjs");
const { computeContentHash } = require("../../utils/hash.cjs");
const { normalizeAnchorText } = require("./normalize.cjs");

/**
 * 确保 anchors 都有 embedding（弱一致：失败不阻塞）
 * - 用 content_hash 做幂等（更稳）
 * - 兼容 embeddings 表字段：id, user_id, session_id, message_id, kind, role, content, content_hash, embedding, created_at, updated_at
 *   如果 embeddings 表没有 content_hash / updated_at，就把对应字段删掉
 */
async function ensureAnchorEmbeddings(db, userId, anchors, now = Date.now()) {
  /* — core logic omitted for preview — */
}

module.exports = { ensureAnchorEmbeddings };
