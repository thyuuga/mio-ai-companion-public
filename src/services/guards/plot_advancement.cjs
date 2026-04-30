// src/services/guards/plot_advancement.cjs

/**
 * 剧情推进安全带 - 删除禁止的时间/环境/退场描写
 * 这是安全带，不是语义理解，只做删除不做理解
 */

// 括号内命中时删除整个括号的关键词
const BRACKET_FORBIDDEN = /夜色|月光|清晨|第二天|虫鸣|房间|街道|风雨|环境|窗外|灯光|黑暗|醒来|入睡/;

// 整段命中时截断的时间推进词（不含 天亮/天黑 避免误伤事实聊天）
const TIME_SKIP_PATTERN = /第二天|清晨|过了一会儿|夜色渐深|时间流逝|不知过了多久|醒来时|入睡后/;

// 戏剧化退场词（用于删除包含它们的括号）
const EXIT_PATTERN = /关门|离开|走远|转身离去|消失|退出|告别|道别/;

// 环境镜头词（用于删除包含它们的句子或括号）
const ENV_PATTERN = /月光洒|虫鸣声|风吹过|房间.*安静|街道.*空旷|夜色.*深|星光|烛光摇曳/;

/**
 * guardPlotAdvancement - 删除禁止的剧情推进内容
 * @param {string} reply - LLM 原始回复
 * @param {object} ctx - 上下文
 * @param {boolean} ctx.silenceMode - 沉默模式（用户沉默/短回复/收尾词时启用 Step3）
 * @returns {string} 处理后的回复
 */
function guardPlotAdvancement(reply, ctx = {}) {
  /* — core logic omitted for preview — */
}

module.exports = { guardPlotAdvancement };
