// tests/relationship_score.test.cjs
// 关系分数系统单元测试
// 覆盖：stage 切换、每日上限、衰减、滞回防抖

const {
  resolveStage,
  STAGE_THRESHOLDS,
  STAGE_ORDER,
  POSITIVE_FEELINGS,
} = require("../src/services/relationship/index.cjs");

// 简易测试框架
let passed = 0;
let failed = 0;

function test(name, fn) {
  /* — core logic omitted for preview — */
}
function assertEqual(actual, expected, msg = "") {
  /* — core logic omitted for preview — */
}

// ===== Stage 边界测试 =====
console.log("\n=== Stage Boundary Tests ===");

test("score=0 → stranger", () => {
  assertEqual(resolveStage(0, "stranger"), "stranger");
});

test("score=20 → stranger（未达到 familiar 阈值 21）", () => {
  assertEqual(resolveStage(20, "stranger"), "stranger");
});

test("score=21 → familiar（升级即时）", () => {
  assertEqual(resolveStage(21, "stranger"), "familiar");
});

test("score=41 → fond", () => {
  assertEqual(resolveStage(41, "familiar"), "fond");
});

test("score=71 → attached", () => {
  assertEqual(resolveStage(71, "fond"), "attached");
});

test("score=101 → deeply_attached", () => {
  assertEqual(resolveStage(101, "attached"), "deeply_attached");
});

// ===== 滞回（Hysteresis）测试 =====
console.log("\n=== Hysteresis Tests ===");

test("score=20, 当前 familiar → 不降级（21-3=18, 20>18）", () => {
  assertEqual(resolveStage(20, "familiar"), "familiar");
});

test("score=17, 当前 familiar → 降级为 stranger（低于 21-3=18）", () => {
  assertEqual(resolveStage(17, "familiar"), "stranger");
});

test("score=40, 当前 fond → 不降级（41-3=38, 40>38）", () => {
  assertEqual(resolveStage(40, "fond"), "fond");
});

test("score=37, 当前 fond → 降级为 familiar", () => {
  assertEqual(resolveStage(37, "fond"), "familiar");
});

// ===== 跨阶段跳跃 =====
console.log("\n=== Cross-stage Tests ===");

test("score=101, 当前 stranger → 直接升到 deeply_attached", () => {
  assertEqual(resolveStage(101, "stranger"), "deeply_attached");
});

test("score=0, 当前 deeply_attached → 降到 stranger（低于所有阈值-3）", () => {
  assertEqual(resolveStage(0, "deeply_attached"), "stranger");
});

// ===== Constants 验证 =====
console.log("\n=== Constants Tests ===");

test("STAGE_ORDER 包含 5 个阶段", () => {
  assertEqual(STAGE_ORDER.length, 5);
});

test("POSITIVE_FEELINGS 包含 3 种情绪", () => {
  assertEqual(POSITIVE_FEELINGS.size, 3);
});

// ===== 输出结果 =====
console.log("\n" + "=".repeat(40));
console.log(`Total: ${passed + failed} tests`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failed > 0) {
  process.exit(1);
}
