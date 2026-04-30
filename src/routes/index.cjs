// src/routes/index.cjs
const express = require("express");
const router = express.Router();

const healthRoutes = require("./health.routes.cjs");
const authRoutes = require("./auth.routes.cjs");
const sessionsRoutes = require("./sessions.routes.cjs");
const memoriesRoutes = require("./memories.routes.cjs");
const chatRoutes = require("./chat.routes.cjs");
const ttsRoutes = require("./tts.routes.cjs");

router.use(healthRoutes);
router.use(authRoutes);
router.use(sessionsRoutes);
router.use(memoriesRoutes);
router.use(chatRoutes);
router.use(ttsRoutes);
if (process.env.NODE_ENV !== "production") {
  const debugRoutes = require("./debug.routes.cjs");
  router.use(debugRoutes);
}

module.exports = router;
