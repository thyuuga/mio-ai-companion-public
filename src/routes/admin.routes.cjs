// src/routes/admin.routes.cjs
const express = require("express");
const { randomUUID } = require("crypto");
const rateLimit = require("express-rate-limit");

const { getDB } = require("../../lib/db.cjs");
const { logInfo, logError } = require("../../lib/logger.cjs");
const { hashPassword, verifyPassword } = require("../../lib/password.cjs");
const { requireAdmin, COOKIE_NAME } = require("../middleware/requireAdmin.cjs");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "登录尝试过多，请15分钟后再试" },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = express.Router();

function getCookieOptions(req) {
  const isHttps = req.secure || req.headers["x-forwarded-proto"] === "https";
  return {
    httpOnly: true,
    sameSite: isHttps ? "none" : "lax",
    secure: isHttps,
    path: "/",
  };
}

// POST /admin/api/login
router.post("/login", loginLimiter, async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Missing username/password" });
  }

  try {
    const db = await getDB();
    const admin = await db.get(
      `SELECT id, password_hash FROM admins WHERE username = ?`,
      username
    );

    if (!admin) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const result = verifyPassword(password, admin.password_hash);
    if (!result.ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = randomUUID();
    const now = Date.now();
    const expires = now + 1000 * 60 * 60 * 24 * 7; // 7天

    await db.run(
      `INSERT INTO admin_sessions (id, admin_id, created_at, expires_at) VALUES (?, ?, ?, ?)`,
      token, admin.id, now, expires
    );

    res.cookie(COOKIE_NAME, token, {
      ...getCookieOptions(req),
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    logInfo("[ADMIN_LOGIN] ok", { username });
    res.json({ ok: true });
  } catch (e) {
    logError("[ADMIN_LOGIN] error", e?.message);
    res.status(500).json({ error: "Login failed" });
  }
});

// POST /admin/api/logout
router.post("/logout", async (req, res) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (token) {
    const db = await getDB();
    await db.run(`DELETE FROM admin_sessions WHERE id = ?`, token);
  }
  res.clearCookie(COOKIE_NAME, getCookieOptions(req));
  res.json({ ok: true });
});

