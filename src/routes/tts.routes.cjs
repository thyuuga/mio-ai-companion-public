// src/routes/tts.routes.cjs
const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth.cjs");
const { logError } = require("../../lib/logger.cjs");

const PY_GATEWAY_URL = process.env.PY_GATEWAY_URL || "http://127.0.0.1:8123";

router.post("/tts/speak", requireAuth, async (req, res) => {
  const { text, voice } = req.body;
  if (!text) return res.status(400).json({ error: "text is required" });

  try {
    const resp = await fetch(`${PY_GATEWAY_URL}/tts/speak`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice: voice || "nova" }),
    });

    if (!resp.ok) {
      return res.status(resp.status).json({ error: "TTS service error" });
    }

    res.set("Content-Type", "audio/mpeg");
    const buffer = Buffer.from(await resp.arrayBuffer());
    res.send(buffer);
  } catch (err) {
    logError("[TTS] proxy error", err.message);
    res.status(502).json({ error: "TTS service unavailable" });
  }
});

module.exports = router;
