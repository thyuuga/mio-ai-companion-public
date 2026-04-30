#!/usr/bin/env node
// scripts/create_user.cjs
// Usage: node scripts/create_user.cjs <username> <password> [timezone] [tier] [character]
// tier: 0=free 1=paid_basic 2=paid_plus 3=paid_pro 4=paid_max（不指定则默认 2）
// character: mio/len（不指定则默认 mio）
// e.g. node scripts/create_user.cjs alice 123456 Asia/Tokyo 2 len
// 目标：在各种奇怪环境下都能跑（不依赖 node-sqlite3；mkdir 不炸；错误可读）

require("dotenv").config();
var crypto = require("crypto");
var fs = require("fs");
var path = require("path");
var child = require("child_process");

function die(msg, code) {
  if (code == null) code = 1;
  console.error(msg);
  process.exit(code);
}

function safeErr(e) {
  try {
    if (!e) return "unknown error";
    if (typeof e === "string") return e;
    if (e.stderr) return String(e.stderr);
    if (e.message) return String(e.message);
    return String(e);
  } catch (_) {
    return "unknown error";
  }
}

function escapeSqlString(s) {
  return String(s).replace(/'/g, "''");
}

function runSqlite(dbPath, sql) {
  return child.execFileSync("sqlite3", ["-bail", dbPath], {
    input: sql,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
}

function ensureDirExists(dir) {
  try {
    if (fs.existsSync(dir)) return;
    fs.mkdirSync(dir, { recursive: true });
  } catch (e) {
    // 兜底：如果并发/怪环境导致 EEXIST，直接忽略
    if (e && e.code === "EEXIST") return;
    // 再兜底：如果父目录存在但 recursive 没生效
    try {
      if (fs.existsSync(dir)) return;
    } catch (_) {}
    throw e;
  }
}

(function main() {
  var username = process.argv[2];
  var password = process.argv[3];
  var timezone = process.argv[4] || "Asia/Tokyo";
  var tier = process.argv[5] != null ? (parseInt(process.argv[5], 10) || 0) : 2;
  var character = process.argv[6] || "mio";

  if (!username || !password) {
    die("Usage: node scripts/create_user.cjs <username> <password> [timezone] [tier] [character]");
  }

  // 稳定根目录：scripts 的上一级就是项目根
  var ROOT = path.resolve(__dirname, "..");
  var dbPath = process.env.DB_PATH
    ? path.resolve(process.env.DB_PATH)
    : path.join(ROOT, "data", "mio.sqlite");

  var schemaPath = process.env.SCHEMA_PATH
    ? path.resolve(process.env.SCHEMA_PATH)
    : path.join(ROOT, "lib", "schema.sql");

  // sqlite3 CLI 是否存在
  try {
    child.execFileSync("sqlite3", ["-version"], { encoding: "utf8" });
  } catch (e) {
    die("[FATAL] sqlite3 CLI not found. Install: brew install sqlite");
  }

  // 确保 data 目录存在（不炸）
  ensureDirExists(path.dirname(dbPath));

  // 读 schema 幂等建表
  if (!fs.existsSync(schemaPath)) {
    die("[FATAL] schema.sql not found: " + schemaPath);
  }
  var schema = fs.readFileSync(schemaPath, "utf8");

  try {
    runSqlite(
      dbPath,
      "PRAGMA journal_mode=WAL;\n" +
        "PRAGMA synchronous=NORMAL;\n" +
        "PRAGMA foreign_keys=ON;\n" +
        schema +
        "\n"
    );
  } catch (e) {
    die("[FATAL] apply schema failed: " + safeErr(e));
  }

  // ---- password hash：优先用项目的 bcrypt；如果炸就用 scrypt fallback ----
  var passwordHash = null;
  try {
    var pw = require("../lib/password.cjs"); // 可能因 bcrypt 架构炸
    passwordHash = pw.hashPassword(password);
  } catch (e) {
    // fallback：用 scrypt（应急用，能登录就行；你后面再统一迁移也行）
    try {
      var salt = crypto.randomBytes(16).toString("hex");
      var dk = crypto.scryptSync(String(password), salt, 32).toString("hex");
      passwordHash = "scrypt$" + salt + "$" + dk;
      console.error("[WARN] password.cjs load failed, using scrypt fallback. reason=" + safeErr(e));
    } catch (e2) {
      die("[FATAL] both bcrypt and scrypt failed: " + safeErr(e2));
    }
  }

  // 查重
  var u = escapeSqlString(username);
  var existingId = "";
  try {
    var out = runSqlite(
      dbPath,
      ".mode list\n.headers off\n" +
        "SELECT id FROM users WHERE lower(username)=lower('" +
        u +
        "') LIMIT 1;\n"
    );
    existingId = (out || "").trim();
  } catch (e) {
    die("[FATAL] query user failed: " + safeErr(e));
  }

  if (existingId) {
    die('[ERROR] User "' + username + '" already exists (id: ' + existingId + ")", 1);
  }

  // 插入
  var id = crypto.randomUUID();
  var now = Date.now();
  var idSql = escapeSqlString(id);
  var ph = escapeSqlString(passwordHash);
  var tz = escapeSqlString(timezone);

  var ch = escapeSqlString(character);
  try {
    runSqlite(
      dbPath,
      "INSERT INTO users (id, username, password_hash, created_at, timezone, tier, character)\n" +
        "VALUES ('" +
        idSql +
        "', '" +
        u +
        "', '" +
        ph +
        "', " +
        now +
        ", '" +
        tz +
        "', " +
        tier +
        ", '" +
        ch +
        "');\n"
    );
  } catch (e) {
    die("[FATAL] insert user failed: " + safeErr(e));
  }

  console.log("[OK] User created:", { id: id, username: username, timezone: timezone, tier: tier, character: character });
  console.log("[INFO] dbPath:", dbPath);
  console.log("[INFO] password_hash format:", passwordHash.split("$").slice(0, 2).join("$") + "$...");
  process.exit(0);
})();
