// src/services/queue/embedding.worker.cjs
const { getDB } = require("../../../lib/db.cjs");
const { embedTexts } = require("../../../lib/embeddings.cjs");
const { upsertMessageEmbedding, upsertAnchorEmbedding } = require("../../utils/embeddings.upsert.cjs")
const { upsertMemoryEmbedding } = require("../../repositories/embeddings.repo.cjs")

const BATCH = 10;
const MAX_ATTEMPTS = 3;
const CLEANUP_PROBABILITY = 0.1;  // 10% 概率清理
const CLEANUP_DAYS = 7;           // 清理 7 天前的记录

let running = false;

async function runEmbeddingWorker() {
  if (running) return;
  running = true;

  try {
    const db = await getDB();
    const jobs = await db.all(
      `SELECT * FROM embedding_jobs
       WHERE status='pending'
       ORDER BY created_at ASC
       LIMIT ?`,
      BATCH
    );
    if (!jobs.length) return;

    const now = Date.now();
    const ids = jobs.map(j => j.id);
    const placeholders = ids.map(() => "?").join(",");
    await db.run(
      `UPDATE embedding_jobs
       SET status='processing', updated_at=?
       WHERE id IN (${placeholders}) AND status='pending'`,
      now, ...ids
    );

    for (const job of jobs) {
      try {
        const [vec] = await embedTexts([job.content]);
        if (!vec) throw new Error("no embedding returned");

        const embeddingJson = JSON.stringify(vec);
        const t = Date.now();

        if (job.kind === "memory") {
          await upsertMemoryEmbedding(db, {
            userId: job.user_id,
            memoryId: job.ref_id,
            content: job.content,
            contentHash: job.content_hash,
            embeddingJson,
            weight: job.weight ?? 1.0,
            expiresAt: job.expires_at ?? null,
            now: t
          });
        } else if (job.kind === "message") {
          await upsertMessageEmbedding(db, {
            userId: job.user_id,
            sessionId: job.session_id,
            messageId: job.ref_id,
            role: job.role,
            content: job.content,
            contentHash: job.content_hash,
            embeddingJson,
            weight: job.weight ?? 1.0,
            expiresAt: job.expires_at ?? null,
            now: t
          });
        } else if (job.kind === "anchor") {
          await upsertAnchorEmbedding(db, {
            userId: job.user_id,
            sessionId: job.session_id,
            anchorId: job.ref_id,
            content: job.content,
            contentHash: job.content_hash,
            embeddingJson,
            weight: job.weight ?? 1.0,
            expiresAt: job.expires_at ?? null,
            now: t
          });
        }

        await db.run(`UPDATE embedding_jobs SET status='done', updated_at=? WHERE id=?`, Date.now(), job.id);
      } catch (e) {
        const attempts = (job.attempts || 0) + 1;
        const status = attempts >= MAX_ATTEMPTS ? "failed" : "pending";
        const err = (e?.message || String(e)).slice(0, 200);
        await db.run(
          `UPDATE embedding_jobs
           SET status=?, attempts=?, last_error=?, updated_at=?
           WHERE id=?`,
          status, attempts, err, Date.now(), job.id
        );
      }
    }

    // 10% 概率清理旧的已完成任务
    if (Math.random() < CLEANUP_PROBABILITY) {
      const cutoff = Date.now() - CLEANUP_DAYS * 24 * 60 * 60 * 1000;
      await db.run(
        `DELETE FROM embedding_jobs WHERE status IN ('done', 'failed') AND updated_at < ?`,
        cutoff
      );
    }
  } finally {
    running = false;
  }
}

module.exports = { runEmbeddingWorker };
