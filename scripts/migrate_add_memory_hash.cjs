// scripts/migrate_add_memory_hash.js
require("dotenv").config();
const crypto = require("crypto");
const { getDB } = require("../lib/db.cjs");

function hashContent(text) {
  return crypto
    .createHash("sha256")
    .update((text || "").trim(), "utf8")
    .digest("hex");
}

// 只做“单一路径”：要么 promise 风格，要么 callback 风格（不双调用）
async function isPromiseDB(db) {
  try {
    const ret = db.all(`PRAGMA database_list`);
    return ret && typeof ret.then === "function";
  } catch {
    return false;
  }
}

function allCb(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}
function runCb(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

(async () => {
  const db = await getDB();
  const promiseMode = await isPromiseDB(db);

  const all = (sql, params = []) =>
    promiseMode ? db.all(sql, ...params) : allCb(db, sql, params);
  const run = (sql, params = []) =>
    promiseMode ? db.run(sql, ...params) : runCb(db, sql, params);

  const dbList = await all(`PRAGMA database_list`);
  console.log("DB:", dbList);

  console.log("🔧 Migrating memories.content_hash ...");

  // 1) 先看列在不在
  const cols0 = await all(`PRAGMA table_info(memories)`);
  const has0 = cols0.some((c) => c.name === "content_hash");

  if (!has0) {
    console.log("➕ Adding content_hash column...");
    await run(`ALTER TABLE memories ADD COLUMN content_hash TEXT`);
  } else {
    console.log("ℹ️ content_hash already exists");
  }

  // 2) 再确认一次（防止你连错库/或 ALTER 没生效）
  const cols1 = await all(`PRAGMA table_info(memories)`);
  const has1 = cols1.some((c) => c.name === "content_hash");
  if (!has1) {
    throw new Error("content_hash still missing. Check DB path (PRAGMA database_list)!");
  }
  console.log("✅ content_hash verified");

  // 3) backfill（只补 NULL）
  const rows = await all(`SELECT id, content FROM memories WHERE content_hash IS NULL`);
  console.log(`🧠 Backfilling ${rows.length} memories...`);

  for (const row of rows) {
    const h = hashContent(row.content);
    await run(`UPDATE memories SET content_hash = ? WHERE id = ?`, [h, row.id]);
  }

  // 4) 建唯一索引（可重复执行）
  await run(`
    CREATE UNIQUE INDEX IF NOT EXISTS uq_memories_user_hash
    ON memories(user_id, content_hash)
  `);

  console.log("🎉 Migration complete");
  process.exit(0);
})().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
