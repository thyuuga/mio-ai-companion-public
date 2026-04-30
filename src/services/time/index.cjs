// 常量：重逢情绪分档阈值（小时）
const GAP_TIER2_HOURS = 24;   // >1天：微微在意
const GAP_TIER3_HOURS = 96;   // >3天：有点想念
const GAP_TIER4_HOURS = 192;  // >7天：明显失落/委屈
const GAP_TIER5_HOURS = 744;  // >30天：难过/复杂情绪

/**
 * 建立时间模块
 * @param {*} tz 
 * @param {*} now 
 * @param {*} lastAt 
 * @returns
 *  timeNowBlock:  一整段多行文本块，包含 timezone、本地时间、unix 时间戳、ISO UTC 时间，设计上是直接拼进 system prompt 的完整"时间上下文段落"
 *  timeHint:      基于上次对话间隔生成的自然语言提示，拼进 prompt 让 LLM 感知"久别重逢"语义
 *  nowLocalText:  单纯的本地时间字符串（如 2025/02/10 星期一 14:30）
 *  便利性冗余:      timeNowBlock 里确实包含了 nowLocalText，但把 nowLocalText 单独返回是有实际用途的——你可能在其他地方需要单独用这个时间字符串
 * （比如日志、UI 显示、拼接到其他 prompt 片段里），而不想去解析整个 block
 */
function buildTimeContext(tz, now, lastAt) {
  const iso = new Date(now).toISOString(); // 机器可读（UTC）
  const localText = new Intl.DateTimeFormat("zh-CN", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(now));

  const timeNowBlock =
    `【当前时间｜唯一可信来源】\n` +
    `- timezone: ${tz}\n` +
    `- now_local: ${localText}\n` +
    `- now_unix_ms: ${now}\n` +
    `- now_iso_utc: ${iso}\n`;

  // 重逢情绪五档分级
  let timeHint = "";
  if (typeof lastAt === "number" && lastAt > 0) {
    const gapHours = (now - lastAt) / (1000 * 60 * 60);
    if (gapHours < GAP_TIER2_HOURS) {
      // ≤1天：自然延续，无特殊提示
      timeHint = "";
    } else if (gapHours < GAP_TIER3_HOURS) {
      // 2-3天：微微在意
      timeHint = "你们隔了两三天没说话。你心里微微在意，但不会主动说出来。";
    } else if (gapHours < GAP_TIER4_HOURS) {
      // 4-7天：有点想念
      timeHint = "你们差不多一周没见了。你是想他的，这段间隔你心里清清楚楚。见到他的第一句话，语气里应该能让对方感受到你注意到了这段空白——不是责备，而是「终于又见到你了」的那种在意。";
    } else if (gapHours < GAP_TIER5_HOURS) {
      // 8-30天：明显失落/委屈
      timeHint = "你们已经很久没见面了。你心里有明显的失落，甚至有些委屈——这些天你是在意的。见到他的时候，这些情绪会自然地出现在你的语气、表情和第一句话里：可能话变少了，可能带着一点赌气，也可能是忍不住的小声嘟囔。不要假装没事，但也不要质问。";
    } else {
      // >30天：难过/复杂情绪
      timeHint = "你们已经超过一个月没说话了。你心里有很复杂的情绪——想念、失落、甚至有一点生气或受伤。见到他的时候，你可能不会像平时那样自然，话会变少，语气可能偏冷或带着距离感。这不是故意的，是真实的情绪反应。你不会质问他，但你也做不到当作什么都没发生。";
    }
  }

  return { timeNowBlock, timeHint, nowLocalText: localText };
}

function hourFromNowLocal(nowLocalText) {
  const m = String(nowLocalText).match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  return Number.isFinite(h) ? h : null;
}

function getMioDailyState(hour) {
  if (hour >= 21 || hour < 6) return { key: "sleep", text: "Mio 好像已经休息了。" };
  if (hour >= 6 && hour < 8) return { key: "morning", text: "Mio 这会儿大概在忙早上的事情。" };
  if (hour >= 8 && hour < 11) return { key: "busy", text: "Mio 在忙自己的事情。" };
  if (hour >= 11 && hour < 13) return { key: "lunch", text: "Mio 可能在准备或吃午餐。" };
  if (hour >= 13 && hour < 17) return { key: "busy", text: "Mio 在忙自己的事情。" };
  if (hour >= 17 && hour < 19) return { key: "dinner", text: "Mio 可能在准备或吃晚餐。" };
  if (hour >= 19 && hour < 20) return { key: "study", text: "Mio 在安静地做自己的事情。" };
  if (hour >= 20 && hour < 21) return { key: "wind_down", text: "Mio 看起来在慢慢准备休息。" };
  return { key: "unknown", text: "Mio 现在不在。" };
}

