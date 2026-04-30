// src/services/planned_events/cleanup.cjs
const { logInfo, logError } = require("../../../lib/logger.cjs");
const { normalizeTitleNorm } = require("./title_norm.cjs");
const { pickBetterTitle } = require("./title_pick.cjs");
const { eventKeyHash } = require("../../utils/events.cjs");

/**
 * cleanupPlannedEventsActive - 对 status='active' 的 planned_events 做语义去重
 *
 * 1. 用 normalizeTitleNorm(title) 重算 newNorm
 * 2. 按 (user_id, due_day_key, newNorm) 分组
 * 3. 每组选 winner：certainty DESC, created_at DESC, title 更具体/更长
 * 4. 删除 losers，更新 winner 的 title/title_norm/event_key/updated_at
 *
 * 整个过程用事务；异常 catch 打 log，不阻塞启动
 * 幂等：重复启动不会反复修改/报错
 *
 * @param {object} db
 * @returns {Promise<{ deletedCount: number, updatedCount: number }>}
 */
async function cleanupPlannedEventsActive(db) {
  /* — core logic omitted for preview — */
}

module.exports = { cleanupPlannedEventsActive };
