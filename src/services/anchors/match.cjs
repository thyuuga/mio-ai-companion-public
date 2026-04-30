// src/services/anchors/match.cjs
const { ANCHOR_THRESH, ANCHOR_LIMIT } = require("./constants.cjs");
const { cosineSim } = require("./math.cjs");
const { normalizeAnchorText } = require("./normalize.cjs");

/**
 * 匹配触发锚点
 * @param {*} db
 * @param {*} userId
 * @param {*} userText
 * @param {*} anchors
 * @param {*} userVec
 * @param {number} nowMs - 当前时间戳（用于过滤过期）
 * @returns
 */
async function matchAnchor(db, userId, userText, anchors, userVec, nowMs = Date.now()) {
  /* — core logic omitted for preview — */
}

module.exports = { matchAnchor };
