// src/services/planned_events/constants.cjs

const UNCERTAIN_PATTERNS = [
  /可能/, /也许/, /考虑/, /打算/, /不一定/, /看情况/,
  /想/, /想要/, /准备/, /计划/, /应该会/, /大概/
];

const ACTION_PATTERNS = [
  /去(.{1,12}?)(?:[，。！？\s]|$)/,
  /来(.{1,12}?)(?:[，。！？\s]|$)/,
  /见(.{1,8}?)(?:[，。！？\s]|$)/,
  /(出门|回国|出远门|钓鱼|动物园|朋友来|逛街|看电影|健身|跑步|爬山|游泳|旅行|旅游|约会|聚餐|聚会|开会|面试|考试|上班|加班|值班)/,
];

const weekdayMap = {
  "一": 1, "二": 2, "三": 3, "四": 4, "五": 5, "六": 6, "日": 0, "天": 0,
  "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6,
  "0": 0, "7": 0
};

module.exports = { UNCERTAIN_PATTERNS, ACTION_PATTERNS, weekdayMap };
