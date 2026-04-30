// src/services/listening_mode/detect.cjs
//
// 倾听模式进入检测
// 强信号：立即进入 listening
// 弱信号：触发观察窗口（复用 followup 的 low_mood 模式）

// ===== 强信号：用户明确表达强烈负面情绪 =====
const STRONG_PATTERNS = [
  /撑不住/,
  /受不了/,
  /快[要]?崩了/,
  /崩溃/,
  /好想哭/,
  /想哭/,
  /不想活/,
  /活不下去/,
  /太痛苦/,
  /真的不行了/,
  /扛不住/,
  /好绝望/,
  /没有意义/,
  /不知道[该怎]么办/,
  /快疯了/,
  /受够了/,
  /真的好累/,     // "真的" 加强语气
  /真的好难受/,
  /真的撑不下去/,
  /もう無理/,     // 日语：已经不行了
  /死にたい/,     // 日语：想死
  /つらい/,       // 日语：痛苦
  /辛い/,         // 日语：辛苦/痛苦
];

// ===== 弱信号：轻度负面（与 followup 的 low_mood 对齐） =====
const WEAK_PATTERNS = [
  /心情[不差很糟]/,
  /状态[不差很糟]/,
  /很难受/,
  /好难受/,
  /不[太开]?开心/,
  /不太想说话/,
  /不太想[聊说]/,
  /低落/,
  /心情不好/,
  /有点丧/,
  /好丧/,
  /有点烦/,
  /好烦/,
  /很烦/,
  /不开心/,
  /郁闷/,
  /难过/,
  /伤心/,
  /委屈/,
  /心里[很有不]?[太好]?舒服/,
  /感觉[很好有]?[点]?[糟差丧]/,
];

// ===== 排除：防误触 =====
const EXCLUDE_PATTERNS = [
  /笑/,
  /哈哈/,
  /开玩笑/,
  /不是说我/,
  /你[是会]不[是会]/,
  /游戏/,
  /角色/,
  /剧情/,
  /歌[词曲]/,
  /[看听读]了/,        // 在说别人的事/作品
  /你[累困难]不[累困难]/, // 在问对方
  /别[太]?[累困难]/,
  /不[累困忙]/,
  /没[有]?[累困忙]/,
  /还好/,
  /已经好[多了些]/,
  /好[多了些]了/,
  /没事了/,
  /好起来了/,
];

/**
 * detectStrongSignal - 检测强倾诉信号（应立即进入 listening）
 * @param {string} message
 * @returns {boolean}
 */
function detectStrongSignal(message) {
  /* — core logic omitted for preview — */
}

/**
 * detectWeakSignal - 检测弱负面信号（应启动观察窗口）
 * @param {string} message
 * @returns {boolean}
 */
function detectWeakSignal(message) {
  /* — core logic omitted for preview — */
}

module.exports = { detectStrongSignal, detectWeakSignal };
