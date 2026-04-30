// src/services/promises/constants.cjs

// ===== 语义检测阈值 =====
const PROMISE_SIM_THRESHOLD = 0.70;
const PROMISE_SIM_THRESHOLD_COMMIT_TONE = 0.62;

// ===== 语义锚点（用于 embedding 相似度匹配） =====
const PROMISE_ANCHORS = [ /* 复制你 server 那个数组 */ ];

// ===== 语义检测 gating =====
const SEMANTIC_GATE = /(我们|咱们|咱俩|一起|约|下次|下回|到时候|说好|说定|定了|答应|保证|记得|别忘)/;

// ===== 强承诺语气（降低阈值） =====
const COMMIT_TONE = /(约定好了|约好了|说定了|就这么定了|定了|答应|保证|不见不散|说好)/;

// ===== 关系确认类排除词（绝不能写入 committed_promises） =====
const RELATIONSHIP_EXCLUDE = /(做我(女朋友|男朋友|女友|男友|对象)|我们在一起|确认关系|永远|一辈子|结婚|嫁给|娶|爱你一生|不分手|不离开|陪你到老|白头|携手|厮守|相伴一生|做你的人|属于你)/;

// ===== 排除词：明显不确定/撤回 =====
const EXCLUDE_PATTERNS = [
  /再看看/,
  /看情况/,
  /不一定/,
  /也许/,
  /说不定/,
  /有机会的话/,
  /以后再说/,
];

// ===== 活动动词（用于时间词组合判断） =====
const ACTIVITY_VERBS = /(去|看|吃|玩|逛|做|开会|面试|考试|健身|跑步|回国|旅行|出差|约|见|买|学|练|聊|搬|飞)/;

// ===== 共同行为词 =====
const WE_WORDS = /(一起|我们|咱们|咱俩|跟你|和你|陪你)/;

// ===== 邀约语气 =====
const INVITE_TONE = /(要不要|想不想|好吗|好不好|行不行|可以吗|怎么样|去不去|[？?])/;
const INVITE_TONE_LOOSE = /(吧|好吗|好不好|行不行|要不要|可以吗|怎么样|[？?])/;

// ===== 改案信号检测 =====
const REVISION_CUE_RE = /那我们|要不|不如|还是|改成|换成|改去|换去|算了.*去|既然.*那|既然.*就|既然.*还是/;

// ===== 提案语气检测 =====
const PROPOSAL_TONE_RE = /吧|好吗|行吗|要不要|怎么样|可以吗|好不好/;
const PROPOSAL_COMMIT_RE = /约好|说定|说好|就这么定|一言为定|约定/;
const PROPOSAL_INVITE_RE = /(我们|咱们|咱俩|一起).{0,8}(去|看|玩|做)/;

// ===== pair: judge 相关 =====
const ACCEPT_LABELS = ["accept", "conditional_accept"];
const MIN_JUDGE_CONFIDENCE = 0.55;

// ===== pair: 用户确认类短句 =====
const CONFIRM_USER_RE = /^[\s（(]*(?:当然[呀啊]?|是[的啊]?|对[啊呀]?|没错|嗯+|好[的呀啊哒嘞]?|可以[的呀啊]?|行[的呀啊]?|就这么定|一言为定|说定了|说好了|约好了|答应|OK|ok|没问题|嗯嗯|对对|那就这样|那就说好了|好吧|成|好的好的)[！!。，,）)\s]*$/;

// ===== judge_client =====
const DEFAULT_JUDGE_URL = "http://127.0.0.1:8123"; // py_gateway
const JUDGE_TIMEOUT_MS = 3000;

// ===== normalize =====
const LEADING_FILLERS_RE =
  /^(嗯+|呃+|额+|那个|这个|其实|就是|然后|所以|总之|好吧|对了|话说|说起来|怎么说呢|反正)[，,、。.…\s]*/i;
const CANDIDATE_MAX_LEN = 200;

// ===== time_hint: 未来时间指向 =====
const FUTURE_TIME_PATTERNS = [
  { pattern: /今年/, hint: "今年" },
  { pattern: /明年/, hint: "明年" },
  { pattern: /后年/, hint: "后年" },
  { pattern: /下个?月/, hint: "下个月" },
  { pattern: /下周|下星期/, hint: "下周" },
  { pattern: /春天/, hint: "春天" },
  { pattern: /夏天/, hint: "夏天" },
  { pattern: /秋天/, hint: "秋天" },
  { pattern: /冬天/, hint: "冬天" },
  { pattern: /(\d{1,2}|十[一二]?|[一二三四五六七八九十])月(份)?/, hint: null, isMonth: true },
  { pattern: /到时候/, hint: "到时候" },
  { pattern: /将来|以后|之后/, hint: "将来" },
  { pattern: /过年|新年|元旦|圣诞|情人节|生日|纪念日/, hint: null },
  { pattern: /周末/, hint: "周末" },
  { pattern: /假期|假日|放假/, hint: "假期" },
  { pattern: /下次|下回/, hint: "下次" },
];

