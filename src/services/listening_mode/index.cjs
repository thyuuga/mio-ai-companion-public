// src/services/listening_mode/index.cjs

const { detectStrongSignal, detectWeakSignal } = require("./detect.cjs");
const {
  getListeningState,
  enterListeningMode,
  exitListeningMode,
  startPending,
  updatePending,
  cancelPending,
  incrementListeningTurn,
} = require("./store.cjs");
const { buildListeningBlock } = require("./block.cjs");
const { checkListeningExit } = require("./exit_check.cjs");

module.exports = {
  detectStrongSignal,
  detectWeakSignal,
  getListeningState,
  enterListeningMode,
  exitListeningMode,
  startPending,
  updatePending,
  cancelPending,
  incrementListeningTurn,
  buildListeningBlock,
  checkListeningExit,
};
