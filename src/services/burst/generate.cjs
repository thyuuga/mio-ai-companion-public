// src/services/burst/generate.cjs
//
// burst 第二句生成：轻量 LLM 调用，不复用主 prompt
// 根据主回复的风格和 burst 类型，生成一句 ≤20 字的轻量补充

const { callDeepSeek } = require("../../../lib/llm.cjs");

// ===== Burst System Prompt =====
const BURST_SYSTEM = `/* — core logic omitted for preview — */`;

// ===== Type Hints =====
// 三种 burst 类型的生成引导
const TYPE_HINTS = {
  soft_addon:      `/* — omitted — */`,   // 小补充，让主回复不戛然而止
  emotional_echo:  `/* — omitted — */`,   // 轻轻回应对方情绪
  aftertaste_tail: `/* — omitted — */`,   // 收语感，留余韵
};

// ===== replyMode → 附加约束 =====
// 根据主回复风格叠加约束，防止 burst 跳出语义轨道
const MODE_CONSTRAINTS = {
  imagery:    `/* — omitted — */`,
  soft_scene: `/* — omitted — */`,
  comfort:    `/* — omitted — */`,
  advice:     "",
  plain:      "",
};

/**
 * generateBurst - 生成 burst 连发的第二句
 *
 * @param {object} params
 * @param {string} params.primaryReply  - 主回复文本
 * @param {string} params.userMessage   - 用户消息
 * @param {string} params.burstType     - 'soft_addon' | 'emotional_echo' | 'aftertaste_tail'
 * @param {string} params.relationship  - 当前关系阶段
 * @param {string} params.replyMode     - 主回复风格 'imagery'|'soft_scene'|'advice'|'comfort'|'plain'
 * @returns {Promise<string|null>} burst 文本，或 null（生成失败 / 不合格）
 */
async function generateBurst({ primaryReply, userMessage, burstType, relationship, replyMode }) {
  /* — core logic omitted for preview — */
}

/**
 * 后处理：确保 burst 文本合规
 */
function validateBurst(text, primaryReply) {
  /* — core logic omitted for preview — */
}

module.exports = { generateBurst };
