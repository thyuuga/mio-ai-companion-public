
/**
 * fun006. 校验 session 是否属于当前用户（防串号），并返回 session 信息
 */
async function assertSessionOwner(db, sessionId, userId) {
  const session = await db.get(
    "SELECT id, updated_at, ended_at, end_state, end_message FROM sessions WHERE id = ? AND user_id = ?",
    sessionId,
    userId
  );
  if (!session) {
    const err = new Error("No access to this session");
    err.status = 403;
    throw err;
  }
  return session; // { id, updated_at, ended_at, end_state, end_message }
}

module.exports = { assertSessionOwner };
