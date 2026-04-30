// src/services/emotional_state/blocks.cjs
//
// Prompt block 构建：Mio 的内在状态（mood + relationship）
// 根据当前 mood 和 relationship stage 生成对应的行为指引，注入 system prompt

const { getMioState } = require("../db/mio_state.cjs");
const { getCharacter } = require("../../../lib/characters.cjs");

// ===== Mood 描述映射 =====

const MOOD_DESCRIPTIONS = {
  good:   /* — omitted — */ "",
  steady: /* — omitted — */ "",
  low:    /* — omitted — */ "",
  tired:  /* — omitted — */ "",
};

// ===== Relationship 阶段指引（6 维度） =====
// 每个阶段从 6 个维度定义行为：
//   核心关系感 / 距离感 / 语气 / 主动性 / 情感表达上限 / 语言风格

const RELATIONSHIP_GUIDANCE = {
  stranger:        `/* — core logic omitted for preview — */`,
  familiar:        `/* — core logic omitted for preview — */`,
  fond:            `/* — core logic omitted for preview — */`,
  attached:        `/* — core logic omitted for preview — */`,
  deeply_attached: `/* — core logic omitted for preview — */`,
};

// ===== pre_established 关系重新解释 block =====
// 用于 pre_established 角色（如 Len），将 relationship stage 解释为
// "表达放松程度" 而非 "是否有关系"

const PRE_ESTABLISHED_REINTERPRETATION = `/* — core logic omitted for preview — */`;

/**
 * 深夜时段（1:00-4:59）mood 覆写：
 * steady → tired，good/low 保持不变
 */
function applyNighttimeOverride(baseMood, tz, nowMs) {
  /* — core logic omitted for preview — */
}

/**
 * 构建 Mood + Relationship + 当前 Feeling prompt block
 * @param {object} db
 * @param {string} userId
 * @param {string} [sessionId] - 当前 session ID，用于取最近一条 feeling
 * @param {string} [tz] - 用户时区
 * @param {number} [nowMs] - 当前毫秒时间戳
 * @returns {string}
 */
async function buildMoodAndRelationshipBlock(db, userId, sessionId, tz, nowMs, productId) {
  /* — core logic omitted for preview — */
}

module.exports = { buildMoodAndRelationshipBlock, applyNighttimeOverride };
