// src/services/guards/stage_directions.cjs

/**
 * fun015a. 压缩舞台动作/旁白：每条回复最多保留 1 个括号段，且长度 <= maxLen
 * - 只匹配 () 和（），不匹配【】以免误伤系统块
 * - 跳过列表序号括号（数字、中文数字、字母、罗马数字）
 * - 跳过链接/路径类括号
 */
function shrinkStageDirections(reply, { maxCount = 1, maxLen = 10 } = {}) {
  /* — core logic omitted for preview — */
}

module.exports = { shrinkStageDirections };
