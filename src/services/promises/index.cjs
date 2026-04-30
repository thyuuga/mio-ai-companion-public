// src/services/promises/index.cjs
// 纯导出汇总，不包含业务逻辑

module.exports = {
  // normalize.cjs
  ...require("./normalize.cjs"),

  // semantic_detect.cjs
  ...require("./semantic_detect.cjs"),

  // pair.cjs
  ...require("./pair.cjs"),
};
