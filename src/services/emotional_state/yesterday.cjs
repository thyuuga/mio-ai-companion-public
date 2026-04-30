// src/services/emotional_state/yesterday.cjs
//
// Prompt block 构建：上次互动线索（跨天连续性）
// 直接从 session_summaries 获取，不依赖 day_contexts.day_summary

const { getDayKey } = require("../sessions/day_key.cjs");

// feeling 标签的中文映射
const FEELING_LABELS = {
  calm: "平静", happy: "开心", sad: "伤心",
  angry: "生气", proud: "得意", shy: "害羞",
};
const MEANINGFUL_FEELINGS = new Set(["happy", "sad", "angry", "proud", "shy"]);

/**
 * 计算两个 day_key (YYYY-MM-DD) 之间的天数差
 */
function daysBetween(dayKeyA, dayKeyB) {
  /* — core logic omitted for preview — */
}

/**
 * 构建"上次互动线索" prompt block
 * 从 session_summaries 直接获取最近非今天的已结束 session 摘要
 * 覆盖 1-7 天间隔，超过 7 天不注入
 */
async function buildYesterdayBlock(db, userId, tz, nowMs) {
  /* — core logic omitted for preview — */
}

module.exports = { buildYesterdayBlock };
