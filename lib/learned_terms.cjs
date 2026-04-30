// ===== Helpers =====
function nowMs() { return Date.now(); }

function safeJsonParse(s, fallback) {
  /* — core logic omitted for preview — */
}

function escapeRegExp(str) {
  /* — core logic omitted for preview — */
}

function isMostlyChineseToken(t) {
  /* — core logic omitted for preview — */
}

// 简单停用词（不追求完美，只求别太脏）
const STOP_WORDS = new Set([
  "这个","那个","然后","就是","因为","所以","但是","如果","可能","也许","感觉",
  "我们","你们","他们","今天","明天","刚才","现在","真的","还是","不要","可以",
  "一下","一点","已经","时候","东西","事情","问题","一个","两个","这样","那样",
  "自己","一起","怎么","什么","哪里","为什么"
]);

// 英文/工程噪音词（避免 learned_terms 被 com/www/http/json 等污染）
const EN_STOP = new Set([
  "com","www","http","https",
  "jpg","jpeg","png","gif","webp",
  "json","sql","html","css","js"
]);

function normalizeToken(t) {
  /* — core logic omitted for preview — */
}

// ===== Tokenization =====
// 从一句文本里抽"可能是实体/领域词"的 token
function extractTermsFromText(text) {
  /* — core logic omitted for preview — */
}

// ===== Storage format =====
// users.learned_terms_json = [{ t: "NISA", s: 6, last: 1700000000000 }, ...]

function arraysEqual(a, b) {
  /* — core logic omitted for preview — */
}

function mergeAndBump(existingArr, newTerms, { bump = 1, bonus = 0, now = nowMs(), maxTerms = 300 } = {}) {
  /* — core logic omitted for preview — */
}

async function getUserLearnedTerms(db, userId) {
  /* — core logic omitted for preview — */
}

async function setUserLearnedTerms(db, userId, termsArr, now = nowMs()) {
  /* — core logic omitted for preview — */
}

async function bumpLearnedTermsFromText(db, userId, text, { importance = 1, now = nowMs() } = {}) {
  /* — core logic omitted for preview — */
}

// 判断是否为 ASCII-like 词（需要加 \b 边界）
function isAsciiLikeToken(t) {
  /* — core logic omitted for preview — */
}

// 生成 regex：只取 score>=4 的 topN，避免 regex 太大
async function getLearnedTermsRegex(db, userId, { minScore = 4, topN = 120 } = {}) {
  /* — core logic omitted for preview — */
}

module.exports = {
  extractTermsFromText,
  bumpLearnedTermsFromText,
  getLearnedTermsRegex,
  getUserLearnedTerms,
};
