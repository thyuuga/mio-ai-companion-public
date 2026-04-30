// lib/password.cjs
// 统一密码哈希格式：pbkdf2_sha256$120000$<saltHex>$<hashHex>
const crypto = require("crypto");

const ALGORITHM = "pbkdf2_sha256";
const ITERATIONS = 120000;
const KEY_LENGTH = 32;
const DIGEST = "sha256";

/**
 * 生成密码哈希
 * @param {string} password - 明文密码
 * @returns {string} 格式: pbkdf2_sha256$120000$<saltHex>$<hashHex>
 */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
  return `${ALGORITHM}$${ITERATIONS}$${salt}$${hash}`;
}

/**
 * 验证密码
 * @param {string} password - 明文密码
 * @param {string} stored - 存储的哈希字符串
 * @returns {{ ok: boolean, reason?: string }}
 */
function verifyPassword(password, stored) {
  if (!stored || typeof stored !== "string") {
    return { ok: false, reason: "invalid_stored_hash" };
  }

  // 新格式: pbkdf2_sha256$120000$<salt>$<hash>
  if (stored.startsWith("pbkdf2_sha256$")) {
    const parts = stored.split("$");
    if (parts.length !== 4) {
      return { ok: false, reason: "malformed_pbkdf2_hash" };
    }
    const [, iterStr, salt, expectedHash] = parts;
    const iterations = parseInt(iterStr, 10);
    if (!iterations || !salt || !expectedHash) {
      return { ok: false, reason: "malformed_pbkdf2_hash" };
    }

    const computedHash = crypto.pbkdf2Sync(password, salt, iterations, KEY_LENGTH, DIGEST).toString("hex");

    // 时间安全比较
    const expected = Buffer.from(expectedHash, "hex");
    const computed = Buffer.from(computedHash, "hex");
    if (expected.length !== computed.length) {
      return { ok: false, reason: "hash_length_mismatch" };
    }
    const ok = crypto.timingSafeEqual(expected, computed);
    return { ok, reason: ok ? undefined : "password_mismatch" };
  }

  // 旧格式兼容: salt:hash (create_user.cjs 之前生成的)
  if (stored.includes(":") && !stored.includes("$")) {
    const [salt, expectedHash] = stored.split(":");
    if (!salt || !expectedHash) {
      return { ok: false, reason: "malformed_legacy_hash" };
    }

    const computedHash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");

    const expected = Buffer.from(expectedHash, "hex");
    const computed = Buffer.from(computedHash, "hex");
    if (expected.length !== computed.length) {
      return { ok: false, reason: "hash_length_mismatch" };
    }
    const ok = crypto.timingSafeEqual(expected, computed);
    return { ok, reason: ok ? undefined : "password_mismatch" };
  }

  // bcrypt 格式 ($2a$, $2b$, $2y$) - 不支持，需要重置密码
  if (stored.startsWith("$2")) {
    return { ok: false, reason: "bcrypt_not_supported_please_reset" };
  }

  // 纯 hex（无 salt）- 无法验证
  return { ok: false, reason: "unsupported_hash_format" };
}

module.exports = { hashPassword, verifyPassword };
