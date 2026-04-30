// tests/intent_router.test.cjs
// Intent classification 单元测试
// V2: question 作为 signal，不影响 plan/promise flags

const {
  classifyUserIntent,
  isQuestionLike,
  detectAdmin,
  detectMemoryCmd,
  detectPromise,
  detectPlan,
} = require("../lib/intent_router.cjs");

// 简易测试框架
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`✓ ${name}`);
  } catch (e) {
    failed++;
    console.error(`✗ ${name}`);
    console.error(`  ${e.message}`);
  }
}

function assertEqual(actual, expected, msg = "") {
  if (actual !== expected) {
    throw new Error(`${msg} Expected ${expected}, got ${actual}`);
  }
}

function assertTrue(value, msg = "") {
  if (!value) {
    throw new Error(`${msg} Expected true, got ${value}`);
  }
}

function assertFalse(value, msg = "") {
  if (value) {
    throw new Error(`${msg} Expected false, got ${value}`);
  }
}

// ===== Admin 测试 =====
console.log("\n=== Admin Tests ===");

test("代码块应判为 admin", () => {
  const result = classifyUserIntent("```js\nconsole.log('test')\n```");
  assertEqual(result.intent, "admin");
  assertFalse(result.flags.allowPlannedEvents);
  assertFalse(result.flags.allowPromises);
});

test("文件路径应判为 admin", () => {
  const result = classifyUserIntent("请修改 /src/domain/chat/handle_chat.cjs");
  assertEqual(result.intent, "admin");
});

test("git 命令应判为 admin", () => {
  const result = classifyUserIntent("执行 git status 看看");
  assertEqual(result.intent, "admin");
});

test("日志特征应判为 admin", () => {
  const result = classifyUserIntent("[ERROR] Connection failed at line 42");
  assertEqual(result.intent, "admin");
});

test("SQL 查询应判为 admin", () => {
  const result = classifyUserIntent("SELECT * FROM users WHERE id = 1");
  assertEqual(result.intent, "admin");
});

// ===== Memory Cmd 测试（收紧后）=====
console.log("\n=== Memory Cmd Tests ===");

test("'记住我喜欢吃草莓' 应判为 memory_cmd", () => {
  const result = classifyUserIntent("记住我喜欢吃草莓");
  assertEqual(result.intent, "memory_cmd");
  assertTrue(result.flags.allowMemoryCmd);
});

test("'帮我记一下这个' 应判为 memory_cmd", () => {
  const result = classifyUserIntent("帮我记一下这个");
  assertEqual(result.intent, "memory_cmd");
});

test("'不要记这个' 应判为 memory_cmd", () => {
  const result = classifyUserIntent("不要记这个");
  assertEqual(result.intent, "memory_cmd");
});

test("'忘了吧' 应判为 memory_cmd", () => {
  const result = classifyUserIntent("忘了吧");
  assertEqual(result.intent, "memory_cmd");
});

test("'记得吃饭' 不应判为 memory_cmd（日常叮嘱）", () => {
  const result = classifyUserIntent("记得吃饭");
  assertEqual(result.intent, "chat", "'记得吃饭' should be chat");
});

test("'你记得那天吗' 应判为 chat 但 isQuestion=true", () => {
  const result = classifyUserIntent("你记得那天吗");
  assertEqual(result.intent, "chat");
  assertTrue(result.signals.isQuestion);
  assertEqual(result.primary_intent, "question");
});

// ===== Promise 测试（收紧后）=====
console.log("\n=== Promise Tests ===");

test("'我答应你明天开始早睡' 应判为 promise", () => {
  const result = classifyUserIntent("我答应你明天开始早睡");
  assertEqual(result.intent, "promise");
});

test("'一言为定' 应判为 promise（强承诺词）", () => {
  const result = classifyUserIntent("一言为定");
  assertEqual(result.intent, "promise");
});