// ===== time_hint: 固定公历节日 =====
const FIXED_HOLIDAYS = [
  { pattern: /圣诞(节)?/, name: "クリスマス", month: 12, day: 25 },
  { pattern: /元旦/, name: "元旦", month: 1, day: 1 },
  { pattern: /情人节/, name: "バレンタイン", month: 2, day: 14 },
];

// ===== time_hint: 季节 → 月份范围 =====
const SEASON_MONTHS = {
  "春天": [3, 5],
  "夏天": [6, 8],
  "秋天": [9, 11],
  "冬天": [12, 2],
};

// ===== time_hint: 相对时间模式 =====
const RELATIVE_PATTERNS = [
  { pattern: /下周|下星期/, label: "week" },
  { pattern: /周末/, label: "week" },
  { pattern: /下个?月/, label: "relative" },
  { pattern: /下次|下回/, label: "relative" },
  { pattern: /到时候/, label: "relative" },
  { pattern: /将来|以后|之后/, label: "relative" },
  { pattern: /假期|假日|放假/, label: "relative" },
  { pattern: /过年|新年/, label: "relative" },
  { pattern: /生日|纪念日/, label: "relative" },
];

// ===== Assistant 确认检测 =====
const NEGATIVE_PATTERNS = [
  { p: /不行/, tag: "不行" },
  { p: /不可以/, tag: "不可以" },
  { p: /不太行/, tag: "不太行" },
  { p: /算了/, tag: "算了" },
  { p: /有点难/, tag: "有点难" },
  { p: /不确定/, tag: "不确定" },
  { p: /不一定/, tag: "不一定" },
  { p: /也许/, tag: "也许" },
  { p: /可能/, tag: "可能" },
  { p: /改天/, tag: "改天" },
  { p: /下次/, tag: "下次" },
  { p: /下回/, tag: "下回" },
  { p: /以后再说/, tag: "以后再说" },
  { p: /再说/, tag: "再说" },
  { p: /再看看/, tag: "再看看" },
  { p: /看情况/, tag: "看情况" },
  { p: /到时候再看/, tag: "到时候再看" },
  { p: /先别/, tag: "先别" },
  { p: /先不/, tag: "先不" },
  { p: /我得先/, tag: "我得先" },
  { p: /我需要先/, tag: "我需要先" },
  { p: /(不过|但是|但\s*是).{0,10}(不行|不可以|不太行|算了|有点难|不确定|不一定|也许|可能|改天|下次|下回|以后再说|再说|再看看|看情况|到时候再看)/, tag: "转折+拒绝" },
];

// [DEPRECATED] 旧版硬确认模式，保留兼容
const CONFIRM_PATTERNS = [
  { p: /(知道了|我知道了)/, tag: "知道了" },
  { p: /我知道/, tag: "我知道" },
  { p: /答应过/, tag: "答应过" },
  { p: /明白了/, tag: "明白了" },
  { p: /收到/, tag: "收到" },
  { p: /(我记下了|我记住了|记下来了)/, tag: "记下了" },
  { p: /(好呀|好啊|好哇|好哒|好呢|好的呀)/, tag: "好呀类" },
  { p: /嗯嗯/, tag: "嗯嗯" },
  { p: /(可以的|行的|行呀|行啊|可以呀|可以啊)/, tag: "行/可以类" },
  { p: /当然可以/, tag: "当然可以" },
  { p: /(就这么定了|约好了|说定了|一言为定|说好了)/, tag: "约定类" },
  { p: /没问题/, tag: "没问题" },
  { p: /(^|[，,。！!\s])ok([，,。！!\s]|$)/i, tag: "OK" },
  { p: /(^|[，,。！!\s])行([，,。！!\s]|$)/, tag: "行" },
  { p: /(^|[，,。！!\s])可以([，,。！!\s]|$)/, tag: "可以" },
  { p: /(^|[，,。！!\s])好([，,。！!\s]|$)/, tag: "好" },
  { p: /当然[，,。！!\s]/, tag: "当然" },
];

