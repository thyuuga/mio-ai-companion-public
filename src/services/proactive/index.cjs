// src/services/proactive/index.cjs
//
// Proactive message 模块 barrel export

module.exports = {
  ...require("./store.cjs"),
  ...require("./scheduler.cjs"),
  ...require("./context.cjs"),
  ...require("./generate.cjs"),
  ...require("./gates.cjs"),
};
