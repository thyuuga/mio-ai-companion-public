// src/services/anchors/emit_dialog_anchor.cjs
// Phase 2: 对话触发 micro-summary anchors（MVP 仅强触发）

const { logInfo, logDebug } = require("../../../lib/logger.cjs");
const { emitAnchor } = require("./emit_anchor.cjs");

// ========== 强触发词检测 ==========

// Yes/No 确认词（完整匹配或开头匹配）
const YESNO_PATTERNS = [
  /^(好|行|可以|嗯|对|是的?|没问题|OK|ok|确定|同意)$/i,
  /^(不要?|不行|算了|改天|取消|不用了?|别了|不想|不是)$/i,
  /^(就这样|那就|就按|好的?吧|行吧|可以吧)$/i,
];

// 指代词（包含匹配）
const DEIXIS_PATTERN = /(这个|那个|上次|这样|那样|那家|这家|明天那个|刚才说的|你说的那个|之前那个|上面说的)/;

// 边界词（包含匹配）
const BOUNDARY_PATTERN = /(别这么叫|不要叫我|不要提|雷点|讨厌|别再|不喜欢被|不想被|不要说|别说)/;

// low_info 判定（短句或纯确认词）
function isLowInfo(text) {
  /* — core logic omitted for preview — */
}

// 检测触发类型
function detectTriggerType(currUserText) {
  /* — core logic omitted for preview — */
}

// ========== 绑定逻辑 ==========

/**
 * 从上一轮 assistant 回复中提取可能提到的 plan/promise
 * @param {object} db
 * @param {string} userId
 * @param {string} prevAssistantText
 * @param {number} nowMs
 * @returns {Promise<{type: 'plan'|'promise', item: object}|null>}
 */
async function findReferencedPlanOrPromise(db, userId, prevAssistantText, nowMs) {
  /* — core logic omitted for preview — */
}

/**
 * 提取文本中的关键词（简单实现：去除常用词，取 >= 2 字的词）
 */
function extractKeywords(text) {
  /* — core logic omitted for preview — */
}

// ========== 生成 anchor ==========

/**
 * emitDialogAnchor - 对话触发 micro-summary anchor
 *
 * @param {object} db
 * @param {{
 *   userId: string,
 *   sessionId: string,
 *   currUserText: string,
 *   prevUserText?: string,
 *   prevAssistantText?: string,
 *   nowMs?: number,
 * }} opts
 * @returns {Promise<{emitted: boolean, reason?: string, triggerType?: string}>}
 */
async function emitDialogAnchor(db, {
  /* — core logic omitted for preview — */
}

module.exports = {
  emitDialogAnchor,
  detectTriggerType,
  isLowInfo,
  // 测试用
  YESNO_PATTERNS,
  DEIXIS_PATTERN,
  BOUNDARY_PATTERN,
};
