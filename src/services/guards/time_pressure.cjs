// src/services/guards/time_pressure.cjs
const { logInfo } = require("../../../lib/logger.cjs");

/**
 * Fix3: guardTimePressure - 禁止小时级精确计时 + push 语气
 */
function guardTimePressure(reply, { gapInfo, message, isTimeQuestion, history }) {
  /* — core logic omitted for preview — */
}

module.exports = { guardTimePressure };
