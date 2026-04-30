// src/services/recall/query.cjs
const { logError } = require("../../../lib/logger.cjs");
const { CANDIDATE_LIMIT } = require("./constants.cjs");

// schema error 只打一次（避免刷屏）
const schemaErrorLogged = Object.create(null);

/**
 * 通道 1: message（历史 user 消息）
 */
async function fetchMessageCandidates(db, userId, excludeMessageId, nowMs = Date.now()) {
  /* — core logic omitted for preview — */
}

/**
 * 通道 2: memory（已晋升记忆）
 */
async function fetchMemoryCandidates(db, userId, nowMs = Date.now()) {
  /* — core logic omitted for preview — */
}

/**
 * 通道 3: anchor（状态触发锚点）
 */
async function fetchAnchorCandidates(db, userId, nowMs = Date.now()) {
  /* — core logic omitted for preview — */
}

module.exports = { fetchMessageCandidates, fetchMemoryCandidates, fetchAnchorCandidates };
