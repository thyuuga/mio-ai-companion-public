// src/services/listening_mode/store.cjs
//
// 倾听模式 DB 操作（sessions 表字段读写）

/**
 * getListeningState - 读取当前 session 的倾听模式状态
 */
async function getListeningState(db, sessionId) {
  /* — core logic omitted for preview — */
}

/**
 * enterListeningMode - 进入倾听模式
 */
async function enterListeningMode(db, sessionId) {
  /* — core logic omitted for preview — */
}

/**
 * exitListeningMode - 退出倾听模式
 */
async function exitListeningMode(db, sessionId) {
  /* — core logic omitted for preview — */
}

/**
 * startPending - 开始观察窗口（弱信号触发）
 * pending_streak 初始为 1（首条弱信号消息算第一次命中）
 */
async function startPending(db, sessionId) {
  /* — core logic omitted for preview — */
}

/**
 * updatePending - 更新观察窗口
 * @param {boolean} isNegative - 当前消息是否为负面
 * @returns {{ shouldEnter: boolean, expired: boolean }}
 */
async function updatePending(db, sessionId, isNegative) {
  /* — core logic omitted for preview — */
}

/**
 * cancelPending - 取消观察窗口
 */
async function cancelPending(db, sessionId) {
  /* — core logic omitted for preview — */
}

/**
 * incrementListeningTurn - 增加用户消息计数
 * @returns {number} 新的 turn_count
 */
async function incrementListeningTurn(db, sessionId) {
  /* — core logic omitted for preview — */
}

module.exports = {
  getListeningState,
  enterListeningMode,
  exitListeningMode,
  startPending,
  updatePending,
  cancelPending,
  incrementListeningTurn,
};
