// src/routes/sessions.routes.cjs
const express = require("express");
const { randomUUID } = require("crypto");

const { getDB } = require("../../lib/db.cjs");
const requireAuth = require("../middleware/requireAuth.cjs");

const { getUserTimezone, getDayKey } = require("../services/sessions/index.cjs");
const { upsertDayContextOnSessionCreated } = require("../services/db/day_contexts.cjs");
const { getMioState } = require("../services/db/mio_state.cjs");
const { applyNighttimeOverride } = require("../services/emotional_state/blocks.cjs");
const { lookupCityByCoords, isConfigured: isQWeatherConfigured } = require("../services/weather/qweather_client.cjs");
const { logDebug, logError } = require("../../lib/logger.cjs");
const { getCharacter } = require("../../lib/characters.cjs");

const router = express.Router();

/** 查询 mio emotional state（mood + feeling + relationship）
 *  新 session 开始时 feeling 重置为"平常"，mood 经深夜滤镜
 */
async function fetchMioState(db, userId) {
  try {
    const state = await getMioState(db, userId);
    const tz = await getUserTimezone(db, userId);
    return {
      mood: applyNighttimeOverride(state.mood, tz, Date.now()),
      feeling: "平常",
      relationship: state.relationship,
    };
  } catch (e) {
    logError({ userId }, "[SESSION] fetchMioState failed", e);
    return null;
  }
}

/**
 * API005. 列出当前用户的会话（最多 20 条，含 msg_count）
 * GET /sessions
 */
router.get("/sessions", requireAuth, async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const db = await getDB();

  const rows = await db.all(
    `SELECT s.id, s.title, s.created_at, s.updated_at,
            s.ended_at, s.end_state, s.end_message, s.next_session_id,
            COALESCE(m.msg_count, 0) AS msg_count
     FROM sessions s
     LEFT JOIN (
       SELECT session_id, COUNT(*) AS msg_count
       FROM messages
       WHERE role IN ('user', 'assistant')
       GROUP BY session_id
     ) m ON m.session_id = s.id
     WHERE s.user_id = ?
     ORDER BY s.updated_at DESC
     LIMIT 20`,
    req.userId
  );

  res.json({ sessions: rows });
});

/**
 * API006. 创建新会话
 * POST /sessions
 */
