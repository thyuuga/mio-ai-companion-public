// src/repositories/memories.repo.cjs
const MEMORY_TTL_DAYS = 90;
const MEMORY_LIMIT = 50;

function getMemoryCutoff(now = Date.now()) {
  return now - 1000 * 60 * 60 * 24 * MEMORY_TTL_DAYS;
}

/**
 * 给 chat prompt 用的 memories
 * - seed 记忆（手动注入）：每次都返回，不受 limit 限制
 * - learned 记忆（交互学习）：importance=2 永久 + importance=1 近90天，受 limit 限制
 */
async function listMemoriesForPrompt(db, userId, { now = Date.now(), limit = MEMORY_LIMIT } = {}) {
  const cutoff = getMemoryCutoff(now);

  // 1) 取所有 seed 记忆（不限数量）
  const seedMems = await db.all(
    `SELECT content
     FROM memories
     WHERE user_id = ? AND source = 'seed'
     ORDER BY created_at ASC`,
    userId
  );

  // 2) 计算 learned 记忆的配额
  const learnedLimit = Math.max(0, limit - seedMems.length);

  // 3) 取 learned 记忆（受配额限制）
  const learnedMems = learnedLimit > 0
    ? await db.all(
        `SELECT content
         FROM memories
         WHERE user_id = ?
           AND source = 'learned'
           AND (
             importance = 2
             OR (importance = 1 AND created_at >= ?)
           )
         ORDER BY importance DESC, created_at DESC
         LIMIT ?`,
        userId,
        cutoff,
        learnedLimit
      )
    : [];

  // 4) 合并：seed 在前，learned 在后
  return [...seedMems, ...learnedMems];
}

/**
 * 从 memories 里取锚点
 * @param {*} db
 * @param {*} userId
 * @param {*} cutoff
 * @returns
 */
async function getAnchorMemories(db, userId, cutoff) {
  const rows = await db.all(
    `SELECT id, content, created_at
     FROM memories
     WHERE user_id = ?
       AND (
         importance = 2
         OR (importance = 1 AND created_at >= ?)
       )
       AND (content LIKE '[ANCHOR_%]%')
     ORDER BY importance DESC, created_at DESC
     LIMIT 30`,
    userId, cutoff
  );
  return rows || [];
}


module.exports = { listMemoriesForPrompt, getAnchorMemories };
