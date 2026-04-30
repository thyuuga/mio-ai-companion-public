// src/routes/auth.routes.cjs
const express = require("express");
const { randomUUID } = require("crypto");
const rateLimit = require("express-rate-limit");

const { getDB } = require("../../lib/db.cjs");
const { logInfo, logError } = require("../../lib/logger.cjs");
const { hashPassword, verifyPassword } = require("../../lib/password.cjs");
const { getCharacter } = require("../../lib/characters.cjs");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: "登录尝试过多，请15分钟后再试" },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = express.Router();

function getCookieName(req) {
  return getCharacter(req.productId).cookieName;
}

function getCookieOptions(req) {
  const isHttps = req.secure || req.headers["x-forwarded-proto"] === "https";
  return {
    httpOnly: true,
    // trycloudflare 等代理场景：HTTPS 时用 none + secure，否则 lax
    sameSite: isHttps ? "none" : "lax",
    secure: isHttps,
    path: "/",
  };
}

// API001. 初始化用户（管理员用）  POST /auth/seed
router.post("/auth/seed", async (req, res) => {
  const { adminKey, username, password, timezone } = req.body || {};
  const tz = ((timezone || "Asia/Tokyo").trim() || "Asia/Tokyo");

  if (!adminKey || adminKey !== process.env.ADMIN_SEED_KEY) {
    return res.status(403).json({ error: "Forbidden" });
  }
  if (!username || !password) {
    return res.status(400).json({ error: "Missing username/password" });
  }

  const db = await getDB();
  const id = randomUUID();
  const password_hash = hashPassword(password);

  const character = req.productId || "mio";
  try {
    await db.run(
      `INSERT INTO users (id, username, password_hash, created_at, timezone, character)
       VALUES (?, ?, ?, ?, ?, ?)`,
      id, username, password_hash, Date.now(), tz, character
    );
    res.json({ ok: true });
  } catch (e) {
    logError("auth/seed failed:", e);
    return res.status(400).json({ error: "User exists or insert failed" });
  }
});

// API002. 登录，写 cookie       POST /auth/login
router.post("/auth/login", loginLimiter, async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: "Missing username/password" });
  }

  let db, user;
  try {
    db = await getDB();
    user = await db.get(
      `SELECT id, password_hash FROM users WHERE username = ? AND character = ?`,
      username, req.productId || "mio"
    );
  } catch (e) {
    logError("[AUTH_LOGIN] db error", e?.message);
    return res.status(500).json({ error: "Database error" });
  }

  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const verifyResult = verifyPassword(password, user.password_hash);
  if (!verifyResult.ok) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // 登录成功，创建 session
  const token = randomUUID();
  const now = Date.now();
  const expires = now + 1000 * 60 * 60 * 24 * 30; // 30天

  try {
    await db.run(
      `INSERT INTO auth_sessions (id, user_id, created_at, expires_at)
       VALUES (?, ?, ?, ?)`,
      token, user.id, now, expires
    );
  } catch (e) {
    logError("[AUTH_LOGIN] session insert fail", e?.message);
    return res.status(500).json({ error: "Session creation failed" });
  }

  res.cookie(getCookieName(req), token, {
    ...getCookieOptions(req),
    maxAge: 1000 * 60 * 60 * 24 * 30,
  });

  logInfo("[AUTH_LOGIN] ok", { username, userId: user.id });
  res.json({ ok: true, token });
});

// API003. 退出，清 cookie       POST /auth/logout
router.post("/auth/logout", async (req, res) => {
  const cookieName = getCookieName(req);
  const token = req.cookies?.[cookieName];
  if (token) {
    const db = await getDB();
    await db.run(`DELETE FROM auth_sessions WHERE id = ?`, token);
  }
  res.clearCookie(cookieName, getCookieOptions(req));
  res.json({ ok: true });
});

module.exports = router;
