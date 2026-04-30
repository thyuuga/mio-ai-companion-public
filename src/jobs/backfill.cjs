// src/jobs/backfill.cjs
require("dotenv").config();

const { getDB } = require("../../lib/db.cjs");
const { embedTexts } = require("../../lib/embeddings.cjs");
const { upsertMemoryEmbedding } = require("../repositories/embeddings.repo.cjs");

const { computeContentHash } = require("../utils/hash.cjs");
const { logInfo, logError } = require("../../lib/logger.cjs");

// schema 错误节流（避免刷屏）
const schemaErrorLogged = globalThis.schemaErrorLogged || {};
globalThis.schemaErrorLogged = schemaErrorLogged;

/**
 * 回填 memories 表中 content_hash 为空的行（幂等，不覆盖已有值）
 */
async function backfillMemoryHashes(db, { userId, limit = 200, now = Date.now() }) {
  const rows = await db.all(
    `SELECT id, content FROM memories
     WHERE user_id = ? AND (content_hash IS NULL OR content_hash = '')
     ORDER BY COALESCE(updated_at, created_at) ASC
     LIMIT ?`,
    userId, limit
  );

  let updated = 0;
  for (const m of rows) {
    const hash = computeContentHash(m.content);
    const result = await db.run(
      `UPDATE memories
       SET content_hash = ?, updated_at = ?
       WHERE id = ?
         AND (content_hash IS NULL OR content_hash = '')`,
      hash, now, m.id
    );
    if (result && result.changes) updated += result.changes;
  }

  return { total: rows.length, updated };
}

/**
 * 回填缺失或 hash 不一致的 memory embeddings（幂等、限量）
 */
async function backfillMemoryEmbeddings(db, { userId, limit = 50, now = Date.now() }) {
  let rows;
  try {
    rows = await db.all(
      `SELECT m.id, m.content, m.content_hash, m.updated_at
       FROM memories m
       LEFT JOIN embeddings e
         ON e.user_id = m.user_id
        AND e.kind = 'memory'
        AND e.memory_id = m.id
       WHERE m.user_id = ?
         AND (e.id IS NULL OR e.content_hash IS NULL OR e.content_hash != m.content_hash)
       ORDER BY COALESCE(m.updated_at, m.created_at) ASC
       LIMIT ?`,
      userId, limit
    );
  } catch (e) {
    // 兼容迁移未完成（缺列）
    if (e?.message?.includes("no such column")) {
      const errKey = "backfillMemoryEmbeddings:" + e.message.slice(0, 80);
      if (!schemaErrorLogged[errKey]) {
        schemaErrorLogged[errKey] = true;
        logError("[BACKFILL] schema error (will retry after migration):", e.message);
      }
      return { total: 0, success: 0, failed: 0, schemaError: true };
    }
    throw e;
  }

  let success = 0, failed = 0;

  for (const m of rows) {
    try {
      const [vec] = await embedTexts([m.content]);
      if (!vec) throw new Error("no embedding returned");

      const contentHash = m.content_hash || computeContentHash(m.content);

      await upsertMemoryEmbedding(db, {
        userId,
        memoryId: m.id,
        content: m.content,
        contentHash,
        embeddingJson: JSON.stringify(vec),
        now
      });

      success++;
    } catch (e) {
      failed++;
      logError("[BACKFILL] memory embedding failed:", m.id, e?.message || e);
    }
  }

  return { total: rows.length, success, failed, schemaError: false };
}

/**
 * 对所有用户跑一轮（按批次）
 * options:
 *  - userLimit: 扫多少用户
 *  - hashLimit: 每用户回填多少 hash
 *  - embLimit: 每用户回填多少 embedding
 */
async function runBackfillAllUsers({
  userLimit = 100,
  hashLimit = 200,
  embLimit = 50,
} = {}) {
  const db = await getDB();
  const now = Date.now();

  // 取用户列表（按需改 where）
  const users = await db.all(`SELECT id FROM users LIMIT ?`, userLimit);

  for (const u of users) {
    // 1) hash
    const hashResult = await backfillMemoryHashes(db, { userId: u.id, limit: hashLimit, now });
    if (hashResult.updated > 0) {
      logInfo("[BACKFILL_HASH]", `user=${u.id}`, `updated=${hashResult.updated}/${hashResult.total}`);
    }

    // 2) embedding
    const embResult = await backfillMemoryEmbeddings(db, { userId: u.id, limit: embLimit, now });
    if (embResult.schemaError) {
      logInfo("[BACKFILL_EMB] skipped due to schema error; stop here.");
      break; // 迁移没好就先停
    }
    if (embResult.total > 0) {
      logInfo("[BACKFILL_EMB]", `user=${u.id}`, `total=${embResult.total}`, `ok=${embResult.success}`, `ng=${embResult.failed}`);
    }
  }

  return { users: users.length };
}

// ===== CLI 入口：node src/jobs/backfill.cjs =====
if (require.main === module) {
  runBackfillAllUsers().then(
    (r) => {
      logInfo("[BACKFILL_DONE]", r);
      process.exit(0);
    },
    (e) => {
      logError("[BACKFILL_FATAL]", e);
      process.exit(1);
    }
  );
}

module.exports = {
  backfillMemoryHashes,
  backfillMemoryEmbeddings,
  runBackfillAllUsers,
};
