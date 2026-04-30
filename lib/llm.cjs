const LLM_TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS) || 30000;

async function callDeepSeek(messages) {
  /* — core logic omitted for preview — */
}

module.exports = { callDeepSeek };
