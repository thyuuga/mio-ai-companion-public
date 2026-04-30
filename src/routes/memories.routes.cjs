// src/routes/memories.routes.cjs
const express = require("express");
const { randomUUID } = require("crypto");

const { getDB } = require("../../lib/db.cjs");
const { logError } = require("../../lib/logger.cjs");
const { bumpLearnedTermsFromText } = require("../../lib/learned_terms.cjs");
const { embedTexts } = require("../../lib/embeddings.cjs");
const { computeContentHash } = require("../utils/hash.cjs");
const { upsertMemoryEmbedding } = require("../repositories/embeddings.repo.cjs");
const requireAuth = require("../middleware/requireAuth.cjs");

const router = express.Router();

/**
 * API009. 手动写入长期 / 临时记忆
 * POST /memories
 */
router.post("/memories", requireAuth, async (req, res) => {
  const db = await getDB();
  const content = (req.body?.content || "").trim();
  const importance = req.body?.importance === 2 ? 2 : 1;

  if (!content) return res.status(400).json({ error: "Missing content" });
  const now = Date.now();
  const memoryId = randomUUID();
  const contentHash = computeContentHash(content);

  // 1) 写入 memories
  await db.run(
    `INSERT INTO memories (id, user_id, content, content_hash, importance, source, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'learned', ?, ?)`,
    memoryId,
    req.userId,
    content,
    contentHash,
    importance,
    now,
    now
  );

  // 2) bump learned_terms（弱一致：失败不影响主流程）
  try {
    await bumpLearnedTermsFromText(db, req.userId, content, { importance, now });
  } catch (e) {
    logError("[LEARNED_TERMS] bump from manual memory failed:", e);
  }

  // 3) embedding（弱一致：失败不影响主流程）
  try {
    const [vec] = await embedTexts([content]);
    if (vec) {
      await upsertMemoryEmbedding(db, {
        userId: req.userId,
        memoryId,
        content,
        contentHash,
        embeddingJson: JSON.stringify(vec),
        now,
      });
    }
  } catch (e) {
    logError("[MEMORY_EMBEDDING] manual memory embedding failed:", e?.message || e);
  }

  res.json({ ok: true });
});

module.exports = router;
