// =============================================
// 物理开关_事件触发器
// 监听MVU变量变化，自动控制事件条目的开关
// 世界书名称：兄妹禁忌
// =============================================

await waitGlobalInitialized('Mvu');

const WORLD_BOOK_NAME = '兄妹禁忌';

const EVENT_CONFIGS = {
  // ===== 林夕（1件） =====
  '林夕_夜袭_事件': {
    condition: (vars) => {
      const state = _.get(vars, 'stat_data.林夕.病娇状态') || '未触发';
      return state !== '未触发';
    }
  },

  // ===== 张晓曼（7件） =====
  '张晓曼_公司初遇_事件': {
    condition: (vars) => {
      const appeared = _.get(vars, 'stat_data.事件.张晓曼.公司初遇') || false;
      return !appeared;
    }
  },
  '张晓曼_午餐邀约_事件': {
    condition: (vars) => {
      const appeared = _.get(vars, 'stat_data.事件.张晓曼.公司初遇') || false;
      const completed = _.get(vars, 'stat_data.事件.张晓曼.午餐邀约') || false;
      return appeared === true && !completed;
    }
  },
  '张晓曼_雨天送伞_事件': {
    condition: (vars) => {
      const weather = _.get(vars, 'stat_data.世界.天气');
      const appeared = _.get(vars, 'stat_data.事件.张晓曼.公司初遇') || false;
      const completed = _.get(vars, 'stat_data.事件.张晓曼.雨天送伞') || false;
      return weather === '雨' && appeared === true && !completed;
    }
  },
  '张晓曼_深夜加班_事件': {
    condition: (vars) => {
      const time = _.get(vars, 'stat_data.世界.时段');
      const appeared = _.get(vars, 'stat_data.事件.张晓曼.雨天送伞') || false;
      const completed = _.get(vars, 'stat_data.事件.张晓曼.深夜加班') || false;
      return time === '深夜' && appeared === true && !completed;
    }
  },
  '张晓曼_酒吧偶遇_事件': {
    condition: (vars) => {
      const appeared = _.get(vars, 'stat_data.事件.张晓曼.深夜加班') || false;
      const completed = _.get(vars, 'stat_data.事件.张晓曼.酒吧偶遇') || false;
      return appeared === true && !completed;
    }
  },
  '张晓曼_告白_事件': {
    condition: (vars) => {
      const appeared = _.get(vars, 'stat_data.事件.张晓曼.酒吧偶遇') || false;
      const completed = _.get(vars, 'stat_data.事件.张晓曼.告白') || false;
      return appeared === true && !completed;
    }
  },
  '张晓曼_交往_事件': {
    condition: (vars) => {
      const appeared = _.get(vars, 'stat_data.事件.张晓曼.告白') || false;
      const completed = _.get(vars, 'stat_data.事件.张晓曼.交往') || false;
      return appeared === true && !completed;
    }
  },

  // ===== 赵雅兰（7件） =====
  '赵雅兰_走廊相遇_事件': {
    condition: (vars) => {
      const appeared = _.get(vars, 'stat_data.事件.赵雅兰.走廊相遇') || false;
      return !appeared;
    }
  },
  '赵雅兰_深夜借酒_事件': {
    condition: (vars) => {
      const time = _.get(vars, 'stat_data.世界.时段');
      const appeared = _.get(vars, 'stat_data.事件.赵雅兰.走廊相遇') || false;
      const completed = _.get(vars, 'stat_data.事件.赵雅兰.深夜借酒') || false;
      return time === '深夜' && appeared === true && !completed;
    }
  },
  '赵雅兰_阳台谈心_事件': {
    condition: (vars) => {
      const appeared = _.get(vars, 'stat_data.事件.赵雅兰.深夜借酒') || false;
      const completed = _.get(vars, 'stat_data.事件.赵雅兰.阳台谈心') || false;
      return appeared === true && !completed;
    }
  },
  '赵雅兰_女儿撞见_事件': {
    condition: (vars) => {
      const appeared = _.get(vars, 'stat_data.事件.赵雅兰.阳台谈心') || false;
      const completed = _.get(vars, 'stat_data.事件.赵雅兰.女儿撞见') || false;
      return appeared === true && !completed;
    }
  },
  '赵雅兰_公园散步_事件': {
    condition: (vars) => {
      const appeared = _.get(vars, 'stat_data.事件.赵雅兰.女儿撞见') || false;
      const completed = _.get(vars, 'stat_data.事件.赵雅兰.公园散步') || false;
      return appeared === true && !completed;
    }
  },
  '赵雅兰_成熟告白_事件': {
    condition: (vars) => {
      const appeared = _.get(vars, 'stat_data.事件.赵雅兰.公园散步') || false;
      const completed = _.get(vars, 'stat_data.事件.赵雅兰.成熟告白') || false;
      return appeared === true && !completed;
    }
  },
  '赵雅兰_公开相处_事件': {
    condition: (vars) => {
      const appeared = _.get(vars, 'stat_data.事件.赵雅兰.成熟告白') || false;
      const completed = _.get(vars, 'stat_data.事件.赵雅兰.公开相处') || false;
      return appeared === true && !completed;
    }
  },

  // ===== 赵梦琪（7件） =====
  '赵梦琪_校园偶遇_事件': {
    condition: (vars) => {
      const appeared = _.get(vars, 'stat_data.事件.赵梦琪.校园偶遇') || false;
      return !appeared;
    }
  },
  '赵梦琪_咖啡厅独处_事件': {
    condition: (vars) => {
      const appeared = _.get(vars, 'stat_data.事件.赵梦琪.校园偶遇') || false;
      const completed = _.get(vars, 'stat_data.事件.赵梦琪.咖啡厅独处') || false;
      return appeared === true && !completed;
    }
  },
  '赵梦琪_深夜来电_事件': {
    condition: (vars) => {
      const time = _.get(vars, 'stat_data.世界.时段');
      const appeared = _.get(vars, 'stat_data.事件.赵梦琪.咖啡厅独处') || false;
      const completed = _.get(vars, 'stat_data.事件.赵梦琪.深夜来电') || false;
      return time === '深夜' && appeared === true && !completed;
    }
  },
  '赵梦琪_天台谈心_事件': {
    condition: (vars) => {
      const appeared = _.get(vars, 'stat_data.事件.赵梦琪.深夜来电') || false;
      const completed = _.get(vars, 'stat_data.事件.赵梦琪.天台谈心') || false;
      return appeared === true && !completed;
    }
  },
  '赵梦琪_骑车兜风_事件': {
    condition: (vars) => {
      const appeared = _.get(vars, 'stat_data.事件.赵梦琪.天台谈心') || false;
      const completed = _.get(vars, 'stat_data.事件.赵梦琪.骑车兜风') || false;
      return appeared === true && !completed;
    }
  },
  '赵梦琪_闺蜜坦白_事件': {
    condition: (vars) => {
      const appeared = _.get(vars, 'stat_data.事件.赵梦琪.骑车兜风') || false;
      const completed = _.get(vars, 'stat_data.事件.赵梦琪.闺蜜坦白') || false;
      return appeared === true && !completed;
    }
  },
  '赵梦琪_正式约会_事件': {
    condition: (vars) => {
      const appeared = _.get(vars, 'stat_data.事件.赵梦琪.闺蜜坦白') || false;
      const completed = _.get(vars, 'stat_data.事件.赵梦琪.正式约会') || false;
      return appeared === true && !completed;
    }
  },

  // ===== 苏小薇（7件） =====
  '苏小薇_大学初见_事件': {
    condition: (vars) => {
      const appeared = _.get(vars, 'stat_data.事件.苏小薇.大学初见') || false;
      return !appeared;
    }
  },
  '苏小薇_深夜消息_事件': {
    condition: (vars) => {
      const time = _.get(vars, 'stat_data.世界.时段');
      const appeared = _.get(vars, 'stat_data.事件.苏小薇.大学初见') || false;
      const completed = _.get(vars, 'stat_data.事件.苏小薇.深夜消息') || false;
      return time === '深夜' && appeared === true && !completed;
    }
  },
  '苏小薇_尴尬开门_事件': {
    condition: (vars) => {
      const appeared = _.get(vars, 'stat_data.事件.苏小薇.深夜消息') || false;
      const completed = _.get(vars, 'stat_data.事件.苏小薇.尴尬开门') || false;
      return appeared === true && !completed;
    }
  },
  '苏小薇_闺蜜试探_事件': {
    condition: (vars) => {
      const appeared = _.get(vars, 'stat_data.事件.苏小薇.尴尬开门') || false;
      const completed = _.get(vars, 'stat_data.事件.苏小薇.闺蜜试探') || false;
      return appeared === true && !completed;
    }
  },
  '苏小薇_甜品店打卡_事件': {
    condition: (vars) => {
      const appeared = _.get(vars, 'stat_data.事件.苏小薇.闺蜜试探') || false;
      const completed = _.get(vars, 'stat_data.事件.苏小薇.甜品店打卡') || false;
      return appeared === true && !completed;
    }
  },
  '苏小薇_互相坦白_事件': {
    condition: (vars) => {
      const appeared = _.get(vars, 'stat_data.事件.苏小薇.甜品店打卡') || false;
      const completed = _.get(vars, 'stat_data.事件.苏小薇.互相坦白') || false;
      return appeared === true && !completed;
    }
  },
  '苏小薇_秘密约会_事件': {
    condition: (vars) => {
      const appeared = _.get(vars, 'stat_data.事件.苏小薇.互相坦白') || false;
      const completed = _.get(vars, 'stat_data.事件.苏小薇.秘密约会') || false;
      return appeared === true && !completed;
    }
  },

  // ===== 王阿姨（7件） =====
  '王阿姨_门口送汤_事件': {
    condition: (vars) => {
      const time = _.get(vars, 'stat_data.世界.时段');
      const weather = _.get(vars, 'stat_data.世界.天气');
      const completed = _.get(vars, 'stat_data.事件.王阿姨.门口送汤') || false;
      return (time === '傍晚' || time === '深夜' || weather === '雨' || weather === '雪') && !completed;
    }
  },
  '王阿姨_送菜日常_事件': {
    condition: (vars) => {
      const appeared = _.get(vars, 'stat_data.事件.王阿姨.门口送汤') || false;
      const completed = _.get(vars, 'stat_data.事件.王阿姨.送菜日常') || false;
      return appeared === true && !completed;
    }
  },
  '王阿姨_深夜谈心_事件': {
    condition: (vars) => {
      const time = _.get(vars, 'stat_data.世界.时段');
      const appeared = _.get(vars, 'stat_data.事件.王阿姨.送菜日常') || false;
      const completed = _.get(vars, 'stat_data.事件.王阿姨.深夜谈心') || false;
      return time === '深夜' && appeared === true && !completed;
    }
  },
  '王阿姨_邻居议论_事件': {
    condition: (vars) => {
      const appeared = _.get(vars, 'stat_data.事件.王阿姨.深夜谈心') || false;
      const completed = _.get(vars, 'stat_data.事件.王阿姨.邻居议论') || false;
      return appeared === true && !completed;
    }
  },
  '王阿姨_包饺子邀请_事件': {
    condition: (vars) => {
      const appeared = _.get(vars, 'stat_data.事件.王阿姨.邻居议论') || false;
      const completed = _.get(vars, 'stat_data.事件.王阿姨.包饺子邀请') || false;
      return appeared === true && !completed;
    }
  },
  '王阿姨_跨越年龄_事件': {
    condition: (vars) => {
      const appeared = _.get(vars, 'stat_data.事件.王阿姨.包饺子邀请') || false;
      const completed = _.get(vars, 'stat_data.事件.王阿姨.跨越年龄') || false;
      return appeared === true && !completed;
    }
  },
  '王阿姨_公开一起_事件': {
    condition: (vars) => {
      const appeared = _.get(vars, 'stat_data.事件.王阿姨.跨越年龄') || false;
      const completed = _.get(vars, 'stat_data.事件.王阿姨.公开一起') || false;
      return appeared === true && !completed;
    }
  },

  // ===== 林婉如（7件） =====
  '林婉如_登门探望_事件': {
    condition: (vars) => {
      const appeared = _.get(vars, 'stat_data.事件.林婉如.登门探望') || false;
      return !appeared;
    }
  },
  '林婉如_劝说不成_事件': {
    condition: (vars) => {
      const appeared = _.get(vars, 'stat_data.事件.林婉如.登门探望') || false;
      const completed = _.get(vars, 'stat_data.事件.林婉如.劝说不成') || false;
      return appeared === true && !completed;
    }
  },
  '林婉如_深夜来电_事件': {
    condition: (vars) => {
      const time = _.get(vars, 'stat_data.世界.时段');
      const appeared = _.get(vars, 'stat_data.事件.林婉如.劝说不成') || false;
      const completed = _.get(vars, 'stat_data.事件.林婉如.深夜来电') || false;
      return time === '深夜' && appeared === true && !completed;
    }
  },
  '林婉如_姑侄独处_事件': {
    condition: (vars) => {
      const appeared = _.get(vars, 'stat_data.事件.林婉如.深夜来电') || false;
      const completed = _.get(vars, 'stat_data.事件.林婉如.姑侄独处') || false;
      return appeared === true && !completed;
    }
  },
  '林婉如_家庭聚餐_事件': {
    condition: (vars) => {
      const appeared = _.get(vars, 'stat_data.事件.林婉如.姑侄独处') || false;
      const completed = _.get(vars, 'stat_data.事件.林婉如.家庭聚餐') || false;
      return appeared === true && !completed;
    }
  },
  '林婉如_禁忌坦白_事件': {
    condition: (vars) => {
      const appeared = _.get(vars, 'stat_data.事件.林婉如.家庭聚餐') || false;
      const completed = _.get(vars, 'stat_data.事件.林婉如.禁忌坦白') || false;
      return appeared === true && !completed;
    }
  },
  '林婉如_一同面对_事件': {
    condition: (vars) => {
      const appeared = _.get(vars, 'stat_data.事件.林婉如.禁忌坦白') || false;
      const completed = _.get(vars, 'stat_data.事件.林婉如.一同面对') || false;
      return appeared === true && !completed;
    }
  }
};

// ========== 核心逻辑（沿用旧版本写法） ==========
async function updateEventEntries(vars) {
  try {
    const worldbook = await TavernHelper.getWorldbook(WORLD_BOOK_NAME);
    
    const updated = worldbook.map(entry => {
      const config = EVENT_CONFIGS[entry.name];
      if (config) {
        const shouldEnable = config.condition(vars);
        if (entry.enabled !== shouldEnable) {
          entry.enabled = shouldEnable;
        }
      }
      return entry;
    });
    
    await TavernHelper.replaceWorldbook(WORLD_BOOK_NAME, updated);
    console.log('[物理开关] 更新成功');
  } catch (e) {
    console.error('[物理开关] 更新失败:', e);
  }
}

// ========== 监听MVU变量更新 ==========
eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, async (newVars) => {
  await updateEventEntries(newVars);
});

// ========== 脚本加载时立即执行一次 ==========
$(async () => {
  try {
    const allVars = getAllVariables();
    const statData = _.get(allVars, 'stat_data', {});
    await updateEventEntries(statData);
    console.log('[物理开关] 初始化完成，已同步43个事件条目的开关状态');
  } catch (e) {
    console.error('[物理开关] 初始化失败:', e);
  }
});
