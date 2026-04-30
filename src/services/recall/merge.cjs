// src/services/recall/merge.cjs
const { RECALL_THRESH, RECALL_TOPK, FINAL_TOPK, MEMORY_BONUS } = require("./constants.cjs");
const { cosineSim, normalizeContent, hashShort } = require("./score.cjs");

/**
 * 打分 + TopK + 合并去重
 */
function rankAndMerge({ qVec, messageCandidates, memoryCandidates }) {
  /* — core logic omitted for preview — */
}

module.exports = { rankAndMerge };
