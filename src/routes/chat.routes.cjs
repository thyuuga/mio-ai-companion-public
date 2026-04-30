// src/routes/chat.routes.cjs
const express = require("express");
const rateLimit = require("express-rate-limit");
const requireAuth = require("../middleware/requireAuth.cjs");
const { logDebug, logError } = require("../../lib/logger.cjs");
const { getDB } = require("../../lib/db.cjs");
const { getMioState } = require("../services/db/mio_state.cjs");
const { getUserTimezone } = require("../services/sessions/timezone.cjs");
const { getDayKey } = require("../services/sessions/index.cjs");
const { applyNighttimeOverride } = require("../services/emotional_state/blocks.cjs");
const { handleChat } = require("../domain/chat/handle_chat.cjs");
const { consumeBurst, cancelBurst } = require("../services/burst/index.cjs");
const {
  shouldTriggerLoginProactive,
  recordLoginTrigger,
  pickProactiveContext,
  generateProactiveMessage,
  saveProactiveMessage,
  markProactiveSeen,
  markLoginTriggeredToday,
  getUnseenProactiveMessages,
} = require("../services/proactive/index.cjs");
const {
  shouldTriggerSessionNudge,
  getNudgeForSession,
  saveSessionNudge,
  generateNudgeMessage,
} = require("../services/session_nudge/index.cjs");

const _chatDebug = process.env.LOG_LEVEL === "debug" || process.env.DEBUG_CHAT === "1";

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.userId || req.ip,
  message: { error: "发送太频繁了，休息一下吧" },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
});

const router = express.Router();

// API008. 一次完整的 Mio 对话流程
router.post("/chat", requireAuth, chatLimiter, async (req, res) => {
  const traceId = req.traceId || "no-trace";
  if (_chatDebug) {
    logDebug({ traceId }, "[CHAT_ROUTE] IN", {
      sessionId: req.body?.sessionId,
      msgLen: req.body?.message?.length,
    });
  }

  try {
    const { sessionId, message } = req.body || {};

    if (!sessionId || !message) {
      return res.status(400).json({ error: "Missing sessionId or message" });
    }
    if (message.length > 1000) {
      return res.status(400).json({ error: "消息太长了，精简一下吧" });
    }

    const result = await handleChat({
      userId: req.userId,
      sessionId,
      message,
      traceId,
      productId: req.productId,
    });

    // 附带 mio emotional state（mood 经深夜滤镜后返回，与 prompt 一致）
    try {
      const db = await getDB();
      const state = await getMioState(db, req.userId);
      const tz = await getUserTimezone(db, req.userId);
      const row = await db.get(
        `SELECT feeling FROM messages
         WHERE session_id = ? AND role = 'assistant' AND feeling IS NOT NULL
         ORDER BY created_at DESC LIMIT 1`,
        sessionId
      );
      result.mio_state = {
        mood: applyNighttimeOverride(state.mood, tz, Date.now()),
        feeling: row?.feeling || "平常",
        relationship: state.relationship,
      };
    } catch (e) {
      logError({ traceId }, "[CHAT] mio_state fetch failed", e);
    }

    res.json(result);
  } catch (err) {
    logError("chat failed:", err);

    // 如果错误带有 payload（如 session ended），使用 payload
    if (err.payload) {
      return res.status(err.status || 400).json(err.payload);
    }

    const status = err?.status || 500;
    res.status(status).json({ error: String(err?.message || err) });
  }
});

// API: burst 连发轮询 — 前端延迟后 poll 取 burst 结果
router.get("/chat/burst", requireAuth, async (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) {
    return res.status(400).json({ error: "Missing sessionId" });
  }

  const burst = consumeBurst(sessionId);
  if (burst) {
    res.json({
      burst: true,
      text: burst.text,
      burst_type: burst.burstType,
      created_at: Date.now(),
    });
  } else {
    res.json({ burst: false });
  }
});

// API: burst 取消 — 用户发了新消息时前端主动取消
router.post("/chat/burst/cancel", requireAuth, (req, res) => {
  const { sessionId } = req.body || {};
  if (sessionId) cancelBurst(sessionId);
  res.json({ ok: true });
});

