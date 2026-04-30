// src/services/addressing/parse_addressing_confirm.cjs

const { sanitizeValue } = require("./detect_addressing.cjs");

// 明确否定词
const REJECT_PATTERN = /不用|别|不要|算了|不必|不行|别这么叫|不太想/;

// 明确同意词
const ACCEPT_PATTERN = /^(可以|行|好|好的|没问题|就这么叫|就叫这个|可以叫|嗯|OK|ok)$/i;

// 带替代指令的模式："叫我Y" / "喊我Y" / "称呼我Y"
const REPLACE_PATTERN = /(?:叫我|喊我|称呼我|叫我做|称呼我为)\s*(.+)/;

/**
 * parseAddressingConfirmation - 解析用户对称呼候选的确认回复
 *
 * 仅在存在 pending 候选时调用，解析用户本轮输入
 *
 * @param {string} message - 用户本轮输入
 * @param {object} pending - addressing_candidates row
 * @returns {{ action: 'accept'|'reject'|'replace'|'none', value?: string }}
 */
function parseAddressingConfirmation(message, pending) {
  /* — core logic omitted for preview — */
}

module.exports = { parseAddressingConfirmation };
