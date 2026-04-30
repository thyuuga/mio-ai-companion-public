// src/utils/events.cjs
const crypto = require("crypto");
const { dayKeyToLocalEndMs } = require("./timezone.cjs");

function eventKeyHash(userId, dueDayKey, title, certainty) {
  const raw = `${userId}|${dueDayKey}|${title}|${certainty}`;
  return crypto.createHash("sha256").update(raw, "utf8").digest("hex");
}

function computeExpiresAt(tz, dueDayKey, extraDays = 2) {
  const [year, month, day] = dueDayKey.split("-").map(Number);
  const baseUtcMs = Date.UTC(year, month - 1, day, 12, 0, 0, 0);
  const newUtcMs = baseUtcMs + extraDays * 24 * 60 * 60 * 1000;

  const newDate = new Date(newUtcMs);
  const newDayKey =
    `${newDate.getUTCFullYear()}-${String(newDate.getUTCMonth() + 1).padStart(2, "0")}-${String(newDate.getUTCDate()).padStart(2, "0")}`;

  return dayKeyToLocalEndMs(tz, newDayKey);
}

module.exports = { eventKeyHash, computeExpiresAt };
