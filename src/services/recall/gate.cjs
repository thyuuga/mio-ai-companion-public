// src/services/recall/gate.cjs
const { getLearnedTermsRegex } = require("../../../lib/learned_terms.cjs");

function shouldRecall(text) {
  /* — core logic omitted for preview — */
}

// learned_terms 命中可放宽 recall gate（短句也允许召回）
async function shouldRecallWithLearnedTerms(db, userId, text) {
  /* — core logic omitted for preview — */
}

module.exports = { shouldRecallWithLearnedTerms };
