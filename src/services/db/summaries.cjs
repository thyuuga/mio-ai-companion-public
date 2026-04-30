// src/services/db/summaries.cjs
const { callDeepSeek } = require("../../../lib/llm.cjs");
const { getSessionSummary, upsertSessionSummary } = require("../../repositories/session_summaries.repo.cjs");
const { WINDOW } = require("./messages.cjs");

/**
 * fun005.
 * 每 50 条触发一次压缩（不删除消息）
 * 51 条时压缩 1-50，101 条时压缩 51-100，151 条时压缩 101-150...
 * 增量合并到已有摘要
 */
async function summarizeIfNeeded(db, sessionId) {
  const countRow = await db.get(
    "SELECT COUNT(*) AS c FROM messages WHERE session_id = ?",
    sessionId
  );
  const count = countRow?.c || 0;

  // 触发条件：count > 50 且刚好超过 50 的倍数（51, 101, 151...）
  if (count <= WINDOW) return;
  if ((count - 1) % WINDOW !== 0) return;

  // 计算这次要压缩的 OFFSET
  // count=51 → OFFSET=0, count=101 → OFFSET=50, count=151 → OFFSET=100
  const batchIndex = Math.floor((count - 1) / WINDOW) - 1;
  const offset = batchIndex * WINDOW;

  const oldMsgs = await db.all(
    `SELECT id, role, content
     FROM messages
     WHERE session_id = ?
     ORDER BY created_at ASC
     LIMIT ? OFFSET ?`,
    sessionId,
    WINDOW,
    offset
  );

  if (!oldMsgs.length) return;

  // 获取用户称呼：优先 user_profile.name，没有则用 users.username
  const userRow = await db.get(
    `SELECT COALESCE(p.name, u.username) AS display_name,
            u.character AS character
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     LEFT JOIN user_profile p ON p.user_id = s.user_id
     WHERE s.id = ?`,
    sessionId
  );
  const userName = userRow?.display_name || "用户";
  const charName = userRow?.character || "mio";

  const prevSummary = await getSessionSummary(db, sessionId);

  const summarizerSystem = {
    role: "system",
    content:
      `你是对话摘要器。这是${userName}和${charName}之间的对话记录：\n` +
      `- user = ${userName}（对话中${charName}可能用各种昵称称呼他）\n` +
      `- assistant = ${charName}\n\n` +
      `将对话压缩为简短摘要，保留关键事实、人物偏好、约定、情绪变化。主语要清晰（${userName}做了什么、${charName}做了什么）。不要编造。用中文。`
  };

  const summarizerUser = {
    role: "user",
    content:
      (prevSummary ? `已有摘要：\n${prevSummary}\n\n` : "") +
      "请把下面这些对话内容合并进摘要，输出「新的摘要」（只输出摘要正文）：\n" +
      oldMsgs.map(m => `${m.role}: ${m.content}`).join("\n")
  };

  const nextSummary = await callDeepSeek([summarizerSystem, summarizerUser]);

  await upsertSessionSummary(db, sessionId, (nextSummary || "").trim());
}

module.exports = {
  summarizeIfNeeded,
};
