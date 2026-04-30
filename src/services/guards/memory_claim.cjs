// src/services/guards/memory_claim.cjs
//
// Post Guard: 记忆表达约束
// 当本轮没有 recall/memory/summary 命中时，
// 把 LLM 编造的"记忆类表达"降级为推测语气

/**
 * 替换映射：把记忆表达降级为推测语气
 * 长模式在前，避免短模式先匹配导致残留助词
 */
const REPLACEMENTS = [
  // ——— 长模式优先 ———
  { re: /我记得你说过/g, to: "我感觉你好像" },
  { re: /我记得你之前/g, to: "我感觉你好像" },
  { re: /我记得你以前/g, to: "我感觉你好像" },
  { re: /我记得你[，,]?/g, to: "我感觉你好像" },
  { re: /你之前告诉过我/g, to: "我感觉" },
  { re: /你以前告诉过我/g, to: "我感觉" },
  { re: /你之前告诉我/g, to: "我感觉" },
  { re: /你以前告诉我/g, to: "我感觉" },
  { re: /你以前说过/g, to: "我感觉" },
  { re: /你之前说过/g, to: "我感觉" },
  { re: /你之前提到过/g, to: "好像" },
  { re: /你以前提到过/g, to: "好像" },
  { re: /你之前提过/g, to: "好像" },
  { re: /你以前提过/g, to: "好像" },
  { re: /你不是说过/g, to: "好像" },
  { re: /你上次说过/g, to: "我感觉" },
  { re: /你上次说/g, to: "我感觉" },
  { re: /你上次提到过/g, to: "好像" },
  { re: /你上次提到/g, to: "好像" },
];

/**
 * guardMemoryClaim - 记忆表达约束 guard
 *
 * 只有在 hasMemorySource=false 时才做替换。
 * 如果有 recall/memory/summary，则认为 LLM 可能确实在引用真实记忆，不做处理。
 *
 * @param {string} reply - LLM 回复
 * @param {{ hasMemorySource: boolean }} ctx
 * @returns {{ text: string, replaced: boolean }}
 */
function guardMemoryClaim(reply, { hasMemorySource }) {
  /* — core logic omitted for preview — */
}

module.exports = { guardMemoryClaim };