router.post("/sessions", requireAuth, async (req, res) => {
  const db = await getDB();
  const id = randomUUID();
  const now = Date.now();
  const charName = getCharacter(req.productId).name;

  await db.run(
    `INSERT INTO sessions (id, user_id, title, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    id, req.userId, charName, now, now
  );

  res.json({ id });
});

/**
 * API006.5 确保有活跃会话（登录后调用）
 * POST /sessions/ensure_active
 */
router.post("/sessions/ensure_active", requireAuth, async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const db = await getDB();

  // 优先级 1：最近一个有消息且未结束
  const activeSession = await db.get(
    `SELECT s.id, s.title, s.created_at, s.updated_at,
            s.ended_at, s.end_state, s.end_message,
            COALESCE(m.msg_count, 0) AS msg_count
     FROM sessions s
     LEFT JOIN (
       SELECT session_id, COUNT(*) AS msg_count
       FROM messages
       WHERE role IN ('user', 'assistant')
       GROUP BY session_id
     ) m ON m.session_id = s.id
     WHERE s.user_id = ?
       AND s.ended_at IS NULL
       AND COALESCE(m.msg_count, 0) > 0
     ORDER BY s.updated_at DESC
     LIMIT 1`,
    req.userId
  );

  const mio_state = await fetchMioState(db, req.userId);

  if (activeSession) {
    return res.json({
      id: activeSession.id,
      created: false,
      msg_count: activeSession.msg_count,
      ended_at: null,
      end_state: null,
      end_message: null,
      mio_state,
    });
  }

  // 优先级 2：回退到“有消息”的最新 session（允许 ended）
  const lastWithMessages = await db.get(
    `SELECT s.id, s.title, s.created_at, s.updated_at,
            s.ended_at, s.end_state, s.end_message,
            COALESCE(m.msg_count, 0) AS msg_count
     FROM sessions s
     LEFT JOIN (
       SELECT session_id, COUNT(*) AS msg_count
       FROM messages
       WHERE role IN ('user', 'assistant')
       GROUP BY session_id
     ) m ON m.session_id = s.id
     WHERE s.user_id = ?
       AND COALESCE(m.msg_count, 0) > 0
     ORDER BY s.updated_at DESC
     LIMIT 1`,
    req.userId
  );

  if (lastWithMessages) {
    return res.json({
      id: lastWithMessages.id,
      created: false,
      msg_count: lastWithMessages.msg_count,
      ended_at: lastWithMessages.ended_at,
      end_state: lastWithMessages.end_state,
      end_message: lastWithMessages.end_message,
      mio_state,
    });
  }

  // 优先级 3：没有任何有消息的 session，创建新的
  const id = randomUUID();
  const now = Date.now();
  const charName = getCharacter(req.productId).name;

  await db.run(
    `INSERT INTO sessions (id, user_id, title, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    id, req.userId, charName, now, now
  );

  try {
    const tz = await getUserTimezone(db, req.userId);
    const dayKey = getDayKey(tz, now);
    await upsertDayContextOnSessionCreated(db, req.userId, dayKey, id, now);
  } catch (e) {
    // 这里不要炸 API：让它弱一致
    // 你有 logger 就换成 logError
    logError({ userId: req.userId }, "[ENSURE_ACTIVE] day_context upsert failed", e);
  }

  res.json({
    id,
    created: true,
    msg_count: 0,
    ended_at: null,
    end_state: null,
    end_message: null,
    mio_state,
  });
});

/**
 * API007. 获取某个会话的完整历史消息（带 ownership 校验）
 * GET /sessions/:id
 */
router.get("/sessions/:id", requireAuth, async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const db = await getDB();
  const sessionId = req.params.id;

  // ✅ 这里直接复用你原来的 ownership 校验逻辑
  const session = await db.get(
    `SELECT id, title, created_at, updated_at, user_id, ended_at, end_state, end_message, next_session_id
     FROM sessions
     WHERE id = ?`,
    sessionId
  );

  if (!session) return res.status(404).json({ error: "Session not found" });
  // 兼容旧数据：user_id 为空的会话，视为无权限（避免"老会话泄露"）
  if (!session.user_id) return res.status(403).json({ error: "Session has no owner" });
  if (session.user_id !== req.userId) return res.status(403).json({ error: "No access to this session" });

  const messages = await db.all(
    `SELECT role, content, created_at, feeling
     FROM messages
     WHERE session_id = ?
     ORDER BY created_at ASC`,
    sessionId
  );

  res.json({
    session: {
      id: session.id,
      title: session.title,
      created_at: session.created_at,
      updated_at: session.updated_at,
      ended_at: session.ended_at,
      end_state: session.end_state,
      end_message: session.end_message,
      next_session_id: session.next_session_id,
    },
    messages,
  });
});

/**
 * API010. 前端提交 geolocation（静默调用，用于天气服务）
 * POST /location
 * Body: { latitude: number, longitude: number }
 */
router.post("/location", requireAuth, async (req, res) => {
  const meta = { traceId: req.traceId || "LOCATION", userId: req.userId };

  try {
    const { latitude, longitude } = req.body || {};

    if (latitude == null || longitude == null) {
      return res.status(400).json({ error: "Missing latitude or longitude" });
    }

    const db = await getDB();
    const now = Date.now();

    // 1. 先存坐标（即使 GeoAPI 不可用也保留 lat/lon，天气 API 可直接用坐标查询）
    await db.run(
      `INSERT INTO user_geolocation (user_id, city, district, location_id, lat, lon, resolved_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         lat = excluded.lat,
         lon = excluded.lon,
         resolved_at = excluded.resolved_at`,
      req.userId, "", "", "", latitude, longitude, now
    );

    // 2. 尝试 GeoAPI 反查城市名（可选增强，失败不影响坐标存储）
    const geo = isQWeatherConfigured() ? await lookupCityByCoords(longitude, latitude) : null;
    if (geo) {
      await db.run(
        `UPDATE user_geolocation SET city = ?, district = ?, location_id = ? WHERE user_id = ?`,
        geo.city || "", geo.district || "", geo.locationId || "", req.userId
      );
      logDebug(meta, "[LOCATION] stored with city", { city: geo.city, district: geo.district });
      return res.json({ ok: true, city: geo.city, district: geo.district });
    }

    logDebug(meta, "[LOCATION] stored coords only (GeoAPI unavailable)", { latitude, longitude });
    res.json({ ok: true, city: "", district: "" });
  } catch (e) {
    logError(meta, "[LOCATION] failed", e);
    res.json({ ok: false, reason: "internal_error" });
  }
});

module.exports = router;
