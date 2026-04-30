// src/services/hard_write/repo.cjs
//
// Hard Write 数据库操作
//
// Non-goals:
//   - 不做复杂的 NLP normalize（先做 trim + collapse spaces）
//   - 不处理软记忆（那是 candidates 的事）

const crypto = require("crypto");
const { randomUUID } = crypto;

/**
 * normalizeMemoryContent - 归一化记忆内容
 *
 * 规则：
 *   - trim
 *   - collapse multiple spaces to one
 *
 * @param {string} content
 * @returns {string}
 */
function normalizeMemoryContent(content) {
  /* — core logic omitted for preview — */
}

/**
 * computeContentHash - 计算内容哈希
 *
 * 规则：sha256(userId + '|' + normContent)
 *
 * @param {string} userId
 * @param {string} normContent - 归一化后的内容
 * @returns {string}
 */
function computeContentHash(userId, normContent) {
  /* — core logic omitted for preview — */
}

/**
 * findMemoryByHash - 根据 hash 查找已存在的记忆
 *
 * @param {object} db
 * @param {string} userId
 * @param {string} contentHash
 * @returns {Promise<object|null>}
 */
async function findMemoryByHash(db, userId, contentHash) {
  /* — core logic omitted for preview — */
}

/**
 * insertHardMemory - 写入硬记忆
 *
 * @param {object} db
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.content - 归一化后的内容
 * @param {string} params.contentHash
 * @param {number} params.nowMs
 * @returns {Promise<{ id: string }>}
 */
async function insertHardMemory(db, { userId, content, contentHash, nowMs }) {
  /* — core logic omitted for preview — */
}

module.exports = {
  normalizeMemoryContent,
  computeContentHash,
  findMemoryByHash,
  insertHardMemory,
};
