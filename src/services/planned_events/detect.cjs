// src/services/planned_events/detect.cjs
const { getDayKey, getDayKeyWithOffset } = require("../../utils/timezone.cjs");
const { weekday0FromDayKey } = require("./weekday.cjs");
const { normalizeEventTitle } = require("./normalize.cjs");
const { UNCERTAIN_PATTERNS, ACTION_PATTERNS, weekdayMap } = require("./constants.cjs");

// =====================================================================
// 形态闸门（Language-Agnostic Shape Gate）
// 在任何时间解析之前，基于文本形态特征过滤掉代码/技术内容
// =====================================================================

// Code fence / SQL / JS 关键符号
const CODE_SYMBOLS_RE = /```|~~~|SELECT\s|INSERT\s|UPDATE\s|DELETE\s|CREATE\s|DROP\s|ALTER\s|FROM\s+\w+\s+WHERE|JOIN\s|=>|===|!==|\(\s*\)\s*=>|\{\s*\}|function\s*\(|\bconst\s+\w+\s*=|\blet\s+\w+\s*=|\bvar\s+\w+\s*=|\bimport\s+.*\s+from\s|require\s*\(/i;

// 路径/文件扩展模式
const PATH_FILE_RE = /(?:^|[\s"'`])(?:src\/|lib\/|dist\/|node_modules\/|\.\.\/|\.\/)|\.(?:cjs|mjs|js|ts|tsx|jsx|sql|json|yaml|yml|md|sh|py|go|rs|java|c|cpp|h|hpp|css|scss|html|xml)\b/i;

