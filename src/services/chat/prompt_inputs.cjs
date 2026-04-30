// src/services/chat/prompt_inputs.cjs
//
// Prompt 输入构建
//
// 从 handle_chat.cjs 抽离的 prompt 输入构建：
//   - buildPromptInputs: 构建 prompt 所需的所有 blocks

const { logInfo, logError } = require("../../../lib/logger.cjs");
const { embedTexts } = require("../../../lib/embeddings.cjs");

// policies
const { STRONG_CONTEXT, SOFT_CONTEXT } = require("../../domain/chat/policies.cjs");

// repositories
const { getRelevantPromises } = require("../../repositories/committed_promises.repo.cjs");
const { getAnchorMemories } = require("../../repositories/memories.repo.cjs");
const { findActiveDueTodayCandidates, markEventNudgedToday } = require("../../repositories/planned_events.repo.cjs");

// services
const { getDayKey } = require("../sessions/index.cjs");
const { getRecentHistory } = require("../db/index.cjs");
const { matchAnchor, normalizeAnchorText, ensureAnchorEmbeddings } = require("../anchors/index.cjs");
const { buildMemoryAndSummaryBlocks } = require("../memory/index.cjs");
const { recallByEmbeddings, shouldRecallWithLearnedTerms } = require("../recall/index.cjs");
const { buildPromisesBlock, buildTodayEventNudgeBlock } = require("../prompt_blocks/index.cjs");
const { buildDayContextBlockFromMeta } = require("../day_context/index.cjs");
const { buildUserProfileBlock } = require("../profile/build_profile_block.cjs");
const { buildMoodAndRelationshipBlock, buildYesterdayBlock } = require("../emotional_state/index.cjs");

// followup nudge
const { getActiveFollowup, markFollowupUsed, buildFollowupBlock } = require("../followup/index.cjs");

// listening mode
const { getListeningState, buildListeningBlock } = require("../listening_mode/index.cjs");
const { getMioState } = require("../db/mio_state.cjs");

// weather
const { getOrFetchWeatherBlock } = require("../weather/index.cjs");

// prompt builder
const { buildPrompt } = require("../../domain/chat/prompt_builder.cjs");

/**
 * buildPromptInputs - 构建 prompt 所需的所有 blocks
 *
 * 输入：ctx 对象（需要 db, userId, sessionId, message, userMsgId, now, tz, timeMode, flags,
 *       effectiveAllowPromises, meta, prevDayMeta, timeNowBlock, timeHint, gapInfo, circadianBlock）
 * 输出：{ history, system, memoryBlock, summaryBlock, promisesBlock, todayEventBlock,
 *        recallBlock, anchorBlock, dayContextBlock, smallPersistenceAllowed }
 * gating：各 block 受 flags/timeMode 控制
 *
 * @param {object} ctx
 * @returns {Promise<object>}
 */
async function buildPromptInputs(ctx) {
  /* — core logic omitted for preview — */
}

module.exports = { buildPromptInputs };