// ===== 评分模式 (v2) =====
// 阈值：score >= 2 则 ok=true
const CONFIRM_SCORE_THRESHOLD = 2;

// +3: 强同意词/约定确认词
const SCORE_STRONG_CONFIRM = [
  { p: /(约好了|说定了|一言为定|就这么定了|说好了)/, tag: "约定类", score: 3 },
  { p: /当然可以/, tag: "当然可以", score: 3 },
  { p: /没问题/, tag: "没问题", score: 3 },
  { p: /(好呀|好啊|好哇|好哒|好呢|好的呀)/, tag: "好呀类", score: 3 },
  { p: /(可以的|行的|行呀|行啊|可以呀|可以啊)/, tag: "行/可以类", score: 3 },
  { p: /当然/, tag: "当然", score: 3 },
];

// +2: 行动/陪伴承诺
const SCORE_ACTION_PROMISE = [
  { p: /我陪你/, tag: "我陪你", score: 2 },
  { p: /我跟你去/, tag: "我跟你去", score: 2 },
  { p: /一起去/, tag: "一起去", score: 2 },
  { p: /我会提醒/, tag: "我会提醒", score: 2 },
  { p: /我会记住/, tag: "我会记住", score: 2 },
  { p: /我记下/, tag: "我记下", score: 2 },
  { p: /我记住/, tag: "我记住", score: 2 },
  { p: /陪你去/, tag: "陪你去", score: 2 },
  { p: /和你一起/, tag: "和你一起", score: 2 },
  { p: /跟你一起/, tag: "跟你一起", score: 2 },
];

// +1: 弱肯定 + 积极情绪
const SCORE_WEAK_POSITIVE = [
  { p: /^嗯[。，,！!]?$/, tag: "嗯", score: 1 },
  { p: /嗯嗯/, tag: "嗯嗯", score: 1 },
  { p: /(^|[，,。！!\s])好([，,。！!\s]|$)/, tag: "好", score: 1 },
  { p: /(^|[，,。！!\s])ok([，,。！!\s]|$)/i, tag: "OK", score: 1 },
  { p: /(^|[，,。！!\s])可以([，,。！!\s]|$)/, tag: "可以", score: 1 },
  { p: /(^|[，,。！!\s])行([，,。！!\s]|$)/, tag: "行", score: 1 },
  { p: /期待/, tag: "期待", score: 1 },
  { p: /不错/, tag: "不错", score: 1 },
  { p: /太好了/, tag: "太好了", score: 1 },
  { p: /真好/, tag: "真好", score: 1 },
  { p: /挺好/, tag: "挺好", score: 1 },
  { p: /开心/, tag: "开心", score: 1 },
  { p: /高兴/, tag: "高兴", score: 1 },
];

// 条件句检测（如果/要是/只要 + 行动承诺 → +2 额外加分）
const CONDITIONAL_PATTERN = /(如果|要是|只要).*?(我陪你|我跟你去|陪你去|一起去|和你一起|跟你一起)/;
const CONDITIONAL_BONUS = 2;

module.exports = {
  // 语义检测
  PROMISE_SIM_THRESHOLD,
  PROMISE_SIM_THRESHOLD_COMMIT_TONE,
  PROMISE_ANCHORS,
  SEMANTIC_GATE,
  COMMIT_TONE,
  // 提案检测
  RELATIONSHIP_EXCLUDE,
  EXCLUDE_PATTERNS,
  ACTIVITY_VERBS,
  WE_WORDS,
  INVITE_TONE,
  INVITE_TONE_LOOSE,
  REVISION_CUE_RE,
  PROPOSAL_TONE_RE,
  PROPOSAL_COMMIT_RE,
  PROPOSAL_INVITE_RE,
  // pair / judge
  ACCEPT_LABELS,
  MIN_JUDGE_CONFIDENCE,
  CONFIRM_USER_RE,
  DEFAULT_JUDGE_URL,
  JUDGE_TIMEOUT_MS,
  // normalize
  LEADING_FILLERS_RE,
  CANDIDATE_MAX_LEN,
  // time_hint
  FUTURE_TIME_PATTERNS,
  FIXED_HOLIDAYS,
  SEASON_MONTHS,
  RELATIVE_PATTERNS,
  // assistant 确认
  NEGATIVE_PATTERNS,
  CONFIRM_PATTERNS,
  CONFIRM_SCORE_THRESHOLD,
  SCORE_STRONG_CONFIRM,
  SCORE_ACTION_PROMISE,
  SCORE_WEAK_POSITIVE,
  CONDITIONAL_PATTERN,
  CONDITIONAL_BONUS,
};
