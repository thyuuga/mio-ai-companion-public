// lib/intent_router.cjs
// 用户意图分类路由器
// 规则优先，LLM fallback 默认关闭（ENV INTENT_LLM_FALLBACK=true 才启用）
//
// V2: question 不再作为互斥 intent，而是作为 signal
// - signals.isQuestion: 用于 prompt/回复策略
// - primary_intent: 如果是问句，优先标记为 question（用于回复先回答问题）
// - flags: 由实际 intent (plan/promise/chat) 决定，不被 question 影响

const {
  detectAdmin,
  detectMemoryCmd,
  detectPromise,
  detectPlan,
  detectQuestion,
} = require("./intent_rules/index.cjs");

/**
 * Flags 默认表：每种意图对应的 pipeline 开关
 * 注意：question 不再作为独立 intent，而是 signal
 */
const FLAGS_TABLE = {
  admin: {
    allowRecall: false,
    allowSoftMemory: false,
    allowPlannedEvents: false,
    allowPromises: false,
    allowMemoryCmd: false,
    allowAdminMode: true,
  },
  memory_cmd: {
    allowRecall: false,
    allowSoftMemory: false,
    allowPlannedEvents: false,
    allowPromises: false,
    allowMemoryCmd: true,
    allowAdminMode: false,
  },
  promise: {
    allowRecall: true,
    allowSoftMemory: false,
    allowPlannedEvents: false,
    allowPromises: true,
    allowMemoryCmd: false,
    allowAdminMode: false,
  },
  plan: {
    allowRecall: true,
    allowSoftMemory: false,
    allowPlannedEvents: true,
    allowPromises: true,   // plan 也允许 promises（pair-based 检测）
    allowMemoryCmd: false,
    allowAdminMode: false,
  },
  chat: {
    allowRecall: true,
    allowSoftMemory: true,
    allowPlannedEvents: false,
    allowPromises: false,
    allowMemoryCmd: false,
    allowAdminMode: false,
  },
};

/**
 * 根据意图类型获取 flags
 * @param {string} intent
 * @returns {object}
 */
function intentToFlags(intent) {
  /* — core logic omitted for preview — */
}

/**
 * 轻量问句检测（用于 signals.isQuestion）
 * 不参与 intent 硬路由，只用于提示回复策略
 * @param {string} text
 * @returns {boolean}
 */
function isQuestionLike(text) {
  /* — core logic omitted for preview — */
}

/**
 * 用户意图分类主函数（规则优先）
 * @param {string} userText
 * @param {{ locale?: string, lastUserText?: string, lastAssistantText?: string }} options
 * @returns {{
 *   intent: "chat" | "plan" | "promise" | "memory_cmd" | "admin",
 *   primary_intent: "question" | "chat" | "plan" | "promise" | "memory_cmd" | "admin",
 *   confidence: number,
 *   reasons: string[],
 *   signals: { isQuestion: boolean },
 *   flags: {
 *     allowRecall: boolean,
 *     allowSoftMemory: boolean,
 *     allowPlannedEvents: boolean,
 *     allowPromises: boolean,
 *     allowMemoryCmd: boolean,
 *     allowAdminMode: boolean
 *   }
 * }}
 */
function classifyUserIntent(userText, options = {}) {
  /* — core logic omitted for preview — */
}

module.exports = {
  classifyUserIntent,
  intentToFlags,
  isQuestionLike,
  FLAGS_TABLE,
  // 导出单独的检测器供测试使用
  detectAdmin,
  detectMemoryCmd,
  detectPromise,
  detectPlan,
  detectQuestion,
};
