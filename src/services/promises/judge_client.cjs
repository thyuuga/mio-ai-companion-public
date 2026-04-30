// src/services/promises/judge_client.cjs

const { debug } = require("./log.cjs");
const { logError } = require("../../../lib/logger.cjs");
const { DEFAULT_JUDGE_URL, JUDGE_TIMEOUT_MS } = require("./constants.cjs");
const { stripStageDirections } = require("./normalize.cjs");

/**
 * 调用 FastAPI promise_judge 服务判定 assistant 是否肯定回应
 * @param {object} params
 * @param {string} params.userText
 * @param {string} params.assistantText
 * @param {string} [params.lang="zh"]
 * @param {string} [params.traceId]
 * @returns {Promise<{label: string, confidence: number, reason: string}|null>}
 */
async function judgeAccept({ userText, assistantText, lang = "zh", traceId }) {
  /* — core logic omitted for preview — */
}

module.exports = { judgeAccept };
