/**
 * 迁移脚本：从远程 embedding API 切换到本地 bge-small-zh-v1.5
 *
 * 1. 清空 embeddings 表（维度不兼容，必须全部重建）
 * 2. 清空 embedding_jobs 表
 * 3. 重新入队所有 memory
 * 4. 重新入队所有 anchor
 * 5. 重新入队所有 message
 *
 * 用法：node src/jobs/migrate_embeddings.cjs
 */
require("dotenv").config();

const { getDB } = require("../../lib/db.cjs");
const { enqueueEmbedding } = require("../services/queue/enqueue.cjs");
const { logInfo, logError } = require("../../lib/logger.cjs");

function log(...args) {
  logInfo(...args);
}

async function main() {
  const db = await getDB();

  // 1. 清空 embeddings 表
  log("[MIGRATE] Clearing embeddings table...");
  const delEmb = await db.run(`DELETE FROM embeddings`);
  log("[MIGRATE] Deleted embeddings:", delEmb.changes);

  // 2. 清空 embedding_jobs 表
  log("[MIGRATE] Clearing embedding_jobs table...");
  const delJobs = await db.run(`DELETE FROM embedding_jobs`);
  log("[MIGRATE] Deleted embedding_jobs:", delJobs.changes);

  // 3. 重新入队所有 memory
  log("[MIGRATE] Re-enqueuing memories...");
  const memories = await db.all(
    `SELECT m.id, m.user_id, m.content, m.content_hash
     FROM memories m
     WHERE m.content IS NOT NULL AND m.content != ''`
  );
  log("[MIGRATE] Found", memories.length, "memories to re-embed");

  let memOk = 0, memSkip = 0;
  for (const m of memories) {
    const result = await enqueueEmbedding(db, m.user_id, "memory", m.id, m.content, {
      memoryId: m.id,
    });
    if (result.enqueued) memOk++;
    else memSkip++;
  }
  log("[MIGRATE] Memories enqueued:", memOk, "skipped:", memSkip);

  // 4. 重新入队所有 anchor
  log("[MIGRATE] Re-enqueuing anchors...");
  const anchors = await db.all(
    `SELECT id, user_id, content, weight, expires_at
     FROM conversation_anchors
     WHERE content IS NOT NULL AND content != ''`
  );
  log("[MIGRATE] Found", anchors.length, "anchors to re-embed");

  let ancOk = 0, ancSkip = 0;
  for (const a of anchors) {
    const result = await enqueueEmbedding(db, a.user_id, "anchor", a.id, a.content, {
      weight: (a.weight != null) ? a.weight : 1.0,
      expiresAt: a.expires_at || null,
    });
    if (result.enqueued) ancOk++;
    else ancSkip++;
  }
  log("[MIGRATE] Anchors enqueued:", ancOk, "skipped:", ancSkip);

  // 5. 重新入队所有 message（通过 session 关联 user_id）
  log("[MIGRATE] Re-enqueuing messages...");
  const messages = await db.all(
    `SELECT m.id, m.role, m.content, m.session_id, s.user_id
     FROM messages m
     JOIN sessions s ON s.id = m.session_id
     WHERE m.content IS NOT NULL AND m.content != ''
       AND m.role IN ('user', 'assistant')`
  );
  log("[MIGRATE] Found", messages.length, "messages to re-embed");

  let msgOk = 0, msgSkip = 0;
  for (const m of messages) {
    const result = await enqueueEmbedding(db, m.user_id, "message", m.id, m.content, {
      sessionId: m.session_id,
      role: m.role,
    });
    if (result.enqueued) msgOk++;
    else msgSkip++;
  }
  log("[MIGRATE] Messages enqueued:", msgOk, "skipped:", msgSkip);

  // 6. 统计
  const pendingCount = await db.get(`SELECT COUNT(*) as cnt FROM embedding_jobs WHERE status='pending'`);
  log("[MIGRATE] Done. Total pending jobs:", pendingCount.cnt);
  log("[MIGRATE] Start the server and embedding worker will process these jobs automatically.");
}

main().then(
  () => process.exit(0),
  (e) => {
    logError("[MIGRATE_FATAL]", e);
    process.exit(1);
  }
);
