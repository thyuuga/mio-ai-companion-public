// src/services/addressing/repo.cjs

/**
 * normCandidate - 归一化称呼候选值
 * @param {string} v
 * @returns {string}
 */
function normCandidate(v) {
  /* — core logic omitted for preview — */
}

/**
 * createPending - 创建称呼候选（自动过期旧 pending）
 * @param {object} db
 * @param {object} params
 * @param {number} [params.turnsLeft=2] - 剩余追问次数
 * @returns {Promise<{id: number, ok: boolean}>}
 */
async function createPending(db, { userId, value, sourceMessage, nowMs, ttlMs, turnsLeft = 2 }) {
  /* — core logic omitted for preview — */
}

/**
 * getLatestPending - 获取最新未过期的 pending 候选
 * @param {object} db
 * @param {object} params
 * @returns {Promise<object|null>}
 */
async function getLatestPending(db, { userId, nowMs }) {
  /* — core logic omitted for preview — */
}

/**
 * rejectPending - 拒绝候选
 * @param {object} db
 * @param {object} params
 * @returns {Promise<{ok: boolean}>}
 */
async function rejectPending(db, { id, nowMs }) {
  /* — core logic omitted for preview — */
}

/**
 * acceptPending - 接受候选
 * @param {object} db
 * @param {object} params
 * @returns {Promise<{ok: boolean}>}
 */
async function acceptPending(db, { id, nowMs }) {
  /* — core logic omitted for preview — */
}

/**
 * expireOverdue - 过期超时的 pending（可选调用）
 * @param {object} db
 * @param {object} params
 * @returns {Promise<{ok: boolean, count: number}>}
 */
async function expireOverdue(db, { nowMs }) {
  /* — core logic omitted for preview — */
}

/**
 * decrementTurnsLeft - 减少剩余追问次数
 * 如果 turns_left 减到 0，则自动设为 expired
 * @param {object} db
 * @param {object} params
 * @returns {Promise<{ok: boolean, expired: boolean, turnsLeft: number}>}
 */
async function decrementTurnsLeft(db, { id, nowMs }) {
  /* — core logic omitted for preview — */
}

module.exports = {
  normCandidate,
  createPending,
  getLatestPending,
  rejectPending,
  acceptPending,
  expireOverdue,
  decrementTurnsLeft,
};
