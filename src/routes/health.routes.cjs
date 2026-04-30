// src/routes/health.routes.cjs
const express = require("express");
const router = express.Router();

// API004. 服务存活检查 GET /health
router.get("/health", (req, res) => {
  res.json({ ok: true });
});

module.exports = router;
