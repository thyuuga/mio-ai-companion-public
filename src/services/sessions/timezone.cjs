// src/services/sessions/timezone.cjs

/**
 * fun007. 获取用户 timezone
 */
async function getUserTimezone(db, userId) {
  const userRow = await db.get("SELECT timezone FROM users WHERE id = ?", userId);
  return String(userRow?.timezone || "Asia/Tokyo").trim() || "Asia/Tokyo";
}

module.exports = { getUserTimezone };
