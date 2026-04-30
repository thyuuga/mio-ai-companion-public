// src/services/weather/qweather_client.cjs
//
// QWeather (和风天气) API v7 客户端
// - lookupCity: 城市名 → locationId
// - lookupCityByCoords: 经纬度 → locationId + 城市信息
// - fetchDailyForecast: locationId → 今日天气预报
//
// 遵守 QWeather 规则：GeoAPI 结果不做持久缓存

const { logDebug, logError } = require("../../../lib/logger.cjs");

const QWEATHER_API_KEY = process.env.QWEATHER_API_KEY || "";
const RAW_HOST = process.env.QWEATHER_API_HOST || "";
const TIMEOUT_MS = 8_000;

// 去掉 scheme（用户可能写 https://devapi.qweather.com）
const QWEATHER_API_HOST = RAW_HOST.replace(/^https?:\/\//, "");

// 旧版共享域名用 key= 查询参数认证；新版专属域名用 X-QW-Api-Key header
const IS_LEGACY_HOST = /^(dev)?api\.qweather\.com$/i.test(QWEATHER_API_HOST);

function isConfigured() {
  if (!QWEATHER_API_KEY || !QWEATHER_API_HOST) return false;
  if (QWEATHER_API_KEY.startsWith("your_") || QWEATHER_API_HOST.startsWith("your_")) return false;
  return true;
}

/**
 * 内部 fetch 封装：带超时，自动区分新旧认证
 * - 旧版 (devapi/api.qweather.com): key= 查询参数
 * - 新版 (*.qweatherapi.com): X-QW-Api-Key header
 */
async function qFetch(urlPath, params = {}) {
  if (!isConfigured()) return null;

  if (IS_LEGACY_HOST) {
    params = { ...params, key: QWEATHER_API_KEY };
  }

  const qs = new URLSearchParams(params).toString();
  const url = `https://${QWEATHER_API_HOST}${urlPath}${qs ? "?" + qs : ""}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const headers = {};
    if (!IS_LEGACY_HOST) {
      headers["X-QW-Api-Key"] = QWEATHER_API_KEY;
    }

    const res = await fetch(url, {
      headers,
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      logError({ traceId: "QWEATHER" }, `HTTP ${res.status}`, { url: urlPath });
      return null;
    }

    const json = await res.json();

    // QWeather 返回 code "200" 表示成功
    if (json.code !== "200") {
      logError({ traceId: "QWEATHER" }, `API code ${json.code}`, { url: urlPath });
      return null;
    }

    return json;
  } catch (e) {
    clearTimeout(timer);
    if (e.name === "AbortError") {
      logError({ traceId: "QWEATHER" }, "timeout", { url: urlPath });
    } else {
      logError({ traceId: "QWEATHER" }, "fetch error", e);
    }
    return null;
  }
}

/**
 * lookupCity - 按城市名搜索 QWeather locationId
 * @param {string} cityName - 城市名（如 "济南"、"上海"）
 * @returns {Promise<{ locationId: string, city: string, district: string, lat: string, lon: string } | null>}
 */
async function lookupCity(cityName) {
  if (!cityName) return null;

  const json = await qFetch("/geo/v2/city/lookup", {
    location: cityName,
    lang: "zh",
    number: "1",
  });

  if (!json?.location?.length) return null;

  const loc = json.location[0];
  logDebug({ traceId: "QWEATHER" }, "[GEO] city lookup", {
    query: cityName,
    id: loc.id,
    name: loc.name,
    adm2: loc.adm2,
  });

  return {
    locationId: loc.id,
    city: loc.adm2 || loc.name,
    district: loc.name !== loc.adm2 ? loc.name : "",
    lat: loc.lat,
    lon: loc.lon,
  };
}

/**
 * lookupCityByCoords - 按经纬度反查城市
 * @param {number} lon - 经度
 * @param {number} lat - 纬度
 * @returns {Promise<{ locationId: string, city: string, district: string, lat: string, lon: string } | null>}
 */
async function lookupCityByCoords(lon, lat) {
  if (lon == null || lat == null) return null;

  // QWeather GeoAPI 接受 "经度,纬度" 格式，最多2位小数
  const coordStr = `${Number(lon).toFixed(2)},${Number(lat).toFixed(2)}`;

  const json = await qFetch("/geo/v2/city/lookup", {
    location: coordStr,
    lang: "zh",
    number: "1",
  });

  if (!json?.location?.length) return null;

  const loc = json.location[0];
  logDebug({ traceId: "QWEATHER" }, "[GEO] coords lookup", {
    coords: coordStr,
    id: loc.id,
    name: loc.name,
    adm2: loc.adm2,
  });

  return {
    locationId: loc.id,
    city: loc.adm2 || loc.name,
    district: loc.name !== loc.adm2 ? loc.name : "",
    lat: loc.lat,
    lon: loc.lon,
  };
}

/**
 * fetchWeatherNow - 获取实时天气
 * @param {string} locationId - QWeather location ID 或 "经度,纬度" 坐标
 * @returns {Promise<{ text: string, temp: string, feelsLike: string, humidity: string, windSpeed: string, raw: object } | null>}
 */
async function fetchWeatherNow(locationId) {
  if (!locationId) return null;

  const json = await qFetch("/v7/weather/now", {
    location: locationId,
    lang: "zh",
    unit: "m",
  });

  if (!json?.now) return null;

  const now = json.now;
  logDebug({ traceId: "QWEATHER" }, "[WEATHER] now fetched", {
    locationId,
    text: now.text,
    temp: now.temp,
    feelsLike: now.feelsLike,
  });

  return {
    text: now.text,
    temp: now.temp,
    feelsLike: now.feelsLike,
    humidity: now.humidity,
    windSpeed: now.windSpeed,
    raw: now,
  };
}

/**
 * fetchWeatherDaily - 获取3天预报（取今日 min/max）
 * @param {string} locationId
 * @returns {Promise<{ tempMin: string, tempMax: string, textDay: string } | null>}
 */
async function fetchWeatherDaily(locationId) {
  if (!locationId) return null;

  const json = await qFetch("/v7/weather/3d", {
    location: locationId,
    lang: "zh",
    unit: "m",
  });

  if (!json?.daily?.length) return null;

  const today = json.daily[0];
  logDebug({ traceId: "QWEATHER" }, "[WEATHER] daily fetched", {
    locationId,
    textDay: today.textDay,
    tempMin: today.tempMin,
    tempMax: today.tempMax,
  });

  return {
    tempMin: today.tempMin,
    tempMax: today.tempMax,
    textDay: today.textDay,
  };
}

module.exports = {
  isConfigured,
  lookupCity,
  lookupCityByCoords,
  fetchWeatherNow,
  fetchWeatherDaily,
};
