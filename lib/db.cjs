// lib/db.cjs
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const fs = require("fs");
const path = require("path");
const { logInfo } = require("./logger.cjs");

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "mio.sqlite");
const SCHEMA_PATH = process.env.SCHEMA_PATH || path.join(process.cwd(), "lib", "schema.sql");

let dbPromise = null;
let dbInfoLogged = false;

function getDBInfo() {
  const absPath = path.resolve(DB_PATH);
  return { cwd: process.cwd(), dbPath: absPath, exists: fs.existsSync(absPath) };
}

async function getDB() {
  if (!dbPromise) {
    if (!dbInfoLogged) {
      dbInfoLogged = true;
      const info = getDBInfo();
      logInfo({ traceId: "DB_INIT" }, "open", { cwd: info.cwd, dbPath: info.dbPath, exists: info.exists });
    }

    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

    dbPromise = open({ filename: DB_PATH, driver: sqlite3.Database }).then(async (db) => {
      // schema
      const schema = fs.readFileSync(SCHEMA_PATH, "utf-8");
      await db.exec(schema);

      // migrations (safe for existing DBs)
      // tier: 0=free 1=paid_basic 2=paid_plus 3=paid_pro 4=paid_max（Beta 默认 2）
      try { await db.exec("ALTER TABLE users ADD COLUMN tier INTEGER NOT NULL DEFAULT 2;"); } catch (_) {}
      // feelings: session 结束时汇总的 Mio 心情 JSON 数组
      try { await db.exec("ALTER TABLE sessions ADD COLUMN feelings TEXT;"); } catch (_) {}
      // feeling: 每条 assistant 消息的单句情绪标签
      try { await db.exec("ALTER TABLE messages ADD COLUMN feeling TEXT;"); } catch (_) {}
      // feeling_confidence: MacBERT 情绪分类置信度
      try { await db.exec("ALTER TABLE messages ADD COLUMN feeling_confidence REAL;"); } catch (_) {}
      // closing_summary: session 结束时生成的完整摘要
      try { await db.exec("ALTER TABLE session_summaries ADD COLUMN closing_summary TEXT;"); } catch (_) {}
      // mio_state: CREATE TABLE 已在 schema.sql 中，此处仅做 fallback
      try { await db.exec("CREATE TABLE IF NOT EXISTS mio_state (user_id TEXT PRIMARY KEY, mood TEXT NOT NULL DEFAULT 'steady', relationship TEXT NOT NULL DEFAULT 'stranger', updated_at INTEGER NOT NULL DEFAULT 0, FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);"); } catch (_) {}
      // followup_nudges: CREATE TABLE 已在 schema.sql 中，此处仅做 fallback
      try { await db.exec("CREATE TABLE IF NOT EXISTS followup_nudges (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, session_id TEXT, type TEXT NOT NULL, source_message_id TEXT, source_text TEXT, hint_after_ts INTEGER NOT NULL, expire_ts INTEGER NOT NULL, used INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);"); } catch (_) {}
      // relationship_scores: CREATE TABLE 已在 schema.sql 中，此处仅做 fallback
      try { await db.exec("CREATE TABLE IF NOT EXISTS relationship_scores (user_id TEXT PRIMARY KEY, score INTEGER NOT NULL DEFAULT 0, daily_day_key TEXT NOT NULL DEFAULT '', daily_login_credited INTEGER NOT NULL DEFAULT 0, daily_msg_count INTEGER NOT NULL DEFAULT 0, daily_score_gained INTEGER NOT NULL DEFAULT 0, positive_feeling_acc INTEGER NOT NULL DEFAULT 0, last_interaction_day TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);"); } catch (_) {}
      // weather_cache: 每日天气缓存（v2: 实时天气 + 环境感受）
      try { await db.exec("CREATE TABLE IF NOT EXISTS weather_cache (user_id TEXT NOT NULL, day_key TEXT NOT NULL, city TEXT NOT NULL DEFAULT '', district TEXT DEFAULT '', location_id TEXT DEFAULT '', weather_text TEXT DEFAULT '', temp TEXT DEFAULT '', feels_like TEXT DEFAULT '', humidity TEXT DEFAULT '', wind_speed TEXT DEFAULT '', feeling_text TEXT DEFAULT '', raw_json TEXT DEFAULT '{}', fetched_at INTEGER NOT NULL, source TEXT NOT NULL DEFAULT 'profile', PRIMARY KEY(user_id, day_key), FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);"); } catch (_) {}
      // weather_cache v1→v2 迁移：旧表可能缺少新字段
      try { await db.exec("ALTER TABLE weather_cache ADD COLUMN temp TEXT DEFAULT '';"); } catch (_) {}
      try { await db.exec("ALTER TABLE weather_cache ADD COLUMN feels_like TEXT DEFAULT '';"); } catch (_) {}
      try { await db.exec("ALTER TABLE weather_cache ADD COLUMN humidity TEXT DEFAULT '';"); } catch (_) {}
      try { await db.exec("ALTER TABLE weather_cache ADD COLUMN wind_speed TEXT DEFAULT '';"); } catch (_) {}
      try { await db.exec("ALTER TABLE weather_cache ADD COLUMN feeling_text TEXT DEFAULT '';"); } catch (_) {}
      // weather_cache v2→v3 迁移：添加每日温度范围
      try { await db.exec("ALTER TABLE weather_cache ADD COLUMN temp_min TEXT DEFAULT '';"); } catch (_) {}
      try { await db.exec("ALTER TABLE weather_cache ADD COLUMN temp_max TEXT DEFAULT '';"); } catch (_) {}
      // user_geolocation: 前端 geolocation 反查结果
      try { await db.exec("CREATE TABLE IF NOT EXISTS user_geolocation (user_id TEXT PRIMARY KEY, city TEXT DEFAULT '', district TEXT DEFAULT '', location_id TEXT DEFAULT '', lat REAL, lon REAL, resolved_at INTEGER, FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);"); } catch (_) {}
      // character: 角色归属（mio/len），用于后台 job 识别用户所属角色
      try { await db.exec("ALTER TABLE users ADD COLUMN character TEXT NOT NULL DEFAULT 'mio';"); } catch (_) {}
      // listening_mode: 倾听模式状态 + 观察窗口
      try { await db.exec("ALTER TABLE sessions ADD COLUMN listening_mode INTEGER NOT NULL DEFAULT 0;"); } catch (_) {}
      try { await db.exec("ALTER TABLE sessions ADD COLUMN listening_turn_count INTEGER NOT NULL DEFAULT 0;"); } catch (_) {}
      try { await db.exec("ALTER TABLE sessions ADD COLUMN listening_pending_budget INTEGER NOT NULL DEFAULT 0;"); } catch (_) {}
      try { await db.exec("ALTER TABLE sessions ADD COLUMN listening_pending_streak INTEGER NOT NULL DEFAULT 0;"); } catch (_) {}
      // proactive_messages: 主动发送的消息记录（seen=展示给用户, read=用户发消息接住了）
      try { await db.exec("CREATE TABLE IF NOT EXISTS proactive_messages (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, session_id TEXT, trigger_type TEXT NOT NULL, content TEXT NOT NULL, seen INTEGER NOT NULL DEFAULT 0, read INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);"); } catch (_) {}
      try { await db.exec("ALTER TABLE proactive_messages ADD COLUMN seen INTEGER NOT NULL DEFAULT 0;"); } catch (_) {}
      // proactive_daily_state: 每日主动消息计数 + 时间窗口 slots + 登录触发标记
      try { await db.exec("CREATE TABLE IF NOT EXISTS proactive_daily_state (user_id TEXT NOT NULL, day_key TEXT NOT NULL, count INTEGER NOT NULL DEFAULT 0, window_slots TEXT NOT NULL DEFAULT '[]', login_triggered INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(user_id, day_key), FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);"); } catch (_) {}
      try { await db.exec("ALTER TABLE proactive_daily_state ADD COLUMN login_triggered INTEGER NOT NULL DEFAULT 0;"); } catch (_) {}
      // session_nudge: 会话内轻触发状态（存在 sessions 表，不新建表）
      try { await db.exec("ALTER TABLE sessions ADD COLUMN nudge_triggered INTEGER NOT NULL DEFAULT 0;"); } catch (_) {}
      try { await db.exec("ALTER TABLE sessions ADD COLUMN nudge_triggered_at INTEGER;"); } catch (_) {}
      try { await db.exec("ALTER TABLE sessions ADD COLUMN nudge_content TEXT;"); } catch (_) {}

      // admins: 管理后台账号
      try { await db.exec("CREATE TABLE IF NOT EXISTS admins (id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at INTEGER NOT NULL);"); } catch (_) {}
      // admin_sessions: 管理员登录 session
      try { await db.exec("CREATE TABLE IF NOT EXISTS admin_sessions (id TEXT PRIMARY KEY, admin_id TEXT NOT NULL, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, FOREIGN KEY(admin_id) REFERENCES admins(id) ON DELETE CASCADE);"); } catch (_) {}

      // pragmas
      await db.exec("PRAGMA journal_mode = WAL;");
      await db.exec("PRAGMA synchronous = NORMAL;");
      await db.exec("PRAGMA foreign_keys = ON;");

      return db;
    });
  }
  return dbPromise;
}

module.exports = { getDB, getDBInfo };
