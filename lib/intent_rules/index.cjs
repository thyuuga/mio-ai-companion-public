// lib/intent_rules/index.cjs
// 意图检测规则模块导出

const { detectAdmin } = require("./detect_admin.cjs");
const { detectMemoryCmd } = require("./detect_memory_cmd.cjs");
const { detectPromise } = require("./detect_promise.cjs");
const { detectPlan } = require("./detect_plan.cjs");
const { detectQuestion } = require("./detect_question.cjs");

module.exports = {
  detectAdmin,
  detectMemoryCmd,
  detectPromise,
  detectPlan,
  detectQuestion,
};
