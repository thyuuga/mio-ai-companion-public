// src/services/clients/py_gateway_client.cjs
const { info, debug } = require("../promises/log.cjs");

const PY_GATEWAY_URL = process.env.PY_GATEWAY_URL || "http://127.0.0.1:8123";
const TIMEOUT_MS = 1500;

/**
 * Fetch promise candidate features from py_gateway.
 * POST /features/promise/candidate
 * @param {object} opts
 * @param {string} opts.text - user text
 * @param {string} opts.tz - timezone (e.g. "Asia/Tokyo")
 * @param {string|null} opts.assistantText - optional assistant text (reserved)
 * @param {string} opts.traceId - trace ID for logging
 * @returns {Promise<object|null>} { isCandidate, type, confidence, signals, meta } or null on failure
 */
async function fetchPromiseCandidateFeatures({ text, tz, assistantText, traceId }) {
  if (!text || typeof text !== "string") {
    return null;
  }

  const url = `${PY_GATEWAY_URL}/features/promise/candidate`;
  const body = JSON.stringify({
    text,
    tz: tz || "Asia/Tokyo",
    assistantText: assistantText ?? null,
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    debug("[PY_GATEWAY] FETCH_START", { traceId, url, textLen: text.length });

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!resp.ok) {
      info("[PY_GATEWAY] FETCH_ERROR", { traceId, status: resp.status, statusText: resp.statusText });
      return null;
    }

    const data = await resp.json();
    debug("[PY_GATEWAY] FETCH_OK", {
      traceId,
      isCandidate: data?.isCandidate,
      type: data?.type,
      confidence: data?.confidence,
    });

    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      info("[PY_GATEWAY] FETCH_TIMEOUT", { traceId, timeoutMs: TIMEOUT_MS });
    } else {
      info("[PY_GATEWAY] FETCH_FAILED", { traceId, error: err.message });
    }
    return null;
  }
}

// ===== Hard Write NLP Judge =====

const HARD_WRITE_NLP_TIMEOUT_MS = parseInt(process.env.HARD_WRITE_NLP_TIMEOUT_MS || "3000", 10);

/**
 * Judge hard write content via py_gateway NLP.
 * POST /hard_write/judge
 *
 * @param {object} opts
 * @param {string} opts.text - content after Gate0 strip (normalized)
 * @param {'remember'|'forget'} opts.mode - intent type
 * @param {string} [opts.traceId] - trace ID for logging
 * @param {number} [opts.timeoutMs] - timeout in ms (default from env)
 * @returns {Promise<{ form_ok: boolean, target: 'plan'|'profile'|'memory'|'block', confidence?: number, reason?: string[] } | null>}
 */
