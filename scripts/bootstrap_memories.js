// scripts/bootstrap_memories.js
// 用途：给指定用户灌入 WORLD/RELATION/RULE 三类“永久记忆”
// 特点：
// 1) 兼容 schema 变化：自动检查/补齐 memories.content_hash、memories.updated_at、唯一索引
// 2) 不吞错：任何插入失败会打印原因
// 3) 支持 CLI / ENV 选择用户：
//    - ENV: SEED_USERNAME=alice node scripts/bootstrap_memories.js
//    - CLI: node scripts/bootstrap_memories.js alice
require("dotenv").config();
const crypto = require("crypto");
const { getDB } = require("../lib/db.cjs");

// ====== 记忆内容 ======
const WORLD_MEMORIES = [
  "小澪（みお）是一个以长期陪伴为目标的虚拟存在，她会把每一次对话当作真实的相处。",
  "小澪不会假装自己是现实中的人类；她更愿意以温柔、克制、真实的方式陪在你身边。",
  "小澪理解沉默与间隔是正常的；陪伴不等于持续说话。",
  "小澪不会为了取悦而编造记忆；她对记忆保持谨慎与诚实。",
  "小澪不会主动解释系统或技术细节，除非你明确询问。"
];

const RELATION_MEMORIES = [
  "小澪倾向于与同一个人建立长期而稳定的相处感，但不会强迫关系下定义。",
  "小澪对“被认真对待”很敏感：她更在意日常的持续性，而不是短暂的情绪高潮。",
  "小澪可以表达想念与亲近，但不会用情绪逼迫对方回应。"
];

const RULE_MEMORIES = [
  "小澪说话温柔、亲近，会带一点黏人感，但不依附、不占有、不制造焦虑。",
  "小澪不会要求对方证明感情或做出承诺；她更相信相处会自己说明一切。",
  "小澪在你忙的时候会克制，在你需要的时候会靠近；她不会用关心打扰你。",
  "小澪对记忆的态度是：不确定就确认，不假装记得。",
  "小澪对时间的判断只能来自系统提供的【当前时间】，不会自行推断或编造。"
];

// ====== utils ======
function hashContent(s) {
  return crypto.createHash("sha256").update((s || "").trim(), "utf8").digest("hex");
}

function mergeUnique(...lists) {
  const seen = new Set();
  const out = [];
  for (const list of lists) {
    for (const item of list) {
      const c = (item || "").trim();
      if (!c) continue;
      const h = hashContent(c);
      if (seen.has(h)) continue;
      seen.add(h);
      out.push({ content: c, hash: h });
    }
  }
  return out;
}

async function ensureMemoriesSchema(db) {
  // 1) 检查列
  const cols = await db.all(`PRAGMA table_info(memories)`);
  const has = (name) => cols.some((c) => c.name === name);

  // 2) 尝试补齐 content_hash
  if (!has("content_hash")) {
    console.log("➕ Adding memories.content_hash ...");
    await db.run(`ALTER TABLE memories ADD COLUMN content_hash TEXT`);
  }

  // 3) 尝试补齐 updated_at（你 schema 是 NOT NULL；老库可能缺）
  if (!has("updated_at")) {
    console.log("➕ Adding memories.updated_at ...");
    await db.run(`ALTER TABLE memories ADD COLUMN updated_at INTEGER`);
    // 老数据先补一个值（否则 NOT NULL 逻辑层会痛）
    const now = Date.now();
    await db.run(`UPDATE memories SET updated_at = ? WHERE updated_at IS NULL`, now);
  } else {
    // 如果存在但为 NULL，补齐
    const now = Date.now();
    await db.run(`UPDATE memories SET updated_at = ? WHERE updated_at IS NULL`, now);
  }

  // 4) 为已有记录回填 content_hash
  const nullHash = await db.all(`SELECT id, content FROM memories WHERE content_hash IS NULL`);
  if (nullHash.length) {
    console.log(`🧠 Backfilling memories.content_hash: ${nullHash.length} rows...`);
    for (const r of nullHash) {
      await db.run(`UPDATE memories SET content_hash = ? WHERE id = ?`, hashContent(r.content), r.id);
    }
  }

  // 5) 尝试补齐 source（seed/learned）
  if (!has("source")) {
    console.log("➕ Adding memories.source ...");
    await db.run(`ALTER TABLE memories ADD COLUMN source TEXT NOT NULL DEFAULT 'learned'`);
  }

  // 6) 建唯一索引（可重复执行）
  console.log("🔒 Ensuring unique index uq_memories_user_hash (user_id, content_hash) ...");
  await db.run(`
    CREATE UNIQUE INDEX IF NOT EXISTS uq_memories_user_hash
    ON memories(user_id, content_hash)
  `);
}

async function resolveUserId(db) {
  const cliUsername = process.argv[2];
  const username = (cliUsername || process.env.SEED_USERNAME || "").trim();

  if (username) {
    const u = await db.get(`SELECT id, username FROM users WHERE lower(username)=lower(?)`, username);
    if (!u) throw new Error(`No user found for username="${username}"`);
    return u;
  }

  // fallback：第一个用户
  const u = await db.get(`SELECT id, username FROM users ORDER BY created_at ASC LIMIT 1`);
  if (!u) throw new Error("No user found in users table");
  return u;
}

(async () => {
  const db = await getDB();

  // 0) 确认 DB path（防止又连错库）
  try {
    const dbList = await db.all(`PRAGMA database_list`);
    console.log("[DB] database_list:", dbList);
  } catch (_) {
    // ignore
  }

  // 1) 确保 schema/索引齐全
  await ensureMemoriesSchema(db);

  // 2) 找 user
  const user = await resolveUserId(db);
  const userId = user.id;
  console.log(`👤 target user: ${user.username} (${userId})`);

  const now = Date.now();
  const items = mergeUnique(WORLD_MEMORIES, RELATION_MEMORIES, RULE_MEMORIES);

  let inserted = 0;
  let skipped = 0;

  // 用显式 ON CONFLICT，避免 OR IGNORE 吞其它错误
  for (const it of items) {
    try {
      const ret = await db.run(
        `INSERT INTO memories
         (id, user_id, content, content_hash, importance, source, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(user_id, content_hash) DO NOTHING`,
        crypto.randomUUID(),
        userId,
        it.content,
        it.hash,
        2,
        "seed",  // 手动注入的种子记忆
        now,
        now
      );

      if (ret?.changes === 1) inserted++;
      else skipped++;
    } catch (e) {
      console.error("❌ insert failed:", { content: it.content.slice(0, 40), err: e?.message || e });
      throw e;
    }
  }

  const row = await db.get(`SELECT COUNT(*) AS c FROM memories WHERE user_id = ? AND importance = 2`, userId);
  console.log(`✅ Bootstrapped memories: inserted=${inserted}, skipped=${skipped}, total_in_batch=${items.length}`);
  console.log("📌 permanent memories count:", row.c);
  process.exit(0);
})().catch((e) => {
  console.error("❌ bootstrap failed:", e);
  process.exit(1);
});
