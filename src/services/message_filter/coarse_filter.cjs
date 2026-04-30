// src/services/message_filter/coarse_filter.cjs
/**
 * Node 粗筛：快速过滤明显不需要 embedding 的消息
 *
 * 返回值：
 * - true: 直接通过，入队 embedding
 * - false: 直接拒绝，不入队
 * - "pending_nlp": 需要 Python NLP 进一步判断
 */

// ========== 拒绝模式 ==========

// 纯语气词/感叹词
const FILLER_ONLY = /^[嗯啊哦哈呵嘿噗呀哇唉诶~～。！？…、]+$/u;

// 纯短确认词
const SHORT_CONFIRM = /^(好的?|行|嗯+|哦+|啊|哈哈+|呵呵+|嘻嘻+|噗|ok|OK|okok|嗯嗯|好好|行行|对对|是是)$/i;

// 纯表情符号
const EMOJI_ONLY = /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s]+$/u;

// 纯数字/标点
const PUNCTUATION_ONLY = /^[\d\s\.,，。！？!?~～…、：:；;""''\"\'()\[\]【】]+$/;

// ========== 直接通过模式 ==========

// 自我陈述（高价值）
const SELF_STATEMENT = /^我(是|叫|住在?|在|有|想|要|会|能|喜欢|讨厌|不喜欢|不想|不要|不会|不能|觉得|认为|希望|打算|准备|决定)/;

// 明确的偏好/边界表达
const PREFERENCE_EXPR = /我(喜欢|讨厌|不喜欢|爱|不爱|怕|不怕|想要|不想要|需要|不需要)/;

// 有明确时间 + 动词（可能是计划）
const TIME_WITH_VERB = /(今天|明天|后天|昨天|上午|下午|晚上|周末|下周|这周|下个月|等会儿?|待会儿?|一会儿?).{0,10}(去|做|吃|喝|看|玩|买|见|约|开|参加|出发|回|到)/;

// 地点陈述
const LOCATION_STATEMENT = /我(住在?|在|去过|来自|老家|家在)/;

// 关系陈述
const RELATION_STATEMENT = /我(的|有).{0,4}(朋友|家人|爸|妈|父|母|哥|姐|弟|妹|老公|老婆|男朋友|女朋友|同事|同学|老师|老板)/;

/**
 * 粗筛主函数
 *
 * @param {string} text - 消息文本
 * @param {string} role - 'user' | 'assistant'
 * @returns {true | false | "pending_nlp"}
 */
function shouldPassCoarseFilter(text, role = "user") {
  /* — core logic omitted for preview — */
}

/**
 * 批量粗筛
 */
function batchCoarseFilter(messages) {
  /* — core logic omitted for preview — */
}

module.exports = {
  shouldPassCoarseFilter,
  batchCoarseFilter,
  // 导出模式供测试
  patterns: {
    FILLER_ONLY,
    SHORT_CONFIRM,
    EMOJI_ONLY,
    SELF_STATEMENT,
    PREFERENCE_EXPR,
    TIME_WITH_VERB,
  },
};
