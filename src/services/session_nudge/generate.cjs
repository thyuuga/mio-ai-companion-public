// src/services/session_nudge/generate.cjs
//
// session nudge 专用 prompt：用户停住后，轻轻留一句"我还在"
// 不复用主聊天 prompt，也不复用 proactive prompt

const { callDeepSeek } = require("../../../lib/llm.cjs");
const { getCharacter } = require("../../../lib/characters.cjs");

// ===== 关系阶段 → 语气说明 =====
// 不同关系阶段下 nudge 的语气约束
const RELATIONSHIP_HINTS = { /* — omitted — */ };

/**
 * buildNudgePrompt - 构建 session nudge 专用 system prompt
 */
function buildNudgePrompt({ characterName, relationship }) {
  /* — core logic omitted for preview — */
}

/**
 * generateNudgeMessage - 生成一条 session nudge 消息
 *
 * @param {object} params
 * @param {string} params.character    - 'mio' | 'len'
 * @param {string} params.relationship - 关系阶段
 * @returns {Promise<string|null>}
 */
async function generateNudgeMessage({ character, relationship }) {
  /* — core logic omitted for preview — */
}

module.exports = { generateNudgeMessage };
