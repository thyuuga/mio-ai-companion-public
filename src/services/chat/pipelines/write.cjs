// src/services/chat/pipelines/write.cjs
//
// 写入管道
//
// 从 handle_chat.cjs 抽离的写入管道：
//   - runWritePipelines: promise/events/soft_memory/summarize

const crypto = require("crypto");
const { randomUUID } = crypto;

const { logDebug, logInfo, logError } = require("../../../../lib/logger.cjs");
const { getLearnedTermsRegex } = require("../../../../lib/learned_terms.cjs");

// repositories
const { getLatestPendingCandidate } = require("../../../repositories/promise_candidates.repo.cjs");
const {
  insertRelationshipPromise,
  contentHashOf: relHashOf,
} = require("../../../repositories/relationship_promises.repo.cjs");

// services
const { summarizeIfNeeded } = require("../../db/index.cjs");
const { shouldKeepUnit, isCodeLikeOrLongPaste, splitUserMessageIntoUnits } = require("../../message_units/index.cjs");
const { upsertCandidate, maybePromoteCandidate, cleanupExpiredCandidates } = require("../../candidates/index.cjs");
const { detectCommittedPromiseC } = require("../../promises/index.cjs");
const { normalizeCandidateContent } = require("../../promises/normalize.cjs");
const { fetchPromiseCandidateFeatures } = require("../../clients/py_gateway_client.cjs");
const { upsertPlannedEventFromMessage } = require("../../planned_events/index.cjs");

// followup nudge
const { detectFollowupState, saveFollowupNudge } = require("../../followup/index.cjs");

// listening mode
const {
  detectStrongSignal,
  detectWeakSignal,
  getListeningState,
  enterListeningMode,
  exitListeningMode,
  startPending,
  updatePending,
  cancelPending,
  incrementListeningTurn,
  checkListeningExit,
} = require("../../listening_mode/index.cjs");
const { analyzeEmotion } = require("../../clients/py_gateway_client.cjs");

// chat helpers
const { obviouslyNotPromise } = require("../helpers.cjs");

/**
 * runWritePipelines - 写入管道（side-effect only，无返回值）
 *
 * 输入：ctx 对象（需要 db, userId, sessionId, message, userMsgId, now, tz, timeMode, flags, intent, meta）
 * 输出：{ effectiveAllowPromises: boolean, prefetchedFeat: object|null }
 * 执行顺序：promise_features_precheck -> committed_promises -> planned_events -> soft_memory -> summarize
 * gating：各管道受 flags 控制
 *
 * 注意：day_context 已在 insertUserMessage 后 touch，不在此处理
 *
 * @param {object} ctx
 * @returns {Promise<{ effectiveAllowPromises: boolean, prefetchedFeat: object|null }>}
 */
async function runWritePipelines(ctx) {
  /* — core logic omitted for preview — */
}

module.exports = { runWritePipelines };
