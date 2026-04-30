// src/routes/debug.routes.cjs
// 调试接口：仅 NODE_ENV !== 'production' 时启用
const express = require("express");
const router = express.Router();

const { getDB, getDBInfo } = require("../../lib/db.cjs");
const { logError } = require("../../lib/logger.cjs");

// DEBUG_API: DB 路径信息 GET /debug/db
router.get("/debug/db", async (req, res) => {
  try {
    const info = getDBInfo();
    res.json(info);
  } catch (e) {
    logError("[DEBUG_DB] failed:", e);
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// DEBUG_API: 用户列表 GET /debug/users
router.get("/debug/users", async (req, res) => {
  try {
    const db = await getDB();
    const countRow = await db.get(`SELECT COUNT(*) AS c FROM users`);
    const usersRow = await db.all(`SELECT username FROM users LIMIT 10`);
    res.json({
      total: countRow?.c || 0,
      usernames: usersRow.map(r => r.username),
    });
  } catch (e) {
    logError("[DEBUG_USERS] failed:", e);
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// DEBUG_API: DB 统计 GET /debug/stats
router.get("/debug/stats", async (req, res) => {
  try {
    const db = await getDB();
    const sessions = await db.get("SELECT COUNT(*) AS c FROM sessions");
    const messages = await db.get("SELECT COUNT(*) AS c FROM messages");
    const memories = await db.get("SELECT COUNT(*) AS c FROM memories");
    const embeddings = await db.get("SELECT COUNT(*) AS c FROM embeddings");
    const anchors = await db.get("SELECT COUNT(*) AS c FROM conversation_anchors").catch(() => ({ c: 0 }));
    res.json({
      sessions: sessions?.c || 0,
      messages: messages?.c || 0,
      memories: memories?.c || 0,
      embeddings: embeddings?.c || 0,
      anchors: anchors?.c || 0,
    });
  } catch (e) {
    logError("[DEBUG_STATS] failed:", e);
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// DEBUG_API: Conversation Anchors GET /debug/anchors?limit=50
router.get("/debug/anchors", async (req, res) => {
  try {
    const db = await getDB();
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const nowMs = Date.now();

    // 查询 anchors 并 LEFT JOIN embeddings 检查是否已有 embedding
    const rows = await db.all(
      `SELECT
         a.id,
         a.anchor_type,
         a.domain,
         a.topic,
         a.content,
         a.weight,
         a.expires_at,
         a.created_at,
         CASE WHEN e.id IS NOT NULL THEN 1 ELSE 0 END AS has_embedding,
         CASE WHEN a.expires_at IS NOT NULL AND a.expires_at <= ? THEN 1 ELSE 0 END AS is_expired
       FROM conversation_anchors a
       LEFT JOIN embeddings e ON e.anchor_id = a.id AND e.kind = 'anchor'
       ORDER BY a.created_at DESC
       LIMIT ?`,
      nowMs, limit
    );

    res.json({
      total: rows.length,
      nowMs,
      anchors: rows.map(r => ({
        id: r.id,
        anchor_type: r.anchor_type,
        domain: r.domain,
        topic: r.topic,
        content: r.content?.slice(0, 100),
        weight: r.weight,
        expires_at: r.expires_at,
        created_at: r.created_at,
        has_embedding: !!r.has_embedding,
        is_expired: !!r.is_expired,
      })),
    });
  } catch (e) {
    logError("[DEBUG_ANCHORS] failed:", e);
    res.status(500).json({ error: String(e?.message || e) });
  }
});

module.exports = router;
