// src/domain/weather/weatherFeeling.cjs
//
// 天气 → 人类感受转换
// 不输出数值，只输出感受描述
// 优先级：体感温度 > 湿度 > 风
// 最多保留 1~2 个 feeling

/**
 * buildWeatherFeeling - 将天气数据转换为自然感受文本
 *
 * @param {{ feelsLike?: string, humidity?: string, windSpeed?: string }} weather
 * @returns {{ feelingText: string }}
 */
function buildWeatherFeeling(weather) {
  /* — core logic omitted for preview — */
}

module.exports = { buildWeatherFeeling };