// 堆栈/错误日志模式
const STACKTRACE_RE = /Error:|Exception:|Traceback|at\s+\S+\s*\(|^\s*at\s+/im;

// URL / CLI flag 模式
const URL_CLI_RE = /https?:\/\/|--[a-zA-Z][\w-]*(?:=|\s|$)|-[a-zA-Z]\s/;

// 正则字面量模式（/pattern/flags）
const REGEX_LITERAL_RE = /\/[^\/\n]+\/[gimsuy]*/;

// JSON-like 结构（多个 "key": 形式）
const JSON_LIKE_RE = /"[^"]+"\s*:\s*["{[\d]|'[^']+'\s*:\s*['{[\d]/;

/**
 * symbolDensityTooHigh - 计算符号密度，判断是否过高
 * nonWordRatio = count(non [a-zA-Z0-9\u4e00-\u9fffぁ-んァ-ン\s]) / len
 * @param {string} t
 * @param {number} threshold - 阈值，默认 0.28
 * @returns {boolean}
 */
function symbolDensityTooHigh(t, threshold = 0.28) {
  /* — core logic omitted for preview — */
}

/**
 * shouldIgnoreByShape - 形态闸门（语言无关）
 * 基于文本形态特征过滤代码/技术内容
 * @param {string} t - 已 trim 的文本
 * @returns {boolean}
 */
function shouldIgnoreByShape(t) {
  /* — core logic omitted for preview — */
}

// =====================================================================
// 问句检测与承诺结构检测（跨语言）
// =====================================================================

/**
 * isQuestionLike - 检测是否像问句
 * 跨语言：?/？/吗/么/呢/かな/ですか 等
 * @param {string} t
 * @returns {boolean}
 */
function isQuestionLike(t) {
  /* — core logic omitted for preview — */
}

/**
 * hasCommitmentCue - 检测是否有承诺/计划结构
 * 跨语言少量 token
 * @param {string} t
 * @returns {boolean}
 */
function hasCommitmentCue(t) {
  /* — core logic omitted for preview — */
}

// =====================================================================
// 原有过滤器（关键词过滤）
// =====================================================================

// 开发/测试/求助关键词（大小写不敏感）
const IGNORE_KEYWORDS_RE = new RegExp(
  [
    // 测试/验证
    "测试", "约定测试", "回归", "验证", "确认",
    // 求助/问句
    "帮我", "你帮我", "能不能", "可以吗", "怎么", "为什么", "是不是", "生成",
    // AI/工具
    "claude", "gpt", "chatgpt", "openai", "deepseek",
    // 开发术语
    "bug", "issue", "ticket", "工单", "pr", "merge", "分支", "部署", "build", "编译",
    "报错", "日志", "server", "db", "sql", "sqlite", "api", "接口", "重构", "优化",
    "排查", "上线", "回滚",
    // 代码/脚本
    "代码", "脚本", "commit", "push", "pull", "release", "版本", "容器", "docker", "nginx",
    // 其他开发语境
    "函数", "变量", "模块", "组件", "配置", "环境", "调试", "断点", "error", "exception",
  ].join("|"),
  "i"
);

/**
 * shouldIgnorePlannedEventMessage - 强拒绝开发/测试/求助类消息
 * @param {string} t - 已 trim 的文本
 * @returns {boolean}
 */
function shouldIgnorePlannedEventMessage(t) {
  /* — core logic omitted for preview — */
}

// 强意图词
const STRONG_INTENT_RE = /我要|我会|我得|我打算|我准备|我计划|我想|我考虑|我们要|我们去|我们会/;

// 动作动词
const ACTION_VERBS_RE = /去|回|见|参加|买|做|跑|练|逛|看|旅行|旅游|参拜|上班|开会|面试|考试|值班|健身|游泳|爬山|钓鱼|聚餐|聚会|约会|出门|出远门|回国|加班/;

/**
 * hasActionIntent - 检测是否有动作意图
 * @param {string} t - 已 trim 的文本
 * @returns {boolean}
 */
function hasActionIntent(t) {
  /* — core logic omitted for preview — */
}

// ===== 主函数 =====

function tokenToWeekday0(token) {
  /* — core logic omitted for preview — */
}

/**
 * fun017h. 检测用户消息中的计划事件
 * 返回 { title, dueDayKey, certainty } 或 null
 */
function detectPlannedEvent(text, tz, nowMs) {
  /* — core logic omitted for preview — */
}

module.exports = {
  detectPlannedEvent,
  shouldIgnoreByShape,
  shouldIgnorePlannedEventMessage,
  hasActionIntent,
  isQuestionLike,
  hasCommitmentCue,
  symbolDensityTooHigh,
};

/*
 * ===== 自测样例（形态闸门 + 问句检测） =====
 *
 * 应拒绝（return null）：
 *
 * 1. [形态] "明天把 src/services/db.cjs 里的函数改一下"
 *    → 命中 PATH_FILE_RE (src/, .cjs)
 *
 * 2. [形态] "下周一 SELECT * FROM users WHERE id = 1"
 *    → 命中 CODE_SYMBOLS_RE (SELECT...FROM...WHERE)
 *
 * 3. [形态] "Error: Cannot find module 'foo' at /app/index.js:10"
 *    → 命中 STACKTRACE_RE (Error:, at...()
 *
 * 4. [形态] "明天看看 https://github.com/xxx/yyy 这个项目"
 *    → 命中 URL_CLI_RE (https://)
 *
 * 5. [问句] "明天去哪里玩呢？"
 *    → isQuestionLike=true, hasCommitmentCue=false → 拒绝
 *
 * 6. [问句] "Where should we go tomorrow?"
 *    → isQuestionLike=true (Where开头), hasCommitmentCue=false → 拒绝
 *
 * 7. [形态] "明日の予定は { \"event\": \"meeting\" } です"
 *    → 命中 JSON_LIKE_RE ("event":)
 *
 * 应通过：
 *
 * 8. [中文] "后天要去鸭川"
 *    → { title: "鸭川", certainty: 1 }
 *
 * 9. [中文+问句+承诺] "明天我们要去看电影吗？"
 *    → isQuestionLike=true, hasCommitmentCue=true → { certainty: 0 }
 *
 * 10. [日文] "来週映画を見に行くつもり"
 *     → hasCommitmentCue=true (つもり) → 通过
 *
 * 11. [英文] "I'll go to the gym tomorrow"
 *     → hasCommitmentCue=true (I'll) → 通过
 *
 * 12. [中文] "3月9日我们去喷水公园看樱花"
 *     → { title: "喷水公园看樱花", certainty: 1 }
 */
