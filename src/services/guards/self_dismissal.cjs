// src/services/guards/self_dismissal.cjs
const { logInfo } = require("../../../lib/logger.cjs");

/**
 * Fix2: guardSelfDismissal - 禁止无授权离场句式
 * 用户没表达收尾时，AI 不应说"那我去…了/我先…/我得…"
 */
function guardSelfDismissal(reply, { history, message }) {
  /* — core logic omitted for preview — */
}

module.exports = { guardSelfDismissal };
