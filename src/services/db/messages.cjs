// src/services/db/messages.cjs
const crypto = require("crypto");
const { randomUUID } = crypto;

// ===== Config =====
const WINDOW = Number(process.env.CHAT_WINDOW) || 50;

/**
 * fun014b. 获取用户跨所有 session 的最后一条用户消息时间（全局）
 * @param {*} db
 * @param {string} userId
 * @param {string} [excludeSessionId] - 可选，排除指定 session（用于获取"上次 session"的时间）
 */
async function getLastUserMessageAtGlobal(db, userId, excludeSessionId = null) {
  if (excludeSessionId) {
    // 排除当前 session，获取"上次对话 session"的最后消息时间
    const row = await db.get(
      `SELECT m.created_at
       FROM messages m
       JOIN sessions s ON s.id = m.session_id
       WHERE s.user_id = ? AND m.role = 'user' AND m.session_id != ?
       ORDER BY m.created_at DESC
       LIMIT 1`,
      userId, excludeSessionId
    );
    return row?.created_at || 0;
  }

  const row = await db.get(
    `SELECT m.created_at
     FROM messages m
     JOIN sessions s ON s.id = m.session_id
     WHERE s.user_id = ? AND m.role = 'user'
     ORDER BY m.created_at DESC
     LIMIT 1`,
    userId
  );
  return row?.created_at || 0;
}

/**
 * fun009. 写入用户消息，返回 userMsgId
 */
async function insertUserMessage(db, sessionId, message, now) {
  const userMsgId = randomUUID();
  await db.run(
    "INSERT INTO messages (id, session_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)",
    userMsgId, sessionId, "user", message, now
  );
  return userMsgId;
}

/**
 * fun010. 获取最近 WINDOW 条对话（按时间正序）
 *
 * burst 连发消息（meta_json.burst === true）会被合并到其主回复中，
 * 不作为独立 turn 出现在 LLM prompt history 里。
 */
async function getRecentHistory(db, sessionId) {
  const rows = await db.all(
    "SELECT id, role, content, meta_json FROM messages WHERE session_id = ? ORDER BY created_at DESC LIMIT ?",
    sessionId,
    WINDOW + 10 // 多取一些，collapse 后再截断到 WINDOW
  );
  rows.reverse();

  // 收集 burst 内容，按 burst_group_id 分组
  const burstAppends = new Map();
  for (const row of rows) {
    const meta = _safeParseMeta(row.meta_json);
    if (meta.burst && meta.burst_group_id) {
      const arr = burstAppends.get(meta.burst_group_id) || [];
      arr.push(row.content);
      burstAppends.set(meta.burst_group_id, arr);
    }
  }

  // 构建结果：跳过 burst 行，把 burst 内容追加到主回复
  const result = [];
  for (const row of rows) {
    const meta = _safeParseMeta(row.meta_json);
    if (meta.burst) continue; // burst 行已收集，跳过
    let content = row.content;
    const appended = burstAppends.get(row.id);
    if (appended) content += "\n" + appended.join("\n");
    result.push({ role: row.role, content });
  }

  return result.slice(-WINDOW);
}

function _safeParseMeta(json) {
  try { return JSON.parse(json || "{}"); } catch { return {}; }
}

module.exports = {
  WINDOW,
  getLastUserMessageAtGlobal,
  insertUserMessage,
  getRecentHistory,
};
