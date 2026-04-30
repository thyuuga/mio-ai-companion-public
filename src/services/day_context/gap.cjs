// src/services/day_context/gap.cjs
// TODO: 抽离常量
const { GAP_THRESH } = require("./constants.cjs");

function formatGapText(lastInteractionAt, nowMs) {
  /* — core logic omitted for preview — */
}

function buildRules(alreadyMetToday) {
  /* — core logic omitted for preview — */
}

module.exports = { formatGapText, buildRules };
