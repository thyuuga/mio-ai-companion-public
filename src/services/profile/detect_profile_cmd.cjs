// src/services/profile/detect_profile_cmd.cjs

/**
 * detectProfileCmd - 解析用户明确的画像管理指令
 *
 * 边界：只处理用户明确要求「记住/以后叫我/别记」的信息
 * 不做自动抽取（随口说"我叫X"不写入，除非明确"记住"）
 *
 * 输出格式（一行表版）：
 * - { action: 'set', field: '...', value: '...' }
 * - { action: 'clear', field: '...' }
 * - { action: 'add_nickname', value: '...' }
 * - { action: 'remove_nickname', value: '...' }
 *
 * @param {string} message - 用户消息
 * @returns {null | object}
 */
// 混合句检测：若 value 含这些词，说明句子有混合意图，不应由 profile cmd 处理
const DISLIKE_KEYWORDS_RE = /讨厌|不喜欢|雷点|NG|不要提|别提|别聊|不要聊/i;
const LIKE_KEYWORDS_RE = /喜欢|很喜欢|爱/;

function detectProfileCmd(message) {
  /* — core logic omitted for preview — */
}

module.exports = { detectProfileCmd };
