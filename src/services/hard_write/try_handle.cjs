// src/services/hard_write/try_handle.cjs
//
// Hard Write 处理入口（用于 handle_chat early-return）
//
// 从 handle_chat.cjs 抽离的硬写入处理逻辑

const { logDebug, logError } = require("../../../lib/logger.cjs");
const { persistAssistantAndReturn } = require("../chat/helpers.cjs");
const { maybeHandleHardWrite } = require("./index.cjs");

/**
 * tryHandleHardWrite - 处理显式硬写入
 *
 * @param {object} params
 * @param {object} params.db
 * @param {string} params.userId
 * @param {string} params.sessionId
 * @param {string} params.message
 * @param {number} params.nowMs
 * @param {object} params.flags
 * @param {string} params.userMsgId
 * @param {string} params.traceId
 * @param {object} params.meta
 * @param {object} params.writeCtx - 写入上下文（会被更新）
 * @returns {Promise<{ reply: string, assistant_created_at: number } | null>}
 */
async function tryHandleHardWrite({ db, userId, sessionId, message, nowMs, flags, userMsgId, traceId, meta, writeCtx }) {
  /* — core logic omitted for preview — */
}

module.exports = { tryHandleHardWrite };
