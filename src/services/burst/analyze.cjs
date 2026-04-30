// src/services/burst/analyze.cjs
//
// burst 连发判断：纯规则 + 概率，不调 LLM
// 判断"主回复之后是否值得补一句"

const { detectReplyMode } = require("./guard.cjs");

// ===== 硬排除：plan / promise / 约定 关键词 =====
const PLAN_PROMISE_KW_RE = /约[好定]|安排|计划[好了]?|承诺|提醒|明天.{0,4}[去做到]|下[次周]|以后|记得|别忘|周[一二三四五六日末].*[见聊]/;

// ===== 承接型短句（有气口，适合 burst 接圆）=====
const BREATH_CATCH_RE = /^(嗯+[。…～~]*|我在[。的]*|好[。～~]+|对[。啊呀]*|是[啊呀的][。]*|也是[。]*|哦[。…]*|啊[。…]*|然后呢[。]*|[…]+|嘿[。…]*)$/;

// ===== 确认型短句（执行感，不适合 burst）=====
const CONFIRM_RE = /^(可以|行|知道了|好的|明白了|了解|收到|没问题|好吧|OK|ok|嗯好|嗯嗯好)[。！!]*$/;

// ===== 基础概率（relationship → base prob） =====
const BASE_PROB = {
  stranger: 0.08,
  familiar: 0.14,
  fond: 0.18,
  attached: 0.20,
  deeply_attached: 0.22,
};

// ===== 承接短句的高概率通道 =====
const BREATH_CATCH_PROB = {
  stranger: 0.35,
  familiar: 0.45,
  fond: 0.55,
  attached: 0.60,
  deeply_attached: 0.65,
};

// ===== burst type 权重 =====
const TYPE_WEIGHTS = [
  { type: "soft_addon", cumWeight: 0.45 },
  { type: "emotional_echo", cumWeight: 0.75 },
  { type: "aftertaste_tail", cumWeight: 1.0 },
];

/**
 * analyzeBurstability - 判断本轮是否应触发 burst 连发
 *
 * @param {object} params
 * @param {string} params.reply          - 主回复文本
 * @param {string} params.intent         - 分类后的意图 ('chat','plan','promise',...)
 * @param {object} params.writeCtx       - { didWrite, ... }
 * @param {boolean} params.listeningMode - 是否在倾听模式
 * @param {string} params.relationship   - 当前关系阶段
 * @param {string} params.sessionId
 * @param {object} params.db
 * @returns {Promise<{ shouldBurst: boolean, burstType: string|null, reason: string }>}
 */
async function analyzeBurstability({ reply, intent, writeCtx, listeningMode, relationship, sessionId, db }) {
  /* — core logic omitted for preview — */
}

module.exports = { analyzeBurstability };
