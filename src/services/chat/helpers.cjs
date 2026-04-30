// src/services/chat/helpers.cjs
//
// handle_chat 辅助函数
//
// 从 handle_chat.cjs 抽离的通用辅助函数：
//   - createWriteCtx: 创建写入上下文
//   - scrubFalseMemoryClaim: 清洗虚假记忆声明
//   - persistAssistantAndReturn: 写入 assistant 消息并返回
//   - tryWriteMessageMeta: 写入消息 meta_json
//   - obviouslyNotPromise: Promise 预检过滤

const crypto = require("crypto");
const { randomUUID } = crypto;

const { logInfo, logError } = require("../../../lib/logger.cjs");

// 问句检测
const { isQuestionLike, hasCommitmentCue } = require("../planned_events/detect.cjs");

// ===== Write Context =====
// 用于追踪本轮是否实际写入了记忆/profile

/**
 * createWriteCtx - 创建写入上下文
 *
 * @returns {{ didWrite: boolean, likesAdded: number, ngsAdded: number, memoriesAdded: number, targets: string[] }}
 */
function createWriteCtx() {
  /* — core logic omitted for preview — */
}

// ===== False Memory Claim Scrubber =====
// 全局护栏：如果 writeCtx.didWrite=false 但 reply 含"记住了/记下了"等强声明，替换回复

const FALSE_MEMORY_CLAIM_RE = /我记住了|已经记下|记下了|我会记住|我记得了/;

/**
 * scrubFalseMemoryClaim - 防止 LLM 虚假承诺"记住了"
 *
 * @param {string} reply - LLM 回复
 * @param {object} writeCtx - 写入上下文
 * @param {object} meta - 日志 meta
 * @returns {string} - 清洗后的回复
 */
function scrubFalseMemoryClaim(reply, writeCtx, meta) {
  /* — core logic omitted for preview — */
}

// ===== Promise Pre-check Filter =====
// 反向过滤：排除"明显不是 promise"的消息，减少无意义的 API 调用
// 原则：宁可多调用，不漏检

/**
 * obviouslyNotPromise - 判断消息是否明显不是 promise
 *
 * @param {string} text
 * @returns {boolean} true = 明显不是 promise，应跳过预检
 */
function obviouslyNotPromise(text) {
  /* — core logic omitted for preview — */
}

// ===== Internal Helpers (for early-return channels) =====

/**
 * persistAssistantAndReturn - 写入 assistant 消息 + 更新 session + 返回
 * 用于 profile_cmd / addressing / hard_write 等 early-return 通道
 *
 * @param {object} db
 * @param {string} sessionId
 * @param {string} reply
 * @returns {Promise<{ reply: string, assistant_created_at: number }>}
 */
async function persistAssistantAndReturn(db, sessionId, reply) {
  /* — core logic omitted for preview — */
}

/**
 * tryWriteMessageMeta - 写入消息 meta_json（仅用于 debug/回放）
 *
 * @param {object} db
 * @param {string} userMsgId
 * @param {object} intentCls - 意图分类结果
 * @param {object} meta - 日志 meta
 */
async function tryWriteMessageMeta(db, userMsgId, intentCls, meta) {
  /* — core logic omitted for preview — */
}

module.exports = {
  createWriteCtx,
  scrubFalseMemoryClaim,
  obviouslyNotPromise,
  persistAssistantAndReturn,
  tryWriteMessageMeta,
};
