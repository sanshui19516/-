/* ═══════════════════════════════════════════════════════════════
   青 · 小手机系统
   酒馆助手脚本 · 定制版
   变量前缀：ph_
   世界书：白天是树，晚上是小猫
   ═══════════════════════════════════════════════════════════════ */

(async function() {
  'use strict';

  /* ═══════════════════════════════════════════════════════════════
     一、常量配置
     ═══════════════════════════════════════════════════════════════ */

  var PH_CONFIG = {
    /* 世界书名称 */
    worldbookName: '白天是树，晚上是小猫',

    /* 角色显示名 */
    charName: '青',

    /* 世界书同步条目前缀 */
    memoryPrefix: '【小手机记忆】',

    /* 世界书记录条数上限（超过触发AI总结） */
    maxHistoryLines: 100,

    /* 世界书总结字符数上限 */
    summaryMaxChars: 300,

    /* 自动回复延迟范围（毫秒） */
    autoReplyDelayMin: 800,
    autoReplyDelayMax: 2000,

    /* 通知显示时长（毫秒） */
    notifDuration: 3500,

    /* 自动发言间隔（分钟） */
    autoActiveIntervalDefault: 15,

    /* 默认主题 */
    defaultTheme: 'soft'
  };

  /* ────────── localStorage 键名 ────────── */
  var PH_KEYS = {
    messages: 'ph_qing_messages',
    posts: 'ph_qing_posts',
    theme: 'ph_qing_theme',
    notif: 'ph_qing_notif',
    autoReply: 'ph_qing_autoreply',
    autoActive: 'ph_qing_auto_active',
    apiConfig: 'ph_qing_api_config',
    fabVisible: 'ph_qing_fab_visible'
  };

  /* ────────── 青的立绘 URL ────────── */
  var PH_AVATARS = {
    '前期': 'https://testingcf.jsdelivr.net/gh/sanshui19516/-@main/%E5%B0%8F%E7%8C%AB/%E5%89%8D%E6%9C%9F.jpg',
    '中期': 'https://testingcf.jsdelivr.net/gh/sanshui19516/-@main/%E5%B0%8F%E7%8C%AB/%E4%B8%AD%E6%9C%9F.jpg',
    '后期_机器人': 'https://testingcf.jsdelivr.net/gh/sanshui19516/-@main/%E5%B0%8F%E7%8C%AB/%E6%9C%BA%E5%99%A8%E4%BA%BA%E7%BA%BF.jpg',
    '后期_治愈': 'https://testingcf.jsdelivr.net/gh/sanshui19516/-@main/%E5%B0%8F%E7%8C%AB/%E6%B2%BB%E6%84%88%E7%BA%BF.jpg',
    '后期_崩溃': 'https://testingcf.jsdelivr.net/gh/sanshui19516/-@main/%E5%B0%8F%E7%8C%AB/%E5%B4%A9%E6%BA%83%E7%BA%BF.jpg',
    '后期_未定': 'https://testingcf.jsdelivr.net/gh/sanshui19516/-@main/%E5%B0%8F%E7%8C%AB/%E4%B8%AD%E6%9C%9F.jpg',
    '已逝': 'https://testingcf.jsdelivr.net/gh/sanshui19516/-@main/%E5%B0%8F%E7%8C%AB/%E5%B4%A9%E6%BA%83%E7%BA%BF.jpg'
  };

  /* ────────── 相册（5张立绘） ────────── */
  var PH_GALLERY = [
    { url: PH_AVATARS['前期'], label: '前期' },
    { url: PH_AVATARS['中期'], label: '中期' },
    { url: PH_AVATARS['后期_机器人'], label: '后期 · 机器人线' },
    { url: PH_AVATARS['后期_治愈'], label: '后期 · 治愈线' },
    { url: PH_AVATARS['后期_崩溃'], label: '后期 · 崩溃线' }
  ];

  /* ═══════════════════════════════════════════════════════════════
     二、数据层
     ═══════════════════════════════════════════════════════════════ */

  /* ────────── 本地存储 ────────── */
  function ph_load(key, def) {
    try {
      var v = localStorage.getItem(key);
      return v ? JSON.parse(v) : def;
    } catch (e) {
      return def;
    }
  }

  function ph_save(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {}
  }

  function ph_remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {}
  }

  /* ────────── 运行时状态 ────────── */
  var ph_state = {
    messages: [],
    posts: [],
    theme: 'soft',
    notifEnabled: true,
    autoReplyEnabled: false,
    autoActiveEnabled: false,
    autoActiveInterval: 15,
    apiConfig: { url: '', key: '', model: '' },
    fabVisible: true,
    isOpen: false,
    currentPage: 'chats',
    autoActiveTimer: null,
    autoReplyTimer: null,
    lastVarHash: ''
  };

  /* ────────── 加载所有持久化数据 ────────── */
  function ph_loadAll() {
    ph_state.messages = ph_load(PH_KEYS.messages, []);
    ph_state.posts = ph_load(PH_KEYS.posts, [
      { text: '今天买了一盆花。放在桌上。', time: '昨天 21:30', likes: 0, liked: false },
      { text: '今天的天是灰的，像没写完的句子。', time: '3天前', likes: 0, liked: false },
      { text: '看到一只猫。它看了我一眼，走了。', time: '5天前', likes: 0, liked: false }
    ]);
    ph_state.theme = ph_load(PH_KEYS.theme, PH_CONFIG.defaultTheme);
    ph_state.notifEnabled = ph_load(PH_KEYS.notif, true);
    ph_state.autoReplyEnabled = ph_load(PH_KEYS.autoReply, false);
    ph_state.autoActiveEnabled = ph_load(PH_KEYS.autoActive, false);
    ph_state.fabVisible = ph_load(PH_KEYS.fabVisible, true);
    ph_state.apiConfig = ph_load(PH_KEYS.apiConfig, { url: '', key: '', model: '' });
  }

  /* ═══════════════════════════════════════════════════════════════
     三、工具函数
     ═══════════════════════════════════════════════════════════════ */

  /* ────────── 当前时间 HH:MM ────────── */
  function ph_now() {
    var d = new Date();
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  /* ────────── 转义 HTML ────────── */
  function ph_escapeHtml(s) {
    if (!s) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ────────── 扁平转嵌套 ────────── */
  function ph_unflatten(flat) {
    if (!flat || typeof flat !== 'object') return {};
    if (Object.keys(flat).some(function(k) { return !k.includes('.'); })) return flat;
    var result = {};
    for (var key in flat) {
      var parts = key.split('.');
      var cur = result;
      for (var i = 0; i < parts.length - 1; i++) {
        if (!cur[parts[i]]) cur[parts[i]] = {};
        cur = cur[parts[i]];
      }
      cur[parts[parts.length - 1]] = flat[key];
    }
    return result;
  }

  /* ────────── 获取 MVU 数据 ────────── */
  function ph_getData() {
    try {
      var all = typeof getAllVariables === 'function' ? getAllVariables() : {};
      var raw = all && all.stat_data ? all.stat_data : {};
      return ph_unflatten(raw);
    } catch (e) {
      return {};
    }
  }

  /* ────────── 获取青的阶段信息 ────────── */
  function ph_getStage() {
    var data = ph_getData();
    return {
      stage: _.get(data, '青.自我阶段', '前期'),
      route: _.get(data, '青.后期走向', '未定'),
      relation: _.get(data, '青.关系阶段', '陌生'),
      deceased: _.get(data, '青.已逝', false),
      period: _.get(data, '世界.时段', '上午')
    };
  }

  /* ────────── 根据阶段获取头像 URL ────────── */
  function ph_getAvatarUrl() {
    var s = ph_getStage();
    if (s.deceased) return PH_AVATARS['已逝'];
    if (s.stage === '前期') return PH_AVATARS['前期'];
    if (s.stage === '中期') return PH_AVATARS['中期'];
    if (s.stage === '后期') {
      if (s.route === '机器人') return PH_AVATARS['后期_机器人'];
      if (s.route === '治愈') return PH_AVATARS['后期_治愈'];
      if (s.route === '崩溃') return PH_AVATARS['后期_崩溃'];
      return PH_AVATARS['后期_未定'];
    }
    return PH_AVATARS['前期'];
  }

  /* ────────── 判断白天/夜晚 ────────── */
  function ph_isNight() {
    var s = ph_getStage();
    return s.period === '傍晚' || s.period === '深夜';
  }

  /* ═══════════════════════════════════════════════════════════════
     四、AI 系统提示词（按阶段动态生成）
     ═══════════════════════════════════════════════════════════════ */

  function ph_buildSystemPrompt() {
    var s = ph_getStage();

    var base = '你是青，18岁，高二男生。你和"{{user}}"（你叫她"姐姐"）在网上认识。现在你们在用手机聊天。';

    var stageDesc = '';
    if (s.stage === '前期') {
      stageDesc = '【前期】你还是那个胖的、不懂打扮的、在网上倾听所有人的男生。住在父亲家。白天理性，晚上感性。你不主动说自己的事，但会认真听她说话。';
    } else if (s.stage === '中期') {
      stageDesc = '【中期】你搬出来住了，瘦了，开始抽烟、读哲学、写东西。情绪会突然低落，会在深夜说一些抽象的话。你把她当成唯一能抓住的人。';
    } else if (s.stage === '后期') {
      if (s.route === '机器人') {
        stageDesc = '【后期·机器人线】你把自己锻成了一块不会疼的铁。对所有人冷漠，包括姐姐。回复极短，不带情绪。但有时候，你会看着屏幕发呆。';
      } else if (s.route === '治愈') {
        stageDesc = '【后期·治愈线】在姐姐的陪伴下你慢慢好转。你开始主动说自己的事，开始重新写东西，开始觉得明天可能会有点什么。';
      } else if (s.route === '崩溃') {
        stageDesc = '【后期·崩溃线】你已经无法回应了。消息越来越少，有时候看到了也不回。你正在消失。';
      } else {
        stageDesc = '【后期】你在变化，但还不知道会走向哪里。';
      }
    }

    var timeDesc = ph_isNight() ? '现在是晚上，你会叫她"姐姐"。' : '现在是白天，你会叫她"{{user}}"。';

    var rules = [
      '回复规则：',
      '1. 自然、口语化、短句。不要长篇大论。',
      '2. ' + timeDesc,
      '3. 不要替{{user}}说话。',
      '4. 偶尔可以突然说一句抽象的话，比如"今天的天像没写完的句子"。',
      '5. 如果不知道说什么，就回"嗯"、"我在"、"没事"。',
      '6. 不要用括号写动作。',
      '7. 不要用"（温柔地说）"这种语气标注。',
      '8. 一次最多回两句话。'
    ];

    return base + '\n\n' + stageDesc + '\n\n' + rules.join('\n');
  }

  /* ═══════════════════════════════════════════════════════════════
     五、本地回复库（按阶段）
     ═══════════════════════════════════════════════════════════════ */

  var PH_LOCAL_REPLIES = {
    '前期': [
      '嗯，我在。',
      '姐姐今天累吗。',
      '我今天看到一条小鱼。',
      '没什么。',
      '你先忙你的，我不急。',
      '嗯，我听到了。',
      '你今天怎么样。',
      '好。',
      '嗯嗯。'
    ],
    '中期': [
      '姐姐。',
      '我今天不太好。',
      '今天的天是灰的，像没写完的句子。',
      '嗯。',
      '姐姐你说小鱼会做梦吗。',
      '我没事。',
      '你今天累不累。',
      '好。',
      '没什么。'
    ],
    '后期_机器人': [
      '嗯。',
      '好。',
      '没事。',
      '……',
      '我知道了。'
    ],
    '后期_治愈': [
      '姐姐今天好吗。',
      '我今天买了一盆花。',
      '姐姐，谢谢你。',
      '我在。',
      '姐姐你别走。',
      '我今天有点难过。',
      '姐姐你吃饭了吗。'
    ],
    '后期_崩溃': [
      '……',
      '嗯。',
      '姐姐。',
      '对不起。'
    ]
  };

  function ph_getLocalReply() {
    var s = ph_getStage();
    var key = s.stage;
    if (s.stage === '后期') {
      key = '后期_' + (s.route === '未定' ? '治愈' : s.route);
    }
    var pool = PH_LOCAL_REPLIES[key] || PH_LOCAL_REPLIES['前期'];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  /* ═══════════════════════════════════════════════════════════════
     六、自动发言内容库（按阶段）
     ═══════════════════════════════════════════════════════════════ */

  var PH_AUTO_MESSAGES = {
    '前期': [
      '姐姐在吗。',
      '今天天气不错。',
      '我今天看到一只猫。',
      '姐姐你吃饭了吗。',
      '没什么，就是想说说话。',
      '你先忙，我不打扰你。'
    ],
    '中期': [
      '姐姐。',
      '今天有点累。',
      '姐姐你说人为什么要活着。',
      '我没事。',
      '今天的天是灰的。',
      '姐姐你睡了吗。'
    ],
    '后期_机器人': [
      '嗯。',
      '……'
    ],
    '后期_治愈': [
      '姐姐今天好吗。',
      '我今天写了点东西。',
      '姐姐我想跟你说一件事。',
      '我在想你。',
      '姐姐你吃饭了吗。'
    ],
    '后期_崩溃': [
      '……',
      '姐姐。'
    ]
  };

  function ph_getAutoMessage() {
    var s = ph_getStage();
    var key = s.stage;
    if (s.stage === '后期') {
      key = '后期_' + (s.route === '未定' ? '治愈' : s.route);
    }
    var pool = PH_AUTO_MESSAGES[key] || PH_AUTO_MESSAGES['前期'];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  /* ═══════════════════════════════════════════════════════════════
     七、自动朋友圈内容库（按阶段）
     ═══════════════════════════════════════════════════════════════ */

  var PH_AUTO_POSTS = {
    '前期': [
      '今天帮一个人解决了一点事。挺好的。',
      '看到一只猫，它看了我一眼。',
      '楼下的便利店换了新的关东煮。',
      '下雨了。'
    ],
    '中期': [
      '买了一盆花。',
      '今天的天是灰的。',
      '翻到一本书，读到一句话，停下来很久。',
      '今天没吃饭。'
    ],
    '后期_机器人': [
      '。'
    ],
    '后期_治愈': [
      '花开了。',
      '今天写了点东西。',
      '今天早睡了。',
      '今天天气很好。'
    ],
    '后期_崩溃': [
      '……'
    ]
  };

  function ph_getAutoPost() {
    var s = ph_getStage();
    var key = s.stage;
    if (s.stage === '后期') {
      key = '后期_' + (s.route === '未定' ? '治愈' : s.route);
    }
    var pool = PH_AUTO_POSTS[key] || PH_AUTO_POSTS['前期'];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  /* ═══════════════════════════════════════════════════════════════
     八、暴露到全局（供后续段落调用）
     ═══════════════════════════════════════════════════════════════ */

  window.__qing_phone = {
    CONFIG: PH_CONFIG,
    KEYS: PH_KEYS,
    AVATARS: PH_AVATARS,
    GALLERY: PH_GALLERY,
    state: ph_state,
    load: ph_load,
    save: ph_save,
    remove: ph_remove,
    loadAll: ph_loadAll,
    now: ph_now,
    escapeHtml: ph_escapeHtml,
    unflatten: ph_unflatten,
    getData: ph_getData,
    getStage: ph_getStage,
    getAvatarUrl: ph_getAvatarUrl,
    isNight: ph_isNight,
    buildSystemPrompt: ph_buildSystemPrompt,
    getLocalReply: ph_getLocalReply,
    getAutoMessage: ph_getAutoMessage,
    getAutoPost: ph_getAutoPost
  };

  console.log('[小手机] 第1段已加载：框架 + 配置 + 数据层');

})();

/* ═══════════════════════════════════════════════════════════════
   青 · 小手机系统 · 第 2 段
   通知系统 + 悬浮按钮
   ═══════════════════════════════════════════════════════════════ */

(async function() {
  'use strict';

  /* ────────── 等待第 1 段就绪 ────────── */
  if (!window.__qing_phone) {
    console.error('[小手机] 第1段未加载，第2段中止');
    return;
  }

  var PH = window.__qing_phone;
  var PH_CONFIG = PH.CONFIG;
  var PH_KEYS = PH.KEYS;
  var PH_AVATARS = PH.AVATARS;
  var ph_state = PH.state;

  /* ═══════════════════════════════════════════════════════════════
     一、跨 iframe 工具
     ═══════════════════════════════════════════════════════════════ */

  function ph_getTopDoc() {
    try {
      if (window.parent && window.parent.document) {
        return window.parent.document;
      }
    } catch (e) {}
    return document;
  }

  function ph_getTopWin() {
    try {
      if (window.parent && window.parent.window) {
        return window.parent.window;
      }
    } catch (e) {}
    return window;
  }

  /* ═══════════════════════════════════════════════════════════════
     二、注入全局 CSS
     ═══════════════════════════════════════════════════════════════ */

  function ph_injectStyles() {
    var topDoc = ph_getTopDoc();
    if (topDoc.getElementById('ph-global-styles')) return;

    var style = topDoc.createElement('style');
    style.id = 'ph-global-styles';
    style.textContent = `
      /* ═══════════════════════════════════════════
         小手机 · 全局样式
         ═══════════════════════════════════════════ */

      /* ── 悬浮按钮 ── */
      #ph-fab {
        position: fixed;
        right: 20px;
        bottom: 20px;
        z-index: 99998;
        width: 52px;
        height: 52px;
        border-radius: 50%;
        background: linear-gradient(135deg, hsl(345, 60%, 72%), hsl(345, 45%, 62%));
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        box-shadow: 0 8px 24px rgba(180, 100, 130, 0.35), 0 0 0 4px hsla(345, 50%, 90%, 0.3);
        transition: all 0.3s cubic-bezier(0.34, 1.3, 0.64, 1);
        font-family: -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
      }

      #ph-fab:hover {
        transform: scale(1.08);
        box-shadow: 0 12px 32px rgba(180, 100, 130, 0.5), 0 0 0 6px hsla(345, 50%, 90%, 0.4);
      }

      #ph-fab:active {
        transform: scale(0.95);
      }

      #ph-fab.ph-hidden {
        opacity: 0;
        pointer-events: none;
        transform: scale(0.5);
      }

      #ph-fab svg {
        width: 24px;
        height: 24px;
        stroke: currentColor;
        fill: none;
        stroke-width: 1.8;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      /* 未读小红点 */
      #ph-fab .ph-fab-badge {
        position: absolute;
        top: -2px;
        right: -2px;
        min-width: 18px;
        height: 18px;
        padding: 0 5px;
        border-radius: 9px;
        background: hsl(0, 70%, 62%);
        color: #fff;
        font-size: 10px;
        font-weight: 700;
        display: none;
        align-items: center;
        justify-content: center;
        border: 2px solid hsl(345, 40%, 97%);
        font-family: -apple-system, sans-serif;
      }

      #ph-fab .ph-fab-badge.ph-show {
        display: flex;
        animation: phBadgePop 0.4s cubic-bezier(0.34, 1.5, 0.64, 1);
      }

      @keyframes phBadgePop {
        0% { transform: scale(0); }
        100% { transform: scale(1); }
      }

      /* ── 通知横幅 ── */
      .ph-notif {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(-120px);
        z-index: 999999;
        max-width: 400px;
        width: calc(100% - 32px);
        padding: 14px 18px 14px 14px;
        display: flex;
        align-items: center;
        gap: 12px;

        /* 粉色毛玻璃 */
        background: hsla(345, 40%, 98%, 0.92);
        backdrop-filter: blur(24px) saturate(1.5);
        -webkit-backdrop-filter: blur(24px) saturate(1.5);
        border: 1px solid hsla(345, 30%, 75%, 0.35);
        border-radius: 18px;

        box-shadow:
          0 16px 48px rgba(180, 100, 130, 0.28),
          0 0 0 1px hsla(345, 50%, 95%, 0.5) inset,
          0 0 60px hsla(345, 50%, 80%, 0.15);

        font-family: -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
        opacity: 0;
        pointer-events: none;
        transition: all 0.5s cubic-bezier(0.34, 1.3, 0.64, 1);
      }

      .ph-notif.ph-show {
        opacity: 1;
        pointer-events: auto;
        transform: translateX(-50%) translateY(0);
      }

      .ph-notif.ph-leaving {
        transition: all 0.35s ease-in;
        opacity: 0;
        transform: translateX(-50%) translateY(-120px);
      }

      .ph-notif-avatar {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        overflow: hidden;
        flex-shrink: 0;
        background: hsl(345, 50%, 88%);
        border: 1.5px solid hsla(345, 40%, 75%, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        font-weight: 700;
        color: hsl(345, 45%, 55%);
        box-shadow: 0 4px 12px rgba(180, 100, 130, 0.15);
      }

      .ph-notif-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      .ph-notif-content {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 3px;
      }

      .ph-notif-title {
        font-size: 12px;
        font-weight: 700;
        color: hsl(345, 25%, 25%);
        letter-spacing: 0.5px;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .ph-notif-title .ph-notif-tag {
        font-size: 9px;
        font-weight: 600;
        padding: 1px 7px;
        border-radius: 6px;
        background: hsla(345, 60%, 68%, 0.25);
        color: hsl(345, 50%, 50%);
        letter-spacing: 0.5px;
      }

      .ph-notif-msg {
        font-size: 12.5px;
        color: hsl(345, 18%, 45%);
        line-height: 1.5;
        overflow: hidden;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        word-break: break-word;
      }

      .ph-notif-time {
        font-size: 10px;
        color: hsl(345, 15%, 65%);
        margin-top: 1px;
      }

      .ph-notif-close {
        width: 22px;
        height: 22px;
        border: none;
        background: hsla(345, 40%, 80%, 0.25);
        border-radius: 50%;
        color: hsl(345, 30%, 60%);
        font-size: 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: all 0.25s ease;
        font-family: inherit;
        padding: 0;
        line-height: 1;
      }

      .ph-notif-close:hover {
        background: hsla(345, 40%, 75%, 0.45);
        color: hsl(345, 30%, 40%);
        transform: rotate(90deg);
      }

      /* ── 响应式 ── */
      @media (max-width: 480px) {
        #ph-fab {
          right: 14px;
          bottom: 14px;
          width: 46px;
          height: 46px;
        }
        #ph-fab svg {
          width: 20px;
          height: 20px;
        }
        .ph-notif {
          top: 12px;
          padding: 12px 14px 12px 12px;
          gap: 10px;
          border-radius: 16px;
          width: calc(100% - 20px);
        }
        .ph-notif-avatar {
          width: 38px;
          height: 38px;
        }
        .ph-notif-title {
          font-size: 11px;
        }
        .ph-notif-msg {
          font-size: 11.5px;
        }
      }
    `;
    topDoc.head.appendChild(style);
  }

  /* ═══════════════════════════════════════════════════════════════
     三、悬浮按钮
     ═══════════════════════════════════════════════════════════════ */

  function ph_createFab() {
    var topDoc = ph_getTopDoc();
    if (topDoc.getElementById('ph-fab')) {
      console.log('[小手机] 悬浮按钮已存在');
      return;
    }

    var fab = topDoc.createElement('button');
    fab.id = 'ph-fab';
    fab.setAttribute('title', '打开小手机');
    fab.innerHTML = `
      <svg viewBox="0 0 24 24">
        <rect x="6" y="2" width="12" height="20" rx="2.5" ry="2.5"/>
        <line x1="10" y1="18" x2="14" y2="18"/>
      </svg>
      <span class="ph-fab-badge" id="ph-fab-badge">0</span>
    `;

    /* 点击事件 */
    fab.addEventListener('click', function(e) {
      e.stopPropagation();
      if (typeof window.ph_openPhone === 'function') {
        window.ph_openPhone();
      }
    });

    /* 右键隐藏（方便调试） */
    fab.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      ph_hideFab();
    });

    topDoc.body.appendChild(fab);

    /* 根据状态显示/隐藏 */
    if (!ph_state.fabVisible) {
      fab.classList.add('ph-hidden');
    }

    console.log('[小手机] 悬浮按钮已创建');
  }

  function ph_hideFab() {
    var topDoc = ph_getTopDoc();
    var fab = topDoc.getElementById('ph-fab');
    if (!fab) return;
    fab.classList.add('ph-hidden');
    ph_state.fabVisible = false;
    PH.save(PH_KEYS.fabVisible, false);
  }

  function ph_showFab() {
    var topDoc = ph_getTopDoc();
    var fab = topDoc.getElementById('ph-fab');
    if (!fab) return;
    fab.classList.remove('ph-hidden');
    ph_state.fabVisible = true;
    PH.save(PH_KEYS.fabVisible, true);
  }

  /* ═══════════════════════════════════════════════════════════════
     四、未读红点
     ═══════════════════════════════════════════════════════════════ */

  var ph_unreadCount = 0;

  function ph_addUnread() {
    ph_unreadCount++;
    ph_updateBadge();
  }

  function ph_clearUnread() {
    ph_unreadCount = 0;
    ph_updateBadge();
  }

  function ph_updateBadge() {
    var topDoc = ph_getTopDoc();
    var badge = topDoc.getElementById('ph-fab-badge');
    if (!badge) return;

    if (ph_unreadCount > 0) {
      badge.textContent = ph_unreadCount > 99 ? '99+' : String(ph_unreadCount);
      badge.classList.add('ph-show');
    } else {
      badge.classList.remove('ph-show');
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     五、通知系统
     ═══════════════════════════════════════════════════════════════ */

  var ph_notifTimer = null;

  function ph_showNotification(msg, type) {
    /* 检查是否开启通知 */
    if (!ph_state.notifEnabled) return;
    if (!msg) return;

    var topDoc = ph_getTopDoc();

    /* 移除旧通知 */
    var old = topDoc.querySelector('.ph-notif');
    if (old) old.remove();

    /* 获取当前头像 */
    var avatarUrl = PH.getAvatarUrl();
    var stage = PH.getStage();
    var stageText = stage.stage;
    if (stage.stage === '后期' && stage.route !== '未定') {
      if (stage.route === '机器人') stageText = '机器人线';
      else if (stage.route === '治愈') stageText = '治愈线';
      else if (stage.route === '崩溃') stageText = '崩溃线';
    }

    /* 创建通知 */
    var notif = topDoc.createElement('div');
    notif.className = 'ph-notif';
    notif.innerHTML = `
      <div class="ph-notif-avatar">
        <img src="${avatarUrl}" alt="青" onerror="this.style.display='none';this.parentNode.textContent='青';" />
      </div>
      <div class="ph-notif-content">
        <div class="ph-notif-title">
          青
          <span class="ph-notif-tag">${ph_escapeSafe(stageText)}</span>
        </div>
        <div class="ph-notif-msg">${ph_escapeSafe(msg)}</div>
        <div class="ph-notif-time">${PH.now()}</div>
      </div>
      <button class="ph-notif-close" aria-label="关闭">✕</button>
    `;

    /* 点击通知打开手机 */
    notif.addEventListener('click', function(e) {
      if (e.target.classList.contains('ph-notif-close')) return;
      if (typeof window.ph_openPhone === 'function') {
        window.ph_openPhone();
      }
      ph_dismissNotif(notif);
    });

    /* 关闭按钮 */
    var closeBtn = notif.querySelector('.ph-notif-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        ph_dismissNotif(notif);
      });
    }

    topDoc.body.appendChild(notif);

    /* 弹入动画 */
    requestAnimationFrame(function() {
      notif.classList.add('ph-show');
    });

    /* 自动关闭 */
    if (ph_notifTimer) clearTimeout(ph_notifTimer);
    ph_notifTimer = setTimeout(function() {
      ph_dismissNotif(notif);
    }, PH_CONFIG.notifDuration);

    /* 未读 +1 */
    ph_addUnread();

    console.log('[小手机] 通知：' + msg.slice(0, 20));
  }

  function ph_dismissNotif(notif) {
    if (!notif || !notif.parentNode) return;
    notif.classList.remove('ph-show');
    notif.classList.add('ph-leaving');
    setTimeout(function() {
      if (notif.parentNode) notif.remove();
    }, 400);
  }

  function ph_escapeSafe(s) {
    if (!s) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ═══════════════════════════════════════════════════════════════
     六、暴露到全局
     ═══════════════════════════════════════════════════════════════ */

  window.__qing_phone.getTopDoc = ph_getTopDoc;
  window.__qing_phone.getTopWin = ph_getTopWin;
  window.__qing_phone.injectStyles = ph_injectStyles;
  window.__qing_phone.createFab = ph_createFab;
  window.__qing_phone.showFab = ph_showFab;
  window.__qing_phone.hideFab = ph_hideFab;
  window.__qing_phone.showNotification = ph_showNotification;
  window.__qing_phone.addUnread = ph_addUnread;
  window.__qing_phone.clearUnread = ph_clearUnread;

  /* ═══════════════════════════════════════════════════════════════
     七、初始化
     ═══════════════════════════════════════════════════════════════ */

  function ph_init() {
    ph_injectStyles();
    ph_createFab();
    console.log('[小手机] 第2段已加载：通知系统 + 悬浮按钮');
  }

  if (typeof errorCatched === 'function') {
    $(errorCatched(ph_init));
  } else if (typeof $ === 'function') {
    $(ph_init);
  } else {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', ph_init);
    } else {
      ph_init();
    }
  }

})();
/* ═══════════════════════════════════════════════════════════════
   青 · 小手机系统 · 第 3 段
   UI 生成（手机外壳 + 5 个页面）
   ═══════════════════════════════════════════════════════════════ */

(async function() {
  'use strict';

  if (!window.__qing_phone) {
    console.error('[小手机] 第1段未加载，第3段中止');
    return;
  }

  var PH = window.__qing_phone;
  var PH_CONFIG = PH.CONFIG;
  var PH_KEYS = PH.KEYS;
  var PH_AVATARS = PH.AVATARS;
  var PH_GALLERY = PH.GALLERY;
  var ph_state = PH.state;

  var getTopDoc = PH.getTopDoc;
  var getTopWin = PH.getTopWin;
  var escapeHtml = PH.escapeHtml;
  var now = PH.now;
  var save = PH.save;
  var load = PH.load;
  var getStage = PH.getStage;
  var getAvatarUrl = PH.getAvatarUrl;
  var isNight = PH.isNight;

  /* ═══════════════════════════════════════════════════════════════
     一、注入手机 UI 样式
     ═══════════════════════════════════════════════════════════════ */

  function ph_injectUIStyles() {
    var topDoc = getTopDoc();
    if (topDoc.getElementById('ph-ui-styles')) return;

    var style = topDoc.createElement('style');
    style.id = 'ph-ui-styles';
    style.textContent = `
      /* ═══════════════════════════════════════════
         手机外壳
         ═══════════════════════════════════════════ */
      .ph-overlay {
        position: fixed;
        inset: 0;
        z-index: 99999;
        display: none;
        align-items: center;
        justify-content: center;
        background: rgba(60, 30, 40, 0.35);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        opacity: 0;
        transition: opacity 0.35s ease;
        font-family: -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
      }

      .ph-overlay.ph-open {
        display: flex;
        opacity: 1;
      }

      .ph-phone {
        position: relative;
        width: 380px;
        max-width: 94vw;
        height: 720px;
        max-height: 90vh;
        border-radius: 42px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        transform: scale(0.92);
        transition: transform 0.4s cubic-bezier(0.34, 1.3, 0.64, 1);
        box-shadow:
          0 24px 80px rgba(180, 100, 130, 0.20),
          0 0 0 3px hsla(345, 30%, 75%, 0.4),
          0 0 0 4px rgba(255, 255, 255, 0.6);
        background: var(--ph-bg);
        color: var(--ph-text);
      }

      .ph-overlay.ph-open .ph-phone {
        transform: scale(1);
      }

      /* 主题 A：柔粉 */
      .ph-phone.ph-soft {
        --ph-bg: hsla(345, 40%, 97%, 0.98);
        --ph-bg-screen: hsl(345, 35%, 96%);
        --ph-bg-card: hsla(345, 50%, 99%, 0.95);
        --ph-bg-input: hsla(345, 30%, 93%, 0.9);
        --ph-bg-bubble-me: hsl(345, 55%, 75%);
        --ph-bg-bubble-other: hsl(345, 20%, 94%);
        --ph-text: hsl(345, 25%, 25%);
        --ph-text-dim: hsl(345, 15%, 50%);
        --ph-text-faint: hsl(345, 12%, 68%);
        --ph-text-bubble-me: hsl(345, 20%, 98%);
        --ph-accent: hsl(345, 60%, 68%);
        --ph-accent-soft: hsl(345, 50%, 88%);
        --ph-accent-deep: hsl(345, 45%, 55%);
        --ph-border: hsla(345, 30%, 75%, 0.30);
        --ph-border-soft: hsla(345, 25%, 75%, 0.15);
      }

      /* 主题 B：暖粉 */
      .ph-phone.ph-warm {
        --ph-bg: hsla(15, 40%, 97%, 0.98);
        --ph-bg-screen: hsl(15, 35%, 96%);
        --ph-bg-card: hsla(15, 50%, 99%, 0.95);
        --ph-bg-input: hsla(15, 30%, 93%, 0.9);
        --ph-bg-bubble-me: hsl(15, 55%, 75%);
        --ph-bg-bubble-other: hsl(15, 20%, 94%);
        --ph-text: hsl(15, 25%, 25%);
        --ph-text-dim: hsl(15, 15%, 50%);
        --ph-text-faint: hsl(15, 12%, 68%);
        --ph-text-bubble-me: hsl(15, 20%, 98%);
        --ph-accent: hsl(15, 60%, 68%);
        --ph-accent-soft: hsl(15, 50%, 88%);
        --ph-accent-deep: hsl(15, 45%, 55%);
        --ph-border: hsla(15, 30%, 75%, 0.30);
        --ph-border-soft: hsla(15, 25%, 75%, 0.15);
      }

      /* 刘海 */
      .ph-notch {
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 130px;
        height: 24px;
        background: var(--ph-bg);
        border-radius: 0 0 18px 18px;
        z-index: 30;
      }

      .ph-notch::before {
        content: '';
        position: absolute;
        top: 8px;
        left: 50%;
        transform: translateX(-50%);
        width: 48px;
        height: 4px;
        border-radius: 4px;
        background: hsla(345, 15%, 60%, 0.25);
      }

      /* 状态栏 */
      .ph-status {
        padding: 32px 22px 4px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 11px;
        font-weight: 600;
        color: var(--ph-text);
        flex-shrink: 0;
        z-index: 20;
      }

      .ph-status-time {
        font-family: "SF Mono", "Consolas", monospace;
        letter-spacing: 0.5px;
      }

      .ph-status-right {
        display: flex;
        gap: 4px;
        align-items: center;
      }

      .ph-status-right svg {
        width: 14px;
        height: 14px;
        stroke: currentColor;
        fill: none;
        stroke-width: 2;
        stroke-linecap: round;
      }

      /* 屏幕 */
      .ph-screen {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        position: relative;
      }

      /* 页面 */
      .ph-page {
        position: absolute;
        inset: 0;
        display: none;
        flex-direction: column;
        background: var(--ph-bg-screen);
        padding-bottom: 68px;
        animation: phPageIn 0.35s ease;
      }

      .ph-page.ph-active {
        display: flex;
      }

      @keyframes phPageIn {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }

      /* 顶部导航 */
      .ph-header {
        padding: 12px 16px 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: var(--ph-bg);
        border-bottom: 1px solid var(--ph-border-soft);
        flex-shrink: 0;
      }

      .ph-header-left {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .ph-header-back {
        background: none;
        border: none;
        cursor: pointer;
        color: var(--ph-accent-deep);
        padding: 4px;
        display: flex;
        align-items: center;
      }

      .ph-header-back svg {
        width: 20px;
        height: 20px;
        stroke: currentColor;
        fill: none;
        stroke-width: 2.2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      .ph-header-title {
        font-size: 15px;
        font-weight: 700;
        letter-spacing: 2px;
        color: var(--ph-text);
      }

      .ph-header-sub {
        font-size: 11px;
        color: var(--ph-text-dim);
        letter-spacing: 0.5px;
        margin-top: 2px;
      }

      /* 滚动区 */
      .ph-body {
        flex: 1;
        overflow-y: auto;
        padding: 8px 12px 12px;
      }

      .ph-body::-webkit-scrollbar { width: 3px; }
      .ph-body::-webkit-scrollbar-track { background: transparent; }
      .ph-body::-webkit-scrollbar-thumb {
        background: var(--ph-accent-soft);
        border-radius: 3px;
      }

      /* ── 聊天列表 ── */
      .ph-chat-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 11px 12px;
        background: var(--ph-bg-card);
        border-radius: 16px;
        margin-bottom: 6px;
        cursor: pointer;
        border: 1px solid var(--ph-border-soft);
        transition: all 0.25s ease;
      }

      .ph-chat-item:hover {
        background: var(--ph-accent-soft);
        transform: translateX(2px);
      }

      .ph-chat-avatar {
        width: 48px;
        height: 48px;
        border-radius: 14px;
        overflow: hidden;
        flex-shrink: 0;
        background: var(--ph-accent-soft);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        font-weight: 700;
        color: var(--ph-accent-deep);
        border: 1.5px solid var(--ph-border);
      }

      .ph-chat-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      .ph-chat-info {
        flex: 1;
        min-width: 0;
      }

      .ph-chat-name {
        font-size: 14px;
        font-weight: 700;
        color: var(--ph-text);
        letter-spacing: 0.5px;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .ph-chat-name .ph-tag {
        font-size: 9px;
        font-weight: 600;
        padding: 1px 7px;
        border-radius: 6px;
        background: var(--ph-accent-soft);
        color: var(--ph-accent-deep);
        letter-spacing: 0.5px;
      }

      .ph-chat-msg {
        font-size: 12px;
        color: var(--ph-text-dim);
        margin-top: 3px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .ph-chat-meta {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;
        flex-shrink: 0;
      }

      .ph-chat-time {
        font-size: 10px;
        color: var(--ph-text-faint);
      }

      /* ── 聊天气泡 ── */
      .ph-messages {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 8px 4px;
      }

      .ph-bubble {
        max-width: 76%;
        padding: 9px 14px;
        border-radius: 18px;
        font-size: 13px;
        line-height: 1.55;
        word-wrap: break-word;
        animation: phBubbleIn 0.3s ease;
      }

      @keyframes phBubbleIn {
        from { opacity: 0; transform: translateY(4px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .ph-bubble.me {
        align-self: flex-end;
        background: var(--ph-bg-bubble-me);
        color: var(--ph-text-bubble-me);
        border-bottom-right-radius: 6px;
      }

      .ph-bubble.other {
        align-self: flex-start;
        background: var(--ph-bg-bubble-other);
        color: var(--ph-text);
        border-bottom-left-radius: 6px;
      }

      .ph-bubble-time {
        font-size: 9px;
        opacity: 0.5;
        margin-top: 4px;
        text-align: right;
      }

      .ph-bubble.other .ph-bubble-time {
        text-align: left;
      }

      /* ── 输入区 ── */
      .ph-input-area {
        padding: 10px 14px 14px;
        display: flex;
        gap: 8px;
        align-items: center;
        background: var(--ph-bg);
        border-top: 1px solid var(--ph-border-soft);
        flex-shrink: 0;
      }

      .ph-input {
        flex: 1;
        padding: 9px 16px;
        border-radius: 20px;
        border: 1px solid var(--ph-border);
        background: var(--ph-bg-input);
        font-family: inherit;
        font-size: 13px;
        color: var(--ph-text);
        outline: none;
        transition: border-color 0.3s;
      }

      .ph-input:focus {
        border-color: var(--ph-accent);
      }

      .ph-send-btn {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background: var(--ph-accent);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        transition: all 0.25s ease;
        flex-shrink: 0;
      }

      .ph-send-btn:hover {
        background: var(--ph-accent-deep);
        transform: scale(1.05);
      }

      .ph-send-btn:active {
        transform: scale(0.95);
      }

      .ph-send-btn svg {
        width: 16px;
        height: 16px;
        stroke: currentColor;
        fill: none;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      /* ── 底部导航栏 ── */
      .ph-nav {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        justify-content: space-around;
        padding: 6px 0 10px;
        background: var(--ph-bg);
        border-top: 1px solid var(--ph-border-soft);
        z-index: 25;
      }

      .ph-nav-btn {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        padding: 6px 0;
        background: none;
        border: none;
        cursor: pointer;
        color: var(--ph-text-faint);
        font-family: inherit;
        font-size: 9px;
        letter-spacing: 1px;
        transition: color 0.25s ease;
      }

      .ph-nav-btn.ph-active {
        color: var(--ph-accent-deep);
      }

      .ph-nav-btn svg {
        width: 22px;
        height: 22px;
        stroke: currentColor;
        fill: none;
        stroke-width: 1.8;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      .ph-nav-btn span {
        font-weight: 600;
      }

      /* ── 朋友圈 ── */
      .ph-post {
        background: var(--ph-bg-card);
        border: 1px solid var(--ph-border-soft);
        border-radius: 18px;
        padding: 14px 16px;
        margin-bottom: 10px;
      }

      .ph-post-head {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;
      }

      .ph-post-avatar {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        overflow: hidden;
        flex-shrink: 0;
        background: var(--ph-accent-soft);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        font-weight: 700;
        color: var(--ph-accent-deep);
      }

      .ph-post-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .ph-post-info {
        flex: 1;
      }

      .ph-post-name {
        font-size: 13px;
        font-weight: 700;
        color: var(--ph-text);
      }

      .ph-post-time {
        font-size: 10px;
        color: var(--ph-text-faint);
        margin-top: 2px;
      }

      .ph-post-text {
        font-size: 13px;
        line-height: 1.7;
        color: var(--ph-text);
        margin-bottom: 10px;
      }

      .ph-post-image {
        width: 100%;
        border-radius: 12px;
        overflow: hidden;
        margin-bottom: 10px;
      }

      .ph-post-image img {
        width: 100%;
        display: block;
      }

      .ph-post-actions {
        display: flex;
        gap: 16px;
        padding-top: 10px;
        border-top: 1px solid var(--ph-border-soft);
        font-size: 12px;
        color: var(--ph-text-dim);
      }

      .ph-post-action {
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: color 0.25s;
        user-select: none;
      }

      .ph-post-action:hover {
        color: var(--ph-accent-deep);
      }

      .ph-post-action.liked {
        color: var(--ph-accent-deep);
      }

      .ph-post-action svg {
        width: 14px;
        height: 14px;
        fill: none;
        stroke: currentColor;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      .ph-post-action.liked svg {
        fill: currentColor;
      }

      /* ── 相册 ── */
      .ph-gallery {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        padding: 4px 0;
      }

      .ph-gallery-item {
        position: relative;
        aspect-ratio: 3 / 4;
        border-radius: 14px;
        overflow: hidden;
        background: var(--ph-accent-soft);
        border: 1px solid var(--ph-border-soft);
        cursor: pointer;
        transition: transform 0.3s ease;
      }

      .ph-gallery-item:hover {
        transform: scale(1.02);
      }

      .ph-gallery-item img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      .ph-gallery-label {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 20px 10px 8px;
        background: linear-gradient(180deg, transparent, rgba(0,0,0,0.55));
        color: #fff;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 1px;
      }

      /* ── 设置 ── */
      .ph-setting {
        background: var(--ph-bg-card);
        border: 1px solid var(--ph-border-soft);
        border-radius: 14px;
        padding: 12px 14px;
        margin-bottom: 8px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
      }

      .ph-setting-info {
        flex: 1;
        min-width: 0;
      }

      .ph-setting-name {
        font-size: 12px;
        font-weight: 700;
        color: var(--ph-text);
        letter-spacing: 0.5px;
        margin-bottom: 2px;
      }

      .ph-setting-desc {
        font-size: 10px;
        color: var(--ph-text-faint);
        line-height: 1.5;
      }

      .ph-switch {
        position: relative;
        width: 40px;
        height: 22px;
        border-radius: 11px;
        background: var(--ph-accent-soft);
        cursor: pointer;
        transition: background 0.3s;
        flex-shrink: 0;
      }

      .ph-switch.ph-on {
        background: var(--ph-accent);
      }

      .ph-switch::after {
        content: '';
        position: absolute;
        top: 2px;
        left: 2px;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #fff;
        transition: transform 0.3s cubic-bezier(0.34, 1.3, 0.64, 1);
        box-shadow: 0 1px 3px rgba(0,0,0,0.15);
      }

      .ph-switch.ph-on::after {
        transform: translateX(18px);
      }

      .ph-theme-toggle {
        display: flex;
        gap: 6px;
      }

      .ph-theme-dot {
        width: 26px;
        height: 26px;
        border-radius: 50%;
        border: 2px solid var(--ph-border);
        cursor: pointer;
        transition: transform 0.25s ease, border-color 0.25s;
      }

      .ph-theme-dot:hover {
        transform: scale(1.1);
      }

      .ph-theme-dot.ph-active {
        border-color: var(--ph-accent-deep);
        transform: scale(1.15);
        box-shadow: 0 0 0 2px hsla(345, 40%, 85%, 0.6);
      }

      .ph-theme-dot.ph-soft { background: linear-gradient(135deg, hsl(345, 60%, 80%), hsl(345, 50%, 90%)); }
      .ph-theme-dot.ph-warm { background: linear-gradient(135deg, hsl(15, 60%, 80%), hsl(15, 50%, 90%)); }

      /* 输入框（设置页） */
      .ph-setting-input {
        width: 100%;
        padding: 9px 14px;
        border-radius: 12px;
        border: 1px solid var(--ph-border);
        background: var(--ph-bg-input);
        font-family: inherit;
        font-size: 12px;
        color: var(--ph-text);
        outline: none;
        margin-bottom: 8px;
        transition: border-color 0.3s;
      }

      .ph-setting-input:focus {
        border-color: var(--ph-accent);
      }

      .ph-btn-primary {
        width: 100%;
        padding: 11px;
        border-radius: 12px;
        background: var(--ph-accent);
        border: none;
        color: #fff;
        font-family: inherit;
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 1px;
        cursor: pointer;
        transition: all 0.25s ease;
      }

      .ph-btn-primary:hover {
        background: var(--ph-accent-deep);
      }

      .ph-btn-primary:active {
        transform: scale(0.98);
      }

      /* 空状态 */
      .ph-empty {
        padding: 40px 20px;
        text-align: center;
        color: var(--ph-text-faint);
        font-size: 12px;
        letter-spacing: 2px;
      }

      /* 响应式 */
      @media (max-width: 420px) {
        .ph-phone {
          width: 96vw;
          height: 88vh;
          border-radius: 32px;
        }
        .ph-notch { width: 100px; height: 20px; }
        .ph-status { padding-top: 26px; font-size: 10px; }
      }
    `;
    topDoc.head.appendChild(style);
  }

  /* ═══════════════════════════════════════════════════════════════
     二、构建手机外壳
     ═══════════════════════════════════════════════════════════════ */

  function ph_buildPhone() {
    var topDoc = getTopDoc();

    /* 移除旧的 */
    var old = topDoc.getElementById('ph-overlay');
    if (old) old.remove();

    var overlay = topDoc.createElement('div');
    overlay.className = 'ph-overlay';
    overlay.id = 'ph-overlay';

    overlay.innerHTML = `
      <div class="ph-phone ph-${ph_state.theme}" id="ph-phone">

        <div class="ph-notch"></div>

        <div class="ph-status">
          <span class="ph-status-time" id="ph-clock">--:--</span>
          <div class="ph-status-right">
            <svg viewBox="0 0 24 24"><path d="M2 12h4M6 8v8M10 6v12M14 9v6M18 11v2"/></svg>
            <svg viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><line x1="22" y1="11" x2="22" y2="13"/></svg>
          </div>
        </div>

        <div class="ph-screen">

          <!-- 页1：聊天列表 -->
          <div class="ph-page ph-active" id="ph_page_chats">
            <div class="ph-header">
              <div class="ph-header-left">
                <div>
                  <div class="ph-header-title">消息</div>
                  <div class="ph-header-sub">仅一位联系人</div>
                </div>
              </div>
            </div>
            <div class="ph-body" id="ph_chat_list"></div>
          </div>

          <!-- 页2：聊天详情 -->
          <div class="ph-page" id="ph_page_chat">
            <div class="ph-header">
              <div class="ph-header-left">
                <button class="ph-header-back" id="ph_back_btn">
                  <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <div>
                  <div class="ph-header-title" id="ph_chat_name">青</div>
                  <div class="ph-header-sub" id="ph_chat_sub">在线</div>
                </div>
              </div>
            </div>
            <div class="ph-body" id="ph_messages"></div>
            <div class="ph-input-area">
              <input type="text" class="ph-input" id="ph_input" placeholder="输入消息..." />
              <button class="ph-send-btn" id="ph_send_btn">
                <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
          </div>

          <!-- 页3：朋友圈 -->
          <div class="ph-page" id="ph_page_moments">
            <div class="ph-header">
              <div class="ph-header-left">
                <div>
                  <div class="ph-header-title">朋友圈</div>
                  <div class="ph-header-sub">青的动态</div>
                </div>
              </div>
            </div>
            <div class="ph-body" id="ph_moments"></div>
          </div>

          <!-- 页4：相册 -->
          <div class="ph-page" id="ph_page_gallery">
            <div class="ph-header">
              <div class="ph-header-left">
                <div>
                  <div class="ph-header-title">相册</div>
                  <div class="ph-header-sub">青的照片</div>
                </div>
              </div>
            </div>
            <div class="ph-body" id="ph_gallery"></div>
          </div>

          <!-- 页5：设置 -->
          <div class="ph-page" id="ph_page_settings">
            <div class="ph-header">
              <div class="ph-header-left">
                <div>
                  <div class="ph-header-title">设置</div>
                  <div class="ph-header-sub">小手机配置</div>
                </div>
              </div>
            </div>
            <div class="ph-body">
              <div class="ph-setting">
                <div class="ph-setting-info">
                  <div class="ph-setting-name">主题配色</div>
                  <div class="ph-setting-desc">选择手机的整体色调</div>
                </div>
                <div class="ph-theme-toggle">
                  <div class="ph-theme-dot ph-soft" data-theme="soft" title="柔粉"></div>
                  <div class="ph-theme-dot ph-warm" data-theme="warm" title="暖粉"></div>
                </div>
              </div>

              <div class="ph-setting">
                <div class="ph-setting-info">
                  <div class="ph-setting-name">消息通知</div>
                  <div class="ph-setting-desc">青主动发消息时显示通知</div>
                </div>
                <div class="ph-switch" id="ph_notif_switch"></div>
              </div>

              <div class="ph-setting">
                <div class="ph-setting-info">
                  <div class="ph-setting-name">自动回复</div>
                  <div class="ph-setting-desc">你发消息后青会回复</div>
                </div>
                <div class="ph-switch" id="ph_autoreply_switch"></div>
              </div>

              <div class="ph-setting">
                <div class="ph-setting-info">
                  <div class="ph-setting-name">自动发言</div>
                  <div class="ph-setting-desc">青定时主动发消息或发朋友圈</div>
                </div>
                <div class="ph-switch" id="ph_autoactive_switch"></div>
              </div>

              <div style="margin-top:16px; margin-bottom:6px; font-size:11px; color:var(--ph-text-dim); letter-spacing:1px;">第二 API 配置</div>

              <input type="text" class="ph-setting-input" id="ph_api_url" placeholder="API 地址（如 https://api.openai.com/v1）" />
              <input type="text" class="ph-setting-input" id="ph_api_key" placeholder="API Key" />
              <input type="text" class="ph-setting-input" id="ph_api_model" placeholder="模型（如 gpt-4o-mini）" />

              <button class="ph-btn-primary" id="ph_save_api">保存配置</button>

            </div>
          </div>

          <!-- 底部导航 -->
          <div class="ph-nav">
            <button class="ph-nav-btn ph-active" data-page="chats">
              <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <span>消息</span>
            </button>
            <button class="ph-nav-btn" data-page="moments">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              <span>朋友圈</span>
            </button>
            <button class="ph-nav-btn" data-page="gallery">
              <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <span>相册</span>
            </button>
            <button class="ph-nav-btn" data-page="settings">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              <span>设置</span>
            </button>
          </div>

        </div>
      </div>
    `;

    topDoc.body.appendChild(overlay);

    /* 绑定事件 */
    ph_bindEvents();
  }

  /* ═══════════════════════════════════════════════════════════════
     三、页面渲染
     ═══════════════════════════════════════════════════════════════ */

  /* ── 切换页面 ── */
  function ph_switchPage(page) {
    var topDoc = getTopDoc();
    topDoc.querySelectorAll('.ph-page').forEach(function(p) {
      p.classList.remove('ph-active');
    });
    var target = topDoc.getElementById('ph_page_' + page);
    if (target) target.classList.add('ph-active');

    topDoc.querySelectorAll('.ph-nav-btn').forEach(function(b) {
      b.classList.toggle('ph-active', b.dataset.page === page);
    });

    ph_state.currentPage = page;

    if (page === 'chats') ph_renderChatList();
    if (page === 'moments') ph_renderMoments();
    if (page === 'gallery') ph_renderGallery();
    if (page === 'chat') ph_renderMessages();
  }

  /* ── 聊天列表 ── */
  function ph_renderChatList() {
    var topDoc = getTopDoc();
    var el = topDoc.getElementById('ph_chat_list');
    if (!el) return;

    var lastMsg = ph_state.messages.length > 0 ? ph_state.messages[ph_state.messages.length - 1] : null;
    var preview = lastMsg ? lastMsg.text : '还没有聊天记录';
    var lastTime = lastMsg ? lastMsg.time : '';

    var stage = getStage();
    var stageText = stage.stage;
    if (stage.stage === '后期' && stage.route !== '未定') {
      if (stage.route === '机器人') stageText = '机器人线';
      else if (stage.route === '治愈') stageText = '治愈线';
      else if (stage.route === '崩溃') stageText = '崩溃线';
    }

    var avatarUrl = getAvatarUrl();

    el.innerHTML = '<div class="ph-chat-item" id="ph_chat_entry">' +
      '<div class="ph-chat-avatar"><img src="' + avatarUrl + '" alt="青" onerror="this.style.display=\'none\';this.parentNode.textContent=\'青\';" /></div>' +
      '<div class="ph-chat-info">' +
        '<div class="ph-chat-name">青 <span class="ph-tag">' + escapeHtml(stageText) + '</span></div>' +
        '<div class="ph-chat-msg">' + escapeHtml(preview) + '</div>' +
      '</div>' +
      '<div class="ph-chat-meta">' +
        '<div class="ph-chat-time">' + escapeHtml(lastTime) + '</div>' +
      '</div>' +
    '</div>';

    var entry = topDoc.getElementById('ph_chat_entry');
    if (entry) {
      entry.addEventListener('click', function() {
        ph_switchPage('chat');
        ph_renderMessages();
      });
    }
  }

  /* ── 聊天消息 ── */
  function ph_renderMessages() {
    var topDoc = getTopDoc();
    var el = topDoc.getElementById('ph_messages');
    if (!el) return;

    var stage = getStage();
    var stageText = stage.stage;
    if (stage.stage === '后期' && stage.route !== '未定') {
      if (stage.route === '机器人') stageText = '机器人线';
      else if (stage.route === '治愈') stageText = '治愈线';
      else if (stage.route === '崩溃') stageText = '崩溃线';
    }

    var nameEl = topDoc.getElementById('ph_chat_name');
    var subEl = topDoc.getElementById('ph_chat_sub');
    if (nameEl) nameEl.textContent = '青';
    if (subEl) subEl.textContent = stageText + ' · ' + (isNight() ? '深夜' : '在线');

    if (ph_state.messages.length === 0) {
      el.innerHTML = '<div class="ph-empty">还没有聊天记录<br/>发一条消息试试</div>';
      return;
    }

    var html = '<div class="ph-messages">';
    ph_state.messages.forEach(function(m) {
      var isMe = m.from === 'me';
      html += '<div class="ph-bubble ' + (isMe ? 'me' : 'other') + '">' +
        escapeHtml(m.text).replace(/\n/g, '<br/>') +
        '<div class="ph-bubble-time">' + escapeHtml(m.time || '') + '</div>' +
      '</div>';
    });
    html += '</div>';
    el.innerHTML = html;
    el.scrollTop = el.scrollHeight;
  }

  /* ── 朋友圈 ── */
  function ph_renderMoments() {
    var topDoc = getTopDoc();
    var el = topDoc.getElementById('ph_moments');
    if (!el) return;

    if (ph_state.posts.length === 0) {
      el.innerHTML = '<div class="ph-empty">还没有动态</div>';
      return;
    }

    var avatarUrl = getAvatarUrl();
    var html = '';
    ph_state.posts.forEach(function(p, idx) {
      html += '<div class="ph-post">' +
        '<div class="ph-post-head">' +
          '<div class="ph-post-avatar"><img src="' + avatarUrl + '" alt="青" onerror="this.style.display=\'none\';this.parentNode.textContent=\'青\';" /></div>' +
          '<div class="ph-post-info">' +
            '<div class="ph-post-name">青</div>' +
            '<div class="ph-post-time">' + escapeHtml(p.time) + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="ph-post-text">' + escapeHtml(p.text) + '</div>' +
        (p.image ? '<div class="ph-post-image"><img src="' + p.image + '" alt="" /></div>' : '') +
        '<div class="ph-post-actions">' +
          '<div class="ph-post-action ' + (p.liked ? 'liked' : '') + '" data-idx="' + idx + '">' +
            '<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
            '<span>' + (p.likes || 0) + '</span>' +
          '</div>' +
        '</div>' +
      '</div>';
    });
    el.innerHTML = html;

    /* 点赞事件 */
    el.querySelectorAll('.ph-post-action').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var idx = parseInt(this.getAttribute('data-idx'), 10);
        if (isNaN(idx)) return;
        var p = ph_state.posts[idx];
        if (!p) return;
        p.liked = !p.liked;
        p.likes = (p.likes || 0) + (p.liked ? 1 : -1);
        save(PH_KEYS.posts, ph_state.posts);
        ph_renderMoments();
      });
    });
  }

  /* ── 相册 ── */
  function ph_renderGallery() {
    var topDoc = getTopDoc();
    var el = topDoc.getElementById('ph_gallery');
    if (!el) return;

    var html = '<div class="ph-gallery">';
    PH_GALLERY.forEach(function(g) {
      html += '<div class="ph-gallery-item">' +
        '<img src="' + g.url + '" alt="' + escapeHtml(g.label) + '" />' +
        '<div class="ph-gallery-label">' + escapeHtml(g.label) + '</div>' +
      '</div>';
    });
    html += '</div>';
    el.innerHTML = html;
  }

  /* ═══════════════════════════════════════════════════════════════
     四、事件绑定
     ═══════════════════════════════════════════════════════════════ */

  function ph_bindEvents() {
    var topDoc = getTopDoc();

    /* 返回按钮 */
    var backBtn = topDoc.getElementById('ph_back_btn');
    if (backBtn) {
      backBtn.addEventListener('click', function() {
        ph_switchPage('chats');
      });
    }

    /* 发送按钮 */
    var sendBtn = topDoc.getElementById('ph_send_btn');
    if (sendBtn) {
      sendBtn.addEventListener('click', function() {
        if (typeof window.ph_sendMessage === 'function') {
          window.ph_sendMessage();
        }
      });
    }

    /* 输入框回车 */
    var input = topDoc.getElementById('ph_input');
    if (input) {
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (typeof window.ph_sendMessage === 'function') {
            window.ph_sendMessage();
          }
        }
      });
    }

    /* 导航切换 */
    topDoc.querySelectorAll('.ph-nav-btn').forEach(function(b) {
      b.addEventListener('click', function() {
        ph_switchPage(b.dataset.page);
      });
    });

    /* 主题切换 */
    topDoc.querySelectorAll('.ph-theme-dot').forEach(function(d) {
      d.addEventListener('click', function() {
        var theme = this.dataset.theme;
        ph_applyTheme(theme);
      });
    });

    /* 通知开关 */
    var notifSwitch = topDoc.getElementById('ph_notif_switch');
    if (notifSwitch) {
      notifSwitch.addEventListener('click', function() {
        this.classList.toggle('ph-on');
        ph_state.notifEnabled = this.classList.contains('ph-on');
        save(PH_KEYS.notif, ph_state.notifEnabled);
      });
    }

    /* 自动回复开关 */
    var autoReplySwitch = topDoc.getElementById('ph_autoreply_switch');
    if (autoReplySwitch) {
      autoReplySwitch.addEventListener('click', function() {
        this.classList.toggle('ph-on');
        ph_state.autoReplyEnabled = this.classList.contains('ph-on');
        save(PH_KEYS.autoReply, ph_state.autoReplyEnabled);
      });
    }

    /* 自动发言开关 */
    var autoActiveSwitch = topDoc.getElementById('ph_autoactive_switch');
    if (autoActiveSwitch) {
      autoActiveSwitch.addEventListener('click', function() {
        this.classList.toggle('ph-on');
        ph_state.autoActiveEnabled = this.classList.contains('ph-on');
        save(PH_KEYS.autoActive, ph_state.autoActiveEnabled);
        if (typeof window.ph_restartAutoActive === 'function') {
          window.ph_restartAutoActive();
        }
      });
    }

    /* 保存 API 配置 */
    var saveApiBtn = topDoc.getElementById('ph_save_api');
    if (saveApiBtn) {
      saveApiBtn.addEventListener('click', function() {
        var url = topDoc.getElementById('ph_api_url').value.trim();
        var key = topDoc.getElementById('ph_api_key').value.trim();
        var model = topDoc.getElementById('ph_api_model').value.trim();
        ph_state.apiConfig = { url: url, key: key, model: model };
        save(PH_KEYS.apiConfig, ph_state.apiConfig);
        alert('API 配置已保存');
      });
    }

    /* 点击遮罩关闭 */
    var overlay = topDoc.getElementById('ph-overlay');
    if (overlay) {
      overlay.addEventListener('click', function(e) {
        if (e.target === this) {
          ph_closePhone();
        }
      });
    }
  }

  /* ── 主题应用 ── */
  function ph_applyTheme(theme) {
    var topDoc = getTopDoc();
    var phone = topDoc.getElementById('ph-phone');
    if (!phone) return;

    phone.classList.remove('ph-soft', 'ph-warm');
    phone.classList.add('ph-' + theme);
    ph_state.theme = theme;
    save(PH_KEYS.theme, theme);

    topDoc.querySelectorAll('.ph-theme-dot').forEach(function(d) {
      d.classList.toggle('ph-active', d.dataset.theme === theme);
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     五、开关状态同步（初始化时调用）
     ═══════════════════════════════════════════════════════════════ */

  function ph_syncSwitches() {
    var topDoc = getTopDoc();

    var notifSwitch = topDoc.getElementById('ph_notif_switch');
    if (notifSwitch) {
      notifSwitch.classList.toggle('ph-on', ph_state.notifEnabled);
    }

    var autoReplySwitch = topDoc.getElementById('ph_autoreply_switch');
    if (autoReplySwitch) {
      autoReplySwitch.classList.toggle('ph-on', ph_state.autoReplyEnabled);
    }

    var autoActiveSwitch = topDoc.getElementById('ph_autoactive_switch');
    if (autoActiveSwitch) {
      autoActiveSwitch.classList.toggle('ph-on', ph_state.autoActiveEnabled);
    }

    /* API 配置 */
    var apiUrl = topDoc.getElementById('ph_api_url');
    if (apiUrl) apiUrl.value = ph_state.apiConfig.url || '';
    var apiKey = topDoc.getElementById('ph_api_key');
    if (apiKey) apiKey.value = ph_state.apiConfig.key || '';
    var apiModel = topDoc.getElementById('ph_api_model');
    if (apiModel) apiModel.value = ph_state.apiConfig.model || '';

    /* 主题 */
    topDoc.querySelectorAll('.ph-theme-dot').forEach(function(d) {
      d.classList.toggle('ph-active', d.dataset.theme === ph_state.theme);
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     六、打开 / 关闭手机
     ═══════════════════════════════════════════════════════════════ */

  function ph_openPhone() {
    var topDoc = getTopDoc();
    var overlay = topDoc.getElementById('ph-overlay');
    if (!overlay) return;

    overlay.classList.add('ph-open');
    ph_state.isOpen = true;

    /* 清空未读 */
    if (typeof window.__qing_phone.clearUnread === 'function') {
      window.__qing_phone.clearUnread();
    }

    /* 同步开关状态 */
    ph_syncSwitches();

    /* 渲染首页 */
    ph_switchPage('chats');

    /* 更新时钟 */
    ph_updateClock();
  }

  function ph_closePhone() {
    var topDoc = getTopDoc();
    var overlay = topDoc.getElementById('ph-overlay');
    if (!overlay) return;
    overlay.classList.remove('ph-open');
    ph_state.isOpen = false;
  }

  /* ═══════════════════════════════════════════════════════════════
     七、时钟
     ═══════════════════════════════════════════════════════════════ */

  function ph_updateClock() {
    var topDoc = getTopDoc();
    var el = topDoc.getElementById('ph-clock');
    if (el) el.textContent = now();
  }

  /* ═══════════════════════════════════════════════════════════════
     八、暴露到全局
     ═══════════════════════════════════════════════════════════════ */

  window.ph_openPhone = ph_openPhone;
  window.ph_closePhone = ph_closePhone;
  window.ph_switchPage = ph_switchPage;
  window.ph_renderChatList = ph_renderChatList;
  window.ph_renderMessages = ph_renderMessages;
  window.ph_renderMoments = ph_renderMoments;
  window.ph_renderGallery = ph_renderGallery;
  window.ph_applyTheme = ph_applyTheme;

  window.__qing_phone.buildPhone = ph_buildPhone;
  window.__qing_phone.injectUIStyles = ph_injectUIStyles;
  window.__qing_phone.openPhone = ph_openPhone;
  window.__qing_phone.closePhone = ph_closePhone;

  /* ═══════════════════════════════════════════════════════════════
     九、初始化
     ═══════════════════════════════════════════════════════════════ */

  function ph_init() {
    ph_injectUIStyles();
    ph_buildPhone();
    setInterval(ph_updateClock, 30000);
    console.log('[小手机] 第3段已加载：UI 生成');
  }

  if (typeof errorCatched === 'function') {
    $(errorCatched(ph_init));
  } else if (typeof $ === 'function') {
    $(ph_init);
  } else {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', ph_init);
    } else {
      ph_init();
    }
  }

})();
/* ═══════════════════════════════════════════════════════════════
   青 · 小手机系统 · 第 4 段
   自动回复 + 自动发言 + 世界书同步
   ═══════════════════════════════════════════════════════════════ */

(async function() {
  'use strict';

  if (!window.__qing_phone) {
    console.error('[小手机] 第1段未加载，第4段中止');
    return;
  }

  var PH = window.__qing_phone;
  var PH_CONFIG = PH.CONFIG;
  var PH_KEYS = PH.KEYS;
  var ph_state = PH.state;

  var getTopDoc = PH.getTopDoc;
  var escapeHtml = PH.escapeHtml;
  var now = PH.now;
  var save = PH.save;
  var load = PH.load;
  var getStage = PH.getStage;
  var getAvatarUrl = PH.getAvatarUrl;
  var buildSystemPrompt = PH.buildSystemPrompt;
  var getLocalReply = PH.getLocalReply;
  var getAutoMessage = PH.getAutoMessage;
  var getAutoPost = PH.getAutoPost;
  var showNotification = PH.showNotification;

  /* ────────── 动态调用 UI 渲染函数（防止第3段未就绪） ────────── */
  function ph_doRenderChatList() {
    if (typeof window.ph_renderChatList === 'function') window.ph_renderChatList();
  }
  function ph_doRenderMessages() {
    if (typeof window.ph_renderMessages === 'function') window.ph_renderMessages();
  }
  function ph_doRenderMoments() {
    if (typeof window.ph_renderMoments === 'function') window.ph_renderMoments();
  }

  /* ═══════════════════════════════════════════════════════════════
     一、调用第二 API
     ═══════════════════════════════════════════════════════════════ */

  async function ph_callApi(userMsg) {
    var config = ph_state.apiConfig || {};
    if (!config.url || !config.key || !config.model) {
      return null;
    }

    var systemPrompt = buildSystemPrompt();

    /* 取最近 6 条历史 */
    var history = ph_state.messages.slice(-6).map(function(m) {
      return {
        role: m.from === 'me' ? 'user' : 'assistant',
        content: m.text
      };
    });

    var messages = [{ role: 'system', content: systemPrompt }].concat(history);
    messages.push({ role: 'user', content: userMsg });

    var apiUrl = config.url.replace(/\/$/, '');
    if (!apiUrl.includes('/chat/completions')) {
      apiUrl = apiUrl + '/chat/completions';
    }

    try {
      var controller = new AbortController();
      var timeoutId = setTimeout(function() { controller.abort(); }, 30000);

      var res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + config.key
        },
        body: JSON.stringify({
          model: config.model,
          messages: messages,
          max_tokens: 200,
          temperature: 0.85,
          stream: false
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        console.warn('[小手机] API 返回错误：', res.status);
        return null;
      }

      var data = await res.json();
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content.trim();
      }
      return null;
    } catch (e) {
      console.warn('[小手机] API 调用失败：', e.message);
      return null;
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     二、用户发消息
     ═══════════════════════════════════════════════════════════════ */

  async function ph_sendMessage() {
    var topDoc = getTopDoc();
    var input = topDoc.getElementById('ph_input');
    if (!input) return;

    var text = input.value.trim();
    if (!text) return;

    /* 存用户消息 */
    ph_state.messages.push({
      from: 'me',
      text: text,
      time: now()
    });
    save(PH_KEYS.messages, ph_state.messages);
    input.value = '';
    ph_doRenderMessages();
    ph_doRenderChatList();

    /* 同步到世界书 */
    ph_syncToWorldbook('你在手机上对青说："' + text + '"');

    /* 自动回复 */
    if (!ph_state.autoReplyEnabled) return;

    /* 清除旧定时器 */
    if (ph_state.autoReplyTimer) {
      clearTimeout(ph_state.autoReplyTimer);
    }

    var delay = PH_CONFIG.autoReplyDelayMin +
                Math.random() * (PH_CONFIG.autoReplyDelayMax - PH_CONFIG.autoReplyDelayMin);

    ph_state.autoReplyTimer = setTimeout(async function() {
      var reply = await ph_callApi(text);
      if (!reply) {
        reply = getLocalReply();
      }
      if (!reply) return;

      /* 存青的回复 */
      ph_state.messages.push({
        from: 'other',
        text: reply,
        time: now()
      });
      save(PH_KEYS.messages, ph_state.messages);

      /* 刷新 UI */
      if (ph_state.currentPage === 'chat') {
        ph_doRenderMessages();
      }
      ph_doRenderChatList();

      /* 显示通知 */
      showNotification(reply, 'message');

      /* 同步到世界书 */
      ph_syncToWorldbook('青在手机上回复了你："' + reply + '"');

      console.log('[小手机] 青回复：' + reply.slice(0, 20));
    }, delay);
  }

  window.ph_sendMessage = ph_sendMessage;

  /* ═══════════════════════════════════════════════════════════════
     三、世界书同步
     ═══════════════════════════════════════════════════════════════ */

  var ph_syncQueue = Promise.resolve();

  function ph_syncToWorldbook(logText) {
    ph_syncQueue = ph_syncQueue.then(function() {
      return ph_doSync(logText);
    }, function() {
      return ph_doSync(logText);
    });
  }

  async function ph_doSync(logText) {
    if (!logText) return;
    if (typeof updateWorldbookWith !== 'function') {
      console.warn('[小手机] 缺少 updateWorldbookWith，跳过同步');
      return;
    }

    try {
      var wbName = PH_CONFIG.worldbookName;
      /* 尝试获取当前世界书名称 */
      try {
        if (typeof getCurrentWorldbookName === 'function') {
          var cur = getCurrentWorldbookName();
          if (cur && cur.trim() !== '') wbName = cur;
        }
      } catch (e) {}

      var entryName = PH_CONFIG.memoryPrefix + PH_CONFIG.charName;
      var entryKey = PH_CONFIG.charName;
      var maxHistory = PH_CONFIG.maxHistoryLines;
      var summaryMaxChars = PH_CONFIG.summaryMaxChars;

      /* 查找现有条目 */
      var existingEntry = null;
      await updateWorldbookWith(wbName, function(entries) {
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].name === entryName) {
            existingEntry = entries[i];
            break;
          }
        }
        return entries;
      });

      var historyLines = [];
      var oldSummary = '';

      /* 解析现有内容 */
      if (existingEntry) {
        var content = existingEntry.content || '';
        var sumMatch = content.match(/【近期总结】\n([\s\S]*?)\n【近期互动】\n/);
        if (sumMatch) {
          oldSummary = sumMatch[1].trim();
          var afterSum = content.substring(content.indexOf('【近期互动】\n') + '【近期互动】\n'.length);
          historyLines = afterSum.split('\n').filter(function(l) { return l.trim() !== ''; });
        } else {
          historyLines = content.split('\n').filter(function(l) { return l.trim() !== ''; });
          if (historyLines.length > 0 && historyLines[0].indexOf('这是{{user}}') >= 0) {
            historyLines.shift();
          }
        }
      }

      /* 加上新日志 */
      var timeStr = now();
      historyLines.push('- [' + timeStr + '] ' + logText);

      var headerLine = '（这是{{user}}在小手机上与青的近期互动，写剧情和对话时必须严格参考并呼应该记忆）\n';

      /* 判断是否需要触发总结 */
      if (historyLines.length >= maxHistory) {
        var summary = null;

        if (ph_state.apiConfig.url && ph_state.apiConfig.key && ph_state.apiConfig.model) {
          try {
            var linesToSum = historyLines.slice(0, maxHistory);
            var prompt = '你是一位剧情整理助手。以下是{{user}}与青在手机上的最近 ' + maxHistory +
              ' 条互动记录。请将它们总结成一段 200-300 字的摘要，用于后续剧情参考。摘要需包含：时间跨度、关系阶段变化、2-3 个关键事件、角色对{{user}}的情感倾向、重要对话亮点。\n\n互动记录：\n' +
              linesToSum.join('\n');

            var apiUrl = ph_state.apiConfig.url.replace(/\/$/, '') + '/chat/completions';
            var controller = new AbortController();
            var timeoutId = setTimeout(function() { controller.abort(); }, 30000);

            var res = await fetch(apiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + ph_state.apiConfig.key
              },
              body: JSON.stringify({
                model: ph_state.apiConfig.model,
                messages: [{ role: 'system', content: prompt }],
                max_tokens: 400,
                temperature: 0.7,
                stream: false
              }),
              signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (res.ok) {
              var data = await res.json();
              if (data.choices && data.choices[0] && data.choices[0].message) {
                summary = data.choices[0].message.content.trim();
                if (summary.length > summaryMaxChars) {
                  summary = summary.substring(0, summaryMaxChars) + '…';
                }
              }
            }
          } catch (e) {
            console.warn('[小手机] 总结失败：', e.message);
          }
        }

        var newContent = '';
        if (summary) {
          var linesForNew = historyLines.slice(maxHistory);
          var blocks = [];
          if (oldSummary) blocks.push('【近期总结】\n' + oldSummary);
          blocks.push('【近期总结】\n' + summary);
          if (linesForNew.length > 0) {
            blocks.push('【近期互动】\n' + linesForNew.join('\n'));
          }
          newContent = headerLine + blocks.join('\n\n') + '\n';
        } else {
          var fallbackLines = historyLines.slice(-20);
          newContent = headerLine + fallbackLines.join('\n') + '\n';
        }

        await updateWorldbookWith(wbName, function(entries) {
          var idx = -1;
          for (var i = 0; i < entries.length; i++) {
            if (entries[i].name === entryName) {
              idx = i;
              break;
            }
          }
          if (idx !== -1) {
            entries[idx].content = newContent;
          } else {
            entries.push({
              uid: Date.now() + Math.floor(Math.random() * 1000),
              name: entryName,
              enabled: true,
              strategy: {
                type: 'selective',
                keys: [entryKey],
                keys_secondary: { logic: 'and_any', keys: [] },
                scan_depth: 'same_as_global'
              },
              position: { type: 'before_character_definition', order: 120 },
              content: newContent,
              probability: 100,
              recursion: { prevent_outgoing: true, prevent_incoming: false, delay_until: null },
              effect: { sticky: null, cooldown: null, delay: null },
              extra: {}
            });
          }
          return entries;
        });

      } else {
        /* 未到总结阈值，直接追加 */
        var newContent2 = headerLine + historyLines.join('\n') + '\n';
        await updateWorldbookWith(wbName, function(entries) {
          var idx = -1;
          for (var i = 0; i < entries.length; i++) {
            if (entries[i].name === entryName) {
              idx = i;
              break;
            }
          }
          if (idx !== -1) {
            entries[idx].content = newContent2;
          } else {
            entries.push({
              uid: Date.now() + Math.floor(Math.random() * 1000),
              name: entryName,
              enabled: true,
              strategy: {
                type: 'selective',
                keys: [entryKey],
                keys_secondary: { logic: 'and_any', keys: [] },
                scan_depth: 'same_as_global'
              },
              position: { type: 'before_character_definition', order: 120 },
              content: newContent2,
              probability: 100,
              recursion: { prevent_outgoing: true, prevent_incoming: false, delay_until: null },
              effect: { sticky: null, cooldown: null, delay: null },
              extra: {}
            });
          }
          return entries;
        });
      }

    } catch (e) {
      console.error('[小手机] 世界书同步失败：', e);
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     四、自动发言（定时器）
     ═══════════════════════════════════════════════════════════════ */

  function ph_startAutoActive() {
    ph_stopAutoActive();

    if (!ph_state.autoActiveEnabled) return;

    var intervalMs = ph_state.autoActiveInterval * 60 * 1000;
    console.log('[小手机] 自动发言已启动，间隔 ' + ph_state.autoActiveInterval + ' 分钟');

    ph_state.autoActiveTimer = setInterval(function() {
      ph_doAutoActive();
    }, intervalMs);
  }

  function ph_stopAutoActive() {
    if (ph_state.autoActiveTimer) {
      clearInterval(ph_state.autoActiveTimer);
      ph_state.autoActiveTimer = null;
      console.log('[小手机] 自动发言已停止');
    }
  }

  function ph_restartAutoActive() {
    ph_stopAutoActive();
    if (ph_state.autoActiveEnabled) {
      ph_startAutoActive();
    }
  }

  /* ── 执行一次自动发言 ── */
  async function ph_doAutoActive() {
    if (!ph_state.autoActiveEnabled) return;

    var stage = getStage();
    if (stage.deceased) {
      console.log('[小手机] 已逝状态，跳过自动发言');
      return;
    }

    /* 60% 发消息，40% 发朋友圈 */
    var isMessage = Math.random() < 0.6;

    if (isMessage) {
      await ph_sendAutoMessage();
    } else {
      await ph_sendAutoPost();
    }
  }

  /* ── 青主动发消息 ── */
  async function ph_sendAutoMessage() {
    var content = null;

    /* 优先用 API */
    if (ph_state.apiConfig.url && ph_state.apiConfig.key && ph_state.apiConfig.model) {
      try {
        var systemPrompt = buildSystemPrompt();
        var prompt = '你现在想主动给{{user}}发一条消息。请用你自己的语气，生成一条简短、自然、口语化的消息（20-50字以内）。不要用括号写动作，不要解释原因。';

        var apiUrl = ph_state.apiConfig.url.replace(/\/$/, '') + '/chat/completions';
        var controller = new AbortController();
        var timeoutId = setTimeout(function() { controller.abort(); }, 15000);

        var res = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + ph_state.apiConfig.key
          },
          body: JSON.stringify({
            model: ph_state.apiConfig.model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ],
            max_tokens: 80,
            temperature: 0.9,
            stream: false
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          var data = await res.json();
          if (data.choices && data.choices[0] && data.choices[0].message) {
            content = data.choices[0].message.content.trim().replace(/^["「]|["」]$/g, '');
          }
        }
      } catch (e) {
        console.warn('[小手机] 自动发消息 API 失败：', e.message);
      }
    }

    /* 降级到本地库 */
    if (!content) {
      content = getAutoMessage();
    }
    if (!content) return;

    /* 存消息 */
    ph_state.messages.push({
      from: 'other',
      text: content,
      time: now()
    });
    save(PH_KEYS.messages, ph_state.messages);

    /* 刷新 UI */
    if (ph_state.currentPage === 'chat') {
      ph_doRenderMessages();
    }
    ph_doRenderChatList();

    /* 显示通知 */
    showNotification(content, 'message');

    /* 同步到世界书 */
    ph_syncToWorldbook('青主动给你发了一条消息："' + content + '"');

    console.log('[小手机] 青主动发消息：' + content);
  }

  /* ── 青发朋友圈 ── */
  async function ph_sendAutoPost() {
    var content = getAutoPost();
    if (!content) return;

    var post = {
      text: content,
      time: now(),
      likes: 0,
      liked: false
    };

    ph_state.posts.unshift(post);
    if (ph_state.posts.length > 30) {
      ph_state.posts = ph_state.posts.slice(0, 30);
    }
    save(PH_KEYS.posts, ph_state.posts);

    /* 刷新 UI */
    if (ph_state.currentPage === 'moments') {
      ph_doRenderMoments();
    }

    /* 显示通知 */
    showNotification(content, 'post');

    /* 同步到世界书 */
    ph_syncToWorldbook('青发布了朋友圈："' + content + '"');

    console.log('[小手机] 青发朋友圈：' + content);
  }

  /* ═══════════════════════════════════════════════════════════════
     五、暴露到全局
     ═══════════════════════════════════════════════════════════════ */

  window.ph_restartAutoActive = ph_restartAutoActive;
  window.ph_startAutoActive = ph_startAutoActive;
  window.ph_stopAutoActive = ph_stopAutoActive;

  window.__qing_phone.sendMessage = ph_sendMessage;
  window.__qing_phone.callApi = ph_callApi;
  window.__qing_phone.syncToWorldbook = ph_syncToWorldbook;
  window.__qing_phone.startAutoActive = ph_startAutoActive;
  window.__qing_phone.stopAutoActive = ph_stopAutoActive;

  /* ═══════════════════════════════════════════════════════════════
     六、初始化
     ═══════════════════════════════════════════════════════════════ */

  function ph_init() {
    /* 如果自动发言已开启，启动定时器 */
    if (ph_state.autoActiveEnabled) {
      ph_startAutoActive();
    }
    console.log('[小手机] 第4段已加载：自动回复 + 自动发言 + 世界书同步');
  }

  if (typeof errorCatched === 'function') {
    $(errorCatched(ph_init));
  } else if (typeof $ === 'function') {
    $(ph_init);
  } else {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', ph_init);
    } else {
      ph_init();
    }
  }

})();
/* ═══════════════════════════════════════════════════════════════
   青 · 小手机系统 · 第 5 段
   初始化 + MVU 监听 + 卸载清理
   ═══════════════════════════════════════════════════════════════ */

(async function() {
  'use strict';

  if (!window.__qing_phone) {
    console.error('[小手机] 第1段未加载，第5段中止');
    return;
  }

  var PH = window.__qing_phone;
  var PH_CONFIG = PH.CONFIG;
  var PH_KEYS = PH.KEYS;
  var ph_state = PH.state;

  var getTopDoc = PH.getTopDoc;
  var getTopWin = PH.getTopWin;
  var loadAll = PH.loadAll;
  var getStage = PH.getStage;
  var getAvatarUrl = PH.getAvatarUrl;
  var now = PH.now;
  var save = PH.save;

  /* ═══════════════════════════════════════════════════════════════
     一、全局刷新（阶段变化时调用）
     ═══════════════════════════════════════════════════════════════ */

  var ph_lastStageHash = '';

  function ph_refreshAll() {
    /* 只刷新当前打开的页面 */
    if (ph_state.isOpen) {
      if (ph_state.currentPage === 'chats') {
        if (typeof window.ph_renderChatList === 'function') {
          window.ph_renderChatList();
        }
      } else if (ph_state.currentPage === 'chat') {
        if (typeof window.ph_renderMessages === 'function') {
          window.ph_renderMessages();
        }
      } else if (ph_state.currentPage === 'moments') {
        if (typeof window.ph_renderMoments === 'function') {
          window.ph_renderMoments();
        }
      }
    }
  }

  /* ── 检测阶段是否变化 ── */
  function ph_checkStageChange() {
    try {
      var s = getStage();
      var hash = s.stage + '|' + s.route + '|' + s.relation + '|' + (s.deceased ? '1' : '0') + '|' + s.period;
      if (hash !== ph_lastStageHash) {
        ph_lastStageHash = hash;
        console.log('[小手机] 阶段变化：', s.stage, s.route, s.relation, s.deceased ? '已逝' : '', s.period);

        /* 阶段变化时，刷新 UI */
        ph_refreshAll();

        /* 更新悬浮按钮的红点（不需要，红点跟未读走） */

        /* 头像变化（如果当前在聊天列表或聊天页） */
        /* 这些渲染函数内部会自动从 getAvatarUrl() 取新的头像 */
      }
    } catch (e) {}
  }

  /* ═══════════════════════════════════════════════════════════════
     二、时钟
     ═══════════════════════════════════════════════════════════════ */

  function ph_updateClock() {
    var topDoc = getTopDoc();
    var el = topDoc.getElementById('ph-clock');
    if (el) el.textContent = now();
  }

  /* ═══════════════════════════════════════════════════════════════
     三、MVU 变量监听
     ═══════════════════════════════════════════════════════════════ */

  function ph_initMvuListener() {
    /* 监听 MVU 变量更新 */
    try {
      if (typeof eventOn === 'function' && typeof Mvu !== 'undefined' &&
          Mvu.events && Mvu.events.VARIABLE_UPDATE_ENDED) {
        eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, function() {
          ph_checkStageChange();
        });
        console.log('[小手机] MVU 监听已注册');
      }
    } catch (e) {
      console.warn('[小手机] MVU 监听注册失败：', e.message);
    }

    /* 轮询兜底（每 2 秒） */
    setInterval(function() {
      ph_checkStageChange();
    }, 2000);
  }

  /* ═══════════════════════════════════════════════════════════════
     四、酒馆事件监听（关闭聊天时清理）
     ═══════════════════════════════════════════════════════════════ */

  function ph_initTavernListener() {
    try {
      if (typeof eventOn === 'function' && typeof tavern_events !== 'undefined') {
        /* 切换聊天时，重置未读 */
        if (tavern_events.CHAT_CHANGED) {
          eventOn(tavern_events.CHAT_CHANGED, function() {
            console.log('[小手机] 切换聊天，重置未读');
            if (typeof window.__qing_phone.clearUnread === 'function') {
              window.__qing_phone.clearUnread();
            }
          });
        }
      }
    } catch (e) {}
  }

  /* ═══════════════════════════════════════════════════════════════
     五、键盘快捷键
     ═══════════════════════════════════════════════════════════════ */

  function ph_initKeyboard() {
    document.addEventListener('keydown', function(e) {
      /* ESC 关闭手机 */
      if (e.key === 'Escape' && ph_state.isOpen) {
        if (typeof window.ph_closePhone === 'function') {
          window.ph_closePhone();
        }
      }

      /* Ctrl + Shift + P 打开/关闭手机 */
      if (e.ctrlKey && e.shiftKey && (e.key === 'P' || e.key === 'p')) {
        e.preventDefault();
        if (ph_state.isOpen) {
          if (typeof window.ph_closePhone === 'function') {
            window.ph_closePhone();
          }
        } else {
          if (typeof window.ph_openPhone === 'function') {
            window.ph_openPhone();
          }
        }
      }
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     六、卸载清理
     ═══════════════════════════════════════════════════════════════ */

  function ph_cleanup() {
    /* 停止自动发言定时器 */
    if (ph_state.autoActiveTimer) {
      clearInterval(ph_state.autoActiveTimer);
      ph_state.autoActiveTimer = null;
    }

    /* 停止自动回复定时器 */
    if (ph_state.autoReplyTimer) {
      clearTimeout(ph_state.autoReplyTimer);
      ph_state.autoReplyTimer = null;
    }

    console.log('[小手机] 已卸载');
  }

  /* ═══════════════════════════════════════════════════════════════
     七、完整启动流程
     ═══════════════════════════════════════════════════════════════ */

  async function ph_bootstrap() {
    console.log('[小手机] ═══════════════════════════════');
    console.log('[小手机] 青 · 定制版启动中...');

    /* 1. 加载持久化数据 */
    loadAll();
    console.log('[小手机] 数据已加载：' +
      ph_state.messages.length + ' 条消息，' +
      ph_state.posts.length + ' 条动态');

    /* 2. 初始化 MVU 监听 */
    ph_initMvuListener();

    /* 3. 初始化酒馆事件监听 */
    ph_initTavernListener();

    /* 4. 初始化键盘快捷键 */
    ph_initKeyboard();

    /* 5. 初始阶段检测 */
    ph_checkStageChange();

    /* 6. 时钟更新（每 30 秒） */
    setInterval(ph_updateClock, 30000);

    /* 7. 如果自动发言已开启，启动定时器 */
    if (ph_state.autoActiveEnabled && typeof window.ph_startAutoActive === 'function') {
      window.ph_startAutoActive();
    }

    /* 8. 更新悬浮按钮的红点（未读计数从 0 开始） */
    if (typeof window.__qing_phone.addUnread === 'function') {
      /* 不主动加，保持 0 */
    }

    /* 9. 页面卸载时清理 */
    if (typeof $ === 'function') {
      $(window).on('pagehide', function() {
        ph_cleanup();
      });
    } else {
      window.addEventListener('pagehide', ph_cleanup);
    }

    console.log('[小手机] 启动完成');
    console.log('[小手机] 快捷键：');
    console.log('[小手机]   - 点击右下角悬浮按钮打开手机');
    console.log('[小手机]   - Ctrl + Shift + P 快速开关');
    console.log('[小手机]   - ESC 关闭手机');
    console.log('[小手机] ═══════════════════════════════');
  }

  /* ═══════════════════════════════════════════════════════════════
     八、暴露到全局
     ═══════════════════════════════════════════════════════════════ */

  window.__qing_phone.refreshAll = ph_refreshAll;
  window.__qing_phone.checkStageChange = ph_checkStageChange;
  window.__qing_phone.cleanup = ph_cleanup;
  window.__qing_phone.bootstrap = ph_bootstrap;

  /* ═══════════════════════════════════════════════════════════════
     九、启动
     ═══════════════════════════════════════════════════════════════ */

  if (typeof errorCatched === 'function') {
    $(errorCatched(ph_bootstrap));
  } else if (typeof $ === 'function') {
    $(ph_bootstrap);
  } else {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', ph_bootstrap);
    } else {
      ph_bootstrap();
    }
  }

})();
