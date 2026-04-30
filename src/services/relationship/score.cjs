// src/services/relationship/score.cjs
//
// 关系分数系统：score → stage 的核心逻辑
//
// 设计参数：
//   - Stage 边界：0-20 stranger, 21-40 familiar, 41-70 fond, 71-100 attached, 101+ deeply_attached
//   - 每日首登 + 发满3条消息 → +5
//   - 每累积5条正面feeling（开心/得意/害羞）→ +1
//   - 每日分数上限：stage 1-2 = 20, stage 3 = 15, stage 4-5 = 10
//   - 衰减：3天宽限期后 -1/天
//   - 滞回缓冲：升级用原始阈值（即时升级），降级 -3 防抖

const { logInfo, logDebug } = require("../../../lib/logger.cjs");
const { getMioState, updateMioRelationship } = require("../db/mio_state.cjs");

// ===== Constants =====

const STAGE_ORDER = ["stranger", "familiar", "fond", "attached", "deeply_attached"];

const STAGE_THRESHOLDS = [
  { stage: "stranger",        min: 0 },
  { stage: "familiar",        min: 21 },
  { stage: "fond",            min: 41 },
  { stage: "attached",        min: 71 },
  { stage: "deeply_attached", min: 101 },
];

const HYSTERESIS = 3;
const DAILY_LOGIN_BONUS = 5;
const LOGIN_MSG_THRESHOLD = 3;
const FEELING_ACC_THRESHOLD = 5;
const DECAY_GRACE_DAYS = 3;
const DECAY_PER_DAY = 1;

const POSITIVE_FEELINGS = new Set(["开心", "得意", "害羞"]);

// Daily score cap by stage index (0=stranger ... 4=deeply_attached)
function getDailyCap(stageIdx) {
  /* — core logic omitted for preview — */
}

// Migration: 从现有 relationship stage 推算初始分数
const MIGRATION_SCORES = {
  stranger: 10,
  familiar: 30,
  fond: 55,
  attached: 85,
  deeply_attached: 110,
};

// ===== Score → Stage (with Hysteresis) =====

/**
 * 递归解析 score → stage
 * - 升级：使用原始阈值，达到即升级（升级是好事，不需要防抖）
 * - 降级：需要低于当前阶段下限 HYSTERESIS 分，避免边界抖动反复降级
 */
function resolveStage(score, currentStage) {
  /* — core logic omitted for preview — */
}

/** 无滞回的原始 stage 查找（用于新用户 fallback） */
function rawStageFromScore(score) {
  /* — core logic omitted for preview — */
}

// ===== DB Record =====

/**
 * 获取或创建用户的关系分数记录
 * 新用户：从 mio_state.relationship 推算初始分数（向下兼容）
 */
async function getScoreRecord(db, userId) {
  /* — core logic omitted for preview — */
}

// ===== Stage Sync =====

/**
 * 将 score 映射到 stage，如果发生变化则更新 mio_state.relationship
 */
async function syncStage(db, userId, score) {
  /* — core logic omitted for preview — */
}

// ===== Day Helpers =====

/** 计算两个 day_key (YYYY-MM-DD) 之间的天数差 */
function daysBetween(dayKeyA, dayKeyB) {
  /* — core logic omitted for preview — */
}

// ===== Core Operations =====

/**
 * tickOnUserMessage — 每条用户消息触发
 *
 * 1. 新日期 → 重置每日计数器 + 应用衰减
 * 2. 累积当日消息数
 * 3. 满3条 → 发放每日登录奖励 (+5)
 *
 * @param {object} db
 * @param {string} userId
 * @param {string} dayKey - 当天日期 (YYYY-MM-DD，用户时区)
 */
async function tickOnUserMessage(db, userId, dayKey) {
  /* — core logic omitted for preview — */
}

/**
 * creditPositiveFeeling — 正面feeling累积
 *
 * 每累积 5 条正面feeling（开心/得意/害羞）→ +1（受每日上限约束）
 * positive_feeling_acc 跨天不重置
 *
 * @param {object} db
 * @param {string} userId
 * @param {string} dayKey - 当天日期 (YYYY-MM-DD)
 */
async function creditPositiveFeeling(db, userId, dayKey) {
  /* — core logic omitted for preview — */
}

/**
 * computeAndSyncRelationship — session 结束时调用
 *
 * 读取当前 score，同步 stage 到 mio_state
 * 替代旧的 computeAndUpdateRelationship
 */
async function computeAndSyncRelationship(db, userId) {
  /* — core logic omitted for preview — */
}

module.exports = {
  tickOnUserMessage,
  creditPositiveFeeling,
  computeAndSyncRelationship,
  resolveStage,
  getScoreRecord,
  POSITIVE_FEELINGS,
  STAGE_ORDER,
  STAGE_THRESHOLDS,
};
