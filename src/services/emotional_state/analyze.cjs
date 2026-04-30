// src/services/emotional_state/analyze.cjs
//
// Session 结束时的情感状态更新：
//   1. analyzeSessionFeeling  — 从 messages.feeling 聚合 + DeepSeek 生成 day_summary
//   2. computeAndUpdateMood   — 根据最近 feelings 推导 mood
//   3. computeAndUpdateRelationship — 根据交互天数 + 缺席天数更新 relationship

const { callDeepSeek } = require("../../../lib/llm.cjs");
const { logInfo, logError } = require("../../../lib/logger.cjs");
const { getDayKey } = require("../sessions/day_key.cjs");
const { updateDaySummary } = require("../db/day_contexts.cjs");
const { updateMioMood } = require("../db/mio_state.cjs");
const { computeAndSyncRelationship } = require("../relationship/score.cjs");

// ===== 常量 =====

const VALID_FEELINGS = ["calm", "happy", "sad", "angry", "proud", "shy"];
const VALID_MOODS = ["good", "steady", "low", "tired"];
const RELATIONSHIP_LEVELS = ["stranger", "familiar", "fond", "attached", "deeply_attached"];

// 中文标签 → 英文标签映射（本地模型返回中文）
const CN_TO_EN = {
  "平常": "calm",
  "开心": "happy",
  "伤心": "sad",
  "生气": "angry",
  "得意": "proud",
  "害羞": "shy",
};

// ===== 1. Feeling 聚合 + day_summary =====

/**
 * Session 结束时：
 *   - 从 messages.feeling 聚合本 session 的 feelings（本地模型已逐条写入）
 *   - 调用 DeepSeek 生成 day_summary（摘要需要上下文理解）
 * 写入 sessions.feelings + day_contexts.day_summary/tone_hint
 */
async function analyzeSessionFeeling(db, sessionId, userId, tz) {
  /* — core logic omitted for preview — */
}

// ===== 2. Mood 更新 =====

/**
 * 根据最近 5 个 session 的 feelings 推导 mood
 */
async function computeAndUpdateMood(db, userId) {
  /* — core logic omitted for preview — */
}

// ===== 3. Relationship 更新（委托给 score 系统） =====

/**
 * 根据关系分数同步 relationship stage
 * （旧版基于天数计算已废弃，现由 relationship/score.cjs 驱动）
 */
async function computeAndUpdateRelationship(db, userId) {
  /* — core logic omitted for preview — */
}

module.exports = {
  analyzeSessionFeeling,
  computeAndUpdateMood,
  computeAndUpdateRelationship,
  VALID_FEELINGS,
  VALID_MOODS,
  RELATIONSHIP_LEVELS,
};
