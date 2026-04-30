const crypto = require("crypto");

// 用于内容去重/索引（非安全用途）
function computeContentHash(content, { len = 16 } = {}) {
  const hex = crypto
    .createHash("sha256")
    .update(String(content ?? ""), "utf8")
    .digest("hex");
  return len ? hex.slice(0, len) : hex;
}

module.exports = { computeContentHash };
