// src/services/recall/constants.cjs

const RECALL_THRESH = 0.65;  // bge-small-zh-v1.5 分数分布偏低，先降低阈值后续观察再调
const RECALL_TOPK = 6;
const CANDIDATE_LIMIT = 1500;  // 每通道最多读取的候选数
const FINAL_TOPK = 8;          // 合并后最多输出条数
const MEMORY_BONUS = 0.02;     // memory 类型统一加权

module.exports = {
  RECALL_THRESH,
  RECALL_TOPK,
  CANDIDATE_LIMIT,
  FINAL_TOPK,
  MEMORY_BONUS,
};
