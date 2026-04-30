-- 注意：PRAGMA 在 schema 文件中仅供参考，实际在每次连接时由 db.cjs 设置
PRAGMA foreign_keys = ON;

-- 001[USER]. Users (账号)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Tokyo',
  tier INTEGER NOT NULL DEFAULT 2, -- 用户等级: 0=free 1=paid_basic 2=paid_plus 3=paid_pro 4=paid_max（Beta 默认 2）
  learned_terms_json TEXT NOT NULL DEFAULT '[]',
  learned_terms_updated_at INTEGER NOT NULL DEFAULT 0,
  character TEXT NOT NULL DEFAULT 'mio'  -- 角色归属: mio/len（用于后台 job 识别）
);

-- 002[AUTH_SESSIONS]. Login sessions (登录态)
CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY,               -- session token
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

-- 003[SESSIONS]. 一次会话（Mio 的一段"存档"）
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT, 
  title TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  ended_at INTEGER,           -- 断开发生时间（ms），NULL 表示未断开
  end_state TEXT,             -- sleep/busy/lunch/... 断开时的作息状态
  end_message TEXT,           -- 用于 UI 显示的离开提示文案
  next_session_id TEXT,       -- 断开后创建的新 session id
  feelings TEXT,              -- JSON 数组：session 结束时 LLM 分析的 Mio 心情，如 '["happy","shy"]'
  listening_mode INTEGER NOT NULL DEFAULT 0,           -- 0=normal, 1=listening（倾听模式）
  listening_turn_count INTEGER NOT NULL DEFAULT 0,     -- 进入 listening 后的用户消息计数
  listening_pending_budget INTEGER NOT NULL DEFAULT 0,  -- 观察窗口剩余轮数（>0 表示正在观察）
  listening_pending_streak INTEGER NOT NULL DEFAULT 0,  -- 观察窗口中连续负面消息计数
  nudge_triggered INTEGER NOT NULL DEFAULT 0,          -- session nudge 是否已触发（每 session 最多 1 次）
  nudge_triggered_at INTEGER,                          -- nudge 触发时间（ms）
  nudge_content TEXT,                                  -- nudge 消息内容（幂等复用）
  FOREIGN KEY(user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_updated
ON sessions(user_id, updated_at);

-- 004[MESSAGES]. 会话中的每条消息（普通聊天窗口里的每一条消息）
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,            -- UUID
  session_id TEXT NOT NULL,       -- 外键：属于哪个会话
  role TEXT NOT NULL CHECK(role IN ('system','user','assistant')),
  content TEXT NOT NULL,          -- 消息内容
  created_at INTEGER NOT NULL,    -- 毫秒时间戳
  feeling TEXT,                   -- Mio 的单句情绪标签（assistant 消息有值，user 消息为 NULL）
  feeling_confidence REAL,        -- MacBERT 情绪分类置信度（0-1）
  meta_json TEXT NOT NULL DEFAULT '{}', -- 元数据 JSON（intent 分类结果等，仅用于 debug/回放，不进 prompt）

  FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
);
-- 加速：按会话 + 时间读取消息
CREATE INDEX IF NOT EXISTS idx_messages_session_created
ON messages(session_id, created_at);

-- 005[SESSION_SUMMARIES]. session对话的摘要（当统一session过长时会自动把历史内容总结成摘要并存储）
-- summary: 每 50 条增量压缩的运行摘要
-- closing_summary: session 结束时生成的完整摘要（用于跨天注入 + embedding）
CREATE TABLE IF NOT EXISTS session_summaries (
  session_id TEXT PRIMARY KEY,
  summary TEXT NOT NULL,
  closing_summary TEXT,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- 006[MEMORIES]. 记忆表（用来标记该记忆是否为永久记忆）
CREATE TABLE IF NOT EXISTS memories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  content_hash TEXT,
  importance INTEGER NOT NULL DEFAULT 1, -- 取简单的记忆二分法： 1 临时记忆（走TTL，会淡出） 2 永久记忆（不走TTL）
  source TEXT NOT NULL DEFAULT 'learned', -- 'seed' = 手动注入的种子记忆（每次必传）, 'learned' = 交互中学习的记忆
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id)
);
-- 给memories加索引，防止今后越用越慢。
CREATE INDEX IF NOT EXISTS idx_memories_user_importance_created
ON memories(user_id, importance, created_at);
-- CREATE UNIQUE INDEX IF NOT EXISTS uq_memories_user_hash
-- ON memories(user_id, content_hash);

