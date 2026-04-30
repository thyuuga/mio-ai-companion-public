// src/services/promises/log.cjs
// Promise 系统专用日志：debug 仅在 PROMISE_DEBUG=1 时输出
const { logDebug, logInfo } = require("../../../lib/logger.cjs");

function debug(tag, obj) {
  /* — core logic omitted for preview — */
}

function info(tag, obj) {
  /* — core logic omitted for preview — */
}

module.exports = { debug, info };
