// src/services/daily_limit/index.cjs
// ────────────────────────────────────────────────────────────
// 每日消息数限制（对话节奏控制）
//
// Beta 阶段用于成本控制，后续作为订阅等级体系的基础设施。
//
// 设计原则：
// - 所有限制通过 Mio 的 assistant 语气表达，不暴露数字/用量信息
// - 阈值统一从 CHAT_LIMITS_BY_TIER 读取，禁止魔法数字
// - soft/warn 仅在恰好达到阈值时触发一次，hard 持续拦截
// ────────────────────────────────────────────────────────────

const { getDayKey } = require("../sessions/index.cjs");

// ===== 用户等级枚举 =====
// 对应 users.tier 字段（INTEGER），数值越大权限越高
// 新增等级只往后追加，不修改已有数值
const USER_TIER = {
  FREE:       0,  // 免费用户
  PAID_BASIC: 1,  // 入门付费
  PAID_PLUS:  2,  // 主力付费（Beta 期间新用户默认等级）
  PAID_PRO:   3,  // 高级付费
  PAID_MAX:   4,  // 最高等级（无限制）
};

// ===== 每日聊天阈值配置 =====
//
// 每个等级对应三个阈值（均为当日 user 消息条数）：
//   soft — 轻提醒：恰好达到时插入一条温柔的 assistant 提醒，之后继续允许聊天
//   warn — 明确提醒：恰好达到时插入一条较明显的 assistant 提醒，之后继续允许聊天
//   hard — 收口：达到及超过后不再调用 LLM，直接返回收口消息
//
// unlimited: true 表示该等级不受任何限制（跳过全部检查）
//
// 触发规则：
//   soft/warn → count === threshold（精确匹配，天然只触发一次）
//   hard      → count >= threshold（持续拦截）
//
const CHAT_LIMITS_BY_TIER = {
  [USER_TIER.FREE]:       { soft: 30,  warn: 40,  hard: 50 },   // free
  [USER_TIER.PAID_BASIC]: { soft: 80,  warn: 100, hard: 120 },  // paid_basic
  [USER_TIER.PAID_PLUS]:  { soft: 180, warn: 200, hard: 220 },  // paid_plus
  [USER_TIER.PAID_PRO]:   { soft: 300, warn: 350, hard: 400 },  // paid_pro
  [USER_TIER.PAID_MAX]:   { unlimited: true },                   // paid_max
};

// ===== 提醒文案 =====
// 以 Mio 的口吻表达，不包含任何数字 / 用量 / 额度信息
const LIMIT_MESSAGES = {
  soft: "今天已经聊了好久了呢。\n不过没关系，我还在这里。",
  warn: "嗯…今天已经说了很多很多话了。\n稍微休息一下，好吗？",
  hard: "今天先到这里吧。\n我会在这里等你，明天再继续。",
};

// ===== 防重复触发（in-memory） =====
// key 格式: `${userId}:${dayKey}:${phase}`
// 进程重启自动清空（可接受：最坏情况是当天重复触发一次 soft/warn 提醒）
const _triggeredReminders = new Set();

// ────────────────────────────────────────────────────────────
// 内部工具函数
// ────────────────────────────────────────────────────────────

/**
 * 计算用户时区下今天 00:00 对应的 UTC 毫秒时间戳
 */
function getTimezoneStartOfDay(tz, nowMs) {
  const dateStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date(nowMs));

  const now = new Date(nowMs);
  const utcRef = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }));
  const tzRef  = new Date(now.toLocaleString("en-US", { timeZone: tz }));
  const offsetMs = tzRef - utcRef;

  return new Date(`${dateStr}T00:00:00Z`).getTime() - offsetMs;
}

// ────────────────────────────────────────────────────────────
// 公开 API
// ────────────────────────────────────────────────────────────

/**
 * 获取指定 tier 的聊天限额配置
 * tier 不存在时 fallback 到 FREE（最严格），确保安全
 */
function getChatLimitsForTier(tier) {
  return CHAT_LIMITS_BY_TIER[tier] ?? CHAT_LIMITS_BY_TIER[USER_TIER.FREE];
}

/**
 * 获取用户今日已发送消息条数
 * - 仅统计 role='user' 的消息
 * - 按用户 timezone 划分"今天"（00:00 ~ 24:00）
 */
async function getTodayMessageCount(db, userId, tz) {
  const now = Date.now();
  const startMs = getTimezoneStartOfDay(tz, now);
  const endMs = startMs + 24 * 60 * 60 * 1000;

  const row = await db.get(
    `SELECT COUNT(*) as cnt FROM messages m
     JOIN sessions s ON m.session_id = s.id
     WHERE s.user_id = ? AND m.role = 'user'
     AND m.created_at >= ? AND m.created_at < ?`,
    userId, startMs, endMs
  );

  return row?.cnt || 0;
}

/**
 * 从 users 表读取用户 tier
 * 用户不存在时 fallback 到 FREE
 */
async function getUserTier(db, userId) {
  const row = await db.get("SELECT tier FROM users WHERE id = ?", userId);
  return row?.tier ?? USER_TIER.FREE;
}

/**
 * 检查每日消息限额
 *
 * @returns {{ count: number, tier: number, phase: string, message?: string }}
 *   phase: "normal" | "soft" | "warn" | "hard"
 *   message: Mio 口吻的提醒文案（仅 soft/warn/hard 有值）
 */
async function checkDailyLimit(db, userId, tz) {
  const [count, tier] = await Promise.all([
    getTodayMessageCount(db, userId, tz),
    getUserTier(db, userId),
  ]);

  const limits = getChatLimitsForTier(tier);

  // unlimited 等级：跳过全部检查
  if (limits.unlimited) {
    return { count, tier, phase: "normal" };
  }

  const { soft, warn, hard } = limits;

  // ---- hard: 达到及超过，持续拦截（不调 LLM） ----
  if (count >= hard) {
    return { count, tier, phase: "hard", message: LIMIT_MESSAGES.hard };
  }

  // ---- warn: 恰好达到时触发一次 ----
  if (count === warn) {
    const dayKey = getDayKey(tz, Date.now());
    const key = `${userId}:${dayKey}:warn`;
    if (!_triggeredReminders.has(key)) {
      _triggeredReminders.add(key);
      return { count, tier, phase: "warn", message: LIMIT_MESSAGES.warn };
    }
  }

  // ---- soft: 恰好达到时触发一次 ----
  if (count === soft) {
    const dayKey = getDayKey(tz, Date.now());
    const key = `${userId}:${dayKey}:soft`;
    if (!_triggeredReminders.has(key)) {
      _triggeredReminders.add(key);
      return { count, tier, phase: "soft", message: LIMIT_MESSAGES.soft };
    }
  }

  return { count, tier, phase: "normal" };
}

module.exports = {
  USER_TIER,
  CHAT_LIMITS_BY_TIER,
  LIMIT_MESSAGES,
  getChatLimitsForTier,
  getTodayMessageCount,
  getUserTier,
  checkDailyLimit,
};
