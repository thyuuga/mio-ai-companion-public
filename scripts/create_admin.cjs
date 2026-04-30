#!/usr/bin/env node
// scripts/create_admin.cjs
// Usage: node scripts/create_admin.cjs <username> <password>

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

(function main() {
  var username = process.argv[2];
  var password = process.argv[3];

  if (!username || !password) {
    die("Usage: node scripts/create_admin.cjs <username> <password>");
  }

  var ROOT = path.resolve(__dirname, "..");
  var dbPath = process.env.DB_PATH
    ? path.resolve(process.env.DB_PATH)
    : path.join(ROOT, "data", "mio.sqlite");

  // sqlite3 CLI
  try {
    child.execFileSync("sqlite3", ["-version"], { encoding: "utf8" });
  } catch (e) {
    die("[FATAL] sqlite3 CLI not found. Install: brew install sqlite");
  }

  // 确保 admins 表存在
  try {
    runSqlite(
      dbPath,
      "CREATE TABLE IF NOT EXISTS admins (id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at INTEGER NOT NULL);\n" +
        "CREATE TABLE IF NOT EXISTS admin_sessions (id TEXT PRIMARY KEY, admin_id TEXT NOT NULL, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, FOREIGN KEY(admin_id) REFERENCES admins(id) ON DELETE CASCADE);\n"
    );
  } catch (e) {
    die("[FATAL] create admins table failed: " + safeErr(e));
  }

  // password hash
  var passwordHash = null;
  try {
    var pw = require("../lib/password.cjs");
    passwordHash = pw.hashPassword(password);
  } catch (e) {
    var salt = crypto.randomBytes(16).toString("hex");
    var dk = crypto.pbkdf2Sync(String(password), salt, 120000, 32, "sha256").toString("hex");
    passwordHash = "pbkdf2_sha256$120000$" + salt + "$" + dk;
    console.error("[WARN] password.cjs load failed, using inline pbkdf2. reason=" + safeErr(e));
  }

  // 查重
  var u = escapeSqlString(username);
  var existingId = "";
  try {
    var out = runSqlite(
      dbPath,
      ".mode list\n.headers off\nSELECT id FROM admins WHERE lower(username)=lower('" + u + "') LIMIT 1;\n"
    );
    existingId = (out || "").trim();
  } catch (e) {
    die("[FATAL] query admin failed: " + safeErr(e));
  }

  if (existingId) {
    die('[ERROR] Admin "' + username + '" already exists (id: ' + existingId + ")", 1);
  }

  // 插入
  var id = crypto.randomUUID();
  var now = Date.now();
  var ph = escapeSqlString(passwordHash);

  try {
    runSqlite(
      dbPath,
      "INSERT INTO admins (id, username, password_hash, created_at) VALUES ('" +
        escapeSqlString(id) + "', '" + u + "', '" + ph + "', " + now + ");\n"
    );
  } catch (e) {
    die("[FATAL] insert admin failed: " + safeErr(e));
  }

  console.log("[OK] Admin created:", { id: id, username: username });
  console.log("[INFO] dbPath:", dbPath);
  process.exit(0);
})();
