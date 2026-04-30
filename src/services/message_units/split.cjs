// src/services/message_units/split.cjs
const { MAX_UNITS, MAX_UNIT_LEN } = require("./constants.cjs");

/**
 * 把用户 message 拆成多个 unit（最多 5 条）
 */
function splitUserMessageIntoUnits(text) {
  /* — core logic omitted for preview — */
}

module.exports = { splitUserMessageIntoUnits };
