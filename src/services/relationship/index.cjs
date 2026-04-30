// src/services/relationship/index.cjs

const {
  tickOnUserMessage,
  creditPositiveFeeling,
  computeAndSyncRelationship,
  resolveStage,
  getScoreRecord,
  POSITIVE_FEELINGS,
  STAGE_ORDER,
  STAGE_THRESHOLDS,
} = require("./score.cjs");

module.exports = {
  tickOnUserMessage,
  creditPositiveFeeling,
  computeAndSyncRelationship,
  resolveStage,
  getScoreRecord,
  POSITIVE_FEELINGS,
  STAGE_ORDER,
  STAGE_THRESHOLDS,
};
