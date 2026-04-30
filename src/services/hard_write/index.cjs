// src/services/hard_write/index.cjs
//
// Hard Write 主入口
//
// 显式授权的硬写入：只处理"记住/请记住/不要忘/别忘/忘了/别记/不要记"指令
// 以及 "清空/删除/移除" scope 操作（likes/ng/all）
//
// Non-goals:
//   - 不调用 LLM 判断"是否写入"
//   - 不处理软记忆（那是 candidates 的事）
//   - 不处理 planned_events（那是 upsertPlannedEventFromMessage 的事）
//
// NLP 可插拔（HARD_WRITE_NLP=1 时启用）：
//   - Gate0 命中后，强制优先调用 Python /hard_write/judge
//   - NLP 返回 { form_ok, target, ops, profile_ops }
//   - V2 ops: 统一格式 [{target, field, op, value/items/patch}, ...]
//   - NLP 超时/失败时：必须 degrade（stopPipeline=true），禁止 local_fallback 写 memory
//
// v4 重构：
//   - 移除 Gate0.5（profile KV 识别），统一由 Python NLP 处理
//   - 使用 V2 ops 格式，支持 set/clear/add/remove/merge 操作
//   - 保留 profile_ops 向后兼容（仅 likes/ng add）
//
// v3:
//   - 支持 scope 清空（忘记我的喜好/清空雷点等）
//   - NLP=1 时禁止 local_fallback 决策 target

const { logInfo, logDebug } = require("../../../lib/logger.cjs");

const { detectExplicitHardWriteIntent } = require("./detect_explicit_intent.cjs");
const { isFormallyMemorable, hitNonStorableBlocklist, dispatchHardWriteTarget } = require("./gates.cjs");
const { normalizeMemoryContent, computeContentHash, findMemoryByHash, insertHardMemory } = require("./repo.cjs");
const { judgeHardWriteNlp } = require("../clients/py_gateway_client.cjs");

// Profile repo functions
const {
  ensureProfileRow,
  clearProfileByScope,
  setField,
  clearField,
  addNickname,
  removeNickname,
  addToJsonArrayField,
  removeFromJsonArrayField,
  mergeJsonObjectField,
} = require("../profile/repo.cjs");

// ===== 环境变量 =====
const HARD_WRITE_NLP_ENABLED = process.env.HARD_WRITE_NLP === "1";

// ===== Profile 写入工具函数 =====

// 字段名到数据库字段的映射
const FIELD_MAP = {
  likes: "likes_json",
  ng: "ng_json",
  nicknames: "nicknames_json",
};

// KV 字段到友好名称的映射（用于生成回复）
const FIELD_LABEL_MAP = {
  name: "名字",
  addressing_name: "称呼",
  birthday_ymd: "生日",
  hometown: "故乡",
  residence: "居住地",
  occupation: "职业",
  preferred_language: "语言偏好",
  nicknames: "昵称",
  likes: "喜好",
  ng: "雷点",
  family: "家庭情况",
};

/**
 * applyOpsToDb - 将 V2 ops 写入数据库
 *
 * @param {object} db
 * @param {string} userId
 * @param {Array} ops - V2 ops 数组
 *   [{target:'profile', field:'name', op:'set', value:'小明'}, ...]
 * @param {number} nowMs
 * @param {object} meta - 日志用
 * @returns {Promise<{ applied: Array<{field:string, op:string, success:boolean}>, stats: object }>}
 */
