// src/services/emotional_state/index.cjs

const { analyzeSessionFeeling, computeAndUpdateMood, computeAndUpdateRelationship } = require("./analyze.cjs");
const { buildMoodAndRelationshipBlock } = require("./blocks.cjs");
const { buildYesterdayBlock } = require("./yesterday.cjs");

module.exports = {
  // session 结束时调用
  analyzeSessionFeeling,
  computeAndUpdateMood,
  computeAndUpdateRelationship,
  // prompt 注入
  buildMoodAndRelationshipBlock,
  buildYesterdayBlock,
};
