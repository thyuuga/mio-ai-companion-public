// lib/intent_rules/detect_memory_cmd.cjs
// 显式记忆指令检测（指向 AI 的记忆操作）
// 收紧规则：排除日常用语如 "记得吃饭"、"记得那天吗"

/**
 * @param {string} text
 * @returns {{ hit: boolean, reasons: string[] }}
 */
function detectMemoryCmd(text) {
  /* — core logic omitted for preview — */
}

module.exports = { detectMemoryCmd };