test("'我保证' 应判为 promise（强承诺词）", () => {
  const result = classifyUserIntent("我保证");
  assertEqual(result.intent, "promise");
});

test("'我会每天锻炼的' 应判为 promise（有明确时间词）", () => {
  const result = classifyUserIntent("我会每天锻炼的");
  assertEqual(result.intent, "promise");
});

test("'从明天开始我会早起的' 应判为 promise", () => {
  const result = classifyUserIntent("从明天开始我会早起的");
  assertEqual(result.intent, "promise");
});

test("'我会努力的' 不应判为 promise（无明确时间词）", () => {
  const result = classifyUserIntent("我会努力的");
  assertEqual(result.intent, "chat", "'我会努力的' should be chat");
});

test("'我会想办法的' 不应判为 promise（无明确时间词）", () => {
  const result = classifyUserIntent("我会想办法的");
  assertEqual(result.intent, "chat", "'我会想办法的' should be chat");
});

// ===== Plan 测试 =====
console.log("\n=== Plan Tests ===");

test("'后天去鸭川' 应判为 plan", () => {
  const result = classifyUserIntent("后天去鸭川");
  assertEqual(result.intent, "plan");
  assertTrue(result.flags.allowPlannedEvents);
});

test("'下周末想去京都玩' 应判为 plan", () => {
  const result = classifyUserIntent("下周末想去京都玩");
  assertEqual(result.intent, "plan");
});

test("'明天打算去健身' 应判为 plan", () => {
  const result = classifyUserIntent("明天打算去健身");
  assertEqual(result.intent, "plan");
});

test("'我们7月去宫古岛吧' 应判为 plan", () => {
  const result = classifyUserIntent("我们7月去宫古岛吧");
  assertEqual(result.intent, "plan");
});

test("'我们七月去宫古岛' 应判为 plan", () => {
  const result = classifyUserIntent("我们七月去宫古岛");
  assertEqual(result.intent, "plan");
});

test("'计划下个月去旅行' 应判为 plan", () => {
  const result = classifyUserIntent("计划下个月去旅行");
  assertEqual(result.intent, "plan");
});

// ===== V2 核心测试：question + plan 不互斥 =====
console.log("\n=== V2: Question + Plan 不互斥 ===");

test("'七月份我们一起去宫古岛怎么样？' - plan + question 同时生效", () => {
  const result = classifyUserIntent("七月份我们一起去宫古岛怎么样？");
  assertEqual(result.intent, "plan", "intent should be plan");
  assertTrue(result.signals.isQuestion, "should be detected as question");
  assertEqual(result.primary_intent, "question", "primary_intent should be question");
  assertTrue(result.flags.allowPlannedEvents, "allowPlannedEvents should be true");
});

test("'明天去哪里玩呢？' - 纯问句，但如果有 plan 特征仍开启", () => {
  const result = classifyUserIntent("明天去哪里玩呢？");
  // 这个例子可能没有强 plan 特征（"哪里"是疑问词），所以可能是 chat
  // 但关键是 signals.isQuestion = true
  assertTrue(result.signals.isQuestion, "should be detected as question");
  assertEqual(result.primary_intent, "question", "primary_intent should be question");
});

test("'我们下周去看电影可以吗？' - promise候选 + question", () => {
  const result = classifyUserIntent("我们下周去看电影可以吗？");
  // 这个可能是 plan（下周+去+看电影）
  assertTrue(result.signals.isQuestion, "should be detected as question");
  assertEqual(result.primary_intent, "question", "primary_intent should be question");
  // 关键：flags 不被 question 关闭
  assertTrue(result.flags.allowPlannedEvents || result.flags.allowPromises,
    "plan or promise pipeline should be allowed");
});

// ===== isQuestionLike 测试 =====
console.log("\n=== isQuestionLike Tests ===");

test("问号结尾识别为问句", () => {
  assertTrue(isQuestionLike("你喜欢吃什么？"));
  assertTrue(isQuestionLike("可以吗?"));
});