async function judgeHardWriteNlp({ text, mode, traceId, timeoutMs }) {
  if (!text || typeof text !== "string") {
    return null;
  }

  const url = `${PY_GATEWAY_URL}/hard_write/judge`;
  const body = JSON.stringify({
    text,
    mode: mode || "remember",
    traceId: traceId || null,
  });

  const timeout = timeoutMs || HARD_WRITE_NLP_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    debug("[PY_GATEWAY] HARD_WRITE_JUDGE_START", { traceId, url, textLen: text.length, mode });

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      signal: controller.signal,
    });

    if (!resp.ok) {
      info("[PY_GATEWAY] HARD_WRITE_JUDGE_ERROR", { traceId, status: resp.status, statusText: resp.statusText });
      return null;
    }

    const data = await resp.json();
    debug("[PY_GATEWAY] HARD_WRITE_JUDGE_OK", {
      traceId,
      form_ok: data?.form_ok,
      target: data?.target,
      confidence: data?.confidence,
    });

    // Validate response shape
    if (typeof data?.form_ok !== "boolean" || typeof data?.target !== "string") {
      info("[PY_GATEWAY] HARD_WRITE_JUDGE_INVALID_RESPONSE", { traceId, data });
      return null;
    }

    return {
      form_ok: data.form_ok,
      target: data.target,
      confidence: data.confidence ?? null,
      reason: Array.isArray(data.reason) ? data.reason : [],
      profile_anchor_hit: data.profile_anchor_hit === true,
      // V2: 新的统一 ops 格式
      ops: Array.isArray(data.ops) ? data.ops : null,
      // Legacy: 保留 profile_ops 向后兼容
      profile_ops: Array.isArray(data.profile_ops) ? data.profile_ops : null,
    };
  } catch (err) {
    if (err.name === "AbortError") {
      info("[PY_GATEWAY] HARD_WRITE_JUDGE_TIMEOUT", { traceId, timeoutMs: timeout });
    } else {
      info("[PY_GATEWAY] HARD_WRITE_JUDGE_FAILED", { traceId, error: err.message });
    }
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ===== Embed Qualify =====

const EMBED_QUALIFY_TIMEOUT_MS = parseInt(process.env.EMBED_QUALIFY_TIMEOUT_MS || "2000", 10);

/**
 * 判断消息是否值得做 embedding（通过 py_gateway NLP）
 * POST /embed/qualify
 *
 * @param {object} opts
 * @param {string} opts.text - message text
 * @param {string} [opts.role='user'] - 'user' | 'assistant'
 * @param {string} [opts.lang='zh'] - language code
 * @param {string} [opts.traceId] - trace ID for logging
 * @returns {Promise<{ should_embed: boolean, score: number, coherence: number, reason: string, features?: string[], penalties?: string[] } | null>}
 */
async function filterMessageNlp({ text, role = "user", lang = "zh", traceId }) {
  if (!text || typeof text !== "string") {
    return null;
  }

  const url = `${PY_GATEWAY_URL}/embed/qualify`;
  const body = JSON.stringify({
    text,
    role,
    lang,
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), EMBED_QUALIFY_TIMEOUT_MS);

  try {
    debug("[PY_GATEWAY] EMBED_QUALIFY_START", { traceId, url, textLen: text.length, role, lang });

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-trace-id": traceId || "",
      },
      body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!resp.ok) {
      info("[PY_GATEWAY] EMBED_QUALIFY_ERROR", { traceId, status: resp.status, statusText: resp.statusText });
      return null;
    }

    const data = await resp.json();
    debug("[PY_GATEWAY] EMBED_QUALIFY_OK", {
      traceId,
      should_embed: data?.should_embed,
      score: data?.score,
      reason: data?.reason,
    });

    return {
      should_embed: data.should_embed ?? true,  // 出错时保守处理
      score: data.score ?? 0,
      coherence: data.coherence ?? 0.5,
      reason: data.reason ?? "",
      sentence_type: data.sentence_type ?? null,
      elements: Array.isArray(data.elements) ? data.elements : [],
      features: Array.isArray(data.features) ? data.features : [],
      penalties: Array.isArray(data.penalties) ? data.penalties : [],
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      info("[PY_GATEWAY] EMBED_QUALIFY_TIMEOUT", { traceId, timeoutMs: EMBED_QUALIFY_TIMEOUT_MS });
    } else {
      info("[PY_GATEWAY] EMBED_QUALIFY_FAILED", { traceId, error: err.message });
    }
    return null;
  }
}

// ===== Emotion Analyze =====

const EMOTION_TIMEOUT_MS = parseInt(process.env.EMOTION_TIMEOUT_MS || "2000", 10);

/**
 * 调用本地 MacBERT 模型分析单句情绪
 * POST /emotion/analyze
 *
 * @param {object} opts
 * @param {string} opts.text - 待分析文本
 * @param {string} [opts.traceId] - trace ID for logging
 * @returns {Promise<{ emotion: string, confidence: number } | null>}
 */
async function analyzeEmotion({ text, traceId }) {
  if (!text || typeof text !== "string" || text.length < 2) {
    return null;
  }

  const url = `${PY_GATEWAY_URL}/emotion/analyze`;
  const body = JSON.stringify({ text, traceId: traceId || null });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), EMOTION_TIMEOUT_MS);

  try {
    debug("[PY_GATEWAY] EMOTION_START", { traceId, textLen: text.length });

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!resp.ok) {
      info("[PY_GATEWAY] EMOTION_ERROR", { traceId, status: resp.status });
      return null;
    }

    const data = await resp.json();
    debug("[PY_GATEWAY] EMOTION_OK", {
      traceId,
      emotion: data?.emotion,
      confidence: data?.confidence,
    });

    if (!data?.emotion) return null;

    return {
      emotion: data.emotion,
      label_zh: data.label_zh || null,
      confidence: data.confidence ?? 0,
      candidates: Array.isArray(data.candidates) ? data.candidates : [],
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      info("[PY_GATEWAY] EMOTION_TIMEOUT", { traceId, timeoutMs: EMOTION_TIMEOUT_MS });
    } else {
      info("[PY_GATEWAY] EMOTION_FAILED", { traceId, error: err.message });
    }
    return null;
  }
}

module.exports = { fetchPromiseCandidateFeatures, judgeHardWriteNlp, filterMessageNlp, analyzeEmotion };
