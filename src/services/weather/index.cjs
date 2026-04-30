// src/services/weather/index.cjs
//
// 天气服务入口
// - resolveUserLocation: 从 profile 或 geolocation 获取用户位置
// - getOrFetchWeatherBlock: 主入口 → 缓存 → 拉取 → feeling 转换 → 构建 block

const { logDebug, logError } = require("../../../lib/logger.cjs");
const { getProfile } = require("../profile/repo.cjs");
const { isConfigured, lookupCity, fetchWeatherNow, fetchWeatherDaily } = require("./qweather_client.cjs");
const { getCachedWeather, setCachedWeather } = require("./cache.cjs");
const { buildWeatherBlock } = require("./blocks.cjs");
const { buildWeatherFeeling } = require("../../domain/weather/weatherFeeling.cjs");

const META = { traceId: "WEATHER" };

/**
 * resolveUserLocation - 按优先级解析用户位置
 *
 * 优先级：
 *   1. user_profile.residence → lookupCity 获取 locationId
 *   2. user_geolocation 表（前端 geolocation 坐标 / GeoAPI 反查结果）
 *   3. 都没有 → null
 *
 * @param {object} db
 * @param {string} userId
 * @returns {Promise<{ locationId: string, city: string, district: string, source: string } | null>}
 */
async function resolveUserLocation(db, userId) {
  // 1. 优先：user_geolocation 表（前端浏览器坐标，实时性最高）
  try {
    const geoRow = await db.get(
      `SELECT city, district, location_id, lat, lon FROM user_geolocation WHERE user_id = ?`,
      userId
    );
    if (geoRow) {
      const locId = geoRow.location_id || (
        geoRow.lon != null && geoRow.lat != null
          ? `${Number(geoRow.lon).toFixed(2)},${Number(geoRow.lat).toFixed(2)}`
          : ""
      );
      if (locId) {
        return {
          locationId: locId,
          city: geoRow.city || "",
          district: geoRow.district || "",
          source: "geolocation",
        };
      }
    }
  } catch (e) {
    logError(META, "geolocation lookup failed", e);
  }

  // 2. Fallback：user_profile.residence
  try {
    const profile = await getProfile(db, { userId });
    if (profile?.residence) {
      const cityName = extractCityFromResidence(profile.residence);
      if (cityName) {
        const geo = await lookupCity(cityName);
        if (geo) {
          return {
            locationId: geo.locationId,
            city: geo.city,
            district: geo.district,
            source: "profile",
          };
        }
      }
    }
  } catch (e) {
    logError(META, "profile location resolve failed", e);
  }

  return null;
}

/**
 * extractCityFromResidence - 从 residence 字段提取城市名
 */
function extractCityFromResidence(residence) {
  if (!residence) return null;
  const s = residence.trim();
  if (!s) return null;

  const shiIdx = s.indexOf("市");
  if (shiIdx > 0) {
    const provinceEnds = ["省", "自治区"];
    let start = 0;
    for (const suffix of provinceEnds) {
      const idx = s.indexOf(suffix);
      if (idx > 0 && idx < shiIdx) {
        start = idx + suffix.length;
        break;
      }
    }
    return s.slice(start, shiIdx) || s;
  }

  return s;
}

/**
 * getOrFetchWeatherBlock - 天气服务主入口
 *
 * 流程：
 *   1. 检查 QWeather 是否配置
 *   2. 检查今日缓存 → 有则直接构建 block
 *   3. 解析用户位置
 *   4. 调用 QWeather 实时天气
 *   5. 生成环境感受 (feelingText)
 *   6. 写入缓存
 *   7. 构建并返回 block
 *
 * @param {object} db
 * @param {string} userId
 * @param {string} dayKey - YYYY-MM-DD
 * @returns {Promise<string>} weather prompt block 或空字符串
 */
async function getOrFetchWeatherBlock(db, userId, dayKey) {
  if (!isConfigured()) {
    logDebug(META, "QWeather not configured, skipping");
    return "";
  }

  // 1. 检查缓存
  const cached = await getCachedWeather(db, userId, dayKey);
  if (cached && cached.weather_text) {
    logDebug(META, "using cached weather", { city: cached.city, dayKey });
    return buildWeatherBlock(cached);
  }

  // 2. 解析位置
  const location = await resolveUserLocation(db, userId);
  if (!location) {
    logDebug(META, "no location available, skipping weather");
    return "";
  }

  // 3. 并行获取实时天气 + 每日预报
  const [now, daily] = await Promise.all([
    fetchWeatherNow(location.locationId),
    fetchWeatherDaily(location.locationId),
  ]);

  if (!now && !daily) {
    logDebug(META, "weather fetch failed (both now & daily), skipping");
    return "";
  }

  // 4. 合并数据
  const merged = {
    temp: now?.temp,
    feelsLike: now?.feelsLike,
    humidity: now?.humidity,
    windSpeed: now?.windSpeed,
    tempMin: daily?.tempMin,
    tempMax: daily?.tempMax,
    weather_text: now?.text || daily?.textDay,
  };

  // 5. 生成环境感受
  const { feelingText } = buildWeatherFeeling(merged);
  merged.feeling_text = feelingText;

  // 6. 写入缓存
  await setCachedWeather(db, userId, dayKey, {
    city: location.city,
    district: location.district,
    locationId: location.locationId,
    weatherText: merged.weather_text,
    temp: merged.temp,
    feelsLike: now?.feelsLike,
    humidity: now?.humidity,
    windSpeed: now?.windSpeed,
    tempMin: merged.tempMin,
    tempMax: merged.tempMax,
    feelingText,
    rawJson: JSON.stringify(now?.raw || {}),
    source: location.source,
  });

  // 7. 构建 block
  return buildWeatherBlock({
    city: location.city,
    district: location.district,
    ...merged,
  });
}

module.exports = {
  getOrFetchWeatherBlock,
  resolveUserLocation,
  buildWeatherBlock,
  extractCityFromResidence,
};
