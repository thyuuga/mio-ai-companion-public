// src/services/hard_write/gates.cjs
//
// Hard Write 门控逻辑
//
// Non-goals:
//   - 本次不接 Python NLP（先用轻量规则跑通）
//   - 不做复杂的正则地狱
//   - 不调用 LLM

/**
 * Gate 1: isFormallyMemorable - 内容形式上是否可记忆
 *
 * 通过条件：
 *   - 长度 > 1
 *   - 不是纯标点/空白
 *   - 不是纯数字
 *
 * @param {string} content - 去掉指令词后的内容
 * @returns {boolean}
 */
function isFormallyMemorable(content) {
  /* — core logic omitted for preview — */
}

/**
 * 不可存储黑名单（避免写入敏感/无意义内容）
 *
 * - 密码/密钥类
 * - 极短确认词
 * - 明显的系统/测试消息
 */
const NON_STORABLE_PATTERNS = [
  /密码|password|secret|key|token/i,
  /^(好|嗯|哦|啊|是|对|行|可以|ok|yes|no)$/i,
  /^test|测试$/i,
];

/**
 * Gate 1.5: hitNonStorableBlocklist - 是否命中不可存储黑名单
 *
 * @param {string} content
 * @returns {boolean} true = 命中黑名单，不应存储
 */
function hitNonStorableBlocklist(content) {
  /* — core logic omitted for preview — */
}

/**
 * Profile 字段关键词（用于判断是否属于 profile 范畴）
 * - 已由 profile_cmd 处理的内容，这里只做"放行"不重复处理
 */
const PROFILE_KEYWORDS = [
  /^我叫/,
  /^我的?(生日|故乡|老家|住址|职业)/,
  /^以后(都)?叫我/,
  /^别叫我/,
];

/**
 * Plan 关键词（用于判断是否属于 planned_events 范畴）
 * - 包含时间词 + 动作词 → 可能是计划
 */
const PLAN_TIME_WORDS = /(今天|明天|后天|下周|下个?月|周末|这周|下次|\d+号|\d+日|早上|晚上|中午|下午)/;
const PLAN_ACTION_WORDS = /(要|去|做|开会|面试|考试|约|见|回|出差|旅行|健身|跑步|买|学|练)/;

/**
 * Gate 2: dispatchHardWriteTarget - 分发硬写入目标
 *
 * @param {string} content - 去掉指令词后的内容
 * @returns {'profile' | 'plan' | 'memory'}
 */
function dispatchHardWriteTarget(content) {
  /* — core logic omitted for preview — */
}

module.exports = {
  isFormallyMemorable,
  hitNonStorableBlocklist,
  dispatchHardWriteTarget,
};