// API: 主动消息 — 取未读 + 登录触发
// push 模式：window 消息由后台 tickProactiveMessages 生成
// 前端进页面时 + 定时 poll（每 2 分钟）
router.get("/chat/proactive", requireAuth, async (req, res) => {
  const traceId = req.traceId || "no-trace";
  const { sessionId } = req.query;
  if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });

  try {
    const db = await getDB();
    const userId = req.userId;
    const now = Date.now();

    // 先查 DB 中已有的未读消息（后台定时任务生成的）
    const unseen = await getUnseenProactiveMessages(db, userId);
    if (unseen.length > 0) {
      return res.json({ messages: unseen });
    }

    // 没有待展示消息 → 尝试登录触发（当场生成）
    const userRow = await db.get("SELECT timezone, character FROM users WHERE id = ?", userId);
    const tz = String(userRow?.timezone || "Asia/Tokyo").trim() || "Asia/Tokyo";
    const character = userRow?.character || "mio";
    const dayKey = getDayKey(tz, now);

    const loginShouldFire = await shouldTriggerLoginProactive(db, userId, dayKey, sessionId);
    if (loginShouldFire) {
      const context = await pickProactiveContext(db, userId, now);
      const mioState = await getMioState(db, userId);
      const relationship = mioState.relationship || "stranger";
      const message = await generateProactiveMessage({
        character, relationship, context, triggerType: "login", tz, now,
      });
      if (message) {
        const id = await saveProactiveMessage(db, {
          userId, sessionId, triggerType: "login", content: message, now, dayKey, skipCount: true,
        });
        await markLoginTriggeredToday(db, userId, dayKey);
        recordLoginTrigger(userId);
        logDebug({ traceId, userId }, "[PROACTIVE] login triggered", {
          contextType: context ? context.type : "none", msgLen: message.length,
        });
        return res.json({ messages: [{ id, content: message, trigger_type: "login", created_at: now }] });
      }
    }

    res.json({ messages: [] });
  } catch (err) {
    logError({ traceId: req.traceId }, "[PROACTIVE] error", err);
    res.json({ messages: [] });
  }
});

// API: 会话内轻触发 — 用户停住后，轻轻留一句"我还在"
// 同一 session 最多触发 1 次；幂等：已触发则直接返回同一条消息
router.get("/chat/session-nudge", requireAuth, async (req, res) => {
  const traceId = req.traceId || "no-trace";
  const { sessionId } = req.query;
  if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });

  try {
    const db = await getDB();
    const userId = req.userId;
    const now = Date.now();

    // 幂等：已触发过，直接返回同一条（避免重复生成）
    const existing = await getNudgeForSession(db, sessionId);
    if (existing) {
      return res.json({ triggered: true, message: existing });
    }

    // Gating
    const shouldFire = await shouldTriggerSessionNudge(db, userId, sessionId, now);
    if (!shouldFire) {
      return res.json({ triggered: false });
    }

    // 生成
    const userRow = await db.get("SELECT character FROM users WHERE id = ?", userId);
    const character = userRow?.character || "mio";
    const mioState = await getMioState(db, userId);
    const relationship = mioState.relationship || "stranger";

    const message = await generateNudgeMessage({ character, relationship });
    if (!message) {
      return res.json({ triggered: false });
    }

    // 写入 session
    await saveSessionNudge(db, { sessionId, content: message, now });

    logDebug({ traceId, userId }, "[NUDGE] session nudge triggered", {
      sessionId, msgLen: message.length,
    });

    res.json({ triggered: true, message });
  } catch (err) {
    logError({ traceId: req.traceId }, "[NUDGE] error", err);
    res.json({ triggered: false });
  }
});

// API: 主动消息已展示 — 前端展示后调用，标记 seen=1（展示即消费）
router.post("/chat/proactive/seen", requireAuth, async (req, res) => {
  const { proactive_id, sessionId } = req.body || {};
  if (!proactive_id) return res.status(400).json({ error: "Missing proactive_id" });
  try {
    const db = await getDB();
    await markProactiveSeen(db, proactive_id);

    // 同时写入 messages 表，让 loadHistory 能加载到
    if (sessionId) {
      const pm = await db.get(
        "SELECT content, created_at FROM proactive_messages WHERE id = ?",
        proactive_id
      );
      if (pm) {
        const { randomUUID } = require("crypto");
        await db.run(
          "INSERT INTO messages (id, session_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)",
          randomUUID(), sessionId, "assistant", pm.content, pm.created_at
        );
      }
    }

    res.json({ ok: true });
  } catch (err) {
    logError({ traceId: req.traceId }, "[PROACTIVE] seen mark failed", err);
    res.json({ ok: false });
  }
});

module.exports = router;
