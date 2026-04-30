// src/services/profile/handle_profile_cmd.cjs
//
// Profile 命令处理
//
// 从 handle_chat.cjs 抽离的 profile 命令处理逻辑：
//   - tryHandleProfileCmd: 处理 set/clear/add/remove 等 profile 命令
//   - tryHandleAddressingCmd: 处理称呼偏好

const { logInfo, logDebug, logError } = require("../../../lib/logger.cjs");
const { persistAssistantAndReturn } = require("../chat/helpers.cjs");
const { handleAddressing } = require("../addressing/index.cjs");

const {
  detectProfileCmd,
  ensureProfileRow,
  setField,
  clearField,
  addNickname,
  removeNickname,
  addToJsonArrayField,
  removeFromJsonArrayField,
  mergeJsonObjectField,
} = require("./index.cjs");

/**
 * tryHandleProfileCmd - 处理 profile 命令
 *
 * @param {object} params
 * @param {object} params.db
 * @param {string} params.userId
 * @param {string} params.sessionId
 * @param {string} params.message
 * @param {number} params.nowMs
 * @param {object} params.meta
 * @param {object} params.writeCtx - 写入上下文（会被更新）
 * @returns {Promise<{ reply: string, assistant_created_at: number } | null>}
 */
async function tryHandleProfileCmd({ db, userId, sessionId, message, nowMs, meta, writeCtx }) {
  /* — core logic omitted for preview — */
}

/**
 * tryHandleAddressingCmd - 处理称呼偏好
 *
 * @param {object} params
 * @param {object} params.db
 * @param {string} params.userId
 * @param {string} params.sessionId
 * @param {string} params.message
 * @param {number} params.nowMs
 * @param {object} params.meta
 * @returns {Promise<{ reply: string, assistant_created_at: number } | null>}
 */
async function tryHandleAddressingCmd({ db, userId, sessionId, message, nowMs, meta }) {
  /* — core logic omitted for preview — */
}

module.exports = {
  tryHandleProfileCmd,
  tryHandleAddressingCmd,
};
