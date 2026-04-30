// src/services/candidates/index.cjs
module.exports = {
  ...require("./constants.cjs"),
  ...require("./key.cjs"),
  ...require("./discard.cjs"),
  ...require("./promote_rules.cjs"),
  ...require("./hits.cjs"),
  ...require("./upsert.cjs"),
  ...require("./lifecycle.cjs"),
};