-- 007[EMBEDDINGS]. 记忆碎片表
CREATE TABLE IF NOT EXISTS embeddings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_id TEXT,
  message_id TEXT,

  kind TEXT NOT NULL,              -- 'message' | 'memory' | 'summary' | 'anchor' | 'promise' | 'plan'
  role TEXT,                       -- user/assistant 可选

  memory_id TEXT,                  -- 当 kind='memory' 时指向 memories.id
  anchor_id TEXT,                  -- 当 kind='anchor' 时指向 conversation_anchors.id
  content TEXT NOT NULL,
  content_hash TEXT,               -- 用于去重

  embedding TEXT NOT NULL,         -- 先用 JSON 字符串存（MVP）
  weight REAL NOT NULL DEFAULT 1.0, -- 召回权重（用于加权排序）
  expires_at INTEGER,              -- 可选：过期时间（毫秒），NULL = 永不过期
  created_at INTEGER NOT NULL,

  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY(message_id) REFERENCES messages(id) ON DELETE SET NULL,
  FOREIGN KEY(memory_id) REFERENCES memories(id) ON DELETE SET NULL
);
-- memory 去重：同一 user 的同一条 memory 只允许写一条 embedding
CREATE UNIQUE INDEX IF NOT EXISTS uq_embeddings_memory
ON embeddings(user_id, memory_id)
WHERE kind='memory' AND memory_id IS NOT NULL;
-- anchor 去重：同一 anchor_id 只写一条
CREATE UNIQUE INDEX IF NOT EXISTS uq_embeddings_anchor
ON embeddings(user_id, anchor_id)
WHERE kind='anchor' AND anchor_id IS NOT NULL;
-- 常用检索索引：按用户/类型/哈希快速查
CREATE INDEX IF NOT EXISTS idx_embeddings_user_kind_hash
ON embeddings(user_id, kind, content_hash);
CREATE INDEX IF NOT EXISTS idx_embeddings_user_kind_created
ON embeddings(user_id, kind, created_at);

