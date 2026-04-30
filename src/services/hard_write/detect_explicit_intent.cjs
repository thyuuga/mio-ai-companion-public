// src/services/hard_write/detect_explicit_intent.cjs
//
// Gate 0: 检测用户消息中的"显式硬写入意图"
//
// 只处理显式指令：记住/请记住/不要忘/别忘/忘了/别记/不要记
// 以及清空/删除/移除等 scope 操作
//
// Non-goals:
//   - 不做自动抽取（随口说"我叫X"不触发）
//   - 不调用 LLM
//   - 不处理软记忆

/**
 * 礼貌前缀（按长度降序排列，优先匹配长的）
 */
const POLITE_PREFIXES = [
  "请你帮我把",
  "麻烦你帮我把",
  "麻烦你把",
  "请帮我把",
  "帮我把",
  "请你帮我",
  "麻烦你帮我",
  "麻烦帮我",
  "请帮我",
  "帮我",
  "麻烦你",
  "请你",
  "麻烦",
  "请",
];

/**
 * 显式记忆指令前缀
 * - 记住 / 请记住 / 帮我记 / 你要记住
 * - 不要忘 / 别忘
 */
const REMEMBER_PREFIXES = [
  "记住",
  "请记住",
  "帮我记一下",
  "帮我记",
  "请记一下",
  "以后你要记",
  "你要记住",
  "不要忘",
  "别忘",
  "别忘了",
];

/**
 * 显式遗忘指令前缀（startsWith 模式）
 * - 忘了 / 别记 / 不要记 / 忘记 / 清空 / 删除 等
 */
const FORGET_PREFIXES = [
  // 原有
  "忘了吧",
  "忘掉这",
  "忘了",
  "别记",
  "不要记",
  "别提了",
  // 新增
  "忘记",
  "清空",
  "删除",
  "移除",
  "清掉",
  "去掉",
  "抹掉",
  "删掉",
  "别再记",
];

/**
 * 遗忘动词（contains 模式，用于"把X删掉/清空X"等句式）
 */
const FORGET_VERBS = ["删掉", "清掉", "去掉", "抹掉", "删了", "清了", "忘掉", "忘了", "清空", "删除", "移除"];

/**
 * Scope 关键词
 */
const SCOPE_LIKES_KEYWORDS = ["喜欢的", "喜欢", "likes"];
const SCOPE_NG_KEYWORDS = ["雷点", "讨厌的", "不喜欢的", "ng", "黑名单"];
const SCOPE_ALL_KEYWORDS = ["全部", "所有", "都", "一切", "全都", "所有的"];
// "喜好" 单独处理：代表整体偏好（likes + ng）
const SCOPE_PREFERENCE_KEYWORDS = ["喜好", "偏好"];

/**
 * stripPolitePrefix - 剥离开头的礼貌词
 *
 * @param {string} text
 * @returns {string}
 */
function stripPolitePrefix(text) {
  /* — core logic omitted for preview — */
}

/**
 * detectScopeFromText - 检测清空 scope
 *
 * @param {string} text
 * @returns {'likes' | 'ng' | 'all' | null}
 */
function detectScopeFromText(text) {
  /* — core logic omitted for preview — */
}

/**
 * hasForgetVerb - 检查文本是否包含遗忘动词
 *
 * @param {string} text
 * @returns {boolean}
 */
function hasForgetVerb(text) {
  /* — core logic omitted for preview — */
}

/**
 * detectExplicitHardWriteIntent - 检测显式硬写入意图
 *
 * @param {string} message - 用户消息
 * @returns {null | { type: 'remember' | 'forget', content: string, original: string, scope: 'likes' | 'ng' | 'all' | null }}
 *   - type: 意图类型
 *   - content: 去掉指令词后的内容（scope 操作时为空字符串）
 *   - original: 剥离礼貌前缀后的文本
 *   - scope: 清空范围（仅 forget 时有效）
 */
function detectExplicitHardWriteIntent(message) {
  /* — core logic omitted for preview — */
}

module.exports = { detectExplicitHardWriteIntent, stripPolitePrefix, detectScopeFromText };
