// src/services/guards/constants.cjs

// Fix1 常量：重逢语义分档阈值
const GAP_REUNION_SOFT_HOURS = 20;   // <20h 视为连续关系，不提间隔
const GAP_REUNION_STRONG_HOURS = 36; // >=36h 才允许轻重逢

module.exports = { GAP_REUNION_SOFT_HOURS, GAP_REUNION_STRONG_HOURS };
