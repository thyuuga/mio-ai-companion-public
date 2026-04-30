// src/services/promises/semantic_detect.cjs
const { embedTexts } = require("../../../lib/embeddings.cjs");
const { normalizeCandidateContent } = require("./normalize.cjs");
const { cosineSim } = require("./similarity.cjs");
const { extractTimeHint, extractTimeSpec } = require("./time_hint.cjs");
const {
  PROMISE_SIM_THRESHOLD,
  PROMISE_SIM_THRESHOLD_COMMIT_TONE,
  PROMISE_ANCHORS,
  SEMANTIC_GATE,
  COMMIT_TONE,
} = require("./constants.cjs");

// 缓存 anchor embeddings
let _promiseAnchorVecs = null;

/**
 * 语义判定「约定」
 * 返回：{ content, timeHint, score, timeSpec } 或 null
 * timeSpec 包含结构化时间字段（time_text, time_precision, time_year, ...）
 */
async function detectCommittedPromiseC(text, nowMs, tz) {
  /* — core logic omitted for preview — */
}

module.exports = { detectCommittedPromiseC };
