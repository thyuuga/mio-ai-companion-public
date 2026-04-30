// src/services/candidates/promote_rules.cjs
const { PROMOTE_MIN_SPAN_MS, STRONG_TAGS } = require("./constants.cjs");

function strengthWeight(s) {
  /* — core logic omitted for preview — */
}

function isCrossSession(firstSessionId, currentSessionId) {
  /* — core logic omitted for preview — */
}

function hasStrongTag(tags) {
  /* — core logic omitted for preview — */
}

function isCrossTime(firstSeenAt, now) {
  /* — core logic omitted for preview — */
}

module.exports = {
  strengthWeight,
  isCrossSession,
  hasStrongTag,
  isCrossTime,
};
