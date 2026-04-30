// src/services/db/closing_summary.cjs
//
// Session 结束时生成 closing_summary：
// - 短 session（无增量 summary）：全量消息 → LLM 总结
// - 长 session（有增量 summary）：已有 summary + 尾部未覆盖消息 → LLM 合并总结

const { callDeepSeek } = require("../../../lib/llm.cjs");
const { logInfo, logError } = require("../../../lib/logger.cjs");
const { getSessionSummary, upsertClosingSummary } = require("../../repositories/session_summaries.repo.cjs");
const { WINDOW } = require("./messages.cjs");

/**
 * Session 结束时生成 closing_summary 并写入 session_summaries
 * @param {*} db
 * @param {string} sessionId
 * @returns {Promise<string>} 生成的 closing_summary（空字符串表示不满足条件）
 */
async function generateClosingSummary(db, sessionId) {
  const meta = { traceId: "CLOSING_SUMMARY", sessionId };

  // 1. 查消息数（只算 user/assistant）
  const countRow = await db.get(
    `SELECT COUNT(*) AS c FROM messages
     WHERE session_id = ? AND role IN ('user', 'assistant')`,
    sessionId
  );
  const count = countRow?.c || 0;
  if (count < 2) {
    logInfo(meta, "skipped (< 2 messages)", { count });
    return "";
  }

  // 2. 获取用户称呼
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

  // 3. 获取已有增量 summary
  const existingSummary = await getSessionSummary(db, sessionId);

  // 4. 取需要发给 LLM 的消息
  let messages;
  if (!existingSummary) {
    // 无增量 summary → 取全部（上限 50 条）
    messages = await db.all(
      `SELECT role, content FROM messages
       WHERE session_id = ? AND role IN ('user', 'assistant')
       ORDER BY created_at ASC
       LIMIT 50`,
      sessionId
    );
  } else {
    // 有增量 summary → 取尾部未被覆盖的消息
    const numFullBatches = Math.floor((count - 1) / WINDOW);
    const tailOffset = numFullBatches > 0 ? numFullBatches * WINDOW : 0;

    messages = await db.all(
      `SELECT role, content FROM messages
       WHERE session_id = ? AND role IN ('user', 'assistant')
       ORDER BY created_at ASC
       LIMIT -1 OFFSET ?`,
      sessionId,
      tailOffset
    );
  }

  // 5. 如果有增量 summary 但没有尾部消息 → 直接用增量 summary 作为 closing
  if (existingSummary && messages.length === 0) {
    await upsertClosingSummary(db, sessionId, existingSummary);
    logInfo(meta, "used existing summary as closing (no tail)", { len: existingSummary.length });
    return existingSummary;
  }

  // 6. 调用 DeepSeek 生成 closing summary
  const conversationText = messages
    .map(m => `${m.role === "user" ? userName : charName}: ${m.content}`)
    .join("\n");

  const systemPrompt = {
    role: "system",
    content:
      `你是对话摘要器。这是${userName}和${charName}之间的对话记录：\n` +
      `- user = ${userName}（对话中${charName}可能用各种昵称称呼他）\n` +
      `- assistant = ${charName}\n\n` +
      "将对话压缩为简短摘要（50-100字）。\n" +
      `要求：保留关键事实、话题、偏好、约定。主语要清晰（${userName}做了什么、${charName}做了什么）。\n` +
      "只概括实际发生的事实和话题，不要推测意图，不要添加未提及的情绪判断，不要编造。\n" +
      "用中文。只输出摘要正文，不要输出其他任何内容。",
  };

  let userContent;
  if (existingSummary) {
    userContent =
      `已有摘要（覆盖了之前的对话）：\n${existingSummary}\n\n` +
      "以下是之后的新对话，请合并生成一份完整摘要：\n" +
      conversationText;
  } else {
    userContent = "请概括以下对话：\n" + conversationText;
  }

  let closingSummary = "";
  try {
    const raw = await callDeepSeek([systemPrompt, { role: "user", content: userContent }]);
    closingSummary = (raw || "").trim();
  } catch (e) {
    logError(meta, "DeepSeek call failed", e);
  }

  // fallback：LLM 失败时，有增量 summary 就用它，否则取最后一条用户消息前 30 字
  if (!closingSummary) {
    if (existingSummary) {
      closingSummary = existingSummary;
    } else {
      const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
      closingSummary = lastUserMsg
        ? lastUserMsg.content.slice(0, 30).replace(/\n/g, " ")
        : "";
    }
  }

  if (!closingSummary) {
    logInfo(meta, "skipped (empty result)");
    return "";
  }

  // 7. 写入
  await upsertClosingSummary(db, sessionId, closingSummary);
  logInfo(meta, "generated", { len: closingSummary.length, hadExisting: !!existingSummary });
  return closingSummary;
}

module.exports = { generateClosingSummary };
