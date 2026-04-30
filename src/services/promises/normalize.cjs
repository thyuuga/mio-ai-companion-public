// src/services/promises/normalize.cjs

const {
  LEADING_FILLERS_RE,
  CANDIDATE_MAX_LEN,
} = require("./constants.cjs");

// 去掉开头的语气词/口癖
function stripLeadingFillers(s) {
  /* — core logic omitted for preview — */
}

// 截断超长
function truncateCandidate(s) {
  /* — core logic omitted for preview — */
}

// 清洗 candidate 内容（只负责清洗，不做 discard 判断）
function normalizeCandidateContent(s) {
  /* — core logic omitted for preview — */
}

/**
 * 剥离开头连续括号段（动作描写），如 "（微笑）好呀" → "好呀"
 * 支持中英文括号
 */
function stripStageDirections(text) {
  /* — core logic omitted for preview — */
}

module.exports = { normalizeCandidateContent, stripStageDirections };
