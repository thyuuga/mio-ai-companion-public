// lib/logger.cjs
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 100 };

function resolveLevel() {
  const env = (process.env.NODE_ENV || "development").toLowerCase();
  const fromEnv = (process.env.LOG_LEVEL || "").toLowerCase();
  if (fromEnv && LEVELS[fromEnv] != null) return fromEnv;
  return env === "production" ? "info" : "debug";
}

const CURRENT_LEVEL = resolveLevel();
const CURRENT_NUM = LEVELS[CURRENT_LEVEL] ?? LEVELS.info;

function shouldLog(level) {
  return (LEVELS[level] ?? 999) >= CURRENT_NUM;
}

function ts() {
  return new Date().toISOString();
}

// 支持 logInfo("msg", obj) 或 logInfo({traceId}, "msg", obj)
function normalizeArgs(args) {
  if (!args.length) return { meta: null, rest: [] };
  const first = args[0];
  if (first && typeof first === "object" && !Array.isArray(first) && (first.traceId || first.userId || first.sessionId)) {
    return { meta: first, rest: args.slice(1) };
  }
  return { meta: null, rest: args };
}

function prefix(level, meta) {
  const base = `[${ts()}] [${level.toUpperCase()}]`;
  if (!meta) return base;
  const parts = [];
  if (meta.traceId) parts.push(`traceId=${meta.traceId}`);
  if (meta.userId) parts.push(`userId=${meta.userId}`);
  if (meta.sessionId) parts.push(`sessionId=${meta.sessionId}`);
  return parts.length ? `${base} [${parts.join(" ")}]` : base;
}

function log(level, ...args) {
  if (!shouldLog(level)) return;
  const { meta, rest } = normalizeArgs(args);
  const head = prefix(level, meta);

  if (level === "error") console.error(head, ...rest);
  else if (level === "warn") console.warn(head, ...rest);
  else console.log(head, ...rest);
}

// 兼容旧接口 + 新接口
function logDebug(...args) { log("debug", ...args); }
function logInfo(...args) { log("info", ...args); }
function logWarn(...args) { log("warn", ...args); }
function logError(...args) { log("error", ...args); }

module.exports = { logDebug, logInfo, logWarn, logError, CURRENT_LEVEL };
