// src/services/candidates/discard.cjs
const {
  DISCARD_MIN_LEN,
  EMOTION_WORDS_RE,
  OBJECT_HINTS_RE,
  TRANSIENT_STATE_RE,
} = require("./constants.cjs");

// 实体信号检测
function hasEntityHint(s, learnedRegex) {
  /* — core logic omitted for preview — */
}

function isEmotionOnlyNoTarget(s, learnedRegex) {
  /* — core logic omitted for preview — */
}

function isTransientState(s) {
  /* — core logic omitted for preview — */
}

// 自动丢弃判断
function shouldAutoDiscardCandidate({ content, learnedRegex }) {
  /* — core logic omitted for preview — */
}

function bumpStrength(oldS, newS) {
  /* — core logic omitted for preview — */
}

module.exports = {
  hasEntityHint,
  isEmotionOnlyNoTarget,
  isTransientState,
  shouldAutoDiscardCandidate,
  bumpStrength,
};
