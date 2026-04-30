// src/services/burst/index.cjs
//
// Burst 连发模块 barrel export

module.exports = {
  ...require("./analyze.cjs"),
  ...require("./generate.cjs"),
  ...require("./store.cjs"),
  ...require("./guard.cjs"),
};
