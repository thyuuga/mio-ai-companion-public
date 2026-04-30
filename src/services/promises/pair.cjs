const crypto = require("crypto");
const { randomUUID } = crypto;

const { debug, info } = require("./log.cjs");
const {
  detectPromiseProposal,
  detectLooseActivityProposal,
  isAssistantConfirm,
  hasProposalTone,
  isConfirmShortReply,
} = require("./detect.cjs");
const { judgeAccept } = require("./judge_client.cjs");
const { extractTimeSpec } = require("./time_hint.cjs");
const {
  ACCEPT_LABELS,
  MIN_JUDGE_CONFIDENCE,
} = require("./constants.cjs");
const {
  contentHashOf,
  findCommittedPromiseByHash,
  insertCommittedPromise,
} = require("../../repositories/committed_promises.repo.cjs");
const {
  upsertPendingCandidate,
  getLatestPendingCandidate,
  markCandidateStatus,
  markCandidateSuperseded,
  deleteExpiredCandidates,
  expireCandidateIfTooManyTurns,
} = require("../../repositories/promise_candidates.repo.cjs");
const { fetchPromiseCandidateFeatures } = require("../clients/py_gateway_client.cjs");
const { llmReviewPromiseCandidate } = require("./llm_review.cjs");
const {
  insertRelationshipPromise,
  contentHashOf: relHashOf,
} = require("../../repositories/relationship_promises.repo.cjs");
const { normalizeCandidateContent } = require("./normalize.cjs");
const { emitPromiseAnchor } = require("../anchors/emit_anchor.cjs");

// 软拒绝阈值：低于此值的 reject 视为 defer，不标记 rejected
const REJECT_STRICT_THRESHOLD = 0.88;

// Helper: 安全解析 signals_json
function safeParseSignalsJson(s) {
  /* — core logic omitted for preview — */
}

// ────────────────────────────────────────
// A. 从 userText 提取并处理候选
// ────────────────────────────────────────
async function prepareCandidateFromUserText(db, { userId, sessionId, userMsgId, userText, now, tz, traceId, prefetchedFeat = null }) {
  /* — core logic omitted for preview — */
}

// ────────────────────────────────────────
// B. 决定晋升计划（promoteSource / pendingCandidate / judgeUserText）
// ────────────────────────────────────────
async function decidePromotionPlan(db, { userId, sessionId, userText, now, hasProposal, isConfirmReply, traceId }) {
  /* — core logic omitted for preview — */
}

// ────────────────────────────────────────
// C. 主流程
// ────────────────────────────────────────
async function tryCommitPromiseFromPair(db, { userId, sessionId, userMsgId, now, userText, assistantText, traceId, tz, prefetchedFeat = null }) {
  /* — core logic omitted for preview — */
}

module.exports = { tryCommitPromiseFromPair };

/*
 * ===== Manual test cases =====
 *
 * 1) 情人节提案 + assistant defer → pending；后续"确定/约定好了"→ 晋升
 *    user: "今年情人节一起去北海道吧"
 *    assistant: "真的吗？北海道2月还很冷呢…" (defer)
 *    → pending candidate 写入, 不晋升
 *    user: "约定好了"  (isConfirmReply=true)
 *    assistant: "好呀，那我们说定了！"
 *    → judge accept → 晋升 committed_promises（内容=情人节去北海道）
 *
 * 2) 情人节提案 + assistant conditional_accept → 晋升
 *    user: "今年情人节一起去北海道吧"
 *    assistant: "冬天有些冷呢，但是可以哦，我会记住的"
 *    → judge conditional_accept/accept → 直接晋升
 *
 * 3) 改案 supersede：情人节→夏天
 *    user: "今年情人节一起去北海道吧"
 *    assistant: "冬天有些冷呢…" (defer)
 *    → pending candidate A 写入
 *    user: "既然怕冷，那我们夏天去吧"  (isRevision=true, revisionCue="既然.*那")
 *    → candidate A 标记 superseded；新 candidate B (夏天去北海道) 写入 pending
 *    assistant: "好呀，夏天去也很棒！"
 *    → judge accept → 晋升 committed_promises（内容=夏天去北海道）
 *
 * 4) 补充描述不生成新 candidate
 *    user: "今年情人节一起去北海道吧"
 *    assistant: "好主意！" (accept → 已晋升)
 *    — 或 defer 后 —
 *    user: "北海道冬天很浪漫…我们一起去看雪まつり"
 *    → elaboration guard: loose + 已有 pending + 无提案语气 → SKIP_LOOSE_AS_ELABORATION
 *    → 不生成新 candidate，不覆盖 time_hint
 *
 * 5) 提案 + 质疑 + 用户确认 → 晋升
 *    user: "今年8月一起去山东吧"
 *    assistant: "你确定吗？8月山东很热呢" (defer)
 *    → pending 写入
 *    user: "当然"  (isConfirmReply=true)
 *    assistant: "好的，那就8月去山东！"
 *    → judge accept → 晋升（内容=8月去山东）
 *
 * 6) 改案 supersede：山东→四川
 *    user: "今年8月一起去山东吧"
 *    assistant: "可以考虑…" (defer)
 *    → pending candidate A (山东)
 *    user: "8月改去四川吧"  (isRevision=true, revisionCue="改去")
 *    → candidate A superseded；新 candidate B (四川)
 *    assistant: "四川也不错！那就这么定了"
 *    → judge accept → 晋升 committed_promises（内容=四川）
 */
