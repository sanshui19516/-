// =============================================
// 物理开关_事件触发器 (最终修复版 - 兼容扁平变量)
// =============================================
(async () => {
  'use strict';
  await waitGlobalInitialized('Mvu');

  const WORLD_BOOK_NAME = '兄妹禁忌';

  // 扁平→嵌套工具函数
  function unflatten(flat) {
    if (!flat || typeof flat !== 'object') return {};
    if (Object.keys(flat).some(k => !k.includes('.'))) return flat;
    const result = {};
    for (const [key, val] of Object.entries(flat)) {
      const parts = key.split('.');
      let cur = result;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!cur[parts[i]]) cur[parts[i]] = {};
        cur = cur[parts[i]];
      }
      cur[parts[parts.length - 1]] = val;
    }
    return result;
  }

  const EVENT_CONFIGS = {
    '林夕_夜袭_事件': {
      condition: (vars) => (_.get(vars, 'stat_data.林夕.病娇状态') || '未触发') !== '未触发'
    },
    '张晓曼_公司初遇_事件': {
      condition: (vars) => !(_.get(vars, 'stat_data.事件.张晓曼.公司初遇') || false)
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
    '赵雅兰_走廊相遇_事件': {
      condition: (vars) => !(_.get(vars, 'stat_data.事件.赵雅兰.走廊相遇') || false)
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
    '赵梦琪_校园偶遇_事件': {
      condition: (vars) => !(_.get(vars, 'stat_data.事件.赵梦琪.校园偶遇') || false)
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
    '苏小薇_大学初见_事件': {
      condition: (vars) => !(_.get(vars, 'stat_data.事件.苏小薇.大学初见') || false)
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
    '林婉如_登门探望_事件': {
      condition: (vars) => !(_.get(vars, 'stat_data.事件.林婉如.登门探望') || false)
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

  let lastVarHash = '';

  async function updateEventEntries(vars) {
    try {
      // 确保使用嵌套结构
      const rawStat = vars?.stat_data || vars;
      const statData = unflatten(rawStat);   // 转为嵌套对象
      const currentHash = JSON.stringify(statData);
      if (currentHash === lastVarHash) return;
      lastVarHash = currentHash;

      const worldbook = await TavernHelper.getWorldbook(WORLD_BOOK_NAME);
      let hasChange = false;
      const updated = worldbook.map(entry => {
        const config = EVENT_CONFIGS[entry.name];
        if (config) {
          const shouldEnable = config.condition({ stat_data: statData });
          if (entry.enabled !== shouldEnable) {
            entry.enabled = shouldEnable;
            hasChange = true;
            console.log(`[物理开关] ${entry.name} → ${shouldEnable ? '开启' : '关闭'}`);
          }
        }
        return entry;
      });
      if (hasChange) {
        await TavernHelper.replaceWorldbook(WORLD_BOOK_NAME, updated);
        console.log('[物理开关] ✅ 世界书已更新');
      }
    } catch (e) {
      console.error('[物理开关] 更新失败:', e);
    }
  }

  // 轮询
  setInterval(async () => {
    try {
      const ctx = typeof SillyTavern !== 'undefined' ? SillyTavern.getContext() : null;
      const latestIndex = ctx && ctx.chat ? ctx.chat.length - 1 : null;
      if (latestIndex !== null && latestIndex >= 0) {
        const result = getVariables({ type: 'message', message_id: latestIndex });
        const statData = _.get(result, 'stat_data', {});
        await updateEventEntries(statData);
      }
    } catch (e) {}
  }, 1500);

  // 初始化
  $(async () => {
    try {
      const ctx = typeof SillyTavern !== 'undefined' ? SillyTavern.getContext() : null;
      const latestIndex = ctx && ctx.chat ? ctx.chat.length - 1 : null;
      if (latestIndex !== null && latestIndex >= 0) {
        const result = getVariables({ type: 'message', message_id: latestIndex });
        const statData = _.get(result, 'stat_data', {});
        await updateEventEntries(statData);
        console.log('[物理开关] 初始化完成，轮询已启动');
      }
    } catch (e) {
      console.error('[物理开关] 初始化失败:', e);
    }
  });
})();
