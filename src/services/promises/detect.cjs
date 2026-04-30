// src/services/promises/detect.cjs
const { normalizeCandidateContent, stripStageDirections } = require("./normalize.cjs");
const { extractTimeHint } = require("./time_hint.cjs");
const {
  RELATIONSHIP_EXCLUDE,
  EXCLUDE_PATTERNS,
  ACTIVITY_VERBS,
  WE_WORDS,
  INVITE_TONE,
  INVITE_TONE_LOOSE,
  NEGATIVE_PATTERNS,
  // 评分模式 v2
  CONFIRM_SCORE_THRESHOLD,
  SCORE_STRONG_CONFIRM,
  SCORE_ACTION_PROMISE,
  SCORE_WEAK_POSITIVE,
  CONDITIONAL_PATTERN,
  CONDITIONAL_BONUS,
  // 改案 & 提案语气
  REVISION_CUE_RE,
  PROPOSAL_TONE_RE,
  PROPOSAL_COMMIT_RE,
  PROPOSAL_INVITE_RE,
  // 用户确认短句
  CONFIRM_USER_RE,
} = require("./constants.cjs");
const { debug } = require("./log.cjs");

/**
 * 检测用户文本是否包含"改案信号"（改案 = 用户想替换之前的约定）
 * @returns {{ isRevision: boolean, revisionCue: string|null }}
 */
function detectRevisionCue(text) {
  /* — core logic omitted for preview — */
}

/**
 * 判断文本是否具有"提案语气"（邀约/确认/明确邀请结构）
 */
function hasProposalTone(text) {
  /* — core logic omitted for preview — */
}

/**
 * 用户"确认类短句"检测（长度 ≤ 20 且匹配）
 */
function isConfirmShortReply(text) {
  /* — core logic omitted for preview — */
}

/**
 * fun001 从用户+助手对话中提取约定
 */
function extractPromiseFromPair(userText, assistantText) {
  /* — core logic omitted for preview — */
}

/**
 * fun002 检测用户是否为「具体活动约定提案」
 * 返回 { content, timeHint } 或 null
 * 规则：
 *   1. 未来时间指向
 *   2. 具体活动动词
 *   3. (一起/我们/咱俩/跟你/和你) 或 邀约语气(吧/好吗/要不要/？)
 *   4. 排除关系确认类
 */
function detectPromiseProposal(text) {
  /* — core logic omitted for preview — */
}

/**
 * fun003 宽松版活动提案检测（用于 loose 分支）
 * 条件更宽松：未来时间 + 活动动词 + (共同词/邀约语气)
 * 返回 { content, timeHint } 或 null
 */
function detectLooseActivityProposal(text) {
  /* — core logic omitted for preview — */
}

/**
 * fun004 判断 assistant 回复是否「确认活动约定」(v2 评分版)
 * 返回 { ok: boolean, score: number, hitTags: string[], conditional: boolean, sample: string }
 * - 先剥离开头连续括号段（动作描写）
 * - 取前 160 字进行评分
 * - 否定词直接返回 ok=false
 * - 评分规则：强同意+3，行动承诺+2，弱肯定/积极情绪+1，条件句+行动+2
 * - score >= CONFIRM_SCORE_THRESHOLD(2) 则 ok=true
 */
function isAssistantConfirm(text) {
  /* — core logic omitted for preview — */
}

module.exports = {
  extractPromiseFromPair,
  detectPromiseProposal,
  detectLooseActivityProposal,
  isAssistantConfirm,
  detectRevisionCue,
  hasProposalTone,
  isConfirmShortReply,
};