async function applyOpsToDb(db, userId, ops, nowMs, meta) {
  const applied = [];
  const stats = {
    setCount: 0,
    clearCount: 0,
    addCount: 0,
    removeCount: 0,
    mergeCount: 0,
    fieldsAffected: new Set(),
  };

  if (!Array.isArray(ops)) {
    return { applied, stats };
  }

  // 确保 profile 行存在
  await ensureProfileRow(db, { userId, nowMs });

  for (const opItem of ops) {
    // 只处理 target=profile
    if (opItem.target !== "profile") continue;

    const { field, op, value, items, patch } = opItem;
    if (!field || !op) continue;

    let success = false;

    try {
      // KV 字段 set
      if (op === "set" && value != null) {
        // 特殊处理 nicknames（使用 addNickname）
        if (field === "nicknames") {
          const r = await addNickname(db, { userId, nickname: value, nowMs });
          success = r.ok;
        } else {
          const r = await setField(db, { userId, field, value, nowMs });
          success = r.ok;
        }
        if (success) stats.setCount++;
      }

      // KV 字段 clear
      else if (op === "clear") {
        // 特殊处理 birthday（映射到 birthday_ymd）
        const actualField = field === "birthday" ? "birthday_ymd" : field;

        if (actualField === "nicknames") {
          // 清空 nicknames 需要用 removeFromJsonArrayField 或直接更新
          await db.run(
            `UPDATE user_profile SET nicknames_json = '[]', updated_at = ? WHERE user_id = ?`,
            nowMs, userId
          );
          success = true;
        } else if (actualField === "likes" || actualField === "ng") {
          // 清空 likes/ng
          const scope = actualField === "likes" ? "likes" : "ng";
          await clearProfileByScope(db, { userId, scope, nowMs });
          success = true;
        } else {
          const r = await clearField(db, { userId, field: actualField, nowMs });
          success = r.ok;
        }
        if (success) stats.clearCount++;
      }

      // 数组字段 add
      else if (op === "add" && Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          if (!item || typeof item !== "string") continue;

          if (field === "nicknames") {
            const r = await addNickname(db, { userId, nickname: item, nowMs });
            if (r.added) stats.addCount++;
          } else {
            const dbField = FIELD_MAP[field];
            if (dbField) {
              const r = await addToJsonArrayField(db, {
                userId,
                field: dbField,
                value: item,
                nowMs,
                limit: 50,
              });
              if (r.added) stats.addCount++;
            }
          }
        }
        success = true;
      }

      // 数组字段 remove
      else if (op === "remove" && Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          if (!item || typeof item !== "string") continue;

          if (field === "nicknames") {
            const r = await removeNickname(db, { userId, nickname: item, nowMs });
            if (r.removed) stats.removeCount++;
          } else {
            const dbField = FIELD_MAP[field];
            if (dbField) {
              const r = await removeFromJsonArrayField(db, {
                userId,
                field: dbField,
                value: item,
                nowMs,
              });
              if (r.removed) stats.removeCount++;
            }
          }
        }
        success = true;
      }

      // 数组字段 clear_all（清空整个数组）
      else if (op === "clear_all") {
        if (field === "nicknames") {
          await db.run(
            `UPDATE user_profile SET nicknames_json = '[]', updated_at = ? WHERE user_id = ?`,
            nowMs, userId
          );
          success = true;
        } else if (field === "likes") {
          await clearProfileByScope(db, { userId, scope: "likes", nowMs });
          success = true;
        } else if (field === "ng") {
          await clearProfileByScope(db, { userId, scope: "ng", nowMs });
          success = true;
        }
        if (success) stats.clearCount++;
      }

      // JSON 对象字段 merge（family）
      else if (op === "merge" && patch && typeof patch === "object") {
        const dbField = field === "family" ? "family_json" : null;
        if (dbField) {
          const r = await mergeJsonObjectField(db, { userId, field: dbField, patch, nowMs });
          success = r.ok;
          if (success) stats.mergeCount++;
        }
      }

      if (success) {
        stats.fieldsAffected.add(field);
      }

      applied.push({ field, op, success });
    } catch (e) {
      logInfo(meta, "[HARD_WRITE] applyOpsToDb op failed", { field, op, error: e.message });
      applied.push({ field, op, success: false });
    }
  }

  return { applied, stats };
}

/**
 * applyProfileOpsToDb - Legacy: 将 profile_ops 写入数据库（仅 likes/ng add）
 * 保留兼容性，内部转换为 V2 ops 格式
 */
async function applyProfileOpsToDb(db, userId, ops, nowMs) {
  let likesAdded = 0;
  let ngsAdded = 0;
  let likesTried = 0;
  let ngsTried = 0;

  if (!Array.isArray(ops)) {
    return { likesAdded, ngsAdded, likesTried, ngsTried };
  }

  for (const op of ops) {
    if (op.op !== "add" || !Array.isArray(op.items)) continue;

    const field = op.field === "likes" ? "likes_json" : op.field === "ng" ? "ng_json" : null;
    if (!field) continue;

    for (const item of op.items) {
      if (!item || typeof item !== "string" || item.length < 1) continue;

      if (op.field === "likes") likesTried++;
      else if (op.field === "ng") ngsTried++;

      const r = await addToJsonArrayField(db, {
        userId,
        field,
        value: item,
        nowMs,
        limit: 50,
      });

      if (r?.added) {
        if (op.field === "likes") likesAdded++;
        else if (op.field === "ng") ngsAdded++;
      }
    }
  }

  return { likesAdded, ngsAdded, likesTried, ngsTried };
}

/**
 * buildOpsWriteReply - 根据 V2 ops 写入结果生成回复
 *
 * @param {{ applied: Array, stats: object }} result
 * @param {'remember' | 'forget'} mode
 * @returns {string | null}
 */
