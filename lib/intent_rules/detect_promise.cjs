// lib/intent_rules/detect_promise.cjs
// 承诺/约定检测
// 收紧规则：单独 "我会…" 不足以触发，需要强承诺词或明确时间/频率词

/**
 * @param {string} text
 * @returns {{ hit: boolean, confidence: number, reasons: string[] }}
 */
function detectPromise(text) {
  /* — core logic omitted for preview — */
}

module.exports = { detectPromise };