test("疑问词识别为问句", () => {
  assertTrue(isQuestionLike("你怎么想"));
  assertTrue(isQuestionLike("这是什么"));
  assertTrue(isQuestionLike("可以吗"));
  assertTrue(isQuestionLike("行不行"));
  assertTrue(isQuestionLike("好吗"));
});

test("普通陈述句不是问句", () => {
  assertFalse(isQuestionLike("今天天气真好"));
  assertFalse(isQuestionLike("我喜欢吃草莓"));
  assertFalse(isQuestionLike("明天去健身"));
});

// ===== Chat 测试 =====
console.log("\n=== Chat Tests ===");

test("'今天天气真好' 应判为 chat", () => {
  const result = classifyUserIntent("今天天气真好");
  assertEqual(result.intent, "chat");
  assertTrue(result.flags.allowSoftMemory);
});

test("'我有点累' 应判为 chat", () => {
  const result = classifyUserIntent("我有点累");
  assertEqual(result.intent, "chat");
});

test("'嗯' 应判为 chat", () => {
  const result = classifyUserIntent("嗯");
  assertEqual(result.intent, "chat");
});

// ===== 边界情况 =====
console.log("\n=== Edge Cases ===");

test("空字符串应判为 chat", () => {
  const result = classifyUserIntent("");
  assertEqual(result.intent, "chat");
  assertFalse(result.signals.isQuestion);
});

test("null 输入应判为 chat", () => {
  const result = classifyUserIntent(null);
  assertEqual(result.intent, "chat");
});

test("undefined 输入应判为 chat", () => {
  const result = classifyUserIntent(undefined);
  assertEqual(result.intent, "chat");
});

// ===== 验收用例 =====
console.log("\n=== 验收用例 ===");

test("验收1: '我们八月去琵琶湖吧' - plan 也允许 promises", () => {
  const result = classifyUserIntent("我们八月去琵琶湖吧");
  assertEqual(result.intent, "plan", "intent should be plan");
  assertTrue(result.flags.allowPlannedEvents, "flags.allowPlannedEvents = true");
  assertTrue(result.flags.allowPromises, "flags.allowPromises = true (plan allows promises)");
});

test("验收2: '七月份我们一起去宫古岛怎么样？' - plan + question + promises", () => {
  const result = classifyUserIntent("七月份我们一起去宫古岛怎么样？");
  assertEqual(result.intent, "plan", "intent should be plan");
  assertEqual(result.primary_intent, "question", "primary_intent should be question");
  assertTrue(result.signals.isQuestion, "signals.isQuestion = true");
  assertTrue(result.flags.allowPlannedEvents, "flags.allowPlannedEvents = true");
  assertTrue(result.flags.allowPromises, "flags.allowPromises = true (plan allows promises)");
});

test("验收3: '我们下周去看电影可以吗？'", () => {
  const result = classifyUserIntent("我们下周去看电影可以吗？");
  assertTrue(result.signals.isQuestion);
  assertTrue(result.flags.allowPlannedEvents, "plan pipeline should be enabled");
  assertTrue(result.flags.allowPromises, "promise pipeline should be enabled");
});

test("验收4: '今天星期几？' - 纯问句", () => {
  const result = classifyUserIntent("今天星期几？");
  assertTrue(result.signals.isQuestion);
  assertEqual(result.intent, "chat"); // 没有 plan/promise 特征
});

test("验收5: '记住我喜欢草莓。' - memory_cmd 不受影响", () => {
  const result = classifyUserIntent("记住我喜欢草莓。");
  assertEqual(result.intent, "memory_cmd");
  assertTrue(result.flags.allowMemoryCmd);
});

// ===== 输出结果 =====
console.log("\n" + "=".repeat(40));
console.log(`Total: ${passed + failed} tests`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failed > 0) {
  process.exit(1);
}
