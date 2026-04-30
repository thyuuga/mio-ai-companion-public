// src/services/proactive/generate.cjs
//
// 主动消息生成：独立 prompt，不复用主聊天 prompt
// 根据 triggerType (login / window) 和上下文构建 prompt，调用 LLM 生成一句 ≤25 字的主动消息

const { callDeepSeek } = require("../../../lib/llm.cjs");
const { getCharacter } = require("../../../lib/characters.cjs");

// ===== 时间段描述 =====
function getTimeDesc(triggerType, nowMs, tz) {
  /* — core logic omitted for preview — */
}

// ===== 时间窗口语气层 =====
// 不同时间段的语气要求（早上安静 / 中午轻快 / 晚上柔和 / 深夜极轻）
const TIME_TONE_HINTS = { /* — omitted — */ };

// ===== 时间间隔 → 自然语言 =====
function getContextGapText(createdAt, now) {
  /* — core logic omitted for preview — */
}

// ===== context 转自然语言 =====
function contextToPromptText(context, now) {
  /* — core logic omitted for preview — */
}

// ===== 关系阶段 → 语气说明 =====
// 不同关系阶段的主动消息语气约束
const RELATIONSHIP_HINTS = { /* — omitted — */ };

// ===== 共通规则 =====
// 主动消息生成的核心约束（字数、格式、时间准确性等）
const BASE_RULES = `/* — core logic omitted for preview — */`;

/**
 * buildLoginPrompt - 登录触发的 prompt
 * 核心感觉：你发现对方来了，轻轻打个照面
 */
function buildLoginPrompt({ characterName, relationship, contextText, timeDesc, hasContext }) {
  /* — core logic omitted for preview — */
}

/**
 * buildWindowPrompt - 时间窗口触发的 prompt
 * 核心感觉：某个时间点，你心里浮起一个念头，轻轻说出来
 */
function buildWindowPrompt({ characterName, relationship, contextText, timeDesc, hasContext }) {
  /* — core logic omitted for preview — */
}

/**
 * buildProactivePrompt - 根据 triggerType 分发到对应 prompt
 */
function buildProactivePrompt({ characterName, relationship, contextText, timeDesc, hasContext, triggerType }) {
  /* — core logic omitted for preview — */
}

/**
 * generateProactiveMessage - 生成一条主动消息
 *
 * @param {object} params
 * @param {string} params.character      - 'mio' | 'len'
 * @param {string} params.relationship   - 关系阶段
 * @param {object|null} params.context   - { type, text } | null
 * @param {string} params.triggerType    - 'login' | 'window_morning' | 'window_noon' | 'window_evening'
 * @param {string} params.tz             - 用户时区
 * @param {number} params.now            - 当前时间戳（ms）
 * @returns {Promise<string|null>}
 */
async function generateProactiveMessage({ character, relationship, context, triggerType, tz, now }) {
  /* — core logic omitted for preview — */
}

module.exports = { generateProactiveMessage };
