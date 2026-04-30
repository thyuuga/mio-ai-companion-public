// src/services/guards/gap.cjs
const { GAP_REUNION_SOFT_HOURS, GAP_REUNION_STRONG_HOURS } = require("./constants.cjs");

/**
 * Fix1: 禁止输出小时数字
 * - gapMins < 3：刚刚
 * - gapMins < 60：刚才
 * - gapHours < 20：""（连续关系，不提示）
 * - gapHours < 36：隔了一会儿
 * - gapHours >= 36：隔了一段时间
 */
function formatGapTextFromMs(nowMs, lastMs) {
  /* — core logic omitted for preview — */
}

module.exports = { formatGapTextFromMs };
