// src/services/profile/index.cjs
module.exports = {
  ...require("./repo.cjs"),
  ...require("./detect_profile_cmd.cjs"),
  ...require("./build_profile_block.cjs"),
};