function buildOpsWriteReply(result, mode) {
  const { stats } = result;
  const fields = Array.from(stats.fieldsAffected);

  // 没有任何字段被影响，返回 null（禁止假成功）
  if (fields.length === 0) {
    return null;
  }

  // forget 模式
  if (mode === "forget") {
    if (fields.length === 1) {
      const label = FIELD_LABEL_MAP[fields[0]] || fields[0];
      return `好，我不再记你的${label}了。`;
    }
    return "好，我把这些信息忘掉了。";
  }

  // remember 模式
  // 单字段时提供详细回复
  if (fields.length === 1) {
    const field = fields[0];
    const label = FIELD_LABEL_MAP[field] || field;

    // 特殊字段回复
    if (field === "likes") {
      return "好，我记住了你喜欢这些。";
    } else if (field === "ng") {
      return "好，我记住了这些是你的雷点。";
    } else if (field === "addressing_name") {
      return "好，以后我就这样叫你。";
    } else if (field === "nicknames") {
      return "好，我记下了你的昵称。";
    } else if (field === "family") {
      return "好，我记住了你的家庭情况。";
    }

    // 其他 KV 字段
    return `好，我记住了你的${label}。`;
  }

  // 多字段时生成组合回复
  const hasLikes = fields.includes("likes");
  const hasNg = fields.includes("ng");
  const otherFields = fields.filter(f => f !== "likes" && f !== "ng");

  if (hasLikes && hasNg && otherFields.length === 0) {
    return "好，我记住了你的喜好和雷点。";
  }

  if (otherFields.length > 0) {
    const labels = otherFields.map(f => FIELD_LABEL_MAP[f] || f);
    let reply = `好，我记住了你的${labels.join("、")}`;

    if (hasLikes || hasNg) {
      if (hasLikes && hasNg) {
        reply += "，以及喜好和雷点";
      } else if (hasLikes) {
        reply += "，以及喜好";
      } else {
        reply += "，以及雷点";
      }
    }

    return reply + "。";
  }

  return "好，我记住了。";
}

/**
 * buildProfileWriteReply - Legacy: 根据写入结果生成回复
 * 仅当 likesAdded/ngsAdded > 0 时返回"我记住了..."
 * 如果 added == 0 返回 null（禁止假成功）
 *
 * @param {{ likesAdded: number, ngsAdded: number }} writeResult
 * @returns {string | null}
 */
function buildProfileWriteReply(writeResult) {
  const { likesAdded, ngsAdded } = writeResult;

  if (likesAdded > 0 && ngsAdded > 0) {
    return "好，我记住了你的喜好和雷点。";
  } else if (likesAdded > 0) {
    return "好，我记住了你喜欢这些。";
  } else if (ngsAdded > 0) {
    return "好，我记住了这些是你的雷点。";
  }

  // added == 0，禁止返回假成功
  return null;
}

/**
 * judgeByLocalGates - 使用本地规则判定
 *
 * @param {string} content - 去掉指令词后的内容
 * @returns {{ form_ok: boolean, target: 'plan'|'profile'|'memory'|'block' }}
 */
function judgeByLocalGates(content) {
  // Gate 1.5: 是否命中不可存储黑名单（优先检查）
  if (hitNonStorableBlocklist(content)) {
    return { form_ok: true, target: "block" };
  }

  // Gate 1: 形式上是否可记忆
  if (!isFormallyMemorable(content)) {
    return { form_ok: false, target: "memory" };
  }

  // Gate 2: 分发目标
  return { form_ok: true, target: dispatchHardWriteTarget(content) };
}

/**
 * maybeHandleHardWrite - 尝试处理硬写入
 *
 * 流程（v2 简化）：
 *   Gate 0: detectExplicitHardWriteIntent → 未命中则 return null
 *   强制优先调用 Python judge（NLP 启用时）
 *   Final Decision:
 *     - target=block: handled=true, stopPipeline=false
 *     - target=plan: handled=true, stopPipeline=false（让 planned_events 处理）
 *     - target=profile:
 *       - 有 profile_ops 且写入成功: stopPipeline=true
 *       - 无 profile_ops: stopPipeline=false（让消息继续，避免假"记住了"）
 *     - target=memory:
 *       - mode=forget: stopPipeline=true + 轻回应（v1 不删除）
 *       - mode=remember + form_ok=true: 写入 memories，stopPipeline=true
 *       - mode=remember + form_ok=false: handled=true, stopPipeline=false
 *
 * @param {object} params
 * @param {object} params.db
 * @param {string} params.userId
 * @param {string} params.sessionId
 * @param {string} params.message
 * @param {number} params.nowMs
 * @param {object} params.flags
 * @param {string} params.userMsgId
 * @param {string} params.traceId
 * @returns {Promise<null | { handled: boolean, stopPipeline: boolean, reply?: string }>}
 */
