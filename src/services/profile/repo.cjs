// src/services/profile/repo.cjs
// 一人一行版 user_profile repo

// 允许直接 setField 的字段白名单
const ALLOWED_FIELDS = new Set([
  "name",
  "addressing_name",
  "birthday_ymd",
  "hometown",
  "residence",
  "occupation",
  "preferred_language",
]);

// JSON 数组字段白名单（用于 addToJsonArrayField / removeFromJsonArrayField）
const JSON_ARRAY_FIELDS = new Set(["nicknames_json", "likes_json", "ng_json"]);

// JSON 对象字段白名单（用于 mergeJsonObjectField）
const JSON_OBJECT_FIELDS = new Set(["family_json"]);

/**
 * ensureProfileRow - 确保用户有 profile 行（不存在则创建）
 * @param {object} db
 * @param {object} params
 * @returns {Promise<{ok: boolean}>}
 */
async function ensureProfileRow(db, { userId, nowMs }) {
  /* — core logic omitted for preview — */
}

/**
 * setField - 设置单值字段
 * @param {object} db
 * @param {object} params
 * @returns {Promise<{ok: boolean, reason?: string}>}
 */
async function setField(db, { userId, field, value, nowMs }) {
  /* — core logic omitted for preview — */
}

/**
 * clearField - 清除单值字段（设为 NULL）
 * @param {object} db
 * @param {object} params
 * @returns {Promise<{ok: boolean, reason?: string}>}
 */
async function clearField(db, { userId, field, nowMs }) {
  /* — core logic omitted for preview — */
}

/**
 * addNickname - 添加昵称（JSON 数组去重）
 * @param {object} db
 * @param {object} params
 * @returns {Promise<{ok: boolean, added: boolean}>}
 */
async function addNickname(db, { userId, nickname, nowMs }) {
  /* — core logic omitted for preview — */
}

/**
 * removeNickname - 移除昵称
 * @param {object} db
 * @param {object} params
 * @returns {Promise<{ok: boolean, removed: boolean}>}
 */
async function removeNickname(db, { userId, nickname, nowMs }) {
  /* — core logic omitted for preview — */
}

/**
 * addToJsonArrayField - 向 JSON 数组字段添加值（去重 + 上限）
 * @param {object} db
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.field - 字段名（必须在 JSON_ARRAY_FIELDS 内）
 * @param {string} params.value - 要添加的值
 * @param {number} params.nowMs
 * @param {number} [params.limit=20] - 数组上限，超过时删除最旧项
 * @returns {Promise<{ok: boolean, added: boolean, reason?: string}>}
 */
async function addToJsonArrayField(db, { userId, field, value, nowMs, limit = 20 }) {
  /* — core logic omitted for preview — */
}

/**
 * removeFromJsonArrayField - 从 JSON 数组字段移除值
 * @param {object} db
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.field - 字段名（必须在 JSON_ARRAY_FIELDS 内）
 * @param {string} params.value - 要移除的值
 * @param {number} params.nowMs
 * @returns {Promise<{ok: boolean, removed: boolean, reason?: string}>}
 */
async function removeFromJsonArrayField(db, { userId, field, value, nowMs }) {
  /* — core logic omitted for preview — */
}

/**
 * mergeJsonObjectField - 合并 JSON 对象字段
 * @param {object} db
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.field - 字段名（必须在 JSON_OBJECT_FIELDS 内）
 * @param {object} params.patch - 要合并的对象（value 为 null 的 key 会被删除）
 * @param {number} params.nowMs
 * @returns {Promise<{ok: boolean, reason?: string}>}
 */
async function mergeJsonObjectField(db, { userId, field, patch, nowMs }) {
  /* — core logic omitted for preview — */
}

/**
 * clearProfileByScope - 清空 profile 的 likes/ng/all
 *
 * @param {object} db
 * @param {object} params
 * @param {string} params.userId
 * @param {'likes' | 'ng' | 'all'} params.scope
 * @param {number} params.nowMs
 * @returns {Promise<{ok: boolean, likesCleared: number, ngsCleared: number}>}
 */
async function clearProfileByScope(db, { userId, scope, nowMs }) {
  /* — core logic omitted for preview — */
}

/**
 * getProfile - 获取用户 profile
 * @param {object} db
 * @param {object} params
 * @param {string} params.userId
 * @param {number} [params.nowMs] - 可选：提供时若 nicknames_json 损坏会自动修复
 * @returns {Promise<object|null>}
 */
async function getProfile(db, { userId, nowMs }) {
  /* — core logic omitted for preview — */
}

module.exports = {
  ensureProfileRow,
  setField,
  clearField,
  addNickname,
  removeNickname,
  addToJsonArrayField,
  removeFromJsonArrayField,
  mergeJsonObjectField,
  clearProfileByScope,
  getProfile,
  ALLOWED_FIELDS,
};
