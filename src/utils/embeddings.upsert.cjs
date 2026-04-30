const crypto = require("crypto");

/**
 * 写入 message 类型的 embedding（幂等，依赖 uq_embeddings_message 唯一索引）
 */
async function upsertMessageEmbedding(db, {
  userId, sessionId, messageId, role, content, contentHash, embeddingJson,
  weight = 1.0, expiresAt = null, now = Date.now()
}) {
  await db.run(
    `INSERT OR IGNORE INTO embeddings
     (id, user_id, session_id, message_id, kind, role, memory_id, anchor_id, content, content_hash, embedding, weight, expires_at, created_at)
     VALUES (?, ?, ?, ?, 'message', ?, NULL, NULL, ?, ?, ?, ?, ?, ?)`,
    crypto.randomUUID(), userId, sessionId, messageId, role, content, contentHash, embeddingJson, weight, expiresAt, now
  );
}

/**
 * 写入 anchor 类型的 embedding
 */
async function upsertAnchorEmbedding(db, {
  userId, sessionId, anchorId, content, contentHash, embeddingJson,
  weight = 1.0, expiresAt = null, now = Date.now()
}) {
  // 先尝试插入，如果已存在则更新 embedding
  const id = crypto.randomUUID();
  const result = await db.run(
    `INSERT OR IGNORE INTO embeddings
     (id, user_id, session_id, message_id, kind, role, memory_id, anchor_id, content, content_hash, embedding, weight, expires_at, created_at)
     VALUES (?, ?, ?, NULL, 'anchor', NULL, NULL, ?, ?, ?, ?, ?, ?, ?)`,
    id, userId, sessionId, anchorId, content, contentHash, embeddingJson, weight, expiresAt, now
  );

  // 如果是重复的 anchor，更新其 embedding（anchor 可能被重新生成）
  if (result && result.changes === 0) {
    await db.run(
      `UPDATE embeddings
       SET embedding = ?, weight = ?, expires_at = ?, created_at = ?
       WHERE user_id = ? AND kind = 'anchor' AND anchor_id = ?`,
      embeddingJson, weight, expiresAt, now, userId, anchorId
    );
  }
}

/**
 * upsert memory embedding (idempotent)
 */
// async function upsertMemoryEmbedding(db, { userId, memoryId, content, contentHash, embeddingJson, now = Date.now() }) {
//   await db.run(
//     `INSERT OR IGNORE INTO embeddings
//      (id, user_id, session_id, message_id, kind, role, memory_id, content, content_hash, embedding, created_at)
//      VALUES (?, ?, NULL, NULL, 'memory', NULL, ?, ?, ?, ?, ?)`,
//     crypto.randomUUID(), userId, memoryId, content, contentHash, embeddingJson, now
//   );

//   await db.run(
//     `UPDATE embeddings
//      SET content = ?, content_hash = ?, embedding = ?, created_at = ?
//      WHERE user_id = ? AND kind = 'memory' AND memory_id = ?`,
//     content, contentHash, embeddingJson, now,
//     userId, memoryId
//   );
// }

module.exports = { upsertMessageEmbedding, upsertAnchorEmbedding };
