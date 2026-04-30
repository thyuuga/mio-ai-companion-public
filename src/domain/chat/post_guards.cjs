// src/domain/chat/post_guards.cjs
const { logError, logInfo } = require("../../../lib/logger.cjs");
const { guardOpener, guardTimePressure, guardSelfDismissal, shrinkStageDirections, guardPlotAdvancement, guardMemoryClaim } = require("../../services/guards/index.cjs");

/**
 * isSilenceMode - 判断用户是否处于沉默/收尾状态
 * 用于 guardPlotAdvancement Step 3 的启用判断
 */
function isSilenceMode(message) {
  /* — core logic omitted for preview — */
}

/**
 * applyPostGuards - LLM 回复后处理 guards（按原 7.5 顺序）
 *
 * @param {string} reply          - LLM 原始回复
 * @param {object} ctx
 * @param {object} ctx.meta       - { traceId, userId, sessionId }
 * @param {boolean} ctx.timeMode  - isTimeQuestion 结果
 * @param {string} ctx.nowLocalText
 * @param {number} ctx.nowMs
 * @param {number|null} ctx.lastInteractionAt - prevDayMeta.lastInteractionAt
 * @param {Array}  ctx.history
 * @param {string} ctx.message
 * @param {object} ctx.gapInfo
 * @param {boolean} ctx.hasMemorySource - 本轮是否有 recall/memory/summary 来源
 * @returns {string} 处理后的 reply
 */
function applyPostGuards(reply, ctx) {
  /* — core logic omitted for preview — */
}

module.exports = { applyPostGuards };
