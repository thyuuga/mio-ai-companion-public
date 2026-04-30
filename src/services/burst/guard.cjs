// src/services/burst/guard.cjs
//
// burst hard guard：纯机械兜底，只拦截确定性高的问题
// 语义类判断（风格识别、轨道匹配）不在这里做硬决策

// ===== detectReplyMode: provisional 词表提示 =====
// 注意：这是临时方案，仅作为 prompt hint / type 倾向的弱参考
// 不可靠，不用于硬拦截。后续会替换为轻量 LLM 分类

const IMAGERY_WORDS = [
  "梦", "星", "月", "风", "云", "光", "影", "花", "雨", "雪", "海", "天空",
  "蝴蝶", "萤火", "泡泡", "气球",
  "轻轻", "静静", "慢慢", "悄悄", "飘", "浮", "漾", "荡",
  "像是", "像在", "说不定", "仿佛", "好像在", "大概是",
  "温柔", "安静", "柔", "暖", "软",
];

const ADVICE_WORDS = [
  "别太", "别忘", "不要太", "不要忘", "注意", "小心",
  "应该", "最好", "记得要", "还是要", "可别", "千万别",
  "早点", "好好", "按时", "一定要",
  "建议", "试试", "不如",
];

const COMFORT_WORDS = [
  "没事", "会好", "没关系", "别担心", "不怕", "别怕",
  "都会过去", "慢慢来", "不急",
];

/**
 * detectReplyMode - 识别主回复的风格轨道（provisional，词表驱动）
 *
 * ⚠️ 仅用于 prompt hint 和 burst type 倾向，不用于硬拦截
 * 后续计划替换为轻量 LLM / classifier
 *
 * @param {string} text - 主回复文本（含括号动作）
 * @returns {'imagery' | 'soft_scene' | 'advice' | 'comfort' | 'plain'}
 */
function detectReplyMode(text) {
  /* — core logic omitted for preview — */
}

// ===== hard guard: 只做确定性高的机械拦截 =====

// 转折词 — burst 里出现几乎必然是转轨，误杀率极低
const PIVOT_WORDS = ["不过", "但是", "可是", "然而", "只是", "话说回来", "话说"];

/**
 * guardBurstQuality - 生成后 hard guard
 *
 * 只做纯机械、不依赖语义分类的拦截：
 * - 转折词
 * - burst 比主回复长
 *
 * 语义类判断（directive / reality anchor）已移除，
 * 由 prompt 约束 + 后续 LLM classifier 承担
 *
 * @param {string} burstText    - 生成的 burst 文本
 * @param {string} primaryReply - 主回复文本
 * @returns {{ pass: boolean, reason: string }}
 */
function guardBurstQuality(burstText, primaryReply) {
  /* — core logic omitted for preview — */
}

module.exports = { detectReplyMode, guardBurstQuality };
