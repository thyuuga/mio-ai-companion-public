// src/services/prompt_blocks/index.cjs
module.exports = {
  ...require("./promises.cjs"),
  ...require("./today_event.cjs"),
  ...require("./continuation_rules.cjs"),
};
