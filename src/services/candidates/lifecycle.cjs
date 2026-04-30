// src/services/candidates/lifecycle.cjs
const crypto = require("crypto");
const { logError } = require("../../../lib/logger.cjs");
const { embedTexts } = require("../../../lib/embeddings.cjs");
const { bumpLearnedTermsFromText } = require("../../../lib/learned_terms.cjs");
const { computeContentHash } = require("../../utils/hash.cjs");
const { upsertMemoryEmbedding } = require("../../repositories/embeddings.repo.cjs");

const { PROMOTE_SCORE } = require("./constants.cjs");
const { isCrossSession, hasStrongTag, isCrossTime } = require("./promote_rules.cjs");

function hasAnyTag(evidence, tags) {
  /* — core logic omitted for preview — */
}

function decideImportance(row) {
  /* — core logic omitted for preview — */
}

function shouldPromote(row, now = Date.now()) {
  /* — core logic omitted for preview — */
}

async function promoteCandidateToMemories(db, { userId, candidateRow, now = Date.now() }) {
  /* — core logic omitted for preview — */
}

async function maybePromoteCandidate(db, { userId, key, now = Date.now() }) {
  /* — core logic omitted for preview — */
}

async function cleanupExpiredCandidates(db, userId, now = Date.now()) {
  /* — core logic omitted for preview — */
}

module.exports = {
  hasAnyTag,
  decideImportance,
  shouldPromote,
  promoteCandidateToMemories,
  maybePromoteCandidate,
  cleanupExpiredCandidates,
};
