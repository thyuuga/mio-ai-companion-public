// src/services/recall/index.cjs
const { embedTexts } = require("../../../lib/embeddings.cjs");
const { logDebug, logError } = require("../../../lib/logger.cjs");

const { shouldRecallWithLearnedTerms } = require("./gate.cjs");
const { fetchMessageCandidates, fetchMemoryCandidates } = require("./query.cjs");
const { rankAndMerge } = require("./merge.cjs");
const { buildRecallBlock } = require("./prompt_block.cjs");

/**
 * fun012. 回忆碎片检索（双通道合并，返回 recallBlock 和 uVec）
 */
async function recallByEmbeddings(db, userId, message, excludeMessageId) {
  let recallBlock = "";
  let uVec = null;

  try {
    [uVec] = await embedTexts([message]);
    const qVec = uVec;
    if (!qVec) throw new Error("no query embedding");

    // 通道 1: message（历史 user 消息）
    const messageCandidates = await fetchMessageCandidates(db, userId, excludeMessageId);
    if (messageCandidates === null) {
      // 表不存在，early return
      return { recallBlock: "", uVec };
    }

    // 通道 2: memory（已晋升记忆）
    const memoryCandidates = await fetchMemoryCandidates(db, userId);

    if (memoryCandidates === null) {
      // memory 表不存在，但 message 通道仍可输出
      const { messageTop } = rankAndMerge({ qVec, messageCandidates, memoryCandidates: [] });
      if (messageTop.length) {
        recallBlock = buildRecallBlock(messageTop);
      }
      return { recallBlock, uVec };
    }

    // 打分 + 合并去重
    const { finalTop, messageTop, memoryTop, stats } = rankAndMerge({ qVec, messageCandidates, memoryCandidates });
    recallBlock = buildRecallBlock(finalTop);

    logDebug({}, "[RECALL] result", {
      messageCandidates: messageCandidates.length,
      memoryCandidates: memoryCandidates.length,
      messageAboveThresh: stats?.messageAboveThresh ?? messageTop?.length ?? 0,
      memoryAboveThresh: stats?.memoryAboveThresh ?? memoryTop?.length ?? 0,
      finalTopCount: finalTop.length,
      maxMessageScore: stats?.maxMessageScore ?? null,
      maxMemoryScore: stats?.maxMemoryScore ?? null,
    });

  } catch (e) {
    logError("recall failed:", e);
  }

  return { recallBlock, uVec };
}

module.exports = {
  shouldRecallWithLearnedTerms,
  recallByEmbeddings,
};
