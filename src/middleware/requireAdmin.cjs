// src/middleware/requireAdmin.cjs
const { getDB } = require("../../lib/db.cjs");
const { logError } = require("../../lib/logger.cjs");

const COOKIE_NAME = "admin_auth";

async function requireAdmin(req, res, next) {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) return res.status(401).json({ error: "Not logged in" });

    const db = await getDB();
    const row = await db.get(
      `SELECT admin_id FROM admin_sessions WHERE id = ? AND expires_at > ?`,
      token,
      Date.now()
    );

    if (!row) return res.status(401).json({ error: "Session expired" });

    req.adminId = row.admin_id;
    return next();
  } catch (e) {
    logError("requireAdmin error:", e);
    return res.status(500).json({ error: "Auth check failed" });
  }
}

module.exports = { requireAdmin, COOKIE_NAME };
