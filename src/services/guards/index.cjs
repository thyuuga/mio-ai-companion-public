// src/services/guards/index.cjs
module.exports = {
  ...require("./opener.cjs"),
  ...require("./self_dismissal.cjs"),
  ...require("./time_pressure.cjs"),
  ...require("./stage_directions.cjs"),
  ...require("./plot_advancement.cjs"),
  ...require("./memory_claim.cjs"),
};
