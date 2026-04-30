// src/services/addressing/index.cjs
module.exports = {
  ...require("./repo.cjs"),
  ...require("./detect_addressing.cjs"),
  ...require("./parse_addressing_confirm.cjs"),
  ...require("./handle_addressing.cjs"),
};
