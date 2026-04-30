// src/services/planned_events/upsert_from_message.cjs
const { randomUUID } = require("crypto");
const { detectPlannedEvent } = require("./detect.cjs");
const { normalizeTitleNorm } = require("./title_norm.cjs");
const { eventKeyHash, computeExpiresAt } = require("../../utils/events.cjs");
const { upsertActivePlannedEvent } = require("../../repositories/planned_events.repo.cjs");
const { emitPlanAnchor } = require("../anchors/emit_anchor.cjs");
const { logError } = require("../../../lib/logger.cjs");

/**
 * upsertPlannedEventFromMessage - 从用户消息中检测并 upsert planned_event
 *
 * @param {object} db
 * @param {{ userId: string, sessionId: string, message: string, userMsgId: string, tz: string, now: number }} opts
 * @returns {Promise<{ action: 'inserted'|'merged', id: string, certainty: number, title: string, titleNorm: string, dueDayKey: string } | null>}
 */
async function upsertPlannedEventFromMessage(db, { userId, sessionId, message, userMsgId, tz, now }) {
  /* — core logic omitted for preview — */
}

module.exports = { upsertPlannedEventFromMessage };
