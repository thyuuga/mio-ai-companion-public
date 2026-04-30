// src/services/message_units/gates.cjs

/**
 * 判断是否为时间问句
 */
function isTimeQuestion(text) {
  /* — core logic omitted for preview — */
}

/**
 * (A) Hard gate：判断是否为代码/长文本粘贴，直接跳过软记忆候选管线
 */
function isCodeLikeOrLongPaste(message) {
  /* — core logic omitted for preview — */
}

  return false;
}

module.exports = { isTimeQuestion, isCodeLikeOrLongPaste };
