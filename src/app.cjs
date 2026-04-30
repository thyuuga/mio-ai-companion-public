// MEMO: app.cjs 负责组装
// MEMO: 只做：创建 express app → 中间件（json、cookie、static）→ mount routes
const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");
const crypto = require("crypto");
const { logDebug, logInfo, logError } = require("../lib/logger.cjs");

const routes = require("./routes/index.cjs");
const adminRoutes = require("./routes/admin.routes.cjs");
const { getCharacterIds } = require("../lib/characters.cjs");

// ===== Product middleware (for future multi-product support) =====
function withProduct(productId) {
  return function (req, res, next) {
    req.productId = productId; // 'mio' (future: 'other')
    next();
  };
}

function createApp() {
  const app = express();

  // 反向代理（Cloudflare / nginx）下信任第一层 proxy，确保 req.ip、req.secure 正确
  app.set("trust proxy", 1);

  // ===== 全局 HTTP 请求日志中间件 =====
  // 默认只打 error(>=400) 和 slow(>=HTTP_SLOW_MS)；HTTP_LOG=1 开启常规 OUT/IN
  const _httpLogEnabled = process.env.HTTP_LOG === "1";
  const _httpInEnabled  = process.env.HTTP_IN === "1";
  const _httpQuiet      = process.env.HTTP_LOG_QUIET === "1";
  const _httpSlowMs     = Number(process.env.HTTP_SLOW_MS) || 1500;
  const _httpQuietPaths = ["/", "/sessions/ensure_active"];
  const _httpQuietPrefixes = ["/.well-known/"];
  const _httpStaticExts = /\.(?:js|css|map|ico|png|svg)(?:\?|$)/;

  function _isQuietPath(url) {
    const p = url.split("?")[0];
    if (_httpQuietPaths.includes(p)) return true;
    for (const pfx of _httpQuietPrefixes) { if (p.startsWith(pfx)) return true; }
    if (_httpStaticExts.test(p)) return true;
    return false;
  }

  app.use((req, res, next) => {
    const start = Date.now();
    const traceId = req.headers["x-trace-id"] || crypto.randomUUID();
    req.traceId = traceId;

    const quiet = _isQuietPath(req.url);
    const meta = { traceId, method: req.method, url: req.url };

    if (_httpLogEnabled && _httpInEnabled && !_httpQuiet && !quiet) {
      logDebug(meta, "[HTTP] IN");
    }

    res.on("finish", () => {
      const costMs = Date.now() - start;
      const isError = res.statusCode >= 400;
      const isSlow  = costMs >= _httpSlowMs;
      const out = { statusCode: res.statusCode, costMs };

      if (res.statusCode >= 500) {
        logError(meta, "[HTTP] OUT", out);
      } else if (isError) {
        // 4xx 是客户端问题（401未登录、404找不到等），用 WARN 即可
        logInfo(meta, "[HTTP] OUT", out);
      } else if (isSlow) {
        logInfo(meta, "[HTTP] SLOW", out);
      } else if (_httpLogEnabled && !_httpQuiet && !quiet) {
        logDebug(meta, "[HTTP] OUT", out);
      }
    });

    next();
  });

  // 常用中间件
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  // ===== Admin 管理后台 =====
  const uiDir = path.join(__dirname, "..", "ui");
  app.use("/admin", express.static(path.join(uiDir, "admin")));
  app.use("/admin/api", adminRoutes);

  // ===== 多角色路由（每个角色一个 URL 前缀）=====
  for (const charId of getCharacterIds()) {
    const router = express.Router();
    router.use(withProduct(charId));
    router.use(routes);

    app.use(`/${charId}`, express.static(uiDir));
    app.use(`/${charId}`, router);
  }

  // favicon（浏览器默认请求 /favicon.ico）
  app.get("/favicon.ico", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "ui", "favicon.ico"));
  });

  // 根路径 health check
  app.get("/health", (req, res) => res.json({ ok: true }));

  // 统一 404
  app.use((req, res) => res.status(404).json({ error: "Not found" }));

  // 全局错误兜底
  app.use((err, req, res, _next) => {
    logError({ traceId: req.traceId }, "[HTTP] unhandled error", err);
    if (res.headersSent) return;
    res.status(err.status || 500).json({ error: err.message || "Internal server error" });
  });

  return app;
}

module.exports = { createApp };
