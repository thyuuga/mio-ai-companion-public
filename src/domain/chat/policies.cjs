// src/domain/chat/policies.cjs
//
// 全局行为约束策略
// 每个策略以 string 形式注入 system prompt，控制 LLM 输出行为

// 上下文类型判断（用于小坚持策略的触发条件）
const STRONG_CONTEXT = /* — pattern omitted for preview — */ /placeholder/;
const SOFT_CONTEXT = /* — pattern omitted for preview — */ /placeholder/;

// 小坚持策略：允许角色在特定记忆锚点场景下表现低频的主动性
const SMALL_PERSISTENCE_POLICY = `/* — core logic omitted for preview — */`;

// 时间规则：强制 LLM 只使用系统注入的时间，禁止推断/捏造时间
const TIME_POLICY = `/* — core logic omitted for preview — */`;

// 互动边界策略：禁止命令式关心，关怀必须可拒绝
const INTERACTION_BOUNDARY_POLICY = `/* — core logic omitted for preview — */`;

// 括号动作/旁白规则：限制频率、长度、禁止连续
const BRACKET_POLICY = `/* — core logic omitted for preview — */`;

// 记忆表达约束：区分真实记忆引用 vs 推测，防止虚假记忆声明
const MEMORY_EXPRESSION_POLICY = `/* — core logic omitted for preview — */`;

// 对话行为原则：连接优先 / 不后退 / 对话延续 / 轻情绪 / 轨道一致性
const CONVERSATION_BEHAVIOR_POLICY = `/* — core logic omitted for preview — */`;

// 关系确认行为（仅 pre_established 角色使用）
const RELATIONSHIP_CONFIRMATION_POLICY = `/* — core logic omitted for preview — */`;

module.exports = {
  STRONG_CONTEXT,
  SOFT_CONTEXT,
  SMALL_PERSISTENCE_POLICY,
  TIME_POLICY,
  INTERACTION_BOUNDARY_POLICY,
  BRACKET_POLICY,
  MEMORY_EXPRESSION_POLICY,
  CONVERSATION_BEHAVIOR_POLICY,
  RELATIONSHIP_CONFIRMATION_POLICY,
};
