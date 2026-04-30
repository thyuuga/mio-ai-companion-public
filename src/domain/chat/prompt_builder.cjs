// src/domain/chat/prompt_builder.cjs
const fs = require("fs");
const path = require("path");

// ===== Dedupe Utils =====

/**
 * 标准化内容用于去重比较
 * 去除括号内容（中文括号、英文括号）和标点符号
 */
function normalizeForDedupe(content) {
  /* — core logic omitted for preview — */
}

/**
 * 对历史记录进行去重，限制同角色相同内容最多出现 maxRepeat 次
 * 按角色分别追踪，因为实际对话是 user/assistant 交替的
 * @param {Array} history - 消息历史数组
 * @param {number} maxRepeat - 允许的最大重复次数，默认 2
 * @returns {Array} 去重后的历史记录
 */
function dedupeHistory(history, maxRepeat = 2) {
  /* — core logic omitted for preview — */
}

// ===== Persona（按 productId 预加载所有角色） =====
const { getCharacterIds, getCharacter } = require("../../../lib/characters.cjs");

const personaMap = {};
for (const charId of getCharacterIds()) {
  const char = getCharacter(charId);
  const filePath = path.join(__dirname, "..", "..", "..", "persona", char.personaFile);
  try {
    personaMap[charId] = fs.readFileSync(filePath, "utf-8");
  } catch (_) {
    // persona 文件不存在时留空，启动不报错
    personaMap[charId] = "";
  }
}

// ===== Policies =====
const {
  SMALL_PERSISTENCE_POLICY,
  TIME_POLICY,
  INTERACTION_BOUNDARY_POLICY,
  BRACKET_POLICY,
  MEMORY_EXPRESSION_POLICY,
  CONVERSATION_BEHAVIOR_POLICY,
  RELATIONSHIP_CONFIRMATION_POLICY,
} = require("./policies.cjs");

// ===== Services =====
const { buildGapBlock } = require("../../services/time/index.cjs");
const { buildEmotionPermitBlock } = require("../../services/day_context/index.cjs");
const { buildContinuationRulesBlock } = require("../../services/prompt_blocks/continuation_rules.cjs");

/**
 * buildPrompt - 构建 system prompt 并处理 history
 *
 * @param {object} ctx
 * @param {string}   ctx.message
 * @param {Array}    ctx.history           - 当前 session 的消息历史
 * @param {boolean}  ctx.timeMode          - isTimeQuestion(message) 的结果（由调用方传入）
 * @param {string}   ctx.timeNowBlock
 * @param {string}   ctx.timeHint          - 重逢语义提示（来自 buildTimeContext）
 * @param {object}   ctx.gapInfo           - buildGapInfo 的返回值
 * @param {string}   ctx.circadianBlock
 * @param {string}   ctx.summaryBlock
 * @param {string}   ctx.dayContextBlock   - 已预计算的 day context 文本
 * @param {string}   ctx.todayEventBlock
 * @param {string}   ctx.memoryBlock
 * @param {string}   ctx.recallBlock
 * @param {string}   ctx.promisesBlock
 * @param {string}   ctx.anchorBlock
 * @param {boolean}  ctx.smallPersistenceAllowed
 * @param {string}   ctx.userProfileBlock      - 用户画像 prompt block（每轮固定注入）
 * @param {string}   ctx.moodBlock             - Mio 内在状态（mood + relationship）
 * @param {string}   ctx.yesterdayBlock         - 昨日线索 block
 * @param {string}   ctx.followupBlock          - 轻跟进提示 block（存在感跃迁）
 * @param {string}   ctx.weatherBlock           - 当地天气背景 block（仅背景，不主动播报）
 *
 * @returns {{ system: { role: string, content: string }, history: Array }}
 */
function buildPrompt(ctx) {
  /* — core logic omitted for preview — */
}

module.exports = { buildPrompt };
