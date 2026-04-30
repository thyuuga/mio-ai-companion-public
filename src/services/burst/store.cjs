// src/services/burst/store.cjs
//
// 内存级 burst pending 状态管理
// 不持久化 — 服务重启丢失 pending burst 可接受

const BURST_TTL_MS = 15_000; // 15 秒过期

/** @type {Map<string, { text: string, burstType: string, primaryMsgId: string, createdAt: number }>} */
const _store = new Map();

/**
 * burst 生成完毕后存入，供前端 poll 取用
 */
function setBurstReady(sessionId, { text, burstType, primaryMsgId }) {
  /* — core logic omitted for preview — */
}

/**
 * 前端 poll 时调用，取出 burst 数据（一次性消费）
 * @returns {{ text: string, burstType: string, primaryMsgId: string } | null}
 */
function consumeBurst(sessionId) {
  /* — core logic omitted for preview — */
}

/**
 * 取消 pending burst（用户发了新消息 / 生成失败）
 */
function cancelBurst(sessionId) {
  /* — core logic omitted for preview — */
}

module.exports = { setBurstReady, consumeBurst, cancelBurst };
