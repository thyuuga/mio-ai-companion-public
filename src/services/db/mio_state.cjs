// src/services/db/mio_state.cjs
//
// mio_state 表 CRUD：Mio 的持久内在状态（mood + relationship）

/**
 * 读取 Mio 对某用户的内在状态
 * @returns {{ mood: string, relationship: string }}
 */
async function getMioState(db, userId) {
  const row = await db.get(
    "SELECT mood, relationship FROM mio_state WHERE user_id = ?",
    userId
  );
  return row || { mood: "steady", relationship: "stranger" };
}

/**
 * 写入/更新 Mio 的内在状态（upsert）
 */
async function upsertMioState(db, userId, { mood, relationship }) {
  const now = Date.now();
  await db.run(
    `INSERT INTO mio_state (user_id, mood, relationship, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       mood = excluded.mood,
       relationship = excluded.relationship,
       updated_at = excluded.updated_at`,
    userId, mood, relationship, now
  );
}

/**
 * 仅更新 mood
 */
async function updateMioMood(db, userId, mood) {
  const now = Date.now();
  await db.run(
    `INSERT INTO mio_state (user_id, mood, relationship, updated_at)
     VALUES (?, ?, 'stranger', ?)
     ON CONFLICT(user_id) DO UPDATE SET
       mood = excluded.mood,
       updated_at = excluded.updated_at`,
    userId, mood, now
  );
}

/**
 * 仅更新 relationship
 */
async function updateMioRelationship(db, userId, relationship) {
  const now = Date.now();
  await db.run(
    `INSERT INTO mio_state (user_id, mood, relationship, updated_at)
     VALUES (?, 'steady', ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       relationship = excluded.relationship,
       updated_at = excluded.updated_at`,
    userId, relationship, now
  );
}

module.exports = {
  getMioState,
  upsertMioState,
  updateMioMood,
  updateMioRelationship,
};
