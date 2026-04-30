const fetch = global.fetch;
const { logWarn, logError } = require("./logger.cjs");

const EMBED_URL = process.env.LOCAL_EMBED_URL || "http://127.0.0.1:8123/embed/encode";

/**
 * 清洗 embedding 输入，确保返回 string[]
 * - string: trim，空则返回 []
 * - array: 逐项转 string，trim，过滤空串
 * - null/undefined/object 等：跳过
 */
function sanitizeEmbeddingInput(input) {
  /* — core logic omitted for preview — */
}

async function embedTexts(input) {
  /* — core logic omitted for preview — */
}

module.exports = { embedTexts };
