// src/services/promises/llm_review.cjs
const { info, debug } = require("./log.cjs");

// ─────────────────────────────────────────────────────────────
// 环境变量
// ─────────────────────────────────────────────────────────────
const ENABLE_LLM_REVIEW = process.env.PROMISE_LLM_REVIEW === "true";
const LLM_PROVIDER = (process.env.PROMISE_LLM_PROVIDER || "deepseek").toLowerCase(); // deepseek | openai
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.PROMISE_LLM_MODEL || "gpt-4o-mini";
const TIMEOUT_MS = 2500;

// ─────────────────────────────────────────────────────────────
// System Prompt（deepseek / openai 共用）
// ─────────────────────────────────────────────────────────────
// 约定候选检测分类器 prompt
// 判断用户消息是否包含有效约定，以及 assistant 是否接受
// 分类：event（事件性约定）/ relationship_b1（行为约束型）/ relationship_b2（情绪宣告型）/ none
const SYSTEM_PROMPT = `/* — core logic omitted for preview — */`;

// ─────────────────────────────────────────────────────────────
// JSON Schema for OpenAI structured output (strict mode)
// ─────────────────────────────────────────────────────────────
const PROMISE_REVIEW_SCHEMA = {
  name: "promise_review",
  strict: true,
  schema: {
    type: "object",
    properties: {
      isCandidate: { type: "boolean" },
      type: { type: "string", enum: ["event", "relationship_b1", "relationship_b2", "none"] },
      acceptance: { type: "string", enum: ["accept", "conditional_accept", "defer", "reject", "unknown"] },
      confidence: { type: "number" },
      reason: { type: "string" },
      signals: {
        type: "object",
        properties: {
          selfOnly: { type: "boolean" },
          isQuestion: { type: "boolean" },
          isHearsay: { type: "boolean" },
          hasAction: { type: "boolean" },
          hasFuture: { type: "boolean" },
          hasPlural: { type: "boolean" },
        },
        required: ["selfOnly", "isQuestion", "isHearsay", "hasAction", "hasFuture", "hasPlural"],
        additionalProperties: false,
      },
    },
    required: ["isCandidate", "type", "acceptance", "confidence", "reason", "signals"],
    additionalProperties: false,
  },
};

// ─────────────────────────────────────────────────────────────
// User Prompt Builder
// ─────────────────────────────────────────────────────────────
function buildUserPrompt(text, assistantText, tz, feat, originalProposal = null) {
  /* — core logic omitted for preview — */
}

// ─────────────────────────────────────────────────────────────
// JSON Extraction: 提取第一个 { 到最后一个 } 之间的内容
// ─────────────────────────────────────────────────────────────
function extractJson(raw) {
  /* — core logic omitted for preview — */
}

// ─────────────────────────────────────────────────────────────
// Validator: 校验解析后的 JSON 是否符合预期结构
// ─────────────────────────────────────────────────────────────
function validateResult(obj) {
  /* — core logic omitted for preview — */
}

// ─────────────────────────────────────────────────────────────
// DeepSeek Provider
// ─────────────────────────────────────────────────────────────
async function callDeepSeekProvider(text, assistantText, tz, feat, traceId, originalProposal = null) {
  /* — core logic omitted for preview — */
}

// ─────────────────────────────────────────────────────────────
// OpenAI Provider (lazy import)
// ─────────────────────────────────────────────────────────────
async function callOpenAIProvider(text, assistantText, tz, feat, traceId, originalProposal = null) {
  /* — core logic omitted for preview — */
}

// ─────────────────────────────────────────────────────────────
// Main Entry
// ─────────────────────────────────────────────────────────────
/**
 * LLM Review for promise candidates.
 * Only runs when PROMISE_LLM_REVIEW=true.
 * Provider: PROMISE_LLM_PROVIDER (deepseek|openai, default deepseek)
 *
 * @param {object} opts
 * @param {string} opts.text - current user text
 * @param {string} opts.tz - timezone
 * @param {string|null} opts.assistantText - assistant message
 * @param {object} opts.feat - features API result
 * @param {string} opts.traceId - trace ID
 * @param {string|null} opts.originalProposal - original proposal text (for multi-turn confirmation)
 * @returns {Promise<object|null>} { isCandidate, type, acceptance, confidence, reason, signals, meta } or null
 */
async function llmReviewPromiseCandidate({ text, tz, assistantText, feat, traceId, originalProposal = null }) {
  /* — core logic omitted for preview — */
}

module.exports = { llmReviewPromiseCandidate };
