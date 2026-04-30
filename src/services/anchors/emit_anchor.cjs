// src/services/anchors/emit_anchor.cjs
/**
 * 状态变化触发 anchor 的统一入口
 *
 * 设计原则：
 * 1. 只在"状态转移"时生成 anchor（不靠语言触发）
 * 2. anchor 文本用模板生成，不用 LLM
 * 3. 去重 + 冷却，防止变成新的污染源
 */

const crypto = require("crypto");
const { logInfo, logError } = require("../../../lib/logger.cjs");
const { insertIgnoreAnchor, isInCooldown, computeContentHash } = require("../../repositories/conversation_anchors.repo.cjs");
const { enqueueEmbedding } = require("../queue/index.cjs");

// 冷却时间：同一 domain + topic 30 分钟内只写一条
const COOLDOWN_MS = 30 * 60 * 1000;

// 默认过期时间：90 天
const DEFAULT_EXPIRES_DAYS = 90;

/**
 * Anchor 文本模板
 */
const ANCHOR_TEMPLATES = {
  // planned_events
  "plan:add": ({ dueDayKey, title }) => `[plan:add] 计划：${dueDayKey} ${title}`,
  "plan:reschedule": ({ title, oldDueDayKey, newDueDayKey }) =>
    `[plan:reschedule] 改期：${title} → ${newDueDayKey}（原 ${oldDueDayKey}）`,
  "plan:cancel": ({ dueDayKey, title }) => `[plan:cancel] 取消计划：${dueDayKey} ${title}`,
  "plan:done": ({ dueDayKey, title }) => `[plan:done] 已完成：${dueDayKey} ${title}`,
  "plan:merge": ({ dueDayKey, title, certainty }) =>
    `[plan:merge] 确认计划：${dueDayKey} ${title}（certainty=${certainty}）`,

  // committed_promises
  "promise:add": ({ content, timeHint }) =>
    timeHint ? `[promise:add] 承诺：${content}（时间：${timeHint}）` : `[promise:add] 承诺：${content}`,

  // addressing / boundary
  "addr:set": ({ addressingName }) => `[addr:set] 用户希望称呼：${addressingName}`,
  "boundary:add": ({ ng }) => `[boundary:add] 用户不喜欢/禁止：${ng}`,
  "like:add": ({ likeItem }) => `[like:add] 用户喜欢：${likeItem}`,

  // dialog micro-summary (Phase 2)
  "confirm:plan": ({ dueDayKey, title }) => `[confirm:plan] 用户确认执行计划：${dueDayKey} ${title}`,
  "confirm:plan:cancel": ({ dueDayKey, title }) => `[confirm:plan:cancel] 用户取消/放弃计划：${dueDayKey} ${title}`,
  "confirm:promise": ({ content, timeHint }) =>
    timeHint ? `[confirm:promise] 用户确认履行承诺：${content}（${timeHint}）` : `[confirm:promise] 用户确认履行承诺：${content}`,
  "confirm:promise:cancel": ({ content }) => `[confirm:promise:cancel] 用户放弃/取消承诺：${content}`,
};

/**
 * 生成 anchor 文本
 *
 * @param {string} anchorType - 如 'plan:add'
 * @param {object} data - 模板所需数据
 * @returns {string | null} anchor 文本，或 null（模板不存在）
 */
function composeAnchorText(anchorType, data) {
  /* — core logic omitted for preview — */
}

/**
 * 从 anchorType 提取 domain
 */
function getDomainFromType(anchorType) {
  /* — core logic omitted for preview — */
}

/**
 * 统一入口：触发 anchor 生成
 *
 * @param {object} db
 * @param {{
 *   userId: string,
 *   sessionId?: string,
 *   anchorType: string,           // plan:add | plan:reschedule | ...
 *   data: object,                 // 模板所需数据
 *   topic?: string,               // 用于冷却的 key（如 title_norm）
 *   refId?: string,               // 关联的 plan/promise id
 *   sourceMessageId?: string,
 *   weight?: number,              // 默认 1.0
 *   expiresAt?: number | null,    // 直接指定过期时间（毫秒），null = 永不过期
 *   expiresInDays?: number,       // 备选：相对天数（仅当 expiresAt 未指定时使用）
 *   skipCooldown?: boolean,       // 跳过冷却检查（默认 false）
 *   now?: number,
 * }} opts
 * @returns {Promise<{ emitted: boolean, reason?: string, anchorId?: string, content?: string }>}
 */
async function emitAnchor(db, {
  /* — core logic omitted for preview — */
}

/**
 * 辅助函数：为 planned_events 状态变化生成 anchor
 *
 * @param {object} db
 * @param {{
 *   userId: string,
 *   sessionId?: string,
 *   action: 'inserted' | 'merged' | 'canceled' | 'done' | 'rescheduled',
 *   before?: { due_day_key, title, title_norm, certainty, status },
 *   after: { id, due_day_key, title, title_norm, certainty, status, expires_at? },
 *   sourceMessageId?: string,
 *   now?: number,
 * }} opts
 */
async function emitPlanAnchor(db, {
  /* — core logic omitted for preview — */
}

/**
 * 辅助函数：为 committed_promises 新增生成 anchor
 * 承诺永不过期（expiresAt = null）
 */
async function emitPromiseAnchor(db, {
  /* — core logic omitted for preview — */
}

/**
 * 辅助函数：为 addressing 变化生成 anchor
 * 称呼/偏好永不过期（expiresAt = null）
 */
async function emitAddressingAnchor(db, {
  /* — core logic omitted for preview — */
}

module.exports = {
  emitAnchor,
  emitPlanAnchor,
  emitPromiseAnchor,
  emitAddressingAnchor,
  composeAnchorText,
  ANCHOR_TEMPLATES,
};