// GET /admin/api/users
router.get("/users", requireAdmin, async (req, res) => {
  try {
    const db = await getDB();

    const users = await db.all(`
      SELECT
        u.id,
        u.username,
        u.character,
        u.created_at,
        (SELECT MAX(s.created_at) FROM auth_sessions s WHERE s.user_id = u.id) AS last_login_at,
        (SELECT COUNT(*) FROM day_contexts d WHERE d.user_id = u.id) AS total_login_days,
        (SELECT COUNT(*) FROM messages m
         JOIN sessions ss ON ss.id = m.session_id
         WHERE ss.user_id = u.id AND m.role = 'user') AS total_messages,
        ms.relationship
      FROM users u
      LEFT JOIN mio_state ms ON ms.user_id = u.id
      ORDER BY u.created_at DESC
    `);

    res.json({ ok: true, users });
  } catch (e) {
    logError("[ADMIN_USERS] error", e?.message);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// POST /admin/api/users/create — 创建新用户
router.post("/users/create", requireAdmin, async (req, res) => {
  const { username, password, character, timezone } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Missing username/password" });
  }

  const char = character || "mio";
  const tz = timezone || "Asia/Tokyo";

  try {
    const db = await getDB();
    const id = randomUUID();
    const password_hash = hashPassword(password);

    await db.run(
      `INSERT INTO users (id, username, password_hash, created_at, timezone, character)
       VALUES (?, ?, ?, ?, ?, ?)`,
      id, username, password_hash, Date.now(), tz, char
    );

    logInfo("[ADMIN_CREATE_USER] ok", { username, character: char });
    res.json({ ok: true, id, username });
  } catch (e) {
    if (e?.message?.includes("UNIQUE")) {
      return res.status(400).json({ error: "Username already exists" });
    }
    logError("[ADMIN_CREATE_USER] error", e?.message);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// POST /admin/api/users/:userId/reset-password — 重置用户密码
router.post("/users/:userId/reset-password", requireAdmin, async (req, res) => {
  const { password } = req.body || {};
  if (!password) {
    return res.status(400).json({ error: "Missing password" });
  }

  try {
    const db = await getDB();
    const { userId } = req.params;

    const user = await db.get(`SELECT id, username FROM users WHERE id = ?`, userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const password_hash = hashPassword(password);
    await db.run(`UPDATE users SET password_hash = ? WHERE id = ?`, password_hash, userId);

    // 清除该用户所有登录 session，强制重新登录
    await db.run(`DELETE FROM auth_sessions WHERE user_id = ?`, userId);

    logInfo("[ADMIN_RESET_PWD] ok", { userId, username: user.username });
    res.json({ ok: true });
  } catch (e) {
    logError("[ADMIN_RESET_PWD] error", e?.message);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

// DELETE /admin/api/users/:userId — 删除用户及所有关联数据
router.delete("/users/:userId", requireAdmin, async (req, res) => {
  try {
    const db = await getDB();
    const { userId } = req.params;

    const user = await db.get(`SELECT id, username FROM users WHERE id = ?`, userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // foreign key ON DELETE CASCADE 会自动清理大部分关联表
    // 手动清理没有 CASCADE 的表
    await db.run(`DELETE FROM auth_sessions WHERE user_id = ?`, userId);
    await db.run(`DELETE FROM users WHERE id = ?`, userId);

    logInfo("[ADMIN_DELETE_USER] ok", { userId, username: user.username });
    res.json({ ok: true });
  } catch (e) {
    logError("[ADMIN_DELETE_USER] error", e?.message);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// GET /admin/api/check — 检查登录状态
router.get("/check", requireAdmin, (req, res) => {
  res.json({ ok: true });
});

// GET /admin/api/users/:userId/days — 该用户有消息的日期列表
router.get("/users/:userId/days", requireAdmin, async (req, res) => {
  try {
    const db = await getDB();
    const { userId } = req.params;

    const days = await db.all(`
      SELECT DISTINCT date(m.created_at / 1000, 'unixepoch', 'localtime') AS day,
             COUNT(*) AS msg_count
      FROM messages m
      JOIN sessions s ON s.id = m.session_id
      WHERE s.user_id = ? AND m.role IN ('user', 'assistant')
      GROUP BY day
      ORDER BY day DESC
    `, userId);

    res.json({ ok: true, days });
  } catch (e) {
    logError("[ADMIN_USER_DAYS] error", e?.message);
    res.status(500).json({ error: "Failed to fetch days" });
  }
});

// GET /admin/api/users/:userId/messages?day=YYYY-MM-DD — 该用户某天（或全部）的聊天记录
router.get("/users/:userId/messages", requireAdmin, async (req, res) => {
  try {
    const db = await getDB();
    const { userId } = req.params;
    const { day } = req.query; // 可选，不传则返回全部

    let messages;
    if (day) {
      messages = await db.all(`
        SELECT m.id, m.role, m.content, m.created_at, m.feeling
        FROM messages m
        JOIN sessions s ON s.id = m.session_id
        WHERE s.user_id = ? AND m.role IN ('user', 'assistant')
          AND date(m.created_at / 1000, 'unixepoch', 'localtime') = ?
        ORDER BY m.created_at ASC
      `, userId, day);
    } else {
      messages = await db.all(`
        SELECT m.id, m.role, m.content, m.created_at, m.feeling
        FROM messages m
        JOIN sessions s ON s.id = m.session_id
        WHERE s.user_id = ? AND m.role IN ('user', 'assistant')
        ORDER BY m.created_at ASC
      `, userId);
    }

    res.json({ ok: true, messages });
  } catch (e) {
    logError("[ADMIN_USER_MESSAGES] error", e?.message);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// GET /admin/api/users/:userId/data — 该用户所有数据（按表分块）
router.get("/users/:userId/data", requireAdmin, async (req, res) => {
  try {
    const db = await getDB();
    const { userId } = req.params;

    const [
      user,
      profile,
      state,
      relScore,
      memories,
      promises,
      plans,
      sessions,
      dayContexts,
      geo,
      weather,
      proactiveMessages,
      nudges,
    ] = await Promise.all([
      db.get(`SELECT id, username, timezone, tier, character, created_at FROM users WHERE id = ?`, userId),
      db.get(`SELECT * FROM user_profile WHERE user_id = ?`, userId),
      db.get(`SELECT * FROM mio_state WHERE user_id = ?`, userId),
      db.get(`SELECT * FROM relationship_scores WHERE user_id = ?`, userId),
      db.all(`SELECT id, content, importance, source, created_at, updated_at FROM memories WHERE user_id = ? ORDER BY created_at DESC`, userId),
      db.all(`SELECT id, content, time_text, time_precision, committed_at, confidence FROM committed_promises WHERE user_id = ? ORDER BY committed_at DESC`, userId),
      db.all(`SELECT id, title, due_day_key, certainty, status, created_at FROM planned_events WHERE user_id = ? ORDER BY due_day_key DESC`, userId),
      db.all(`SELECT id, title, created_at, updated_at, ended_at, end_state, listening_mode, nudge_triggered FROM sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`, userId),
      db.all(`SELECT day_key, first_interaction_at, last_interaction_at, session_count, tone_hint FROM day_contexts WHERE user_id = ? ORDER BY day_key DESC LIMIT 30`, userId),
      db.get(`SELECT * FROM user_geolocation WHERE user_id = ?`, userId),
      db.all(`SELECT day_key, city, district, weather_text, temp, feels_like, temp_min, temp_max FROM weather_cache WHERE user_id = ? ORDER BY day_key DESC LIMIT 10`, userId),
      db.all(`SELECT id, trigger_type, content, seen, read, created_at FROM proactive_messages WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`, userId),
      db.all(`SELECT id, type, source_text, hint_after_ts, expire_ts, used, created_at FROM followup_nudges WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`, userId),
    ]);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      ok: true,
      sections: {
        user,
        profile: profile || null,
        state: state || null,
        relationship: relScore || null,
        memories,
        promises,
        plans,
        sessions,
        dayContexts,
        geolocation: geo || null,
        weather,
        proactiveMessages,
        nudges,
      },
    });
  } catch (e) {
    logError("[ADMIN_USER_DATA] error", e?.message);
    res.status(500).json({ error: "Failed to fetch user data" });
  }
});

module.exports = router;
