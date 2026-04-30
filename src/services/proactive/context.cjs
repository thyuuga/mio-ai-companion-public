// src/services/proactive/context.cjs
//
// 主动消息 context 优先级挑选
//
// 优先级（从高到低）：
//   1. followup nudge（用户之前提到的睡眠/忙碌/情绪状态）
//   2. 最近的对话 anchor
//   3. 最近 assistant 的非"平常"情绪
//   4. null（无 context）

const { getActiveFollowup } = require("../followup/store.cjs");

const FOLLOWUP_TYPE_TEXT = {
  sleep: "你之前说想睡了",
  busy:  "你之前说在忙",
  low_mood: "你之前情绪有点低落",
};

/**
 * pickProactiveContext - 挑选主动消息的 context
 *
 * @param {object} db
 * @param {string} userId
 * @param {number} now
 * @returns {Promise<{ type: string, text: string } | null>}
 */
async function pickProactiveContext(db, userId, now) {
  /* — core logic omitted for preview — */
}

module.exports = { pickProactiveContext };
