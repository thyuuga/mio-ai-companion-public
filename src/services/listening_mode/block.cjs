// src/services/listening_mode/block.cjs
//
// 倾听模式 prompt block 生成
// 当用户情绪低落进入倾听模式时，注入特殊行为约束

// ===== Relationship 叠加指引 =====
// 不同关系阶段下，倾听模式的表达强度不同
const RELATIONSHIP_OVERLAY = {
  stranger:        `/* — omitted — */`,
  familiar:        `/* — omitted — */`,
  fond:            `/* — omitted — */`,
  attached:        `/* — omitted — */`,
  deeply_attached: `/* — omitted — */`,
};

// ===== 核心倾听规则 =====
// 不给建议、不分析、用户主导、短回复、共感但不过度
const LISTENING_RULES = `/* — core logic omitted for preview — */`;

// ===== 渐变退出指引 =====
// 用户情绪缓和时逐步退出倾听模式
const FADE_GUIDANCE = `/* — core logic omitted for preview — */`;

/**
 * buildListeningBlock - 构建倾听模式 prompt block
 *
 * @param {number} turnCount - 进入 listening 后的用户消息数
 * @param {string} relationship - 当前关系阶段
 * @returns {string}
 */
function buildListeningBlock(turnCount, relationship) {
  /* — core logic omitted for preview — */
}

module.exports = { buildListeningBlock };