-- 008[MEMORY_CANDIDATES]
CREATE TABLE IF NOT EXISTS memory_candidates (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  candidate_key TEXT NOT NULL,  -- 用于去重/聚合：同一条候选（同一用户）只保留一条记录
  content TEXT NOT NULL, -- 候选内容（建议一句话）
  strength TEXT NOT NULL DEFAULT 'weak',  -- 软强度：none/weak/medium/strong
  status TEXT NOT NULL DEFAULT 'soft',  -- 状态：soft=软记忆候选；confirmed=已升级；discarded=丢弃
  evidence TEXT NOT NULL DEFAULT '{}',  -- 证据聚合：出现次数、触发原因tags、来源、最后一次触发等（JSON 字符串）
  first_seen_at INTEGER NOT NULL, -- 用于"自然确认"的时间/跨session证据
  last_seen_at INTEGER NOT NULL,
  first_session_id TEXT,
  last_session_id TEXT,
  expires_at INTEGER NOT NULL,  -- 过期时间：软记忆没升级就自然淡出（比如 90 天）
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,

  UNIQUE(user_id, candidate_key),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_memory_candidates_user_status
ON memory_candidates (user_id, status);
CREATE INDEX IF NOT EXISTS idx_memory_candidates_user_last_seen
ON memory_candidates (user_id, last_seen_at);

-- 008[MEMORY_CANDIDATE_HITS]
CREATE TABLE IF NOT EXISTS memory_candidate_hits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  candidate_key TEXT NOT NULL, -- candidate_key 用锚点 content 的 hash
  session_id TEXT,
  message_id TEXT,
  source TEXT,                 -- 'user' | 'recall' | 'assistant'
  reason_tags TEXT,            -- JSON array string
  strength TEXT,               -- weak/medium/strong
  created_at INTEGER NOT NULL,

  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE SET NULL,
  FOREIGN KEY(message_id) REFERENCES messages(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_candidate_hits_user_key
ON memory_candidate_hits (user_id, candidate_key);
CREATE INDEX IF NOT EXISTS idx_candidate_hits_user_created
ON memory_candidate_hits(user_id, created_at);

-- 009[ANCHOR_HIST]
CREATE TABLE IF NOT EXISTS anchor_hits (
  user_id TEXT NOT NULL,
  anchor_key TEXT NOT NULL, -- anchor_key 用锚点 content 的 hash
  last_hit_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, anchor_key)
);

-- 010[COMMITTED_PROMISES]. 已承诺的约定（永久保存，不过期，不自动清理）
-- 用户说出口的约定 = 成立。Mio 会记住，但不会用它施压。
CREATE TABLE IF NOT EXISTS committed_promises (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_id TEXT,
  content TEXT NOT NULL,           -- 约定内容（如：一起去看樱花）
  content_hash TEXT,               -- 内容哈希（用于去重）
  time_hint TEXT,                  -- 时间提示（如：今年春天、3月）
  committed_at INTEGER NOT NULL,   -- 承诺时间戳
  source_message_id TEXT,          -- 来源消息ID
  confidence TEXT DEFAULT 'high',  -- 置信度
  -- ▼ 结构化时间字段
  time_text TEXT,                  -- 原始时间表述（如："今年春天"、"3月下旬"）
  time_precision TEXT,             -- 精度标签：date | month | season | holiday | week | relative | none
  time_year INTEGER,               -- 年份（如 2026），NULL = 未提及
  time_month INTEGER,              -- 月份 1-12，NULL = 未提及
  time_day INTEGER,                -- 日 1-31，NULL = 未提及
  time_holiday TEXT,               -- 节日名（如 "桜"、"クリスマス"），NULL = 无
  time_start_ts INTEGER,           -- 时间窗口起始（毫秒），NULL = 未解析
  time_end_ts INTEGER,             -- 时间窗口结束（毫秒），NULL = 未解析
  -- ▼ 提醒/推送字段
  nudge_plan TEXT,                 -- 提醒策略 JSON（如 {"type":"before","days":7}），NULL = 无计划
  last_nudged_at INTEGER,          -- 最后一次提醒时间戳（毫秒），NULL = 从未提醒
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE SET NULL,
  FOREIGN KEY(source_message_id) REFERENCES messages(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_committed_promises_user
ON committed_promises(user_id, committed_at);
CREATE UNIQUE INDEX IF NOT EXISTS uq_committed_promises_user_hash
ON committed_promises(user_id, content_hash);

-- 011[PROMISE_CANDIDATES]. 待确认的约定候选（短期保存，可过期清理）
-- 用户提出约定但 assistant 未当轮确认时，先存候选；后续确认可晋升 committed_promises
CREATE TABLE IF NOT EXISTS promise_candidates (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_id TEXT,
  content TEXT NOT NULL,              -- 候选约定内容（归一化后）
  content_hash TEXT,                  -- 内容哈希（用于去重）
  original_text TEXT,                 -- 用户原始文本（用于回传 judge）
  time_hint TEXT,
  time_text TEXT,
  time_precision TEXT,
  time_year INTEGER,
  time_month INTEGER,
  time_day INTEGER,
  time_holiday TEXT,
  time_start_ts INTEGER,
  time_end_ts INTEGER,
  source_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending | accepted | rejected | expired
  -- ▼ Feature signals（结构化特征，便于回归/审计）
  signals_json TEXT NOT NULL DEFAULT '{}',
  candidate_confidence REAL,
  candidate_lang TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE SET NULL,
  FOREIGN KEY(source_message_id) REFERENCES messages(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_promise_candidates_user_status_exp
ON promise_candidates(user_id, status, expires_at);
CREATE INDEX IF NOT EXISTS idx_promise_candidates_user_session_status
ON promise_candidates(user_id, session_id, status);

-- 012[RELATIONSHIP_PROMISES]. 关系承诺（不写入 committed_promises）
-- 仅记录"关系绑定/持续承诺"，后续由单独模块处理（不做事件提醒）
CREATE TABLE IF NOT EXISTS relationship_promises (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_id TEXT,
  content TEXT NOT NULL,
  content_hash TEXT,
  created_at INTEGER NOT NULL,
  source_message_id TEXT,
  confidence TEXT DEFAULT 'relationship:v1',
  -- ▼ Feature signals（结构化特征，便于回归/审计）
  signals_json TEXT NOT NULL DEFAULT '{}',
  candidate_confidence REAL,
  candidate_lang TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE SET NULL,
  FOREIGN KEY(source_message_id) REFERENCES messages(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_relationship_promises_user
ON relationship_promises(user_id, created_at);

CREATE UNIQUE INDEX IF NOT EXISTS uq_relationship_promises_user_hash
ON relationship_promises(user_id, content_hash);

-- 013[MIO_STATE]. Mio 的持久内在状态（每用户一行）
CREATE TABLE IF NOT EXISTS mio_state (
  user_id TEXT PRIMARY KEY,
  mood TEXT NOT NULL DEFAULT 'steady',           -- good/steady/low/tired
  relationship TEXT NOT NULL DEFAULT 'stranger',  -- stranger/familiar/fond/attached/deeply_attached
  updated_at INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 014[DAY_CONTEXTS]. Day-level context (日内关系层 / 轻状态)
CREATE TABLE IF NOT EXISTS day_contexts (
  id TEXT PRIMARY KEY,                 -- UUID
  user_id TEXT NOT NULL,
  day_key TEXT NOT NULL,               -- 'YYYY-MM-DD' in user's timezone (e.g. 2026-01-13)

  first_interaction_at INTEGER,
  last_interaction_at INTEGER,

  session_count INTEGER NOT NULL DEFAULT 0,
  last_session_id TEXT,                -- 最近一次互动所在的 session（便于回溯，但不参与 session 判定）

  day_summary TEXT,                    -- 可选：一句话“今天聊过什么”（轻总结，不是正式 summary）
  tone_hint TEXT,                      -- 可选：轻标签，如 'relaxed'/'tired'（不要写成事实判断）

  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,

  UNIQUE(user_id, day_key),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(last_session_id) REFERENCES sessions(id) ON DELETE SET NULL
);
-- 查询/更新今日 day_context 的核心索引
CREATE INDEX IF NOT EXISTS idx_day_contexts_user_day
ON day_contexts(user_id, day_key);
-- 取最近日内状态（用于 prompt 注入）
CREATE INDEX IF NOT EXISTS idx_day_contexts_user_last
ON day_contexts(user_id, last_interaction_at);

-- 015[PLANNED_EVENTS] 未来的计划事件
CREATE TABLE IF NOT EXISTS planned_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,

  due_day_key TEXT NOT NULL,          -- YYYY-MM-DD (user timezone)
  title TEXT NOT NULL,                -- 简短事件名：钓鱼/朋友来/出远门...
  title_norm TEXT NOT NULL DEFAULT '', -- 归一化标题 lower(trim(title))，用于去重
  certainty INTEGER NOT NULL DEFAULT 1, -- 1=确定 0=不确定(可能/也许/考虑)

  source_message_id TEXT,             -- 可选：来源消息
  source_text TEXT,                   -- 可选：原句（调试用，后面可删）
  event_key TEXT NOT NULL,            -- 去重 key: hash(user_id + due_day_key + title + certainty)

  status TEXT NOT NULL DEFAULT 'active', -- active/done/canceled/expired
  last_nudged_day_key TEXT,           -- 今天触发过就写今天，保证一天一次

  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,        -- 到期自动淡出（避免"计划垃圾"堆积）

  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(source_message_id) REFERENCES messages(id) ON DELETE SET NULL,

  UNIQUE(user_id, event_key),
  UNIQUE(user_id, due_day_key, title_norm)
);

CREATE INDEX IF NOT EXISTS idx_planned_events_user_due
ON planned_events(user_id, due_day_key);
CREATE INDEX IF NOT EXISTS idx_planned_events_user_status_due
ON planned_events(user_id, status, due_day_key);
CREATE INDEX IF NOT EXISTS idx_planned_events_user_expires
ON planned_events(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_planned_events_user_due_nudge
ON planned_events(user_id, due_day_key, last_nudged_day_key);
CREATE INDEX IF NOT EXISTS idx_planned_events_user_due_norm
ON planned_events(user_id, due_day_key, title_norm);

-- 016[EMBEDDING_JOBS]. Embedding 写入队列（异步去重）
CREATE TABLE IF NOT EXISTS embedding_jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  kind TEXT NOT NULL,              -- 'message' | 'memory' | 'anchor' | 'promise' | 'plan'
  ref_id TEXT NOT NULL,            -- message_id / memory_id / anchor_id / promise_id / plan_id
  session_id TEXT,                 -- message 用
  role TEXT,                       -- message 用: 'user' | 'assistant'
  memory_id TEXT,                  -- memory 用（冗余，方便查询）
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  weight REAL NOT NULL DEFAULT 1.0,        -- 写入 embeddings 时的权重
  expires_at INTEGER,                      -- 写入 embeddings 时的过期时间
  status TEXT NOT NULL DEFAULT 'pending',  -- pending | processing | done | failed
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,

  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, kind, ref_id)
);
-- 队列消费索引：按状态+创建时间取待处理任务
CREATE INDEX IF NOT EXISTS idx_embedding_jobs_status_created
ON embedding_jobs(status, created_at);
-- 用户维度查询
CREATE INDEX IF NOT EXISTS idx_embedding_jobs_user_status
ON embedding_jobs(user_id, status);

-- embeddings 表新增唯一约束：message 类型去重
CREATE UNIQUE INDEX IF NOT EXISTS uq_embeddings_message
ON embeddings(user_id, kind, message_id, role)
WHERE kind='message' AND message_id IS NOT NULL;

-- 017[USER_PROFILE]. 用户硬画像 - 一人一行版
-- 未上线阶段采用此结构，避免 KV 多行复杂性
-- nicknames_json: JSON 数组存储多个昵称（去重）
CREATE TABLE IF NOT EXISTS user_profile (
  user_id            TEXT PRIMARY KEY,
  name               TEXT,              -- 主名（记住我叫X）
  addressing_name    TEXT,              -- Mio 叫用户的称呼（以后叫我X / 称呼确认）
  birthday_ymd       TEXT,              -- 生日 YYYY-MM-DD
  hometown           TEXT,              -- 故乡
  residence          TEXT,              -- 现住地
  occupation         TEXT,              -- 职业
  preferred_language TEXT,              -- 偏好语言: zh-CN | ja | en
  nicknames_json     TEXT NOT NULL DEFAULT '[]',  -- JSON 数组：多个昵称
  likes_json         TEXT NOT NULL DEFAULT '[]',  -- JSON 数组：喜好
  ng_json            TEXT NOT NULL DEFAULT '[]',  -- JSON 数组：雷点/NG
  family_json        TEXT NOT NULL DEFAULT '{}',  -- JSON 对象：家庭信息
  created_at         INTEGER NOT NULL,
  updated_at         INTEGER NOT NULL,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 018[ADDRESSING_CANDIDATES]. 称呼候选（弱触发确认用）
-- 用于"大家都叫我X"类弱触发 → Mio 确认问句 → 用户确认后写入 user_profile
-- turns_left: 剩余追问次数，降到 0 时自动 expire（避免反复追问）
CREATE TABLE IF NOT EXISTS addressing_candidates (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         TEXT    NOT NULL,
  candidate_value TEXT    NOT NULL,
  candidate_norm  TEXT    NOT NULL,  -- trim().toLowerCase()
  status          TEXT    NOT NULL DEFAULT 'pending', -- pending | accepted | rejected | expired
  source_message  TEXT,              -- 可选：触发原句（短）
  turns_left      INTEGER NOT NULL DEFAULT 2,  -- 剩余追问次数
  asked_at        INTEGER,           -- 上次询问时间
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL,
  expires_at      INTEGER NOT NULL,

  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 同一 user 同一 candidate_norm 同一 status 不重复
CREATE UNIQUE INDEX IF NOT EXISTS idx_addr_cand_uniq
ON addressing_candidates (user_id, candidate_norm, status);

-- 常用查询：按 user + status 快速过滤
CREATE INDEX IF NOT EXISTS idx_addr_cand_user_status
ON addressing_candidates (user_id, status);

-- 过期清理索引
CREATE INDEX IF NOT EXISTS idx_addr_cand_user_exp
ON addressing_candidates (user_id, expires_at);

-- 019[CONVERSATION_ANCHORS]. 对话锚点（状态变化触发的索引句）
-- 用于 embedding 召回，捕捉 plan/promise/addressing 的状态转移
CREATE TABLE IF NOT EXISTS conversation_anchors (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_id TEXT,
  content TEXT NOT NULL,              -- 索引句（如 "[plan:add] 计划：2026-03-01 去看樱花"）
  anchor_type TEXT NOT NULL,          -- plan:add | plan:reschedule | plan:cancel | promise:add | addr:set | boundary:add
  domain TEXT NOT NULL,               -- plan | promise | addressing
  topic TEXT,                         -- 可选：关联的 title_norm 或 content_hash（用于冷却去重）
  ref_id TEXT,                        -- 可选：关联的 planned_event.id 或 committed_promise.id
  content_hash TEXT NOT NULL,         -- 内容哈希（用于去重）
  source_message_id TEXT,             -- 可选：触发的消息 ID
  weight REAL NOT NULL DEFAULT 1.0,   -- 召回权重（默认 1.0，确认类可降为 0.6~0.7）
  expires_at INTEGER,                 -- 可选：过期时间（毫秒），NULL = 永不过期
  created_at INTEGER NOT NULL,

  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE SET NULL,
  FOREIGN KEY(source_message_id) REFERENCES messages(id) ON DELETE SET NULL
);

-- 去重：同一 user 同一 content_hash 只写一次
CREATE UNIQUE INDEX IF NOT EXISTS uq_conversation_anchors_user_hash
ON conversation_anchors(user_id, content_hash);

-- 按用户+创建时间查询
CREATE INDEX IF NOT EXISTS idx_conversation_anchors_user_created
ON conversation_anchors(user_id, created_at);

-- 按用户+类型查询
CREATE INDEX IF NOT EXISTS idx_conversation_anchors_user_type
ON conversation_anchors(user_id, anchor_type);

-- 按用户+domain+topic 查询（用于冷却检查）
CREATE INDEX IF NOT EXISTS idx_conversation_anchors_user_domain_topic
ON conversation_anchors(user_id, domain, topic);

-- 020[RELATIONSHIP_SCORES]. 关系分数（用户-Mio 亲密度积累）
-- score → stage 映射：0-20 stranger, 21-40 familiar, 41-70 fond, 71-100 attached, 101+ deeply_attached
-- 含每日计数器（登录奖励、消息数、分数上限）+ 正面feeling累积器 + 衰减追踪
CREATE TABLE IF NOT EXISTS relationship_scores (
  user_id TEXT PRIMARY KEY,
  score INTEGER NOT NULL DEFAULT 0,
  -- 每日追踪（按 day_key 重置）
  daily_day_key TEXT NOT NULL DEFAULT '',               -- 当前计数所属日期 (YYYY-MM-DD)
  daily_login_credited INTEGER NOT NULL DEFAULT 0,      -- 当日 +5 登录奖励是否已发放
  daily_msg_count INTEGER NOT NULL DEFAULT 0,           -- 当日用户消息数（满3条触发登录奖励）
  daily_score_gained INTEGER NOT NULL DEFAULT 0,        -- 当日已获得分数（所有来源合计，受上限约束）
  -- 正面feeling累积器（跨天不重置，每满5→+1）
  positive_feeling_acc INTEGER NOT NULL DEFAULT 0,
  -- 衰减追踪
  last_interaction_day TEXT NOT NULL DEFAULT '',         -- 最后互动日期 (YYYY-MM-DD)
  -- 时间戳
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 021[FOLLOWUP_NUDGES]. 存在感跃迁：轻跟进候选
-- 用户提到未完成状态（困/忙/低落）时写入，下次用户发言时检查并注入 prompt block
CREATE TABLE IF NOT EXISTS followup_nudges (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_id TEXT,
  type TEXT NOT NULL,                -- 'sleep' | 'busy' | 'low_mood'
  source_message_id TEXT,
  source_text TEXT,                  -- 用户原话（截断，仅调试用）
  hint_after_ts INTEGER NOT NULL,    -- 最早可触发时间（毫秒）
  expire_ts INTEGER NOT NULL,        -- 过期时间（毫秒）
  used INTEGER NOT NULL DEFAULT 0,   -- 0=active, 1=已触发
  created_at INTEGER NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE SET NULL,
  FOREIGN KEY(source_message_id) REFERENCES messages(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_followup_nudges_user_used
ON followup_nudges(user_id, used);
CREATE INDEX IF NOT EXISTS idx_followup_nudges_user_expire
ON followup_nudges(user_id, expire_ts);

-- 022[WEATHER_CACHE]. 每日天气缓存（每用户每天最多一条）
-- 同一 user + 同一 day_key → 最多请求一次天气 API
CREATE TABLE IF NOT EXISTS weather_cache (
  user_id TEXT NOT NULL,
  day_key TEXT NOT NULL,                              -- YYYY-MM-DD
  city TEXT NOT NULL DEFAULT '',
  district TEXT DEFAULT '',
  location_id TEXT DEFAULT '',                        -- QWeather location ID
  weather_text TEXT DEFAULT '',                       -- "多云" / "晴" / "小雨"
  temp TEXT DEFAULT '',                               -- 实时温度
  feels_like TEXT DEFAULT '',                         -- 体感温度
  humidity TEXT DEFAULT '',                           -- 湿度
  wind_speed TEXT DEFAULT '',                         -- 风速 km/h
  feeling_text TEXT DEFAULT '',                       -- 环境感受文本
  temp_min TEXT DEFAULT '',                           -- 每日最低温
  temp_max TEXT DEFAULT '',                           -- 每日最高温
  raw_json TEXT DEFAULT '{}',                         -- 完整 API 响应
  fetched_at INTEGER NOT NULL,
  source TEXT NOT NULL DEFAULT 'profile',             -- 'profile' | 'geolocation'
  PRIMARY KEY(user_id, day_key),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 023[USER_GEOLOCATION]. 前端 geolocation 反查结果（每用户一条，覆盖写入）
CREATE TABLE IF NOT EXISTS user_geolocation (
  user_id TEXT PRIMARY KEY,
  city TEXT DEFAULT '',
  district TEXT DEFAULT '',
  location_id TEXT DEFAULT '',                        -- QWeather location ID
  lat REAL,
  lon REAL,
  resolved_at INTEGER,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 024[PROACTIVE_MESSAGES]. 主动发出的消息记录
-- seen: 前端已展示给用户（展示即消费，用于 gate 判断，避免 unseen 消息堆积）
-- read: 用户发消息"接住"了这条消息（记录对话接续行为，供后续分析）
CREATE TABLE IF NOT EXISTS proactive_messages (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_id TEXT,
  trigger_type TEXT NOT NULL,   -- 'login' | 'window_morning' | 'window_noon' | 'window_evening'
  content TEXT NOT NULL,
  seen INTEGER NOT NULL DEFAULT 0,   -- 0=未展示, 1=已展示（前端调 POST /chat/proactive/seen）
  read INTEGER NOT NULL DEFAULT 0,   -- 0=未接住, 1=用户发消息后自动置1
  created_at INTEGER NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_proactive_messages_user_seen
ON proactive_messages(user_id, seen, created_at);

-- 025[PROACTIVE_DAILY_STATE]. 每日主动消息控制状态（每用户每天一行）
-- count: 当日已发主动消息总数（登录+窗口共享，上限 2）
-- window_slots: JSON 数组，三个随机时间点（早/中/晚），当天首次判断时生成并固定
-- login_triggered: 今日是否已触发登录 proactive（每天最多 1 次，DB 持久化防重启重置）
CREATE TABLE IF NOT EXISTS proactive_daily_state (
  user_id TEXT NOT NULL,
  day_key TEXT NOT NULL,                          -- YYYY-MM-DD (user timezone)
  count INTEGER NOT NULL DEFAULT 0,
  window_slots TEXT NOT NULL DEFAULT '[]',        -- JSON: [{ window, ts, probability, fired }]
  login_triggered INTEGER NOT NULL DEFAULT 0,     -- 0=未触发, 1=今日已触发
  PRIMARY KEY(user_id, day_key),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

