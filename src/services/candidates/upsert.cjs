// src/services/candidates/upsert.cjs
const crypto = require("crypto");
const { logError } = require("../../../lib/logger.cjs");
const { normalizeCandidateContent } = require("../promises/normalize.cjs");

const { PROMOTE_SCORE } = require("./constants.cjs");
const { candidateKeyFromNorm, toTagArray, hasDenyTag, detectMemoryDenyIntent } = require("./key.cjs");
const { shouldAutoDiscardCandidate, bumpStrength } = require("./discard.cjs");
const { strengthWeight, isCrossSession, hasStrongTag, isCrossTime } = require("./promote_rules.cjs");
const { insertCandidateHit, mchSchemaErrorLogged } = require("./hits.cjs");

// ===== E. candidates（软记忆候选） =====
async function upsertCandidate(db, {
  /* — core logic omitted for preview — */
}

module.exports = { upsertCandidate };
