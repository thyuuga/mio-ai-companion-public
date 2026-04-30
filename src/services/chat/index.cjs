// src/services/chat/index.cjs
//
// Chat service 入口
//
// 导出 handle_chat 相关辅助函数和管道

module.exports = {
  ...require("./helpers.cjs"),
  ...require("./pipelines/write.cjs"),
  ...require("./prompt_inputs.cjs"),
};
