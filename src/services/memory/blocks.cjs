// src/services/memory/blocks.cjs
const { getSessionSummary } = require("../../repositories/session_summaries.repo.cjs");
const { listMemoriesForPrompt } = require("../../repositories/memories.repo.cjs");

/**
 * fun011. 构造 summaryBlock + memoryBlock
 */
async function buildMemoryAndSummaryBlocks(db, userId, sessionId) {
  /* — core logic omitted for preview — */
}

module.exports = { buildMemoryAndSummaryBlocks };
