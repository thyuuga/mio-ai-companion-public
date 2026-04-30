// src/services/message_filter/index.cjs
module.exports = {
  ...require("./coarse_filter.cjs"),
  ...require("./filter_message.cjs"),
};
