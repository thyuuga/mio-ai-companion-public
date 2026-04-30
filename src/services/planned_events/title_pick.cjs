// src/services/planned_events/title_pick.cjs

const { stripTrailingParticlesAndPunct } = require("./title_norm.cjs");

// 修饰性词汇（使标题更具体的标志）
const DETAIL_MARKERS_RE = /[的在到去从跟和与]/;

/**
 * pickBetterTitle - 选择更"具体/详细"的标题
 *
 * 规则：
 * 1. stripTrailingParticlesAndPunct 后长度更长者优先
 * 2. 若长度相同，包含修饰词（的/在/到/去/从/跟/和/与）者优先
 * 3. 若仍相同，保留旧的（existing）
 *
 * @param {string} existingTitle - 已存在的标题
 * @param {string} incomingTitle - 新传入的标题
 * @returns {string} - 选中的更好的标题
 */
function pickBetterTitle(existingTitle, incomingTitle) {
  /* — core logic omitted for preview — */
}

module.exports = { pickBetterTitle };