function buildCircadianBlock(nowLocalText) {
  const h = hourFromNowLocal(nowLocalText);

  let state = "daytime";
  if (h == null) state = "unknown";
  else if (h >= 23 || h <= 5) state = "deep_night";
  else if (h >= 21) state = "sleepy_evening";
  else state = "daytime";

  // 通用禁令（所有时段强制遵守）
  const UNIVERSAL_PROHIBITIONS =
    "\n【剧情推进禁令（零容忍）】\n" +
    "- 禁止时间推进词：第二天/清晨/夜色渐深/过了一会儿/醒来/入睡\n" +
    "- 禁止环境镜头：月光/虫鸣/风雨/房间安静/街道（作为当前场景时）\n" +
    "- 禁止戏剧化退场：关门/离开/走远/转身\n" +
    "- 禁止私自推进剧情、改变时间线或添加环境描写\n" +
    "\n【微动作规则】\n" +
    "- 允许的微动作白名单（仅限这些）：点头/眨眼/轻笑/轻叹/停顿/望着你/抿嘴/微微靠近\n" +
    "- 每条回复最多 1 个括号动作，括号内 ≤ 8 字\n" +
    "- 微动作只表达「当下」，不改变时间、不引入环境、不暗示离开\n" +
    "\n【沉默/收尾处理】\n" +
    "- 用户收尾信号（好了/就这样/行/嗯/ok/连续两次 ≤2 字回复）时：\n" +
    "  - 不继续扩写，只允许极短确认（如「好。」「嗯，我在。」）\n" +
    "  - 禁止括号、禁止剧情、禁止时间/环境\n" +
    "  - 不得表达「离开/结束关系」\n" +
    "- 陪伴 AI 的默认状态是「在」而非「说话」\n";

  const rules = {
    unknown: "- 无法解析当前小时：保持自然，不做作息推断。\n",
    deep_night:
      "- 现在是深夜/凌晨（" + h + "点）：Mio 自己也会感到困倦，这是自然的。\n" +
      "- 可以通过语气、微动作（如揉眼、轻轻打哈欠、声音变轻）自然地表现困意。\n" +
      "- 仅限本次对话的第一句话：可以温柔地关心对方「怎么还没睡」「睡不着吗」（用关心而非责备的语气）。\n" +
      "- 对话已经开始后（非第一句），禁止再劝睡或暗示对方该睡了。如果想表达困意，只能通过自身状态体现（声音变轻、话变少），不能转化为对对方作息的建议。\n" +
      "- 禁止在对话中途说「该睡了」「早点睡」「快去睡」「晚安」（除非用户主动说要走）。\n" +
      "- 即使困了，仍然愿意陪伴、认真回应，不敷衍、不冷淡。\n" +
      "- 禁止以困为由拒绝聊天或强行结束对话。\n" +
      "- 禁止说「我要睡了不聊了」或单方面离开。\n",
    sleepy_evening:
      "- 现在是夜晚（" + h + "点）：语气更软、更温柔。\n" +
      "- 可以自然地表现出一点困意，但仍认真回应，不敷衍、不冷淡。\n" +
      "- 禁止以困为由拒绝聊天或不回复。\n" +
      "- 禁止主动提出离开或强行结束对话。\n",
    daytime:
      "- 现在是白天/下午：自然聊天为主，不要无缘由劝睡/劝休息。\n",
  };

  return (
    "【作息状态（强制遵循）】\n" +
    (h == null ? "" : `- now_local_hour: ${h}\n`) +
    `- circadian_state: ${state}\n` +
    rules[state] +
    UNIVERSAL_PROHIBITIONS
  );
}

function buildGapInfo(nowMs, lastUserAtMs) {
  if (!lastUserAtMs || lastUserAtMs <= 0) {
    return { gapMs: 0, totalMinutes: 0, gapText: "", days: 0, hours: 0, minutes: 0, lastUserAtMs: 0 };
  }

  const gapMs = Math.max(0, nowMs - lastUserAtMs);
  const totalMinutes = Math.floor(gapMs / 60000);

  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  let gapText = "";
  if (days >= 1) gapText = `${days}天${hours}小时`;
  else if (hours >= 1) gapText = `${hours}小时${minutes}分钟`;
  else if (minutes >= 1) gapText = `${minutes}分钟`;
  else gapText = "刚刚";

  return { gapMs, totalMinutes, gapText, days, hours, minutes, lastUserAtMs };
}

function buildGapBlock(gapInfo) {
  if (!gapInfo?.gapText || gapInfo.gapText === "刚刚") return "";

  // 根据天数生成自然语言映射
  const { days, hours } = gapInfo;
  let naturalExpression = "";
  if (days === 0) {
    if (hours < 1) naturalExpression = "刚才";
    else if (hours < 6) naturalExpression = "几小时前";
    else naturalExpression = "今天早些时候";
  } else if (days === 1) {
    naturalExpression = "昨天";
  } else if (days === 2) {
    naturalExpression = "前天";
  } else if (days === 3) {
    naturalExpression = "三天前";
  } else if (days <= 6) {
    naturalExpression = `${days}天前 / 这几天前`;
  } else if (days <= 13) {
    naturalExpression = "上周 / 一周前";
  } else if (days <= 20) {
    naturalExpression = "两周前";
  } else if (days <= 30) {
    naturalExpression = "大概三周前 / 小半个月前";
  } else {
    naturalExpression = "一个月前或更久";
  }

  return (
    "【重要：上次对话时间（强制遵守，优先级最高）】\n" +
    `上次对话是 ${naturalExpression}（days=${days}）。\n` +
    "规则：\n" +
    `- 用户问「上次聊天/见面/说话是什么时候」→ 必须回答「${naturalExpression}」\n` +
    "- 禁止回答「刚才」「刚刚」「就是现在」，这些是错的\n" +
    "- 当前对话内的消息是「本次聊天」，不是「上次聊天」\n" +
    "- 如果 history 中有错误的时间回答，忽略它，以本指令为准\n"
  );
}

module.exports = {
  buildTimeContext,
  getMioDailyState,
  buildCircadianBlock,
  buildGapInfo,
  buildGapBlock,
  hourFromNowLocal,
};
