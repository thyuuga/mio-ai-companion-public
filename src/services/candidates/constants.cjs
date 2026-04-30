// src/services/candidates/constants.cjs

const DISCARD_MIN_LEN = 6;

// 晋升配置
const PROMOTE_SCORE = 6;
const PROMOTE_MIN_SPAN_MS = 24 * 60 * 60 * 1000; // 24h

const STRONG_TAGS = new Set(["strong", "force_confirm", "high_confidence"]);
const DENY_TAGS = new Set(["deny", "user_denied", "negate_memory", "forget"]);

// 否认/纠正检测
const MEMORY_DENY_RE = /(不是|别记|不要记|别记录|别把.*记(住|下)|不要把.*记(住|下)|我不喜欢|我讨厌|不想让你记|忘了吧|别提了)/;

// 情绪词
const EMOTION_WORDS_RE = /烦|焦虑|难受|开心|生气|郁闷|崩溃|累|压力大|恐慌|紧张|害怕|担心|沮丧|无聊|烦躁|头疼|头痛|心烦|心累|emo|丧/;

// 对象线索
const OBJECT_HINTS_RE = /因为|对[^不]|关于|工作|项目|同事|老板|家人|朋友|客户|考试|租房|钱|投资|面试|出差|加班|开会|deadline|任务|报告|论文|毕业|签证|搬家/;

// 明显临时状态
const TRANSIENT_STATE_RE = /(我现在|正在|刚刚|马上|在).*(在地铁|在路上|在公司|在家|在车站|在电梯|在排队|在开会|在吃饭|准备睡觉|要睡了|睡觉了|出门|回家|下班|上班)/;

module.exports = {
  DISCARD_MIN_LEN,
  PROMOTE_SCORE,
  PROMOTE_MIN_SPAN_MS,
  STRONG_TAGS,
  DENY_TAGS,
  MEMORY_DENY_RE,
  EMOTION_WORDS_RE,
  OBJECT_HINTS_RE,
  TRANSIENT_STATE_RE,
};
