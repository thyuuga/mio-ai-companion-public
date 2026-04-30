// src/services/planned_events/title_norm.cjs

// 结尾语气词（可重复出现）
const TRAILING_PARTICLES_RE = /[吧呀呢啊哦嘛啦哇诶哈噢耶]+$/;
// 省略号（中文/英文多种形式）
const ELLIPSIS_RE = /[…·.。]{2,}$|\.{2,}$/;
// 结尾标点（中/英文常见）
const TRAILING_PUNCT_RE = /[。！？，、,.!?~～]+$/;
// 全角空格 → 半角
const FULLWIDTH_SPACE_RE = /\u3000/g;
// 多空格 → 单空格
const MULTI_SPACE_RE = /\s{2,}/g;

// 常见前缀动词/时间修饰（按长度降序，避免短的先匹配）
const PREFIX_PATTERNS = [
  /^(后天|明天|大后天|下周|下个月|周末|这周末|下周末)?(要|想|打算|准备|计划)?(去|到|回)?/,
];

// "X的Y" 模式：若 Y 非空且长度合理，则取 Y 作为核心
const XDE_Y_RE = /^(.{1,8})的(.{1,12})$/;

/**
 * stripTrailingParticlesAndPunct - 去除尾部语气词和标点
 *
 * @param {string} s
 * @returns {string}
 */
function stripTrailingParticlesAndPunct(s) {
  /* — core logic omitted for preview — */
}

/**
 * normalizeTitleNorm - 归一化标题（语义去重用）
 *
 * 处理：
 * - lower + trim
 * - 全角空格 → 半角
 * - 折叠多空格
 * - 去结尾省略号
 * - 去结尾语气词（吧呀呢啊哦嘛啦哇诶等）
 * - 去结尾标点
 * - 去常见前缀动词（去/要去/打算去/准备去/想去/后天要去 等）
 * - 处理 "X的Y" 模式：取 Y 作为核心
 *
 * 例如：
 * - "环球影城玩吧！！！" → "环球影城玩"
 * - "京都的鸭川哦" → "鸭川"
 * - "明天要去钓鱼" → "钓鱼"
 *
 * @param {string} title
 * @returns {string}
 */
function normalizeTitleNorm(title) {
  /* — core logic omitted for preview — */
}

module.exports = { normalizeTitleNorm, stripTrailingParticlesAndPunct };
