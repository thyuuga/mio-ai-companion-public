// src/domain/chat/handle_chat.cjs
const crypto = require("crypto");
const { randomUUID } = crypto;

// ===== Lib =====
const { getDB } = require("../../../lib/db.cjs");
const { callDeepSeek } = require("../../../lib/llm.cjs");
const { logDebug, logInfo, logError } = require("../../../lib/logger.cjs");

// ===== Repositories =====
const { assertSessionOwner } = require("../../repositories/sessions.repo.cjs");

// ===== Services =====
const { getUserTimezone, getDayKey } = require("../../services/sessions/index.cjs");

// time
const {
  buildGapInfo,
  buildTimeContext,
  buildCircadianBlock,
} = require("../../services/time/index.cjs");

// db
const {
  getDayContextMeta,
  insertUserMessage,
  getLastUserMessageAtGlobal,
  touchDayContextOnUserMessage,
} = require("../../services/db/index.cjs");

// message_units
const { isTimeQuestion } = require("../../services/message_units/index.cjs");

// queue
const { enqueueEmbedding } = require("../../services/queue/index.cjs");

// promises
const { tryCommitPromiseFromPair } = require("../../services/promises/index.cjs");
const { normalizeCandidateContent } = require("../../services/promises/normalize.cjs");

// day_context
const { buildEmotionPermitBlock } = require("../../services/day_context/index.cjs");

// planned_events
const { upsertPlannedEventFromMessage } = require("../../services/planned_events/index.cjs");

// intent classification
const { classifyUserIntent } = require("../../../lib/intent_router.cjs");

// post guards
const { applyPostGuards } = require("./post_guards.cjs");

// profile
const { detectProfileCmd } = require("../../services/profile/index.cjs");

// hard_write
const { detectExplicitHardWriteIntent } = require("../../services/hard_write/detect_explicit_intent.cjs");
const { tryHandleHardWrite } = require("../../services/hard_write/try_handle.cjs");

// chat helpers & pipelines
const {
  createWriteCtx,
  scrubFalseMemoryClaim,
  tryWriteMessageMeta,
  runWritePipelines,
  buildPromptInputs,
} = require("../../services/chat/index.cjs");

// anchors (dialog micro-summary)
const { emitDialogAnchor } = require("../../services/anchors/index.cjs");

// emotion (per-message feeling analysis)
const { analyzeEmotion } = require("../../services/clients/py_gateway_client.cjs");

// daily limit
const { checkDailyLimit } = require("../../services/daily_limit/index.cjs");

// relationship score
const { tickOnUserMessage: tickRelScore, creditPositiveFeeling, POSITIVE_FEELINGS } = require("../../services/relationship/index.cjs");

// message filter
const { filterMessage } = require("../../services/message_filter/index.cjs");

// burst (连发)
const { analyzeBurstability, generateBurst, setBurstReady, cancelBurst, guardBurstQuality } = require("../../services/burst/index.cjs");
const { getMioState } = require("../../services/db/mio_state.cjs");
// proactive (主动消息)
const { markAllProactiveRead } = require("../../services/proactive/store.cjs");

// profile cmd handlers
const { tryHandleProfileCmd, tryHandleAddressingCmd } = require("../../services/profile/handle_profile_cmd.cjs");

// ===== 环境变量 =====
const HARD_WRITE_NLP_ENABLED = process.env.HARD_WRITE_NLP === "1";

// ===== Startup Assertions (防止 silent undefined) =====
const _assertFn = (name, fn) => {
  /* — core logic omitted for preview — */
};

_assertFn("isTimeQuestion", isTimeQuestion);
_assertFn("normalizeCandidateContent", normalizeCandidateContent);
_assertFn("tryCommitPromiseFromPair", tryCommitPromiseFromPair);
_assertFn("buildEmotionPermitBlock", buildEmotionPermitBlock);
_assertFn("upsertPlannedEventFromMessage", upsertPlannedEventFromMessage);
_assertFn("applyPostGuards", applyPostGuards);

// ===== Internal Helpers 已迁移到 services/chat/helpers.cjs =====
// ===== Profile/Addressing/HardWrite handlers 已迁移到各自的 service =====

// ============================================================================
// STEP 函数：handleChat 的可读性重构
// 约定：所有 step 函数不改变原有逻辑，仅做代码折叠
// ============================================================================

/**
 * runEarlyReturnChannels - 前置通道（可能 early-return）
 *
 * 输入：ctx 对象（需要 db, userId, sessionId, message, now, meta, writeCtx,
 *       isExplicitHardWrite, flags, userMsgId, traceId）
 * 输出：{ reply, assistant_created_at } | null
 * 可能 return：如果任一通道命中并处理，返回结果；否则返回 null
 * 执行顺序：profile -> addressing -> hardwrite（严格保持）
 *
 * @param {object} ctx
 * @returns {Promise<{ reply: string, assistant_created_at: number } | null>}
 */
async function runEarlyReturnChannels(ctx) {
  /* — core logic omitted for preview — */
}

// ===== runWritePipelines 已迁移到 services/chat/pipelines/write.cjs =====
// ===== buildPromptInputs 已迁移到 services/chat/prompt_inputs.cjs =====

// ============================================================================
// handleChat 主函数：目录式编排
// ============================================================================

/**
 * handleChat - 完整的 Mio 对话流程
 *
 * 执行顺序（目录式）：
 * 0. 初始化 + 权限校验
 * 1. 时间上下文构建
 * 2. 写入 user 消息 + day_context touch
 * 3. 意图分类 + flags gating
 * 4. Early-return 通道（profile/addressing/hardwrite）
 * 5. 写入管道（promises/events/soft_memory/summarize）
 * 6. 构建 prompt inputs
 * 7. LLM 调用 + post guards
 * 8. 写入 assistant 消息 + promise pair
 * 9. 异步 embedding 入队
 *
 * @param {{ userId: string, sessionId: string, message: string }} params
 * @returns {Promise<{ reply: string, assistant_created_at: number }>}
 * @throws {{ status: number, message: string }} 可带 status 的错误
 */
async function handleChat({ userId, sessionId, message, traceId, productId }) {
  /* — core logic omitted for preview — */
}

module.exports = { handleChat };
