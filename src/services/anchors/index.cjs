// src/services/anchors/index.cjs
module.exports = {
  ...require("./normalize.cjs"),
  ...require("./embeddings.cjs"),
  ...require("./match.cjs"),
  ...require("./emit_dialog_anchor.cjs"),
};
