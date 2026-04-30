// src/services/weather/cache.cjs
//
// 天气缓存：每用户每天最多一条
// 同一 user + 同一 day_key → 最多请求一次天气 API

const { logDebug } = require("../../../lib/logger.cjs");

const META = { traceId: "WEATHER_CACHE" };

/**
 * getCachedWeather - 读取今日天气缓存
 * @param {object} db
 * @param {string} userId
 * @param {string} dayKey - YYYY-MM-DD
 * @returns {Promise<object | null>}
 */
async function getCachedWeather(db, userId, dayKey) {
  const row = await db.get(
    `SELECT city, district, location_id, weather_text, temp, feels_like,
            humidity, wind_speed, feeling_text, temp_min, temp_max,
            raw_json, fetched_at, source
     FROM weather_cache
     WHERE user_id = ? AND day_key = ?`,
    userId, dayKey
  );

  if (row) {
    logDebug(META, "cache hit", { userId, dayKey, city: row.city });
    // 映射 snake_case → camelCase 供 buildWeatherBlock 使用
    row.tempMin = row.temp_min;
    row.tempMax = row.temp_max;
  }

  return row || null;
}

/**
 * setCachedWeather - 写入天气缓存（UPSERT）
 * @param {object} db
 * @param {string} userId
 * @param {string} dayKey
 * @param {object} data
 */
async function setCachedWeather(db, userId, dayKey, data) {
  const now = Date.now();

  await db.run(
    `INSERT INTO weather_cache
       (user_id, day_key, city, district, location_id, weather_text,
        temp, feels_like, humidity, wind_speed, feeling_text,
        temp_min, temp_max, raw_json, fetched_at, source)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, day_key) DO UPDATE SET
       city = excluded.city,
       district = excluded.district,
       location_id = excluded.location_id,
       weather_text = excluded.weather_text,
       temp = excluded.temp,
       feels_like = excluded.feels_like,
       humidity = excluded.humidity,
       wind_speed = excluded.wind_speed,
       feeling_text = excluded.feeling_text,
       temp_min = excluded.temp_min,
       temp_max = excluded.temp_max,
       raw_json = excluded.raw_json,
       fetched_at = excluded.fetched_at,
       source = excluded.source`,
    userId,
    dayKey,
    data.city || "",
    data.district || "",
    data.locationId || "",
    data.weatherText || "",
    data.temp || "",
    data.feelsLike || "",
    data.humidity || "",
    data.windSpeed || "",
    data.feelingText || "",
    data.tempMin || "",
    data.tempMax || "",
    data.rawJson || "{}",
    now,
    data.source || "profile"
  );

  logDebug(META, "cache set", { userId, dayKey, city: data.city });
}

module.exports = { getCachedWeather, setCachedWeather };
