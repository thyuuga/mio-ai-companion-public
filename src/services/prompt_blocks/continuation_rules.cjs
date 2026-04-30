// src/services/prompt_blocks/continuation_rules.cjs

/**
 * buildContinuationRulesBlock - 短间隔续聊规则
 *
 * 当 gapMins < 360（6小时内）时，生成续聊行为约束。
 * 用于避免"今天怎么样"等日结式问候在短间隔时出现。
 *
 * @param {{ gapInfo: { gapMins?: number }, prevDayMeta: { lastInteractionAt?: number }, nowMs?: number }} opts
 * @returns {string}
 */
function buildContinuationRulesBlock({ gapInfo, prevDayMeta, nowMs }) {
  /* — core logic omitted for preview — */
}

module.exports = { buildContinuationRulesBlock };
