// src/services/listening_mode/exit_check.cjs
//
// 倾听模式退出检测
// 条件：关键词早退 + 6+2+2 轮数结构 + 强制上限

const { logDebug } = require("../../../lib/logger.cjs");

// ===== 恢复关键词（任意轮次可触发早退） =====
const RECOVERY_PATTERNS = [
  /好多了/,
  /没事了/,
  /我[好没]事了/,
  /好起来了/,
  /好了好了/,
  /谢谢你?陪/,
  /谢谢你?听/,
  /不说这个了/,
  /算了不[想说]了/,
  /聊点别的/,
  /换个话题/,
  /说点开心的/,
  /大丈夫/,       // 日语：没事
  /もう大丈夫/,   // 日语：已经没事了
];

// ===== 展开情绪判定：MacBERT 返回 sad/angry 视为"仍在展开" =====
const EXPANDING_EMOTIONS = new Set(["sad", "angry"]);

// ===== 6+2+2 结构常量 =====
const UNCONDITIONAL_TURNS = 6;   // 前 6 轮无条件 listening
const CHECK_TURNS = [7, 9];       // 第 7、9 轮检查是否退出
const MAX_TURNS = 10;             // 第 10 轮强制退出

/**
 * checkListeningExit - 检查是否应退出倾听模式
 *
 * @param {number} turnCount - 当前轮次（已递增后的值）
 * @param {string} userMessage - 用户消息
 * @param {Function} analyzeEmotionFn - analyzeEmotion({ text, traceId })
 * @param {object} meta - 日志 meta
 * @returns {Promise<{ shouldExit: boolean, reason: string }>}
 */
async function checkListeningExit(turnCount, userMessage, analyzeEmotionFn, meta) {
  /* — core logic omitted for preview — */
}

module.exports = { checkListeningExit };
