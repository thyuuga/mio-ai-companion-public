// src/services/message_filter/filter_message.cjs
/**
 * 消息过滤器：组合 Node 粗筛 + Python NLP 细筛
 *
 * 流程：
 * 1. Node 粗筛 → true/false/"pending_nlp"
 * 2. 如果 pending_nlp → 调用 Python NLP
 * 3. 返回最终结果
 */

const { logDebug, logInfo, logError } = require("../../../lib/logger.cjs");
const { shouldPassCoarseFilter } = require("./coarse_filter.cjs");
const { filterMessageNlp } = require("../clients/py_gateway_client.cjs");

// 环境变量控制
const MESSAGE_FILTER_ENABLED = process.env.MESSAGE_FILTER_ENABLED !== "0";  // 默认开启
const MESSAGE_FILTER_NLP_ENABLED = process.env.MESSAGE_FILTER_NLP_ENABLED !== "0";  // 默认开启

/**
 * 过滤结果
 * @typedef {object} FilterResult
 * @property {boolean} shouldEmbed - 是否应该做 embedding
 * @property {string} stage - 'coarse' | 'nlp' | 'disabled'
 * @property {string} reason - 过滤原因
 * @property {number} [score] - NLP 得分（仅 NLP 阶段）
 * @property {string[]} [features] - 特征列表（仅 NLP 阶段）
 */

/**
 * 过滤单条消息
 *
 * @param {object} opts
 * @param {string} opts.text - 消息文本
 * @param {string} [opts.role='user'] - 'user' | 'assistant'
 * @param {string} [opts.lang='zh'] - 语言
 * @param {string} [opts.traceId] - 追踪 ID
 * @returns {Promise<FilterResult>}
 */
async function filterMessage({ text, role = "user", lang = "zh", traceId }) {
  /* — core logic omitted for preview — */
}

/**
 * 判断消息是否应该入队 embedding（简化接口）
 *
 * @param {string} text
 * @param {string} role
 * @param {string} traceId
 * @returns {Promise<boolean>}
 */
async function shouldEmbedMessage(text, role, traceId) {
  /* — core logic omitted for preview — */
}

module.exports = {
  filterMessage,
  shouldEmbedMessage,
  // 常量导出
  MESSAGE_FILTER_ENABLED,
  MESSAGE_FILTER_NLP_ENABLED,
};
