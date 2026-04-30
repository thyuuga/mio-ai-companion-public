// src/repositories/embeddings.repo.cjs
const crypto = require("crypto");

/**
 * upsert memory embedding (idempotent)
 */
async function upsertMemoryEmbedding(db, {
  userId, memoryId, content, contentHash, embeddingJson,
  weight = 1.0, expiresAt = null, now = Date.now()
}) {
  await db.run(
    `INSERT OR IGNORE INTO embeddings
     (id, user_id, session_id, message_id, kind, role, memory_id, anchor_id, content, content_hash, embedding, weight, expires_at, created_at)
     VALUES (?, ?, NULL, NULL, 'memory', NULL, ?, NULL, ?, ?, ?, ?, ?, ?)`,
    crypto.randomUUID(), userId, memoryId, content, contentHash, embeddingJson, weight, expiresAt, now
  );

  await db.run(
    `UPDATE embeddings
     SET content = ?, content_hash = ?, embedding = ?, weight = ?, expires_at = ?, created_at = ?
     WHERE user_id = ? AND kind = 'memory' AND memory_id = ?`,
    content, contentHash, embeddingJson, weight, expiresAt, now,
    userId, memoryId
  );
}

module.exports = { upsertMemoryEmbedding };
