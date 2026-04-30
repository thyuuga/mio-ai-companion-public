// src/services/guards/opener.cjs
const { logInfo } = require("../../../lib/logger.cjs");
const { hourFromNowLocal } = require("../time/index.cjs");
const { formatGapTextFromMs } = require("./gap.cjs");

/**
 * splitFirstUtterance - 切分第一句话与剩余内容
 * 优先按换行切分，否则按句末标点切分（覆盖中英文）
 */
function splitFirstUtterance(text) {
  /* — core logic omitted for preview — */
}

/**
 * fun026. 根据时段选择安全的轻重逢 opener
 */
function pickSafeSoftOpener({ nowLocalText, lastInteractionAt, nowMs }) {
  /* — core logic omitted for preview — */
}

// ===== "今天怎么样" 类日结式问候（短间隔时禁用） =====
const TODAY_CHECK_RE = /今天怎么样|今天过得怎么样|今天如何|今天还好吗|今天开心吗|今天累不累|今天忙不忙|今天顺利吗/;

/**
 * fun027. Opener Guard：检测 NG 开场并替换
 * - 白名单豁免：温柔的关心式问法
 * - TODAY_CHECK：短间隔时拦截"今天怎么样"类问候
 * - 黑名单拦截：冷漠/审判感开场
 * - 只替换第一句，后文原样保留
 */
function guardOpener(reply, meta) {
  /* — core logic omitted for preview — */
}

module.exports = { pickSafeSoftOpener, guardOpener, splitFirstUtterance };

/*
 * ===== 自测样例 =====
 *
 * splitFirstUtterance 切分：
 * - "今天怎么样？有没有好好休息？" → first="今天怎么样？", rest="有没有好好休息？"
 * - "你好\n今天天气不错" → first="你好", rest="今天天气不错"
 * - "今天过得怎么样呀～好久不见" → first="今天过得怎么样呀～好久不见", rest=""（无句末标点）
 *
 * 应拦截（短间隔 < 6h 时）：
 * - "今天怎么样？有没有好好休息？"        → 命中 TODAY_CHECK_RE，替换第一句，保留 rest
 * - "今天过得怎么样呀～"                  → 命中 TODAY_CHECK_RE
 * - "今天还好吗？"                        → 命中 TODAY_CHECK_RE
 * - "今天开心吗？刚才在忙什么？"          → 命中 TODAY_CHECK_RE（即使后面有"刚才"）
 *
 * 应放行（无论间隔）：
 * - "刚才怎么样？"                        → 命中白名单，放行
 * - "你刚才在忙什么？"                    → 不命中任何拦截
 * - "刚才在忙什么呀？"                    → 命中白名单，放行
 *
 * 应放行（长间隔 >= 6h 时）：
 * - "今天怎么样？"                        → gapMins >= 360，不触发 TODAY_CHECK
 */
