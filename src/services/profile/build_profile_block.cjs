// src/services/profile/build_profile_block.cjs
//
// 将 user_profile 转成每轮固定注入的 prompt block

const { getProfile } = require("./repo.cjs");

// ===== family_json → 自然语言 =====

const NUM_WORDS = ["零", "一", "两", "三", "四", "五", "六", "七", "八", "九", "十"];

const FAMILY_ROLE_MAP = {
  father: "父亲",
  mother: "母亲",
  older_brother: "哥哥",
  younger_brother: "弟弟",
  older_sister: "姐姐",
  younger_sister: "妹妹",
  spouse: "配偶",
  children: "孩子",
};

/**
 * familyToText - 将 family_json 对象转成自然语言短句
 * @param {object} family
 * @returns {string} 如 "有一个弟弟、一个妹妹"，为空时返回 ""
 */
function familyToText(family) {
  /* — core logic omitted for preview — */
}

// ===== prompt block 构建 =====

/**
 * buildUserProfileBlock - 读取 user_profile 并构建 prompt block
 * @param {object} db
 * @param {string} userId
 * @returns {Promise<string>} prompt block 字符串，为空时返回 ""
 */
async function buildUserProfileBlock(db, userId) {
  /* — core logic omitted for preview — */
}

module.exports = { buildUserProfileBlock, familyToText };
