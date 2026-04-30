// src/middleware/requireAuth.cjs
const { getDB } = require("../../lib/db.cjs");
const { logError } = require("../../lib/logger.cjs");
const { getCharacter } = require("../../lib/characters.cjs");

async function requireAuth(req, res, next) {
  try {
    // 支持 Bearer token（小程序）和 Cookie（浏览器）
    const authz = req.headers.authorization || "";
    const bearer = authz.startsWith("Bearer ") ? authz.slice(7).trim() : "";
    const cookieName = getCharacter(req.productId).cookieName;
    const cookieToken = req.cookies?.[cookieName];
    const token = bearer || cookieToken;

    if (!token) return res.status(401).json({ error: "Not logged in" });

    const db = await getDB();
    const now = Date.now();

    const row = await db.get(
      `SELECT s.user_id FROM auth_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.id = ? AND s.expires_at > ? AND u.character = ?`,
      token,
      now,
      req.productId || "mio"
    );

    if (!row) return res.status(401).json({ error: "Session expired" });

    req.userId = row.user_id;
    return next();
  } catch (e) {
    logError("requireAuth error:", e);
    return res.status(500).json({ error: "Auth check failed" });
  }
}

module.exports = requireAuth;
