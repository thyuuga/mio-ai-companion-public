// src/repositories/relationship_promises.repo.cjs
const crypto = require("crypto");

/**
 * Content hash (SHA-256) - same logic as committed_promises.repo.cjs
 */
function contentHashOf(content) {
  return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

/**
 * Insert relationship promise with INSERT OR IGNORE (deduplication by unique index on user_id + content_hash).
 * @param {object} db - sqlite db instance
 * @param {object} row - row data
 * @returns {Promise<{changes: number, lastID: number}>}
 */
async function insertRelationshipPromise(db, row) {
  const result = await db.run(
    `INSERT OR IGNORE INTO relationship_promises
     (id, user_id, session_id, content, content_hash, created_at, source_message_id, confidence,
      signals_json, candidate_confidence, candidate_lang)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    row.id,
    row.userId,
    row.sessionId ?? null,
    row.content,
    row.contentHash,
    row.createdAt,
    row.sourceMessageId ?? null,
    row.confidence ?? "relationship:v1",
    row.signalsJson ?? "{}",
    row.candidateConfidence ?? null,
    row.candidateLang ?? null
  );
  return { changes: result?.changes, lastID: result?.lastID };
}

/**
 * Find relationship promise by hash (optional helper).
 */
async function findRelationshipPromiseByHash(db, userId, contentHash) {
  return db.get(
    `SELECT id FROM relationship_promises WHERE user_id = ? AND content_hash = ?`,
    userId, contentHash
  );
}

module.exports = {
  contentHashOf,
  insertRelationshipPromise,
  findRelationshipPromiseByHash,
};
