// MEMO: server.cjs 只负责 listen
// MEMO: 只做：加载 env → import app → listen → 启动后台 jobs
require("dotenv").config();

const { logInfo, logWarn, logError, CURRENT_LEVEL } = require("./lib/logger.cjs");

// 进程级兜底错误日志
process.on("unhandledRejection", (err) => { logError({ traceId: "UNHANDLED_REJECTION" }, err); });
process.on("uncaughtException", (err) => { logError({ traceId: "UNCAUGHT_EXCEPTION" }, err); });

// ===== Imports =====
const crypto = require("crypto");
const { randomUUID } = crypto;

const { getDB } = require("./lib/db.cjs");

// Jobs
const { runEmbeddingWorker } = require("./src/services/queue/embedding.worker.cjs");
const { backfillMemoryHashes, backfillMemoryEmbeddings } = require("./src/jobs/backfill.cjs");


// Time utils (for tickSessionEndings)
const { hourFromNowLocal, getMioDailyState } = require("./src/services/time/index.cjs");

// Session summary + embedding (for tickSessionEndings)
const { getSessionSummary, getClosingSummary } = require("./src/repositories/session_summaries.repo.cjs");
const { enqueueEmbedding } = require("./src/services/queue/index.cjs");
const { generateClosingSummary } = require("./src/services/db/closing_summary.cjs");

// Emotional state (for tickSessionEndings)
const { analyzeSessionFeeling, computeAndUpdateMood, computeAndUpdateRelationship } = require("./src/services/emotional_state/index.cjs");

// Characters
const { getCharacter } = require("./lib/characters.cjs");

// Proactive (push 模式后台定时生成)
const { getActiveUsers, saveProactiveMessage } = require("./src/services/proactive/store.cjs");
const { shouldTriggerWindowProactive } = require("./src/services/proactive/gates.cjs");
const { generateProactiveMessage } = require("./src/services/proactive/generate.cjs");
const { pickProactiveContext } = require("./src/services/proactive/context.cjs");
const { getMioState } = require("./src/services/db/mio_state.cjs");
const { getDayKey } = require("./src/services/sessions/index.cjs");

// ===== App =====
const { createApp } = require("./src/app.cjs");
const app = createApp();

// schema 错误节流（避免刷屏）
let schemaErrorLogged = globalThis.schemaErrorLogged || {};
globalThis.schemaErrorLogged = schemaErrorLogged;

// Worker 状态
const EMBEDDING_WORKER_INTERVAL = 3000; // 3 秒

// tick 并发锁，防止重入
let ticking = false;

/**
 * 获取某 session 中最后一条用户消息的时间
 */
async function getLastUserMessageAt(db, sessionId) {
  /* — core logic omitted for preview — */
}

/**
 * 判断 session 是否应当断开
 * 规则：1h 内不断；1-6h 线性概率递增；6h+ 必断
 */
function shouldEndSession(lastAt, now) {
  /* — core logic omitted for preview — */
}

/**
 * 后台定时器：扫描并断开超时的 session
 *
 * 流程：
 * 1. 查询所有未断开且超过 1h 未更新的 session
 * 2. 对每个 session 判断是否应断开（概率模型）
 * 3. 断开 → 写入 end_state/end_message → 生成 closing_summary
 * 4. 将 closing_summary 写入 embedding 永久保存
 * 5. 分析情感状态 → 更新 mood/relationship
 */
async function tickSessionEndings() {
  /* — core logic omitted for preview — */
}

// ===== Proactive Push 后台定时任务 =====
let tickingProactive = false;
const ACTIVE_USER_WINDOW_MS = 7 * 24 * 3600_000; // 最近 7 天有活跃的用户

/**
 * 后台定时器：扫描活跃用户 → 检查时间窗口 → 生成主动消息
 *
 * 流程：
 * 1. 获取最近 7 天有活跃的用户列表
 * 2. 对每个用户检查是否命中当日时间窗口（早/中/晚）
 * 3. 根据 relationship + context 生成主动消息
 * 4. 保存消息记录，等待前端轮询拉取
 */
async function tickProactiveMessages() {
  /* — core logic omitted for preview — */
}

// ===== Server Start =====
const PORT = process.env.PORT || 3001;
const banner = `
=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~
(ฅ•̀ω•́ฅ)  ChatAI API Server Started
=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~
`;

app.listen(PORT, async () => {
  console.log(banner);
  logInfo({ traceId: "BOOT" }, "server started", {
    pid: process.pid,
    time: new Date().toISOString(),
    port: PORT,
    env: process.env.NODE_ENV || "development",
    logLevel: CURRENT_LEVEL,
    health: `http://localhost:${PORT}/mio/health`,
    ui: `http://localhost:${PORT}/mio`,
  });

  // 确保 DB 初始化完成后再启动 workers
  await getDB();

  // 启动后台 tick 定时器（每 60 秒扫描一次）
  setInterval(tickSessionEndings, 60 * 1000);

  // 启动 proactive push 定时器（每 60 秒扫描一次）
  setInterval(tickProactiveMessages, 60 * 1000);

  // 启动 embedding worker 定时器（每 3 秒消费队列）
  setInterval(runEmbeddingWorker, EMBEDDING_WORKER_INTERVAL);

  // 启动时立即执行一次
  tickSessionEndings().catch(e => logError({ traceId: "BOOT" }, "initial tick failed:", e));
  tickProactiveMessages().catch(e => logError({ traceId: "BOOT" }, "initial proactive tick failed:", e));
  runEmbeddingWorker().catch(e => logError({ traceId: "BOOT" }, "initial embedding worker failed:", e));


  // 启动时跑一轮 memory hash + embedding 回填（小批量，不阻塞启动）
  /* — backfill logic omitted for preview — */
});
