// src/services/candidates/key.cjs
const crypto = require("crypto");
const { DENY_TAGS, MEMORY_DENY_RE } = require("./constants.cjs");

// 入参 norm 必须已 normalizeCandidateContent
function candidateKeyFromNorm(norm) {
  /* — core logic omitted for preview — */
}

// 统一 reasonTags 为数组（上游可能传 string / null / array）
function toTagArray(tags) {
  /* — core logic omitted for preview — */
}

function hasDenyTag(tags) {
  /* — core logic omitted for preview — */
}

function detectMemoryDenyIntent(text) {
  /* — core logic omitted for preview — */
}

module.exports = {
  candidateKeyFromNorm,
  toTagArray,
  hasDenyTag,
  detectMemoryDenyIntent,
};
