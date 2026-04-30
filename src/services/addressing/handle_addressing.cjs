// src/services/addressing/handle_addressing.cjs

const { detectAddressingStrong, detectAddressingWeak } = require("./detect_addressing.cjs");
const { parseAddressingConfirmation } = require("./parse_addressing_confirm.cjs");
const {
  createPending,
  getLatestPending,
  rejectPending,
  acceptPending,
  decrementTurnsLeft,
} = require("./repo.cjs");
const { ensureProfileRow, setField } = require("../profile/repo.cjs");
const { emitAddressingAnchor } = require("../anchors/emit_anchor.cjs");
const { logError } = require("../../../lib/logger.cjs");

// TTL: 7 天
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * handleAddressing - 称呼偏好处理入口
 *
 * 处理顺序：
 * 1. 若存在 pending 候选，优先走确认解析
 * 2. 没有 pending 时，判断强触发
 * 3. 没有 pending 且没命中强触发，判断弱触发
 *
 * @param {object} params
 * @param {object} params.db - SQLite 数据库实例
 * @param {string} params.userId
 * @param {string} params.message - 用户输入
 * @param {number} params.nowMs - 当前时间戳
 * @returns {Promise<null | { reply: string, didWrite: boolean }>}
 */
async function handleAddressing({ db, userId, message, nowMs }) {
  /* — core logic omitted for preview — */
}

module.exports = { handleAddressing };
