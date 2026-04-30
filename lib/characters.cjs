// lib/characters.cjs
//
// 角色配置中心：集中管理所有角色的属性，避免硬编码散落各处

const characters = {
  mio: {
    name: "Mio",
    personaFile: "mio.md",
    cookieName: "mio_auth",
    icon: "mio_icon.png",
    relationshipMode: "progressive",  // 从0建立关系
    awayMessages: {
      sleep: "Mio 已经睡着了…明天再来找她也可以。",
      morning: "Mio 刚起床，可能在忙早上的事情，暂时离开了。",
      busy: "Mio 有事离开了一会儿。",
      lunch: "Mio 可能去吃午饭了，稍后再回来。",
      dinner: "Mio 可能去吃晚饭了，稍后再回来。",
      study: "Mio 暂时离开了。",
      wind_down: "Mio 可能去准备休息了，晚安。",
      unknown: "Mio 现在不在。",
    },
  },
  len: {
    name: "Len",
    personaFile: "len.md",
    cookieName: "len_auth",
    icon: "len_icon.png",
    relationshipMode: "pre_established",  // 关系已存在，阶段表示表达强度
    awayMessages: {
      sleep: "Len 已经睡了…明天再来找他吧。",
      morning: "Len 刚起床，可能在忙早上的事情，暂时离开了。",
      busy: "Len 有事离开了一会儿。",
      lunch: "Len 可能去吃午饭了，稍后再回来。",
      dinner: "Len 可能去吃晚饭了，稍后再回来。",
      study: "Len 暂时离开了。",
      wind_down: "Len 可能去准备休息了，晚安。",
      unknown: "Len 现在不在。",
    },
  },
};

/**
 * 获取角色配置，不存在时 fallback 到 mio
 */
function getCharacter(productId) {
  return characters[productId] || characters.mio;
}

/**
 * 获取所有角色 ID
 */
function getCharacterIds() {
  return Object.keys(characters);
}

module.exports = { characters, getCharacter, getCharacterIds };