async function maybeHandleHardWrite({ db, userId, sessionId, message, nowMs, flags, userMsgId, traceId }) {
  const meta = { traceId, userId };

  // Gate 0: 检测显式意图（Node deterministic，必须命中才进入 HardWrite）
  const intent = detectExplicitHardWriteIntent(message);
  if (!intent) {
    return null;
  }

  const originalText = intent.original;
  const content = normalizeMemoryContent(intent.content);
  const mode = intent.type; // 'remember' | 'forget'
  const scope = intent.scope ?? null; // 'likes' | 'ng' | 'all' | null

  logInfo(meta, "[HARD_WRITE] intent detected", {
    type: intent.type,
    contentLen: intent.content?.length,
    scope,
    original40: originalText?.slice(0, 40),
  });

  // ===== 0) Scope 清空抢占：forget + scope 命中时，直接清空 profile =====
  if (mode === "forget" && scope) {
    try {
      await ensureProfileRow(db, { userId, nowMs });
      const clearResult = await clearProfileByScope(db, { userId, scope, nowMs });

      const replyMap = {
        likes: "好，我已经清空了你的喜好记录。",
        ng: "好，我已经清空了你的雷点记录。",
        all: "好，我已经清空了你的喜好和雷点记录。",
      };

      logInfo(meta, "[HARD_WRITE] scope clear complete", {
        scope,
        likesCleared: clearResult.likesCleared,
        ngsCleared: clearResult.ngsCleared,
      });

      return {
        handled: true,
        stopPipeline: true,
        reply: replyMap[scope] || "好，我已经清空了。",
        likesCount: 0,
        ngsCount: 0,
        memoriesAdded: 0,
      };
    } catch (e) {
      logInfo(meta, "[HARD_WRITE] scope clear failed", { scope, error: e.message });
      return {
        handled: true,
        stopPipeline: true,
        reply: "清空操作失败了，请稍后再试。",
      };
    }
  }

  // ===== Gate0.5 已移除 =====
  // V2: 所有 profile 解析统一由 Python /hard_write/judge 处理
  // Python 返回 ops 数组，Node 执行写入

  // ===== 强制优先调用 Python judge =====
  let judge = null;
  let source = "python";

  if (HARD_WRITE_NLP_ENABLED) {
    judge = await judgeHardWriteNlp({ text: content, mode, traceId });

    // 止血核心：Python judge 失败时不 fallback 到 local，直接降级返回
    // 禁止 local_fallback 写 memory（防止 profile 内容误入 memories）
    if (!judge) {
      logInfo(meta, "[HARD_WRITE] python judge failed, degrade", {
        content40: content?.slice(0, 40),
      });
      return {
        handled: true,
        stopPipeline: true,
        reply: "我这边记忆服务刚刚超时了，这条没能写入。你稍后再发一次「记住…」，我再帮你保存。",
      };
    }
  }

  // 仅当 NLP 未启用时，才用 local gates
  if (!judge) {
    source = "local";
    judge = judgeByLocalGates(content);
  }

  // 日志：judge 结果
  logInfo(meta, "[HARD_WRITE] judge", {
    source,
    mode,
    target: judge.target,
    form_ok: judge.form_ok,
    conf: judge.confidence ?? null,
    reason: judge.reason ?? null,
    // V2: 使用 ops 而非 profile_ops
    hasOps: !!(judge.ops?.length),
    opsCount: judge.ops?.length ?? 0,
    content40: content?.slice(0, 40),
  });

  // ===== 最终裁决 =====
  const { form_ok, target, ops } = judge;
  // Legacy 兼容
  const profile_ops = judge.profile_ops;

  // 1) target=block => 不写库，不 early-return
  if (target === "block") {
    logDebug(meta, "[HARD_WRITE] blocked", { content20: content?.slice(0, 20) });
    return {
      handled: true,
      stopPipeline: false,
      reply: null,
    };
  }

  // 2) target=plan => 不写 memories，让 planned_events 后续处理
  if (target === "plan") {
    logInfo(meta, "[HARD_WRITE] target=plan, deferring to planned_events", {
      content40: content?.slice(0, 40),
    });
    return {
      handled: true,
      stopPipeline: false,
      reply: null,
    };
  }

  // 3) target=profile => 尝试写入 profile
  if (target === "profile") {
    // V2: 优先使用 ops
    if (ops?.length > 0) {
      // 使用 V2 applyOpsToDb
      const writeResult = await applyOpsToDb(db, userId, ops, nowMs, meta);

      logInfo(meta, "[HARD_WRITE] profile write complete (V2)", {
        source: "python_ops",
        opsApplied: writeResult.applied.length,
        setCount: writeResult.stats.setCount,
        clearCount: writeResult.stats.clearCount,
        addCount: writeResult.stats.addCount,
        removeCount: writeResult.stats.removeCount,
        mergeCount: writeResult.stats.mergeCount,
        fieldsAffected: Array.from(writeResult.stats.fieldsAffected),
        target: "user_profile",
      });

      // 生成回复（基于真实写入结果）
      const reply = buildOpsWriteReply(writeResult, mode);

      // 如果 reply 为 null（没有字段被影响），不 stopPipeline
      if (reply === null) {
        logInfo(meta, "[HARD_WRITE] profile write affected 0 fields, not stopping pipeline", {
          opsCount: ops.length,
        });
        return {
          handled: true,
          stopPipeline: false,
          reply: null,
        };
      }

      return {
        handled: true,
        stopPipeline: true,
        reply,
        fieldsAffected: Array.from(writeResult.stats.fieldsAffected),
      };
    }

    // Legacy fallback: 使用 profile_ops（仅 likes/ng）
    if (profile_ops?.length > 0) {
      const totalItems = profile_ops.reduce((sum, op) => sum + (op.items?.length || 0), 0);

      if (totalItems > 0) {
        // 确保 profile 行存在
        await ensureProfileRow(db, { userId, nowMs });

        // 写入
        const writeResult = await applyProfileOpsToDb(db, userId, profile_ops, nowMs);

        logInfo(meta, "[HARD_WRITE] profile write complete (legacy)", {
          source: "python_profile_ops",
          likesAdded: writeResult.likesAdded,
          ngsAdded: writeResult.ngsAdded,
          likesTried: writeResult.likesTried,
          ngsTried: writeResult.ngsTried,
          target: "user_profile",
        });

        // 生成回复（基于真实写入计数）
        const reply = buildProfileWriteReply(writeResult);

        if (reply === null) {
          return {
            handled: true,
            stopPipeline: false,
            reply: null,
          };
        }

        return {
          handled: true,
          stopPipeline: true,
          reply,
          likesCount: writeResult.likesAdded,
          ngsCount: writeResult.ngsAdded,
        };
      }
    }

    // 无 ops 也无 profile_ops：不写库、不拦
    logInfo(meta, "[HARD_WRITE] target=profile but no ops, not stopping pipeline", {
      content40: content?.slice(0, 40),
      hasOps: !!(ops?.length),
      hasProfileOps: !!(profile_ops?.length),
    });
    return {
      handled: true,
      stopPipeline: false,
      reply: null,
    };
  }

  // 4) target=memory
  // 4a) mode=forget: v1 不做删除，只返回轻回应
  if (mode === "forget") {
    logInfo(meta, "[HARD_WRITE] forget request", {
      target: "deferred",
      content40: content?.slice(0, 40),
    });
    return {
      handled: true,
      stopPipeline: true,
      reply: "嗯，我知道了。",
    };
  }

  // 4b) mode=remember + form_ok=false => 不写
  if (!form_ok) {
    logDebug(meta, "[HARD_WRITE] form_not_ok", { content20: content?.slice(0, 20) });
    return {
      handled: true,
      stopPipeline: false,
      reply: null,
    };
  }

  // 4c) mode=remember + form_ok=true => 写入 memories
  const contentHash = computeContentHash(userId, content);

  // 检查重复
  const existing = await findMemoryByHash(db, userId, contentHash);

  if (existing) {
    logInfo(meta, "[HARD_WRITE] saved", {
      status: "existed",
      memId: existing.id,
      target: "memories",
      content40: content?.slice(0, 40),
    });
    return {
      handled: true,
      stopPipeline: true,
      reply: "嗯，这个我已经记下了。",
      memoriesAdded: 0, // 重复，未实际新增
    };
  }

  // 写入
  const { id: memId } = await insertHardMemory(db, {
    userId,
    content: content,
    contentHash,
    nowMs,
  });

  logInfo(meta, "[HARD_WRITE] saved", {
    status: "saved",
    memId,
    target: "memories",
    content40: content?.slice(0, 40),
  });

  return {
    handled: true,
    stopPipeline: true,
    reply: "嗯，我记住了。",
    memoriesAdded: 1, // 新增了一条记忆
  };
}

module.exports = { maybeHandleHardWrite };
