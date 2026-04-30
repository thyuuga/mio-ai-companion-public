// src/services/addressing/detect_addressing.cjs

/**
 * sanitizeValue - 清理并验证称呼值
 * 去除引号/书名号/括号/语气词，验证长度和无标点
 * @param {string} raw
 * @returns {string|null} - 有效值或 null
 */
function sanitizeValue(raw) {
  /* — core logic omitted for preview — */
}

/**
 * detectAddressingStrong - 强触发检测（直接 commit）
 *
 * 支持句式：
 * - "以后叫我X"
 * - "请叫我X"
 * - "就叫我X"
 * - "你叫我X就行"
 * - "叫我X"（整句 <= 12 字时）
 *
 * @param {string} message
 * @returns {null | { value: string }}
 */
function detectAddressingStrong(message) {
  /* — core logic omitted for preview — */
}

/**
 * detectAddressingWeak - 弱触发检测（进入 pending）
 *
 * 支持句式：
 * - "大家都叫我X"
 * - "他们都叫我X"
 * - "朋友都叫我X"
 * - "我外号X" / "我的外号是X"
 *
 * @param {string} message
 * @returns {null | { value: string }}
 */
function detectAddressingWeak(message) {
  /* — core logic omitted for preview — */
}

module.exports = {
  detectAddressingStrong,
  detectAddressingWeak,
  sanitizeValue,
};
