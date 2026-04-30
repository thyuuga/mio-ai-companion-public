// src/services/followup/index.cjs
//
// Follow-up Nudge 服务入口
// 存在感跃迁 v1：轻跟进提示

module.exports = {
  ...require("./detect.cjs"),
  ...require("./store.cjs"),
  ...require("./block.cjs"),
};
