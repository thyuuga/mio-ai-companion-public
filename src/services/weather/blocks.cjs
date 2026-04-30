// src/services/weather/blocks.cjs
//
// 天气 prompt block 构建（环境感受系统）
// 不输出原始数据，只输出自然描述 + 感受

/**
 * buildWeatherBlock - 构建天气环境感受 prompt block
 * @param {object} data - { city, district, weather_text, temp, tempMin, tempMax, feeling_text }
 * @returns {string} prompt block 或空字符串
 */
function buildWeatherBlock(data) {
  if (!data || !data.weather_text) return "";

  const { city, district, weather_text, temp, tempMin, tempMax, feeling_text } = data;

  // 地点显示
  const place = district || city || "";
  const placePrefix = place ? `今天${place}` : "你这边今天";

  // 温度范围（daily）
  const tempRange = (tempMin && tempMax) ? `，${tempMin}~${tempMax}°C` : "";

  // 当前温度（now）
  const currentTemp = temp ? `，现在${temp}°C` : "";

  // 感受
  const feeling = feeling_text ? `，感觉${feeling_text}` : "";

  return (
    "【用户所在地天气（你和用户在同一个地方）】\n" +
    `${placePrefix}${weather_text}${tempRange}${currentTemp}${feeling}。\n` +
    '这是你们共同所在地的天气。仅在用户主动提到天气或出门时自然引用；不要主动播报天气。不要反问"你那边呢"。'
  );
}

module.exports = { buildWeatherBlock };
