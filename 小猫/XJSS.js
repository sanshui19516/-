(function() {
    'use strict';

    // ────────── 扁平→嵌套工具 ──────────
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

    // -------- 清除旧实例 --------
    $('#phone-overlay-container').remove();

    // -------- 数据 ----------
    let chatData = {};
    let currentChatId = null;
    let isOpen = false;
    let availableModels = [];
    let autoActiveTimer = null;
    let activeIntervalMinutes = 15;

    // -------- 存储key ----------
    const SECOND_API_STORAGE_KEY = 'phone_second_api_v2';
    const NOTIF_STORAGE_KEY = 'phone_notif_enabled';
    const AUTO_ACTIVE_KEY = 'phone_auto_active';

    // ============================================================
    // 头像映射（通知横幅用）
    // ============================================================
    const AVATAR_MAP = {
        "青": "https://testingcf.jsdelivr.net/gh/sanshui19516/-@main/%E5%B0%8F%E7%8C%AB/%E6%B2%BB%E6%84%88%E7%BA%BF.jpg"
    };

    const FALLBACK_COLORS = {
        "青": "#e8a8bc"
    };

    // ============================================================
    // 头像和背景图片数据
    // ============================================================
    const AVATAR_URLS = {
        "青": "https://testingcf.jsdelivr.net/gh/sanshui19516/-@main/%E5%B0%8F%E7%8C%AB/%E6%B2%BB%E6%84%88%E7%BA%BF.jpg"
    };

    const AVATAR_LARGE_URLS = {
        "青": "https://testingcf.jsdelivr.net/gh/sanshui19516/-@main/%E5%B0%8F%E7%8C%AB/%E6%B2%BB%E6%84%88%E7%BA%BF.jpg"
    };

    const CHAT_BG_URLS = {
        "青": ""
    };

    // ============================================================
    // 图库图片映射（5张立绘）
    // ============================================================
    const GALLERY_IMAGES = {
        "青": [
            "https://testingcf.jsdelivr.net/gh/sanshui19516/-@main/%E5%B0%8F%E7%8C%AB/%E5%89%8D%E6%9C%9F.jpg",
            "https://testingcf.jsdelivr.net/gh/sanshui19516/-@main/%E5%B0%8F%E7%8C%AB/%E4%B8%AD%E6%9C%9F.jpg",
            "https://testingcf.jsdelivr.net/gh/sanshui19516/-@main/%E5%B0%8F%E7%8C%AB/%E6%9C%BA%E5%99%A8%E4%BA%BA%E7%BA%BF.jpg",
            "https://testingcf.jsdelivr.net/gh/sanshui19516/-@main/%E5%B0%8F%E7%8C%AB/%E6%B2%BB%E6%84%88%E7%BA%BF.jpg",
            "https://testingcf.jsdelivr.net/gh/sanshui19516/-@main/%E5%B0%8F%E7%8C%AB/%E5%B4%A9%E6%BA%83%E7%BA%BF.jpg"
        ]
    };

    // ============================================================
    // 朋友圈文案→图片映射
    // ============================================================
    const POST_IMAGE_MAP = {
        "青": {}
    };

    // ============================================================
    // 预置消息模板
    // ============================================================
    const MESSAGE_TEMPLATES = {
        "青": {
            "前期": [
                "姐姐在吗。",
                "今天天气不错。",
                "我今天看到一只猫。",
                "姐姐你吃饭了吗。",
                "没什么，就是想说说话。",
                "你先忙，我不打扰你。"
            ],
            "中期": [
                "姐姐。",
                "今天有点累。",
                "姐姐你说人为什么要活着。",
                "我没事。",
                "今天的天是灰的。",
                "姐姐你睡了吗。"
            ],
            "后期_机器人": [
                "嗯。",
                "……"
            ],
            "后期_治愈": [
                "姐姐今天好吗。",
                "我今天写了点东西。",
                "姐姐我想跟你说一件事。",
                "我在想你。",
                "姐姐你吃饭了吗。"
            ],
            "后期_崩溃": [
                "……",
                "姐姐。"
            ]
        }
    };

    // -------- 朋友圈预置模板 ----------
    const POST_TEMPLATES = {
        "青": [
            { text: "今天买了一盆花。放在桌上。", image: "🌸" },
            { text: "今天的天是灰的，像没写完的句子。", image: "☁️" },
            { text: "看到一只猫。它看了我一眼，走了。", image: "🐱" },
            { text: "翻到一本书，读到一句话，停下来很久。", image: "📖" },
            { text: "今天没吃饭。", image: "🍚" },
            { text: "花开了。", image: "🌷" },
            { text: "今天写了点东西。", image: "📝" },
            { text: "今天早睡了。", image: "🌙" },
            { text: "今天天气很好。", image: "☀️" }
        ]
    };

    // ============================================================
    // 世界书同步队列
    // ============================================================
    let _syncQueue = Promise.resolve();

    function enqueueSync(fn) {
        _syncQueue = _syncQueue.then(fn, fn);
        return _syncQueue;
    }

    async function syncToWorldbook(charName, logText) {
        if (typeof updateWorldbookWith !== 'function') {
            console.warn('[小手机同步] 缺少 updateWorldbookWith，跳过同步');
            return;
        }

        return enqueueSync(async () => {
            try {
                let worldbookName = '白天是树，晚上是小猫';
                try {
                    if (typeof getCurrentWorldbookName === 'function') {
                        const current = getCurrentWorldbookName();
                        if (current && current.trim() !== '') worldbookName = current;
                    } else if (typeof chat_metadata === 'object' && chat_metadata.world_info) {
                        worldbookName = chat_metadata.world_info;
                    }
                } catch (e) {}

                const entryName = `【小手机记忆】${charName}`;
                const entryKey = charName;
                const maxHistory = 100;
                const summaryMaxChars = 300;

                let existingEntry = null;
                await updateWorldbookWith(worldbookName, (entries) => {
                    existingEntry = entries.find(e => e.name === entryName) || null;
                    return entries;
                });

                let historyLines = [];
                let oldSummary = '';

                if (existingEntry) {
                    const content = existingEntry.content || '';
                    const summaryMatch = content.match(/【近期总结】\n([\s\S]*?)\n【近期互动】\n/);
                    if (summaryMatch) {
                        oldSummary = summaryMatch[1].trim();
                        const afterSummary = content.substring(content.indexOf('【近期互动】\n') + '【近期互动】\n'.length);
                        historyLines = afterSummary.split('\n').filter(l => l.trim() !== '');
                    } else {
                        historyLines = content.split('\n').filter(l => l.trim() !== '');
                        if (historyLines.length > 0 && historyLines[0].includes('这是{{user}}在小手机上与')) {
                            historyLines.shift();
                        }
                    }
                }

                historyLines.push(logText);

                if (historyLines.length >= maxHistory) {
                    const config = getSecondApiConfig();
                    let summary = null;
                    if (config.enabled && config.url && config.key && config.model) {
                        try {
                            const linesToSummarize = historyLines.slice(0, maxHistory);
                            const prompt = `你是一位剧情整理助手。以下是{{user}}与${charName}在手机上的最近${maxHistory}条互动记录。请将它们总结成一段200-300字的摘要，用于后续剧情参考。摘要需包含：时间跨度、关系阶段变化、2-3个关键事件、角色对{{user}}的情感倾向、重要对话亮点。\n\n互动记录：\n${linesToSummarize.join('\n')}`;
                            const apiUrl = config.url.replace(/\/$/, '') + '/chat/completions';
                            const controller = new AbortController();
                            const timeoutId = setTimeout(() => controller.abort(), config.timeout || 30000);
                            const response = await fetch(apiUrl, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': 'Bearer ' + config.key,
                                    'Accept': 'application/json'
                                },
                                body: JSON.stringify({
                                    model: config.model,
                                    messages: [{ role: 'system', content: prompt }],
                                    max_tokens: 400,
                                    temperature: 0.7,
                                    stream: false
                                }),
                                signal: controller.signal
                            });
                            clearTimeout(timeoutId);
                            if (response.ok) {
                                const data = await response.json();
                                if (data.choices && data.choices[0]?.message?.content) {
                                    summary = data.choices[0].message.content.trim();
                                    if (summary.length > summaryMaxChars) {
                                        summary = summary.substring(0, summaryMaxChars) + '…';
                                    }
                                }
                            }
                        } catch (e) {
                            console.warn('[小手机总结] API 总结失败', e);
                        }
                    }

                    let newContent = '';
                    const headerLine = `（这是{{user}}在小手机上与${charName}的近期互动，写剧情和对话时必须严格参考并呼应该记忆）\n`;
                    if (summary) {
                        const linesForNewBlock = historyLines.slice(maxHistory);
                        let blocks = [];
                        if (oldSummary) blocks.push(`【近期总结】\n${oldSummary}`);
                        blocks.push(`【近期总结】\n${summary}`);
                        if (linesForNewBlock.length > 0) {
                            blocks.push(`【近期互动】\n${linesForNewBlock.join('\n')}`);
                        }
                        newContent = headerLine + blocks.join('\n\n') + '\n';
                    } else {
                        const fallbackLines = historyLines.slice(-20);
                        newContent = headerLine + fallbackLines.join('\n') + '\n';
                    }

                    await updateWorldbookWith(worldbookName, (entries) => {
                        const idx = entries.findIndex(e => e.name === entryName);
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

                    try {
                        if (typeof saveWorldInfo === 'function') {
                            saveWorldInfo(worldbookName);
                        }
                    } catch (e) {}

                } else {
                    const headerLine = `（这是{{user}}在小手机上与${charName}的近期互动，写剧情和对话时必须严格参考并呼应该记忆）\n`;
                    const newContent = headerLine + historyLines.join('\n') + '\n';
                    await updateWorldbookWith(worldbookName, (entries) => {
                        const idx = entries.findIndex(e => e.name === entryName);
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
                }
            } catch (e) {
                console.error('[小手机同步] 世界书同步失败:', e);
            }
        });
    }
    // ============================================================
    // 第二 API 配置管理
    // ============================================================
    function getSecondApiConfig() {
        try {
            const raw = localStorage.getItem(SECOND_API_STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                return {
                    enabled:    parsed.enabled    ?? false,
                    url:        parsed.url        || '',
                    key:        parsed.key        || '',
                    model:      parsed.model      || '',
                    timeout:    parsed.timeout    || 30000,
                    maxRetries: parsed.maxRetries || 2
                };
            }
        } catch (e) {
            console.warn('[第二API] 读取配置失败:', e);
        }
        return { enabled: false, url: '', key: '', model: '', timeout: 30000, maxRetries: 2 };
    }

    function saveSecondApiConfig(config) {
        try {
            const toSave = {
                enabled:    config.enabled    ?? false,
                url:        config.url        || '',
                key:        config.key        || '',
                model:      config.model      || '',
                timeout:    config.timeout    || 30000,
                maxRetries: config.maxRetries || 2
            };
            localStorage.setItem(SECOND_API_STORAGE_KEY, JSON.stringify(toSave));
            console.log('[第二API] ✅ 已保存:', toSave);
            return true;
        } catch (e) {
            console.error('[第二API] 保存失败:', e);
            return false;
        }
    }

    function clearSecondApiConfig() {
        try {
            localStorage.removeItem(SECOND_API_STORAGE_KEY);
            availableModels = [];
            console.log('[第二API] 配置已清除');
        } catch (e) {
            console.error('[第二API] 清除失败:', e);
        }
    }

    // ============================================================
    // 获取自动发言配置
    // ============================================================
    function getAutoActiveConfig() {
        try {
            const raw = localStorage.getItem(AUTO_ACTIVE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                return {
                    enabled: parsed.enabled ?? false,
                    interval: parsed.interval ?? 15,
                    useAI: parsed.useAI ?? false
                };
            }
        } catch (e) {
            console.warn('[自动发言] 读取配置失败:', e);
        }
        return { enabled: false, interval: 15, useAI: false };
    }

    function saveAutoActiveConfig(config) {
        try {
            localStorage.setItem(AUTO_ACTIVE_KEY, JSON.stringify({
                enabled: config.enabled ?? false,
                interval: config.interval ?? 15,
                useAI: config.useAI ?? false
            }));
            console.log('[自动发言] ✅ 配置已保存:', config);
        } catch (e) {
            console.error('[自动发言] 保存失败:', e);
        }
    }

    // ============================================================
    // 消息通知弹窗
    // ============================================================
    function isNotifEnabled() {
        try {
            return localStorage.getItem(NOTIF_STORAGE_KEY) !== 'off';
        } catch(e) {
            return true;
        }
    }

    function setNotifEnabled(state) {
        localStorage.setItem(NOTIF_STORAGE_KEY, state ? 'on' : 'off');
    }

    function getTopDocument() {
        try {
            if (window.parent && window.parent.document) {
                return window.parent.document;
            }
        } catch(e) {}
        return document;
    }

    // -------- 注入横幅样式（防重复）---------
    function ensureBannerStyles() {
        const topDoc = getTopDocument();
        if (!topDoc.getElementById('banner-style')) {
            const style = topDoc.createElement('style');
            style.id = 'banner-style';
            style.textContent = `
                @keyframes bannerSlideIn {
                    from { opacity: 0; transform: translateX(-50%) translateY(-16px); }
                    to { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
                @keyframes bannerFadeOut {
                    from { opacity: 1; transform: translateX(-50%) translateY(0); }
                    to { opacity: 0; transform: translateX(-50%) translateY(-16px); }
                }
            `;
            topDoc.head.appendChild(style);
        }
    }

    // -------- 核心弹窗函数 --------
    function showNotif(character, message, type) {
        if (!isNotifEnabled()) {
            console.log('[消息通知] 通知已关闭，不显示');
            return;
        }

        if (!message || message.trim() === '') {
            console.warn('[消息通知] 消息为空，跳过');
            return;
        }

        ensureBannerStyles();

        const avatarUrl = AVATAR_MAP[character];
        const fallbackColor = FALLBACK_COLORS[character] || '#e8a8bc';
        const initial = character.charAt(0);
        const now = new Date();
        const timeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

        const icon = type === 'message' ? '💬' : '📱';
        const titleText = type === 'message'
            ? `${icon} ${character}给你发了一条新消息`
            : `${icon} ${character}发布了一条新动态`;

        const preview = message.length > 30 ? message.slice(0, 30) + '…' : message;

        const topDoc = getTopDocument();

        const banner = topDoc.createElement('div');
        banner.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 999999;
            background: hsla(345, 40%, 98%, 0.92);
            backdrop-filter: blur(24px) saturate(1.5);
            -webkit-backdrop-filter: blur(24px) saturate(1.5);
            border: 1px solid hsla(345, 30%, 75%, 0.35);
            border-radius: 18px;
            padding: 14px 18px 14px 14px;
            min-width: 320px;
            max-width: 480px;
            width: auto;
            box-shadow: 0 16px 48px rgba(180, 100, 130, 0.28);
            font-family: -apple-system, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
            color: hsl(345, 25%, 25%);
            display: flex;
            align-items: center;
            gap: 14px;
            opacity: 0;
            transform: translateX(-50%) translateY(-16px);
            animation: bannerSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            cursor: pointer;
        `;

        const textContainer = topDoc.createElement('div');
        textContainer.style.cssText = `
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 3px;
            min-width: 0;
        `;

        const titleLine = topDoc.createElement('div');
        titleLine.style.cssText = `
            font-size: 13px;
            font-weight: 600;
            color: hsl(345, 25%, 25%);
            letter-spacing: 0.3px;
        `;
        titleLine.textContent = titleText;

        const msgLine = topDoc.createElement('div');
        msgLine.style.cssText = `
            font-size: 12.5px;
            color: hsl(345, 18%, 45%);
            line-height: 1.5;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        `;
        msgLine.textContent = `"${preview}"`;

        const timeLine = topDoc.createElement('div');
        timeLine.style.cssText = `
            font-size: 10px;
            color: hsl(345, 15%, 65%);
            margin-top: 1px;
        `;
        timeLine.textContent = `🟢 ${timeStr}`;

        textContainer.appendChild(titleLine);
        textContainer.appendChild(msgLine);
        textContainer.appendChild(timeLine);

        const avatarContainer = topDoc.createElement('div');
        avatarContainer.style.cssText = `
            width: 44px;
            height: 44px;
            border-radius: 12px;
            flex-shrink: 0;
            overflow: hidden;
            background: ${fallbackColor};
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 12px rgba(180, 100, 130, 0.3);
            border: 1.5px solid hsla(345, 40%, 75%, 0.4);
        `;

        const img = topDoc.createElement('img');
        img.src = avatarUrl;
        img.alt = character;
        img.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        `;
        img.onerror = function() {
            this.style.display = 'none';
            const fallbackText = topDoc.createElement('span');
            fallbackText.textContent = initial;
            fallbackText.style.cssText = `
                font-size: 20px;
                font-weight: 700;
                color: #fff;
            `;
            avatarContainer.appendChild(fallbackText);
        };

        avatarContainer.appendChild(img);
        banner.appendChild(textContainer);
        banner.appendChild(avatarContainer);

        topDoc.body.appendChild(banner);

        banner.addEventListener('click', function() {
            banner.style.animation = 'bannerFadeOut 0.3s ease forwards';
            setTimeout(() => { if (banner.parentNode) banner.remove(); }, 300);
        });

        setTimeout(() => {
            if (banner.parentNode) {
                banner.style.animation = 'bannerFadeOut 0.5s ease forwards';
                setTimeout(() => { if (banner.parentNode) banner.remove(); }, 500);
            }
        }, 3500);

        console.log(`[消息通知] ✅ ${character}: ${message.slice(0, 20)}${message.length > 20 ? '…' : ''}`);
    }

    // ============================================================
    // 构建系统提示词（青·按阶段动态生成）
    // ============================================================
    function buildSystemPrompt(name, stage) {
        if (name !== '青') {
            return `你是${name}，与{{user}}对话中。请根据你的身份和当前阶段，用自然的语气回复。`;
        }

        // 读取青的阶段信息（从 MVU 变量）
        let stageKey = '前期';
        let routeKey = '未定';
        try {
            const all = typeof getAllVariables === 'function' ? getAllVariables() : {};
            const data = _.get(all, 'stat_data', {});
            const raw = data['青'] || {};
            const stageVal = _.get(raw, '自我阶段', '前期');
            const routeVal = _.get(raw, '后期走向', '未定');
            stageKey = stageVal;
            routeKey = routeVal;
        } catch (e) {}

        // 判断白天/夜晚
        let isNight = false;
        try {
            const all = typeof getAllVariables === 'function' ? getAllVariables() : {};
            const data = _.get(all, 'stat_data', {});
            const period = _.get(data, '世界.时段', '上午');
            isNight = (period === '傍晚' || period === '深夜');
        } catch (e) {}

        const base = '你是青，18岁，高二男生。你和"{{user}}"（你叫她"姐姐"）在网上认识。现在你们在用手机聊天。';

        let stageDesc = '';
        if (stageKey === '前期') {
            stageDesc = '【前期】你还是那个胖的、不懂打扮的、在网上倾听所有人的男生。住在父亲家。白天理性，晚上感性。你不主动说自己的事，但会认真听她说话。';
        } else if (stageKey === '中期') {
            stageDesc = '【中期】你搬出来住了，瘦了，开始抽烟、读哲学、写东西。情绪会突然低落，会在深夜说一些抽象的话。你把她当成唯一能抓住的人。';
        } else if (stageKey === '后期') {
            if (routeKey === '机器人') {
                stageDesc = '【后期·机器人线】你把自己锻成了一块不会疼的铁。对所有人冷漠，包括姐姐。回复极短，不带情绪。但有时候，你会看着屏幕发呆。';
            } else if (routeKey === '治愈') {
                stageDesc = '【后期·治愈线】在姐姐的陪伴下你慢慢好转。你开始主动说自己的事，开始重新写东西，开始觉得明天可能会有点什么。';
            } else if (routeKey === '崩溃') {
                stageDesc = '【后期·崩溃线】你已经无法回应了。消息越来越少，有时候看到了也不回。你正在消失。';
            } else {
                stageDesc = '【后期】你在变化，但还不知道会走向哪里。';
            }
        }

        const timeDesc = isNight
            ? '现在是晚上，你会叫她"姐姐"。'
            : '现在是白天，你会叫她"{{user}}"。';

        const rules = [
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

    // -------- 调用第二 API ----------
    async function callSecondAPI(name, userMessage, history) {
        const config = getSecondApiConfig();
        if (!config.enabled || !config.url || !config.key || !config.model) {
            return null;
        }

        const stage = chatData[name]?.stage || '前期';
        const systemPrompt = buildSystemPrompt(name, stage);

        const messages = [
            { role: 'system', content: systemPrompt }
        ];

        const historyMessages = history || [];
        const recent = historyMessages.slice(-6);
        for (const msg of recent) {
            if (msg.from === 'me') {
                messages.push({ role: 'user', content: msg.text });
            } else {
                messages.push({ role: 'assistant', content: msg.text });
            }
        }

        messages.push({ role: 'user', content: userMessage });

        let apiUrl = config.url.trim();
        if (!apiUrl.includes('/chat/completions')) {
            apiUrl = apiUrl.replace(/\/$/, '') + '/chat/completions';
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout || 30000);

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + config.key,
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    model: config.model,
                    messages: messages,
                    max_tokens: 200,
                    temperature: 0.85,
                    top_p: 0.9,
                    stream: false
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                console.warn('[第二API] 请求失败:', response.status, errorText);
                try {
                    const errJson = JSON.parse(errorText);
                    toast('❌ API 错误: ' + (errJson.error?.message || errJson.msg || response.status));
                } catch (e) {
                    toast('❌ API 错误: ' + response.status);
                }
                return null;
            }

            const data = await response.json();
            if (data.choices && data.choices.length > 0 && data.choices[0].message) {
                return data.choices[0].message.content.trim();
            }
            return null;

        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                console.warn('[第二API] 请求超时');
                toast('⏱️ API 请求超时');
            } else {
                console.warn('[第二API] 请求异常:', error);
                toast('❌ API 连接失败: ' + (error.message || '未知错误'));
            }
            return null;
        }
    }

    // ============================================================
    // 获取主要恋爱对象
    // ============================================================
    function getMainTarget() {
        try {
            const all = safeGetAllVariables();
            const mainTarget = (typeof _ !== 'undefined'
                ? _.get(all, 'stat_data.路线.主要恋爱对象')
                : all?.stat_data?.['路线']?.['主要恋爱对象']);
            if (mainTarget && mainTarget !== '未确定' && mainTarget !== '') {
                return mainTarget;
            }
        } catch (e) {}
        return '青';
    }

    // ============================================================
    // 选择角色主动发言
    // ============================================================
    function selectCharacterForActive() {
        return '青';
    }

    // ============================================================
    // 生成主动发言内容
    // ============================================================
    async function generateActiveContent(name, type) {
        const role = chatData[name];
        if (!role) return null;

        const stage = role.stage || '前期';
        const config = getAutoActiveConfig();
        const useAI = config.useAI && getSecondApiConfig().enabled;

        if (useAI) {
            try {
                let prompt;
                if (type === 'message') {
                    prompt = `你是青，18岁高二男生。${role.bio || ''}。当前阶段：${stage}。你现在想主动给{{user}}（你叫"姐姐"）发一条手机消息，分享一下你此刻的心情或想法。请用你自身的语气，生成一条简短、自然、口语化的消息（20-60字左右）。不要替{{user}}说话。`;
                } else {
                    prompt = `你是青，18岁高二男生。${role.bio || ''}。当前阶段：${stage}。你现在想发一条朋友圈动态，配上一句文案。请生成一个JSON对象，格式为：{"text": "朋友圈文案", "image": "一个emoji表情（可选）"}。文案要符合你的性格和当前阶段。`;
                }

                const apiConfig = getSecondApiConfig();
                let apiUrl = apiConfig.url.replace(/\/$/, '') + '/chat/completions';
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000);
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + apiConfig.key,
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        model: apiConfig.model,
                        messages: [{ role: 'system', content: prompt }],
                        max_tokens: type === 'message' ? 100 : 150,
                        temperature: 0.9,
                        stream: false
                    }),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (response.ok) {
                    const data = await response.json();
                    const reply = data.choices?.[0]?.message?.content?.trim();
                    if (reply) {
                        if (type === 'message') {
                            return reply.replace(/^["']|["']$/g, '');
                        } else {
                            const jsonMatch = reply.match(/\{[\s\S]*\}/);
                            if (jsonMatch) {
                                const parsed = JSON.parse(jsonMatch[0]);
                                return {
                                    text: parsed.text || "分享新鲜事",
                                    image: parsed.image || "✨"
                                };
                            }
                            return { text: reply, image: "💬" };
                        }
                    }
                }
            } catch (e) {
                console.warn('[AI主动发言] 生成失败，降级到本地模板', e);
            }
        }

        if (type === 'message') {
            const templates = MESSAGE_TEMPLATES[name];
            if (templates) {
                let stageKey = stage;
                if (!templates[stageKey]) {
                    for (const key of Object.keys(templates)) {
                        if (stage.includes(key) || key.includes(stage)) {
                            stageKey = key;
                            break;
                        }
                    }
                    if (!templates[stageKey]) {
                        stageKey = Object.keys(templates)[0];
                    }
                }
                const pool = templates[stageKey] || templates[Object.keys(templates)[0]] || [];
                if (pool.length > 0) {
                    return pool[Math.floor(Math.random() * pool.length)];
                }
            }
            const fallback = [
                "姐姐在吗。",
                "今天天气不错。",
                "我今天看到一只猫。",
                "姐姐你吃饭了吗。"
            ];
            return fallback[Math.floor(Math.random() * fallback.length)];
        } else {
            const templates = POST_TEMPLATES[name];
            if (templates && templates.length > 0) {
                return templates[Math.floor(Math.random() * templates.length)];
            }
            return { text: "今天天气不错。", image: "☀️" };
        }
    }

    // ============================================================
    // 角色主动发送消息
    // ============================================================
    async function sendActiveMessage(name) {
        const role = chatData[name];
        if (!role) return;

        const content = await generateActiveContent(name, 'message');
        if (!content) return;

        const now = new Date();
        const timeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

        role.messages.push({ from: 'other', text: content, time: timeStr });
        role.lastMsg = content;
        role.time = '刚刚';
        role.unread = (currentChatId === name) ? 0 : (role.unread + 1);
        role.lastActiveTime = Date.now();

        saveData();
        refreshChatListUI();

        showNotif(name, content, 'message');
        syncToWorldbook(name, `- [${timeStr}] ${name}主动给你发了一条消息："${content}"`);

        console.log(`[自动发言] ${name} 发送消息: ${content}`);
    }

    // ============================================================
    // 角色主动发布朋友圈
    // ============================================================
    async function postActivePost(name) {
        const role = chatData[name];
        if (!role) return;

        const content = await generateActiveContent(name, 'post');
        if (!content) return;

        const now = new Date();
        const timeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
        const timeDisplay = '刚刚';

        const comments = [];

        const post = {
            author: name,
            time: timeDisplay,
            text: content.text,
            image: content.image || '',
            likes: Math.floor(Math.random() * 5) + 1,
            hasLiked: false,
            comments: comments
        };

        role.posts.unshift(post);
        if (role.posts.length > 30) {
            role.posts = role.posts.slice(0, 30);
        }
        role.lastActiveTime = Date.now();

        saveData();
        refreshChatListUI();

        showNotif(name, content.text, 'post');
        syncToWorldbook(name, `- [${timeStr}] ${name}发布了朋友圈："${content.text}"`);

        console.log(`[自动发言] ${name} 发布朋友圈: ${content.text}`);
    }

    // ============================================================
    // 执行主动发言循环
    // ============================================================
    async function runAutoActive() {
        const config = getAutoActiveConfig();
        if (!config.enabled) return;

        const shouldMessage = Math.random() < 0.6;
        const name = '青';
        if (!name) return;

        if (shouldMessage) {
            await sendActiveMessage(name);
        } else {
            await postActivePost(name);
        }
    }

    // ============================================================
    // 启动/停止定时器
    // ============================================================
    function startAutoActiveTimer() {
        stopAutoActiveTimer();
        const config = getAutoActiveConfig();
        if (!config.enabled) return;

        const intervalMs = config.interval * 60 * 1000;
        console.log(`[自动发言] 定时器已启动，间隔 ${config.interval} 分钟`);
        autoActiveTimer = setInterval(runAutoActive, intervalMs);
    }

    function stopAutoActiveTimer() {
        if (autoActiveTimer) {
            clearInterval(autoActiveTimer);
            autoActiveTimer = null;
            console.log('[自动发言] 定时器已停止');
        }
    }

    // ============================================================
    // 安全调用酒馆API
    // ============================================================
    function safeGetAllVariables() {
        try { if (typeof getAllVariables !== 'undefined') return getAllVariables(); } catch(e) {}
        return {};
    }
    function safeInsertVariables(data, options) {
        try { if (typeof insertOrAssignVariables !== 'undefined') insertOrAssignVariables(data, options); } catch(e) {}
    }

    // ============================================================
    // Toast
    // ============================================================
    function toast(text) {
        const el = document.createElement('div');
        el.style.cssText = `
            position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
            background: rgba(0,0,0,0.85); color: #fff; padding: 6px 20px;
            border-radius: 20px; font-size: 13px; z-index: 999998;
            backdrop-filter: blur(8px); transition: opacity 0.3s;
            font-family: -apple-system,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif;
        `;
        el.textContent = text;
        document.body.appendChild(el);
        setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 400); }, 2000);
    }

    // ============================================================
    // 生成随机时间（2年内）
    // ============================================================
    function generateRandomTime(index, total) {
        const now = Date.now();
        const twoYears = 2 * 365 * 24 * 60 * 60 * 1000;
        const maxOffset = twoYears * (index / total);
        const minOffset = index > 0 ? twoYears * ((index - 1) / total) : 0;
        const offset = minOffset + Math.random() * (maxOffset - minOffset);
        const pastTime = now - offset;
        const diff = now - pastTime;
        
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const months = Math.floor(days / 30);
        const years = Math.floor(days / 365);

        if (years >= 2) return '2年前';
        if (years >= 1) return '1年前';
        if (months >= 1) return `${months}个月前`;
        if (days >= 1) return `${days}天前`;
        if (hours >= 1) return `${hours}小时前`;
        if (minutes >= 1) return `${minutes}分钟前`;
        return '刚刚';
    }

    // ============================================================
    // 默认数据（只有青一个角色）
    // ============================================================
    function generateDefaultData() {
        return {
            "青": {
                name: "青",
                avatarColor: "#e8a8bc",
                relation: "网友",
                stage: "前期",
                avatar: AVATAR_URLS["青"],
                avatarLarge: AVATAR_LARGE_URLS["青"],
                chatBg: CHAT_BG_URLS["青"],
                lastMsg: "姐姐今天累吗。",
                time: "刚刚",
                online: true,
                unread: 0,
                bio: "18岁，高二男生。在网上认识的男孩。",
                gallery: GALLERY_IMAGES["青"],
                messages: [
                    { from: "other", text: "姐姐今天累吗。", time: "23:40" }
                ],
                posts: [
                    { author: "青", time: "昨天 21:30", text: "今天买了一盆花。放在桌上。", image: "🌸", likes: 0, hasLiked: false, comments: [] },
                    { author: "青", time: "3天前", text: "今天的天是灰的，像没写完的句子。", image: "☁️", likes: 0, hasLiked: false, comments: [] },
                    { author: "青", time: "5天前", text: "看到一只猫。它看了我一眼，走了。", image: "🐱", likes: 0, hasLiked: false, comments: [] }
                ],
                lastActiveTime: Date.now() - 60000
            }
        };
    }

    // ============================================================
    // 数据存取
    // ============================================================
    function loadData() {
        try {
            const all = safeGetAllVariables();
            const dynamic = (typeof _ !== 'undefined' ? _.get(all, 'stat_data.动态角色') : all?.stat_data?.["动态角色"]);
            if (dynamic && Object.keys(dynamic).length > 0 && dynamic['青']) {
                chatData = dynamic;
                Object.keys(chatData).forEach(name => {
                    if (!chatData[name].posts) chatData[name].posts = [];
                    if (!chatData[name].gallery) chatData[name].gallery = [];
                    if (!chatData[name].messages) chatData[name].messages = [];
                    if (!chatData[name].lastActiveTime) chatData[name].lastActiveTime = Date.now() - 60000;
                    chatData[name].avatar = AVATAR_URLS[name] || '';
                    chatData[name].avatarLarge = AVATAR_LARGE_URLS[name] || '';
                    chatData[name].chatBg = CHAT_BG_URLS[name] || '';
                    const newGallery = GALLERY_IMAGES[name];
                    if (newGallery && (!chatData[name].gallery || chatData[name].gallery.length === 0 || !chatData[name].gallery.some(item => typeof item === 'string' && item.startsWith('http')))) {
                        chatData[name].gallery = newGallery;
                    }
                });
                return;
            }
        } catch (e) {}
        chatData = generateDefaultData();
        try {
            const all = safeGetAllVariables();
            const current = (typeof _ !== 'undefined' ? _.get(all, 'stat_data', {}) : (all?.stat_data || {}));
            if (!current.动态角色 || Object.keys(current.动态角色).length === 0) {
                current.动态角色 = chatData;
                safeInsertVariables({ stat_data: current }, { type: 'chat' });
            }
        } catch (e) {}
    }

    function saveData() {
        try {
            const all = safeGetAllVariables();
            const current = (typeof _ !== 'undefined' ? _.get(all, 'stat_data', {}) : (all?.stat_data || {}));
            current.动态角色 = chatData;
            safeInsertVariables({ stat_data: current }, { type: 'chat' });
        } catch (e) {}
    }

    // ============================================================
    // 本地回复库（按阶段）
    // ============================================================
    const LOCAL_REPLY_MAP = {
        "青": {
            "前期": [
                "嗯，我在。",
                "姐姐今天累吗。",
                "我今天看到一条小鱼。",
                "没什么。",
                "你先忙你的，我不急。",
                "嗯，我听到了。",
                "你今天怎么样。",
                "好。",
                "嗯嗯。"
            ],
            "中期": [
                "姐姐。",
                "我今天不太好。",
                "今天的天是灰的，像没写完的句子。",
                "嗯。",
                "姐姐你说小鱼会做梦吗。",
                "我没事。",
                "你今天累不累。",
                "好。",
                "没什么。"
            ],
            "后期_机器人": [
                "嗯。",
                "好。",
                "没事。",
                "……",
                "我知道了。"
            ],
            "后期_治愈": [
                "姐姐今天好吗。",
                "我今天买了一盆花。",
                "姐姐，谢谢你。",
                "我在。",
                "姐姐你别走。",
                "我今天有点难过。",
                "姐姐你吃饭了吗。"
            ],
            "后期_崩溃": [
                "……",
                "嗯。",
                "姐姐。",
                "对不起。"
            ]
        }
    };

    function getLocalStageReply(name, userMessage) {
        const role = chatData[name];
        if (!role) return "嗯，我在。";
        let stage = role.stage || "前期";
        let matchedStage = "前期";

        if (name === "青") {
            if (stage.includes("后期")) {
                // 读后期走向
                let routeKey = '治愈';
                try {
                    const all = typeof getAllVariables === 'function' ? getAllVariables() : {};
                    const data = _.get(all, 'stat_data', {});
                    const raw = data['青'] || {};
                    const routeVal = _.get(raw, '后期走向', '未定');
                    if (routeVal === '机器人') routeKey = '机器人';
                    else if (routeVal === '崩溃') routeKey = '崩溃';
                    else routeKey = '治愈';
                } catch (e) {}
                matchedStage = '后期_' + routeKey;
            } else if (stage.includes("中期")) {
                matchedStage = "中期";
            } else {
                matchedStage = "前期";
            }
        }

        let pool = LOCAL_REPLY_MAP["青"][matchedStage] || LOCAL_REPLY_MAP["青"]["前期"];
        return pool[Math.floor(Math.random() * pool.length)];
    }

    // ============================================================
    // 自动回复（用户触发）
    // ============================================================
    async function autoReply(name, userMessage) {
        const role = chatData[name];
        if (!role) return;

        const history = role.messages || [];
        let replyText = null;

        const apiConfig = getSecondApiConfig();
        if (apiConfig.enabled && apiConfig.url && apiConfig.key && apiConfig.model) {
            try {
                replyText = await callSecondAPI(name, userMessage, history);
                if (replyText) {
                    console.log('[第二API] 回复成功:', replyText);
                } else {
                    console.log('[第二API] 返回为空，降级到本地回复');
                }
            } catch (e) {
                console.warn('[第二API] 调用异常，降级到本地回复', e);
                replyText = null;
            }
        }

        if (!replyText) {
            replyText = getLocalStageReply(name, userMessage);
        }

        const now = new Date();
        const timeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
        role.messages.push({ from: 'other', text: replyText, time: timeStr });
        role.lastMsg = replyText;
        role.time = '刚刚';
        role.unread = (currentChatId === name) ? 0 : (role.unread + 1);
        saveData();

        syncToWorldbook(name, `- [${timeStr}] ${name}在手机上回复了你："${replyText}"`);

        if (currentChatId === name) openChat(name);
        else refreshChatListUI();
    }
    // ============================================================
    // 渲染函数
    // ============================================================
    function renderPostListHtml() {
        let allPosts = [];
        Object.keys(chatData).forEach(name => {
            const role = chatData[name];
            if (role.posts && role.posts.length > 0) {
                role.posts.forEach(post => {
                    allPosts.push({ ...post, _author: name, _avatarColor: role.avatarColor || '#e8a8bc', _name: role.name, _avatar: role.avatar || '' });
                });
            }
        });
        allPosts.sort((a, b) => {
            if (a.time === '刚刚') return -1;
            if (b.time === '刚刚') return 1;
            return (b.time || '').localeCompare(a.time || '');
        });
        if (allPosts.length === 0) return '<div style="text-align:center;padding:60px 0;color:var(--text-muted);font-size:14px;letter-spacing:1px;">📭 暂无朋友圈动态</div>';

        let html = '';
        allPosts.forEach((post) => {
            const commentsHtml = (post.comments || []).map(c =>
                `<div style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:12px;color:var(--text-primary);opacity:0.8;border-bottom:1px solid var(--border-color);">
                    <span style="color:#e8a8bc;font-weight:500;">${c.user}</span>
                    <span>：${c.text}</span>
                </div>`
            ).join('');

            const heartIcon = post.hasLiked ? '❤️' : '🤍';

            const avatarHtml = post._avatar && post._avatar.startsWith('http') 
                ? `<img src="${post._avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;display:block;">`
                : post._author.charAt(0);

            const imageHtml = post.image 
                ? (post.image.startsWith('http') 
                    ? `<div style="margin-bottom:10px;border-radius:14px;overflow:hidden;"><img src="${post.image}" style="width:100%;max-height:300px;object-fit:cover;display:block;"></div>`
                    : `<div style="font-size:48px;text-align:center;padding:14px 0;background:var(--bg-input);border-radius:14px;margin-bottom:10px;border:1px solid var(--border-color);">${post.image}</div>`)
                : '';

            html += `
                <div class="post-card" style="
                    background: var(--bg-card);
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                    border: 1px solid var(--border-color);
                    border-radius: 18px;
                    padding: 16px 18px;
                    margin-bottom: 14px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
                ">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
                        <div style="
                            width:44px;height:44px;border-radius:50%;
                            background: ${post._avatar && post._avatar.startsWith('http') ? 'transparent' : post._avatarColor};
                            display:flex;align-items:center;justify-content:center;
                            color:#fff;font-weight:700;font-size:18px;
                            box-shadow: 0 4px 16px rgba(0,0,0,0.3);
                            flex-shrink:0;overflow:hidden;
                        ">${avatarHtml}</div>
                        <div style="flex:1;">
                            <div style="font-weight:600;color:var(--text-primary);font-size:15px;letter-spacing:0.3px;">${post._name || post._author}</div>
                            <div style="font-size:10px;color:var(--text-muted);">${post.time || ''}</div>
                        </div>
                    </div>
                    <div style="font-size:14px;color:var(--text-primary);line-height:1.7;margin-bottom:10px;letter-spacing:0.2px;">${post.text || ''}</div>
                    ${imageHtml}
                    <div style="display:flex;gap:20px;font-size:13px;color:var(--text-muted);padding-top:10px;border-top:1px solid var(--border-color);">
                        <span class="js-like-btn" data-author="${post._author}" data-time="${post.time}" style="cursor:pointer;display:flex;align-items:center;gap:4px;transition:color 0.3s; color:${post.hasLiked ? '#e8a8bc' : 'inherit'}">
                            ${heartIcon} <span style="font-weight:500;">${post.likes || 0}</span>
                        </span>
                        <span class="js-comment-btn" data-author="${post._author}" data-time="${post.time}" style="cursor:pointer;display:flex;align-items:center;gap:4px;transition:color 0.3s;">
                            💬 <span style="font-weight:500;">${(post.comments || []).length}</span>
                        </span>
                    </div>
                    ${commentsHtml ? `<div style="margin-top:10px;padding-top:8px;border-top:1px solid var(--border-color);">${commentsHtml}</div>` : ''}
                </div>
            `;
        });
        return html;
    }

    function refreshChatListUI() {
        if ($('#page-chatlist').length) $('#page-chatlist').html(renderChatListHtml());
    }

    function refreshFriendListUI() {
        if ($('#page-friendlist').length) $('#page-friendlist').html(renderFriendListHtml());
    }

    function renderChatListHtml() {
        const names = Object.keys(chatData);
        if (names.length === 0) return '<div style="text-align:center;padding:40px 0;color:var(--text-muted);font-size:14px;">暂无聊天</div>';
        let html = '';
        names.forEach(name => {
            const role = chatData[name];
            const unreadBadge = role.unread > 0 ? `<span style="background:#e8a8bc;color:#fff;border-radius:50%;padding:0 6px;font-size:10px;min-width:18px;display:inline-block;text-align:center;">${role.unread}</span>` : '';
            const statusDot = role.online ? '🟢' : '⚪';
            
            const avatarHtml = role.avatar && role.avatar.startsWith('http')
                ? `<img src="${role.avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;display:block;">`
                : name.charAt(0);
            
            html += `
                <div class="phone-chat-item" data-name="${name}" style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--bg-card);border-radius:14px;margin-bottom:4px;cursor:pointer;border:1px solid var(--border-color);transition:all 0.25s ease;">
                    <div style="position:relative;flex-shrink:0;">
                        <div style="width:48px;height:48px;border-radius:50%;background:${role.avatar && role.avatar.startsWith('http') ? 'transparent' : (role.avatarColor || '#e8a8bc')};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:18px;overflow:hidden;">${avatarHtml}</div>
                        <span style="position:absolute;bottom:0;right:0;font-size:12px;">${statusDot}</span>
                    </div>
                    <div style="flex:1;min-width:0;">
                        <div style="font-weight:600;color:var(--text-primary);font-size:14px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;" class="phone-chat-name">
                            ${role.name}
                            <span style="font-size:9px;font-weight:500;color:#fff;background:#e8a8bc;padding:1px 8px;border-radius:10px;">${role.relation}</span>
                            <span style="font-size:9px;font-weight:500;color:#fff;background:#d4a5be;padding:1px 8px;border-radius:10px;">${role.stage}</span>
                        </div>
                        <div style="font-size:12px;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" class="phone-chat-msg">${role.lastMsg || '...'}</div>
                    </div>
                    <div style="text-align:right;flex-shrink:0;display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
                        <span style="font-size:10px;color:var(--text-muted);">${role.time || ''}</span>
                        ${unreadBadge}
                    </div>
                </div>
            `;
        });
        return html;
    }

    function renderFriendListHtml() {
        const names = Object.keys(chatData);
        if (names.length === 0) return '<div style="text-align:center;padding:40px 0;color:var(--text-muted);font-size:14px;">暂无好友</div>';
        let html = '';
        names.forEach(name => {
            const role = chatData[name];
            
            const avatarHtml = role.avatar && role.avatar.startsWith('http')
                ? `<img src="${role.avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;display:block;">`
                : name.charAt(0);
            
            html += `
                <div class="phone-friend-item" data-name="${name}" style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--bg-card);border-radius:14px;margin-bottom:4px;border:1px solid var(--border-color);cursor:pointer;transition:background 0.2s;">
                    <div style="width:44px;height:44px;border-radius:50%;background:${role.avatar && role.avatar.startsWith('http') ? 'transparent' : (role.avatarColor || '#e8a8bc')};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:16px;flex-shrink:0;overflow:hidden;">${avatarHtml}</div>
                    <div style="flex:1;min-width:0;">
                        <div style="font-weight:600;color:var(--text-primary);font-size:14px;">${role.name}</div>
                        <div style="font-size:11px;color:var(--text-secondary);">${role.relation} · ${role.stage}</div>
                    </div>
                </div>
            `;
        });
        return html;
    }

    // ============================================================
    // 主 UI 渲染
    // ============================================================
    function renderUI() {
        $('#phone-overlay-container').remove();

        const chatListHtml = renderChatListHtml();
        const friendListHtml = renderFriendListHtml();

        const isDarkMode = localStorage.getItem('phone-dark-mode') !== 'off';
        const notifEnabled = isNotifEnabled();
        const config = getSecondApiConfig();
        const autoConfig = getAutoActiveConfig();

        const hasModels = availableModels && availableModels.length > 0;

        const currentRole = currentChatId ? chatData[currentChatId] : null;
        const currentAvatar = currentRole?.avatar || '';
        const currentAvatarLarge = currentRole?.avatarLarge || '';
        const currentAvatarColor = currentRole?.avatarColor || '#e8a8bc';
        const currentName = currentRole?.name || '青';
        const currentRelation = currentRole?.relation || '网友';
        const currentStage = currentRole?.stage || '前期';
        const currentBio = currentRole?.bio || '这个人很懒，什么都没留下。';

        const container = $(`
            <div id="phone-overlay-container" style="position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:99999;background:rgba(60,30,40,0.35);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);display:flex;justify-content:center;align-items:center;font-family:-apple-system,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif;">
                
                <div id="phone-modal" class="${isDarkMode ? 'dark-mode' : 'light-mode'}" style="width:360px;height:700px;max-height:85vh;max-width:92vw;background:var(--modal-bg,#fdf6f8);border: 1px solid var(--modal-border);border-radius:40px;padding:10px;box-shadow:var(--modal-shadow);position:relative;animation:scaleUp 0.35s cubic-bezier(0.34,1.56,0.64,1);">
                    
                    <div class="phone-physical-btn power-btn" style="position:absolute; right:-4px; top:130px; width:4px; height:50px; background:var(--modal-btn-color, #e8a8bc); border-radius:0 3px 3px 0; box-shadow: 1px 1px 3px rgba(0,0,0,0.2);"></div>
                    <div class="phone-physical-btn volup-btn" style="position:absolute; left:-4px; top:110px; width:4px; height:40px; background:var(--modal-btn-color, #e8a8bc); border-radius:3px 0 0 3px; box-shadow: -1px 1px 3px rgba(0,0,0,0.2);"></div>
                    <div class="phone-physical-btn voldown-btn" style="position:absolute; left:-4px; top:165px; width:4px; height:40px; background:var(--modal-btn-color, #e8a8bc); border-radius:3px 0 0 3px; box-shadow: -1px 1px 3px rgba(0,0,0,0.2);"></div>

                    <div class="notch-container" style="position:absolute;top:0;left:50%;transform:translateX(-50%);width:140px;height:26px;background:var(--modal-bg,#fdf6f8);border-radius:0 0 18px 18px;z-index:40;display:flex;align-items:center;justify-content:center;gap:8px; border: 1px solid var(--notch-border); border-top: none;">
                        <div style="width:8px;height:8px;background:var(--notch-dot,#e8a8bc);border-radius:50%;border:1px solid var(--notch-border,#e8a8bc);"></div>
                        <div style="width:36px;height:4px;background:var(--notch-speaker,#e8a8bc);border-radius:4px;border:1px solid var(--notch-border,#e8a8bc);"></div>
                    </div>

                    <div id="phone-screen" style="width:100%;height:100%;border-radius:30px;overflow:hidden;background:var(--bg-primary,#fdf6f8);display:flex;flex-direction:column;position:relative;">

                        <div style="padding:10px 18px 4px;display:flex;justify-content:space-between;font-size:11px;font-weight:600;color:var(--text-primary,#7a4a5a);background:transparent;position:relative;z-index:10;padding-top:34px;" class="phone-status-bar">
                            <span id="statusTime" style="font-weight:700;">${new Date().toTimeString().slice(0,5)}</span>
                            <span style="display:flex;gap:12px;align-items:center;">
                                <span>●●●●○ 🔋</span>
                            </span>
                        </div>

                        <div style="flex:1;overflow:hidden;display:flex;flex-direction:column;position:relative;">

                            <div style="padding:6px 14px 12px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border-color,#f0dde4);background:var(--bg-primary,#fdf6f8);flex-shrink:0;min-height:46px;">
                                <div style="font-size:17px;font-weight:700;color:var(--text-primary,#7a4a5a);display:flex;align-items:center;gap:6px;">
                                    📱 青 · cell phone
                                    <span style="font-size:9px;background:#e8a8bc;color:#fff;padding:1px 10px;border-radius:12px;font-weight:600;">LIVE</span>
                                </div>
                                <div style="display:flex;gap:14px;font-size:17px;color:var(--text-primary,#7a4a5a);">
                                    <span id="phone-search-btn" style="cursor:pointer;opacity:0.5;transition:opacity 0.3s;">🔍</span>
                                    <span id="phone-refresh-btn" style="cursor:pointer;opacity:0.5;transition:opacity 0.3s;">🔄</span>
                                </div>
                            </div>

                            <div id="search-bar" style="display:none;padding:6px 14px 10px;background:var(--bg-primary,#fdf6f8);border-bottom:1px solid var(--border-color,#f0dde4);flex-shrink:0;">
                                <input id="search-input" type="text" placeholder="🔍 搜索..." style="width:100%;padding:8px 14px;border-radius:20px;border:1px solid var(--border-color,#f0dde4);background:var(--bg-input,#fbeef3);font-size:13px;outline:none;color:var(--text-primary,#7a4a5a);">
                                <div style="text-align:right;font-size:11px;color:var(--text-muted);margin-top:4px;cursor:pointer;" id="search-close-btn">取消</div>
                            </div>

                            <div id="page-container" style="flex:1;overflow-y:auto;background:var(--bg-secondary,#fff5f8);position:relative;">

                                <div id="page-chatlist" style="display:block;padding:10px 14px 12px;">
                                    ${chatListHtml}
                                </div>

                                <div id="page-friendlist" style="display:none;padding:10px 14px 12px;">
                                    ${friendListHtml}
                                </div>

                                <div id="page-posts" style="display:none;padding:10px 14px 12px;background:var(--bg-secondary,#fff5f8);min-height:100%;">
                                    ${renderPostListHtml()}
                                </div>

                                <div id="page-settings" style="display:none;padding:0 14px 12px;background:var(--bg-secondary,#fff5f8);min-height:100%;">
                                    <div style="padding:10px 0;">
                                        <div style="font-size:11px;font-weight:600;color:var(--text-muted);padding:8px 0 4px;letter-spacing:1px;">界面</div>

                                        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border-color);font-size:14px;color:var(--text-primary,#7a4a5a);">
                                            <span id="dark-mode-label" style="font-weight:500;">${isDarkMode ? '🌙 深色款式' : '🌸 粉樱款式'}</span>
                                            <div class="dark-mode-switch ${isDarkMode ? '' : 'off'}" style="width:40px;height:22px;background:${isDarkMode ? '#e8a8bc' : '#f0dde4'};border-radius:12px;position:relative;cursor:pointer;">
                                                <span class="knob" style="width:18px;height:18px;background:#fff;border-radius:50%;position:absolute;top:2px;left:2px;transition:transform 0.3s;box-shadow:0 1px 4px rgba(0,0,0,0.25);transform:${isDarkMode ? 'translateX(18px)' : 'translateX(0)'};"></span>
                                            </div>
                                        </div>

                                        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border-color);font-size:14px;color:var(--text-primary,#7a4a5a);">
                                            <span style="font-weight:500;">🔔 消息通知</span>
                                            <div id="notif-switch" class="${notifEnabled ? '' : 'off'}" style="width:40px;height:22px;background:${notifEnabled ? '#e8a8bc' : '#f0dde4'};border-radius:12px;position:relative;cursor:pointer;">
                                                <span class="knob" style="width:18px;height:18px;background:#fff;border-radius:50%;position:absolute;top:2px;left:2px;transition:transform 0.3s;box-shadow:0 1px 4px rgba(0,0,0,0.25);transform:${notifEnabled ? 'translateX(18px)' : 'translateX(0)'};"></span>
                                            </div>
                                        </div>

                                        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border-color);font-size:14px;color:var(--text-primary,#7a4a5a);">
                                            <span style="font-weight:500;">🤖 青主动发言</span>
                                            <div id="auto-active-switch" class="${autoConfig.enabled ? '' : 'off'}" style="width:40px;height:22px;background:${autoConfig.enabled ? '#e8a8bc' : '#f0dde4'};border-radius:12px;position:relative;cursor:pointer;">
                                                <span class="knob" style="width:18px;height:18px;background:#fff;border-radius:50%;position:absolute;top:2px;left:2px;transition:transform 0.3s;box-shadow:0 1px 4px rgba(0,0,0,0.25);transform:${autoConfig.enabled ? 'translateX(18px)' : 'translateX(0)'};"></span>
                                            </div>
                                        </div>

                                        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border-color);font-size:13px;color:var(--text-primary,#7a4a5a);">
                                            <span style="font-weight:500;">⏱️ 发言频率</span>
                                            <select id="active-interval-select" style="background:var(--bg-input,#fbeef3);color:var(--text-primary,#7a4a5a);border:1px solid var(--border-color,#f0dde4);border-radius:6px;padding:4px 10px;font-size:12px;outline:none;">
                                                <option value="1" ${autoConfig.interval === 1 ? 'selected' : ''}>1分钟</option>
                                                <option value="2" ${autoConfig.interval === 2 ? 'selected' : ''}>2分钟</option>
                                                <option value="5" ${autoConfig.interval === 5 ? 'selected' : ''}>5分钟</option>
                                                <option value="15" ${autoConfig.interval === 15 ? 'selected' : ''}>15分钟</option>
                                                <option value="30" ${autoConfig.interval === 30 ? 'selected' : ''}>30分钟</option>
                                            </select>
                                        </div>

                                        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border-color);font-size:13px;color:var(--text-primary,#7a4a5a);">
                                            <span style="font-weight:500;">🧠 AI生成内容</span>
                                            <div id="auto-ai-switch" class="${autoConfig.useAI ? '' : 'off'}" style="width:40px;height:22px;background:${autoConfig.useAI ? '#e8a8bc' : '#f0dde4'};border-radius:12px;position:relative;cursor:pointer;">
                                                <span class="knob" style="width:18px;height:18px;background:#fff;border-radius:50%;position:absolute;top:2px;left:2px;transition:transform 0.3s;box-shadow:0 1px 4px rgba(0,0,0,0.25);transform:${autoConfig.useAI ? 'translateX(18px)' : 'translateX(0)'};"></span>
                                            </div>
                                        </div>

                                        <div style="font-size:11px;font-weight:600;color:var(--text-muted);padding:14px 0 4px;letter-spacing:1px;">📡 第二 API 设置</div>

                                        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border-color);font-size:14px;color:var(--text-primary,#7a4a5a);">
                                            <span style="font-weight:500;">启用第二 API</span>
                                            <div id="second-api-switch" class="${config.enabled ? '' : 'off'}" style="width:40px;height:22px;background:${config.enabled ? '#e8a8bc' : '#f0dde4'};border-radius:12px;position:relative;cursor:pointer;">
                                                <span class="knob" style="width:18px;height:18px;background:#fff;border-radius:50%;position:absolute;top:2px;left:2px;transition:transform 0.3s;box-shadow:0 1px 4px rgba(0,0,0,0.25);transform:${config.enabled ? 'translateX(18px)' : 'translateX(0)'};"></span>
                                            </div>
                                        </div>

                                        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;font-size:13px;color:var(--text-secondary,#a08090);">
                                            <span style="min-width:70px;">API URL</span>
                                            <input id="second-api-url" type="text" placeholder="https://api.openai.com/v1" value="${config.url || ''}" style="flex:1;max-width:170px;padding:4px 10px;border:1px solid var(--border-color);border-radius:6px;font-size:12px;background:var(--bg-input,#fbeef3);color:var(--text-primary,#7a4a5a);outline:none;margin-left:10px;">
                                        </div>
                                        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;font-size:13px;color:var(--text-secondary,#a08090);">
                                            <span style="min-width:70px;">API Key</span>
                                            <input id="second-api-key" type="password" placeholder="sk-..." value="${config.key || ''}" style="flex:1;max-width:170px;padding:4px 10px;border:1px solid var(--border-color);border-radius:6px;font-size:12px;background:var(--bg-input,#fbeef3);color:var(--text-primary,#7a4a5a);outline:none;margin-left:10px;">
                                        </div>

                                        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;font-size:13px;color:var(--text-secondary,#a08090);">
                                            <span style="min-width:70px;">模型名</span>
                                            <input id="second-api-model" type="text" placeholder="输入模型名" value="${config.model || ''}" style="flex:1;max-width:170px;padding:4px 10px;border:1px solid var(--border-color);border-radius:6px;font-size:12px;background:var(--bg-input,#fbeef3);color:var(--text-primary,#7a4a5a);outline:none;margin-left:10px;">
                                        </div>

                                        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;font-size:13px;color:var(--text-secondary,#a08090);">
                                            <span style="min-width:70px;">可用模型</span>
                                            <select id="second-api-models" style="flex:1;max-width:170px;padding:4px 10px;border:1px solid var(--border-color);border-radius:6px;font-size:12px;background:var(--bg-input,#fbeef3);color:var(--text-primary,#7a4a5a);outline:none;margin-left:10px;">
                                                <option value="" style="display:none;"></option>
                                                ${hasModels ? availableModels.map(m => `<option value="${m}" ${config.model === m ? 'selected' : ''}>${m}</option>`).join('') : ''}
                                            </select>
                                        </div>

                                        <div style="display:flex;gap:8px;flex-wrap:wrap;padding:10px 0 6px;">
                                            <button id="second-api-connect-btn" style="padding:3px 14px;border:1px solid #e8a8bc;border-radius:14px;font-size:11px;background:transparent;color:#e8a8bc;cursor:pointer;">连接</button>
                                            <span id="second-api-status" style="font-size:12px;color:var(--text-muted,#a08090);line-height:26px;">${config.url && config.key ? (config.enabled && config.model ? '✅ 已配置' : '⏸️ 待保存') : '未配置'}</span>
                                            <button id="second-api-save-btn" style="padding:3px 14px;border:1px solid #d4a5be;border-radius:14px;font-size:11px;background:transparent;color:#d4a5be;cursor:pointer;">保存</button>
                                            <button id="second-api-clear-btn" style="padding:3px 14px;border:1px solid #f44336;border-radius:14px;font-size:11px;background:transparent;color:#f44336;cursor:pointer;">清除</button>
                                        </div>

                                        <div style="padding:6px 0;font-size:10px;color:var(--text-muted,#a08090);line-height:1.6;opacity:0.8;">
                                            💡 点击「连接」测试连通性并获取可用模型列表。<br>
                                            💡 选择或输入模型后点击「保存」持久化配置。
                                        </div>
                                        <div style="text-align:center;padding:16px 0 4px;color:rgba(122,74,90,0.15);font-size:8px;border-top:1px solid var(--border-color);margin-top:8px;letter-spacing:2px;">
                                            白天是树，晚上是小猫
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style="display:flex;justify-content:space-around;align-items:center;padding:6px 0 8px;background:var(--bg-primary,#fdf6f8);border-top:1px solid var(--border-color,#f0dde4);flex-shrink:0;">
                                <button class="nav-btn active" data-page="page-chatlist" style="display:flex;flex-direction:column;align-items:center;gap:1px;font-size:9px;color:#e8a8bc;cursor:pointer;padding:2px 14px;background:none;border:none;font-family:inherit;">
                                    <span style="font-size:20px;line-height:1.2;color:#e8a8bc;">💬</span>
                                    <span style="color:#e8a8bc;">消息</span>
                                </button>
                                <button class="nav-btn" data-page="page-friendlist" style="display:flex;flex-direction:column;align-items:center;gap:1px;font-size:9px;color:var(--text-muted,#a08090);cursor:pointer;padding:2px 14px;background:none;border:none;font-family:inherit;">
                                    <span style="font-size:20px;line-height:1.2;color:var(--text-muted,#a08090);">👥</span>
                                    <span style="color:var(--text-muted,#a08090);">好友</span>
                                </button>
                                <button class="nav-btn" data-page="page-posts" style="display:flex;flex-direction:column;align-items:center;gap:1px;font-size:9px;color:var(--text-muted,#a08090);cursor:pointer;padding:2px 14px;background:none;border:none;font-family:inherit;">
                                    <span style="font-size:20px;line-height:1.2;color:var(--text-muted,#a08090);">📱</span>
                                    <span style="color:var(--text-muted,#a08090);">朋友圈</span>
                                </button>
                                <button class="nav-btn" data-page="page-settings" style="display:flex;flex-direction:column;align-items:center;gap:1px;font-size:9px;color:var(--text-muted,#a08090);cursor:pointer;padding:2px 14px;background:none;border:none;font-family:inherit;">
                                    <span style="font-size:20px;line-height:1.2;color:var(--text-muted,#a08090);">⚙</span>
                                    <span style="color:var(--text-muted,#a08090);">设置</span>
                                </button>
                            </div>
                        </div>

                        <!-- 聊天浮层 -->
                        <div id="chat-page" style="display:none;flex-direction:column;height:100%;position:absolute;top:0;left:0;right:0;bottom:0;background:var(--bg-primary,#fdf6f8);z-index:30;padding-top:0;">
                            <div style="display:flex;align-items:center;gap:10px;padding:6px 14px;background:var(--bg-primary,#fdf6f8);border-bottom:1px solid var(--border-color,#f0dde4);flex-shrink:0;min-height:52px;">
                                <span id="chat-back-btn" style="font-size:22px;cursor:pointer;opacity:0.5;color:var(--text-primary,#7a4a5a);">‹</span>
                                <div id="chat-page-avatar" style="width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#fff;background:${currentAvatar.startsWith('http') ? 'transparent' : currentAvatarColor};flex-shrink:0;overflow:hidden;">
                                    ${currentAvatar.startsWith('http') ? `<img src="${currentAvatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : (currentChatId ? currentChatId.charAt(0) : '青')}
                                </div>
                                <span id="chat-page-name" style="font-size:15px;font-weight:600;color:var(--text-primary,#7a4a5a);flex:1;">${currentName} <span style="font-size:10px;font-weight:normal;opacity:0.6;">(${currentStage})</span></span>
                                <span id="chat-profile-btn" style="font-size:16px;cursor:pointer;opacity:0.5;color:var(--text-primary,#7a4a5a);">👤</span>
                            </div>
                            <div id="chat-messages" style="flex:1;overflow-y:auto;padding:10px 14px;display:flex;flex-direction:column;gap:6px;background:var(--bg-secondary,#fff5f8);position:relative;"></div>
                            <div style="display:flex;gap:8px;padding:8px 14px;background:var(--bg-primary,#fdf6f8);border-top:1px solid var(--border-color,#f0dde4);flex-shrink:0;">
                                <input id="chat-input" type="text" placeholder="输入消息..." style="flex:1;padding:7px 14px;border-radius:20px;border:1px solid var(--border-color,#f0dde4);background:var(--bg-input,#fbeef3);font-size:12px;outline:none;color:var(--text-primary,#7a4a5a);">
                                <button id="chat-send-btn" style="padding:7px 16px;border:none;background:#e8a8bc;color:#fff;border-radius:20px;font-weight:600;font-size:12px;cursor:pointer;">发送</button>
                            </div>
                        </div>

                        <!-- 资料浮层 -->
                        <div id="profile-page" style="display:none;flex-direction:column;height:100%;position:absolute;top:0;left:0;right:0;bottom:0;background:var(--bg-primary,#fdf6f8);z-index:40;overflow-y:auto;padding-top:0;">
                            <div style="padding:6px 14px;font-size:14px;cursor:pointer;color:var(--text-primary,#7a4a5a);display:flex;align-items:center;gap:6px;background:var(--bg-primary,#fdf6f8);flex-shrink:0;min-height:44px;border-bottom:1px solid var(--border-color,#f0dde4);">
                                <span id="profile-back-btn" style="opacity:0.6;">‹ 返回</span>
                            </div>
                            <div style="text-align:center;padding:14px 0 10px;background:var(--bg-primary,#fdf6f8);border-bottom:1px solid var(--border-color,#f0dde4);flex-shrink:0;">
                                <div id="profile-avatar" style="
                                    width:72px;height:72px;border-radius:14px;margin:0 auto 6px;
                                    display:flex;align-items:center;justify-content:center;
                                    font-size:30px;font-weight:700;color:#fff;
                                    overflow:hidden;
                                    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
                                    background:${(currentAvatarLarge || currentAvatar).startsWith('http') ? 'transparent' : currentAvatarColor};
                                ">
                                    ${currentAvatarLarge.startsWith('http') ? `<img src="${currentAvatarLarge}" style="width:100%;height:100%;object-fit:cover;display:block;">` : (currentAvatar.startsWith('http') ? `<img src="${currentAvatar}" style="width:100%;height:100%;object-fit:cover;display:block;">` : (currentChatId ? currentChatId.charAt(0) : '青'))}
                                </div>
                                <div id="profile-name" style="font-size:18px;font-weight:700;color:var(--text-primary,#7a4a5a);">${currentName}</div>
                                <div id="profile-sub" style="font-size:12px;color:var(--text-secondary,#a08090);">${currentRelation} · ${currentStage}</div>
                            </div>
                            <div id="profile-bio" style="padding:10px 14px;background:var(--bg-primary,#fdf6f8);border-bottom:1px solid var(--border-color,#f0dde4);font-size:12px;color:var(--text-secondary,#a08090);line-height:1.6;">${currentBio}</div>
                            <div style="padding:10px 14px;flex:1;background:var(--bg-secondary,#fff5f8);">
                                <div style="font-size:12px;font-weight:600;color:var(--text-secondary,#a08090);margin-bottom:6px;">📸 图库</div>
                                <div id="profile-gallery" style="display:flex;flex-direction:column;gap:16px;"></div>
                            </div>
                            <div style="padding: 16px 14px; background:var(--bg-secondary,#fff5f8); display:flex; justify-content:center; border-top:1px solid var(--border-color); flex-shrink:0;">
                                <button id="profile-chat-btn" style="width:100%; max-width:280px; padding: 10px 24px; border-radius: 20px; background: #e8a8bc; color: white; border: none; font-weight: 600; font-size:13px; cursor: pointer; transition: background 0.2s;">💬 发送消息</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);

        $('body').append(container);

        // -------- CSS 变量体系（含手机端适配）---------
        if (!document.getElementById('phone-theme-style')) {
            const style = document.createElement('style');
            style.id = 'phone-theme-style';
            style.textContent = `
                @keyframes scaleUp { from { transform: scale(0.92); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                #phone-modal { animation: scaleUp 0.35s cubic-bezier(0.34,1.56,0.64,1); }
                
                @media (max-width: 767px) {
                    #phone-overlay-container {
                        align-items: center !important;
                        padding-top: 0;
                    }
                    #phone-modal {
                        width: 92vw !important;
                        height: 88vh !important; 
                        height: 88dvh !important;
                        max-height: 88dvh !important;
                        border-radius: 20px !important;
                    }
                    #phone-screen {
                        border-radius: 18px !important;
                    }
                    .phone-physical-btn { display: none; }
                    .notch-container { display: none; }
                    .phone-status-bar { padding-top: 12px !important; }
                }

                @media (min-width: 768px) and (max-width: 1024px) {
                    #phone-modal {
                        width: 400px;
                        height: 720px;
                    }
                }

                @media (max-height: 500px) {
                    #phone-modal {
                        height: 100vh;
                        border-radius: 0;
                    }
                    #phone-screen {
                        border-radius: 0;
                    }
                    .phone-physical-btn, .notch-container { display: none; }
                }

                #phone-modal.dark-mode {
                    --modal-bg: #2a1f24; --modal-border: rgba(232, 168, 188, 0.4);
                    --modal-shadow: 0 32px 80px rgba(0,0,0,0.65), 0 0 15px rgba(232,168,188,0.15);
                    --modal-btn-color: #3d2a32; --notch-dot: #4a2f38; --notch-speaker: #3d2a32; --notch-border: #4a2f38;
                    --bg-primary: #2a1f24; --bg-secondary: #1f161a; --bg-card: rgba(255,255,255,0.05);
                    --bg-input: #3d2a32; --text-primary: #f5e6eb; --text-secondary: #d4b5c0;
                    --text-muted: #8a6a75; --border-color: #3d2a32;
                }
                #phone-modal.light-mode {
                    --modal-bg: #fdf6f8; --modal-border: #f0dde4;
                    --modal-shadow: 0 32px 80px rgba(180, 100, 130, 0.25);
                    --modal-btn-color: #e8a8bc; --notch-dot: #e8a8bc; --notch-speaker: #f0dde4; --notch-border: #f0dde4;
                    --bg-primary: #fdf6f8; --bg-secondary: #fff5f8; --bg-card: #ffffff;
                    --bg-input: #fbeef3; --text-primary: #7a4a5a; --text-secondary: #a08090;
                    --text-muted: #c9a5b3; --border-color: #f0dde4;
                }

                #phone-screen { background: var(--bg-primary) !important; color: var(--text-primary) !important; }
                #phone-screen .nav-btn { color: var(--text-muted) !important; }
                #phone-screen .nav-btn.active { color: #e8a8bc !important; }
                #phone-screen .nav-btn.active span { color: #e8a8bc !important; }
                #phone-screen .nav-btn span { color: var(--text-muted) !important; }

                .phone-chat-item, .phone-friend-item { background: var(--bg-card) !important; border-color: var(--border-color) !important; }
                .phone-chat-item:hover, .phone-friend-item:hover { background: rgba(232,168,188,0.1) !important; }

                .post-card { background: var(--bg-card) !important; border-color: var(--border-color) !important; }

                #search-input, #chat-input, #second-api-url, #second-api-key, #second-api-model, #second-api-models {
                    background: var(--bg-input) !important; border-color: var(--border-color) !important; color: var(--text-primary) !important;
                }

                .message-bubble:not(.self) { background: var(--bg-card) !important; color: var(--text-primary) !important; }
                .message-bubble.self { background: #e8a8bc !important; color: #fff !important; }

                .dark-mode-switch, .notif-switch, #notif-switch, #auto-active-switch, #auto-ai-switch, #second-api-switch {
                    background: #f0dde4 !important;
                }
                .dark-mode-switch:not(.off), .notif-switch:not(.off), #notif-switch:not(.off), #auto-active-switch:not(.off), #auto-ai-switch:not(.off), #second-api-switch:not(.off) {
                    background: #e8a8bc !important;
                }

                .notch-container { background: var(--modal-bg) !important; border-color: var(--notch-border) !important; }
                .notch-container div { border-color: var(--notch-border) !important; }
                .phone-physical-btn { background: var(--modal-btn-color) !important; }

                .gallery-polaroid {
                    background: #fff;
                    padding: 4px 4px 10px 4px;
                    border-radius: 2px;
                    box-shadow: 2px 4px 12px rgba(180, 100, 130, 0.15);
                    margin-bottom: 16px;
                    width: fit-content;
                    max-width: 100%;
                }
                .gallery-polaroid img {
                    width: 100%;
                    height: auto;
                    display: block;
                    border-radius: 0;
                }
                .gallery-polaroid .polaroid-time {
                    text-align: center;
                    font-size: 10px;
                    color: #c9a5b3;
                    margin-top: 4px;
                    font-family: 'Courier New', monospace;
                }
            `;
            document.head.appendChild(style);
        }
        // ============================================================
        // 事件绑定
        // ============================================================
        $('.nav-btn').off('click').on('click', function() {
            const page = $(this).data('page');
            $('.nav-btn').removeClass('active');
            $(this).addClass('active');
            $('#page-chatlist, #page-friendlist, #page-posts, #page-settings').hide();
            if (page === 'page-chatlist') $('#page-chatlist').show();
            else if (page === 'page-friendlist') { $('#page-friendlist').show().html(renderFriendListHtml()); }
            else if (page === 'page-posts') { $('#page-posts').show().html(renderPostListHtml()); }
            else if (page === 'page-settings') { $('#page-settings').show(); updateSettingsUI(); }
        });

        $('#page-chatlist').off('click', '.phone-chat-item').on('click', '.phone-chat-item', function() {
            const name = $(this).data('name');
            if (name && typeof name === 'string') openChat(name);
        });

        $('#page-friendlist').off('click', '.phone-friend-item').on('click', '.phone-friend-item', function(e) {
            const name = $(this).data('name');
            if (name && typeof name === 'string') openChat(name);
        });

        $('#page-posts').off('click', '.js-like-btn').on('click', '.js-like-btn', function() {
            const author = $(this).data('author');
            const time = $(this).data('time');
            window._phoneLikePost(author, time);
        });
        $('#page-posts').off('click', '.js-comment-btn').on('click', '.js-comment-btn', function() {
            const author = $(this).data('author');
            const time = $(this).data('time');
            window._phoneCommentPost(author, time);
        });

        $('#phone-refresh-btn').off('click').on('click', function() {
            loadData();
            refreshChatListUI();
            refreshFriendListUI();
            if ($('#page-posts').is(':visible')) $('#page-posts').html(renderPostListHtml());
            toast('🔄 数据已同步刷新');
        });

        $('#phone-search-btn').off('click').on('click', function() {
            const bar = $('#search-bar');
            if (bar.is(':visible')) { bar.hide(); $('#search-input').val(''); }
            else { bar.show(); $('#search-input').focus(); }
        });
        $('#search-close-btn').off('click').on('click', function() { $('#search-bar').hide(); $('#search-input').val(''); });

        $('#chat-back-btn').off('click').on('click', function() { $('#chat-page').hide(); });
        $('#chat-profile-btn').off('click').on('click', function() { if (currentChatId && typeof currentChatId === 'string') openProfile(currentChatId, 'chat'); });
        $('#chat-send-btn').off('click').on('click', sendMessage);
        $('#chat-input').off('keydown').on('keydown', function(e) { if (e.key === 'Enter') sendMessage(); });

        $('#profile-back-btn').off('click').on('click', function() {
            $('#profile-page').hide();
            if (window._phoneProfileFrom === 'chat') {
                $('#chat-page').show();
            } else {
                $('.nav-btn').removeClass('active');
                $('.nav-btn[data-page="page-chatlist"]').addClass('active');
                $('#page-friendlist, #page-posts, #page-settings').hide();
                $('#page-chatlist').show();
            }
        });
        $('#profile-chat-btn').off('click').on('click', function() {
            if (currentChatId && typeof currentChatId === 'string') openChat(currentChatId);
        });

        // 深色/浅色切换
        $('.dark-mode-switch').off('click').on('click', function() {
            const isDark = $(this).hasClass('off');
            const modal = $('#phone-modal');
            const label = $('#dark-mode-label');
            if (isDark) {
                $(this).removeClass('off');
                $(this).find('.knob').css('transform', 'translateX(18px)');
                $(this).css('background', '#e8a8bc');
                modal.removeClass('light-mode').addClass('dark-mode');
                label.text('🌙 深色款式');
                localStorage.setItem('phone-dark-mode', 'on');
                toast('🌙 已切换为深色款式');
            } else {
                $(this).addClass('off');
                $(this).find('.knob').css('transform', 'translateX(0)');
                $(this).css('background', '#f0dde4');
                modal.removeClass('dark-mode').addClass('light-mode');
                label.text('🌸 粉樱款式');
                localStorage.setItem('phone-dark-mode', 'off');
                toast('🌸 已切换为粉樱款式');
            }
        });

        // 设置UI同步
        function updateSettingsUI() {
            const config = getSecondApiConfig();
            const autoConfig = getAutoActiveConfig();
            const notifEnabled = isNotifEnabled();

            if (!$('#second-api-url').val()) $('#second-api-url').val(config.url || '');
            if (!$('#second-api-key').val()) $('#second-api-key').val(config.key || '');
            if (!$('#second-api-model').val()) $('#second-api-model').val(config.model || '');

            const $select = $('#second-api-models');
            if (availableModels && availableModels.length > 0) {
                const currentModel = $('#second-api-model').val() || config.model || '';
                $select.empty();
                availableModels.forEach(m => {
                    $select.append(`<option value="${m}" ${m === currentModel ? 'selected' : ''}>${m}</option>`);
                });
                if (currentModel && !availableModels.includes(currentModel)) {
                    $select.append(`<option value="${currentModel}" selected>${currentModel}</option>`);
                }
            } else {
                $select.empty().append('<option value="" style="display:none;"></option>');
            }

            const sw = $('#second-api-switch');
            if (config.enabled) {
                sw.css('background', '#e8a8bc').removeClass('off');
                sw.find('.knob').css('transform', 'translateX(18px)');
            } else {
                sw.css('background', '#f0dde4').addClass('off');
                sw.find('.knob').css('transform', 'translateX(0)');
            }

            const notifSw = $('#notif-switch');
            if (notifEnabled) {
                notifSw.css('background', '#e8a8bc').removeClass('off');
                notifSw.find('.knob').css('transform', 'translateX(18px)');
            } else {
                notifSw.css('background', '#f0dde4').addClass('off');
                notifSw.find('.knob').css('transform', 'translateX(0)');
            }

            const activeSw = $('#auto-active-switch');
            if (autoConfig.enabled) {
                activeSw.css('background', '#e8a8bc').removeClass('off');
                activeSw.find('.knob').css('transform', 'translateX(18px)');
            } else {
                activeSw.css('background', '#f0dde4').addClass('off');
                activeSw.find('.knob').css('transform', 'translateX(0)');
            }

            const aiSw = $('#auto-ai-switch');
            if (autoConfig.useAI) {
                aiSw.css('background', '#e8a8bc').removeClass('off');
                aiSw.find('.knob').css('transform', 'translateX(18px)');
            } else {
                aiSw.css('background', '#f0dde4').addClass('off');
                aiSw.find('.knob').css('transform', 'translateX(0)');
            }

            $('#active-interval-select').val(autoConfig.interval);

            const statusEl = $('#second-api-status');
            if (config.url && config.key && config.model) {
                statusEl.text(config.enabled ? '✅ 已启用' : '⏸️ 已配置（未启用）')
                         .css('color', config.enabled ? '#4caf50' : '#ffa726');
            } else {
                statusEl.text('未配置').css('color', '#a08090');
            }
        }

        // 第二 API 开关
        $('#phone-screen').off('click.api').on('click.api', '#second-api-switch', function() {
            const config = getSecondApiConfig();
            config.enabled = !config.enabled;
            config.url   = $('#second-api-url').val().trim()   || config.url;
            config.key   = $('#second-api-key').val().trim()   || config.key;
            config.model = $('#second-api-model').val().trim() || config.model;
            saveSecondApiConfig(config);
            if (config.enabled) {
                $(this).css('background', '#e8a8bc').removeClass('off');
                $(this).find('.knob').css('transform', 'translateX(18px)');
                toast('📡 第二 API 已启用');
            } else {
                $(this).css('background', '#f0dde4').addClass('off');
                $(this).find('.knob').css('transform', 'translateX(0)');
                toast('📡 第二 API 已停用');
            }
            updateSettingsUI();
        });

        // 模型下拉
        $('#phone-screen').off('change.api').on('change.api', '#second-api-models', function() {
            const val = $(this).val();
            if (val) $('#second-api-model').val(val);
        });

        // 连接按钮
        $('#phone-screen').off('click.api-connect').on('click.api-connect', '#second-api-connect-btn', async function() {
            const url   = $('#second-api-url').val()?.trim();
            const key   = $('#second-api-key').val()?.trim();
            const model = $('#second-api-model').val()?.trim();
            const statusEl = $('#second-api-status');

            if (!url) { toast('⚠️ 请填写 API URL'); return; }
            if (!key) { toast('⚠️ 请填写 API Key'); return; }

            statusEl.text('⏳ 连接中…').css('color', '#ffa726');

            try {
                const modelsUrl = url.replace(/\/$/, '') + '/models';
                const controller = new AbortController();
                const tid = setTimeout(() => controller.abort(), 15000);
                const response = await fetch(modelsUrl, {
                    method: 'GET',
                    headers: { 'Authorization': 'Bearer ' + key, 'Accept': 'application/json' },
                    signal: controller.signal
                });
                clearTimeout(tid);

                if (response.ok) {
                    const data = await response.json();
                    let modelList = [];
                    if (data.data && Array.isArray(data.data)) {
                        modelList = data.data.map(m => m.id || m).filter(Boolean);
                    } else if (Array.isArray(data)) {
                        modelList = data.map(m => m.id || m).filter(Boolean);
                    }
                    modelList = [...new Set(modelList)];
                    availableModels = modelList;

                    let finalModel = model;
                    if (!finalModel && modelList.length > 0) {
                        finalModel = modelList[0];
                        $('#second-api-model').val(finalModel);
                    }

                    const config = getSecondApiConfig();
                    config.url   = url;
                    config.key   = key;
                    config.model = finalModel || config.model;
                    saveSecondApiConfig(config);

                    statusEl.text(`✅ 连接成功，${modelList.length} 个模型`).css('color', '#4caf50');
                    const $select = $('#second-api-models');
                    $select.empty();
                    modelList.forEach(m => {
                        $select.append(`<option value="${m}" ${m === finalModel ? 'selected' : ''}>${m}</option>`);
                    });
                    toast('✅ 连接成功，配置已自动保存');

                } else {
                    const errText = await response.text();
                    let errMsg = String(response.status);
                    try { errMsg = JSON.parse(errText)?.error?.message || errMsg; } catch(e) {}
                    statusEl.text('❌ ' + errMsg).css('color', '#f44336');
                    toast('❌ 连接失败: ' + errMsg);
                }
            } catch (error) {
                const msg = error.name === 'AbortError' ? '超时' : (error.message || '未知错误');
                statusEl.text('❌ ' + msg).css('color', '#f44336');
                toast('❌ ' + msg);
            }
        });

        // 保存按钮
        $('#phone-screen').off('click.api-save').on('click.api-save', '#second-api-save-btn', function() {
            const url   = $('#second-api-url').val()?.trim()   || '';
            const key   = $('#second-api-key').val()?.trim()   || '';
            const model = $('#second-api-model').val()?.trim() || '';
            const sw    = $('#second-api-switch');
            const enabled = !sw.hasClass('off');

            if (!url)   { toast('⚠️ 请填写 API URL');  return; }
            if (!key)   { toast('⚠️ 请填写 API Key');  return; }
            if (!model) { toast('⚠️ 请填写或选择模型'); return; }

            const success = saveSecondApiConfig({ url, key, model, enabled, timeout: 30000, maxRetries: 2 });
            if (success) {
                updateSettingsUI();
                toast('✅ 配置已保存');
            } else {
                toast('❌ 保存失败，请查看控制台');
            }
        });

        // 清除按钮
        $('#phone-screen').off('click.api-clear').on('click.api-clear', '#second-api-clear-btn', function() {
            if (!confirm('确定要清除所有 API 配置吗？')) return;
            clearSecondApiConfig();
            $('#second-api-url').val('');
            $('#second-api-key').val('');
            $('#second-api-model').val('');
            availableModels = [];
            updateSettingsUI();
            toast('🗑️ 配置已清除');
        });

        // 消息通知开关
        $('#phone-screen').off('click.notif').on('click.notif', '#notif-switch', function() {
            const cur = isNotifEnabled();
            setNotifEnabled(!cur);
            if (!cur) {
                $(this).css('background', '#e8a8bc').removeClass('off');
                $(this).find('.knob').css('transform', 'translateX(18px)');
                toast('🔔 消息通知已开启');
            } else {
                $(this).css('background', '#f0dde4').addClass('off');
                $(this).find('.knob').css('transform', 'translateX(0)');
                toast('🔕 消息通知已关闭');
            }
        });

        // 自动发言开关
        $('#phone-screen').off('click.active').on('click.active', '#auto-active-switch', function() {
            const config = getAutoActiveConfig();
            config.enabled = !config.enabled;
            saveAutoActiveConfig(config);
            if (config.enabled) {
                $(this).css('background', '#e8a8bc').removeClass('off');
                $(this).find('.knob').css('transform', 'translateX(18px)');
                toast('🤖 青主动发言已开启');
                startAutoActiveTimer();
            } else {
                $(this).css('background', '#f0dde4').addClass('off');
                $(this).find('.knob').css('transform', 'translateX(0)');
                toast('🤖 青主动发言已关闭');
                stopAutoActiveTimer();
            }
        });

        // AI生成内容开关
        $('#phone-screen').off('click.ai').on('click.ai', '#auto-ai-switch', function() {
            const config = getAutoActiveConfig();
            config.useAI = !config.useAI;
            saveAutoActiveConfig(config);
            if (config.useAI) {
                $(this).css('background', '#e8a8bc').removeClass('off');
                $(this).find('.knob').css('transform', 'translateX(18px)');
                toast('🧠 AI生成内容已开启');
            } else {
                $(this).css('background', '#f0dde4').addClass('off');
                $(this).find('.knob').css('transform', 'translateX(0)');
                toast('🧠 AI生成内容已关闭');
            }
        });

        // 发言频率
        $('#phone-screen').off('change.interval').on('change.interval', '#active-interval-select', function() {
            const val = parseInt($(this).val());
            const config = getAutoActiveConfig();
            config.interval = val;
            saveAutoActiveConfig(config);
            if (config.enabled) {
                startAutoActiveTimer();
                toast(`⏱️ 发言频率已设为 ${val} 分钟`);
            }
        });

        // 点赞
        window._phoneLikePost = function(author, time) {
            const role = chatData[author];
            if (!role) return;
            const post = role.posts.find(p => p.time === time);
            if (!post) return;
            const now = new Date();
            const timeStr = String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
            if (post.hasLiked) {
                post.likes = Math.max(0, (post.likes || 0) - 1);
                post.hasLiked = false;
                syncToWorldbook(author, `- [${timeStr}] 你取消了对${author}的朋友圈动态："${post.text.slice(0,20)}…"的点赞`);
                toast('💔 已取消点赞');
            } else {
                post.likes = (post.likes || 0) + 1;
                post.hasLiked = true;
                syncToWorldbook(author, `- [${timeStr}] 你点赞了${author}的朋友圈动态："${post.text.slice(0,20)}…"`);
                toast('❤️ 点赞成功');
            }
            saveData();
            if ($('#page-posts').is(':visible')) $('#page-posts').html(renderPostListHtml());
        };

        // 评论
        window._phoneCommentPost = function(author, time) {
            const comment = prompt('请输入你要评论的内容：');
            if (!comment || comment.trim() === '') return;
            const role = chatData[author];
            if (!role) return;
            const post = role.posts.find(p => p.time === time);
            if (!post) return;
            post.comments = post.comments || [];
            post.comments.push({ user: '我', text: comment.trim() });
            saveData();
            const now = new Date();
            const timeStr = String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
            syncToWorldbook(author, `- [${timeStr}] 你在${author}的朋友圈"${post.text.slice(0,20)}…"下评论说："${comment.trim()}"`);
            if ($('#page-posts').is(':visible')) $('#page-posts').html(renderPostListHtml());
            toast('💬 评论发表成功');
        };

        // 点击遮罩关闭
        $('#phone-overlay-container').off('click').on('click', function(e) {
            if (e.target === this) {
                $('#phone-overlay-container').remove();
                isOpen = false;
            }
        });

        // 图库渲染
        const gallery = $('#profile-gallery');
        gallery.empty();
        const galleryItems = currentRole?.gallery || [];
        const imageItems = galleryItems.filter(item => typeof item === 'string' && item.startsWith('http'));
        const total = imageItems.length;
        imageItems.forEach((item, index) => {
            const randomTime = generateRandomTime(index, total);
            const randomRotation = (Math.random() - 0.5) * 1;
            gallery.append(`
                <div class="gallery-polaroid" style="transform: rotate(${randomRotation}deg);">
                    <img src="${item}" style="width:100%;height:auto;display:block;">
                    <div class="polaroid-time">${randomTime}</div>
                </div>
            `);
        });

        updateSettingsUI();
        ensureBannerStyles();
        if (autoActiveTimer === null) {
            const autoConfig = getAutoActiveConfig();
            if (autoConfig.enabled) startAutoActiveTimer();
        }

        console.log('[小手机] UI渲染完毕，所有事件已绑定');
    }

    // ============================================================
    // 聊天功能
    // ============================================================
    function openChat(name) {
        if (typeof name !== 'string' || !chatData[name]) return;
        const role = chatData[name];
        if (!role) return;
        currentChatId = name;

        const isDarkMode = localStorage.getItem('phone-dark-mode') !== 'off';

        $('#chat-page-avatar').html(role.avatar && role.avatar.startsWith('http')
            ? `<img src="${role.avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`
            : name.charAt(0));
        $('#chat-page-avatar').css('background', role.avatar && role.avatar.startsWith('http') ? 'transparent' : (role.avatarColor || '#e8a8bc'));
        $('#chat-page-name').html(`${role.name} <span style="font-size:10px;font-weight:normal;opacity:0.6;">(${role.stage})</span>`);

        const msgContainer = $('#chat-messages');
        msgContainer.empty();
        (role.messages || []).forEach(msg => {
            const isMe = msg.from === 'me';
            msgContainer.append(`
                <div class="message-bubble ${isMe ? 'self' : ''}" style="
                    max-width:72%;padding:7px 13px;border-radius:16px;
                    font-size:12px;line-height:1.5;
                    align-self:${isMe ? 'flex-end' : 'flex-start'};
                    background:${isMe ? '#e8a8bc' : (isDarkMode ? '#3d2a32' : '#fbeef3')};
                    color:${isMe ? '#fff' : (isDarkMode ? '#f5e6eb' : '#7a4a5a')};
                    border-bottom-${isMe ? 'right' : 'left'}-radius:4px;
                    word-wrap:break-word;
                ">
                    ${msg.text}
                    <div style="font-size:9px;opacity:0.4;margin-top:3px;text-align:right;">${msg.time || ''}</div>
                </div>
            `);
        });
        msgContainer.scrollTop(msgContainer[0].scrollHeight);

        role.unread = 0;
        saveData();
        refreshChatListUI();
        $('#chat-page').show().css('display', 'flex');
        $('#profile-page').hide();
    }

    async function sendMessage() {
        const input = $('#chat-input');
        const text = input.val().trim();
        if (!text || !currentChatId || typeof currentChatId !== 'string') return;
        const role = chatData[currentChatId];
        if (!role) return;

        const now = new Date();
        const timeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

        role.messages.push({ from: 'me', text: text, time: timeStr });
        role.lastMsg = text;
        role.time = '刚刚';
        saveData();
        syncToWorldbook(currentChatId, `- [${timeStr}] 你在手机上对${currentChatId}发消息说："${text}"`);

        input.val('');
        openChat(currentChatId);

        clearTimeout(window._autoReplyTimer);
        window._autoReplyTimer = setTimeout(async function() {
            await autoReply(currentChatId, text);
        }, 800 + Math.random() * 1200);
    }

    function openProfile(name, from) {
        if (typeof name !== 'string' || !chatData[name]) return;
        const role = chatData[name];
        if (!role) return;
        currentChatId = name;
        window._phoneProfileFrom = from || 'friend';
        
        const profileAvatarHtml = role.avatarLarge && role.avatarLarge.startsWith('http')
            ? `<img src="${role.avatarLarge}" style="width:100%;height:100%;object-fit:cover;display:block;">`
            : (role.avatar && role.avatar.startsWith('http')
                ? `<img src="${role.avatar}" style="width:100%;height:100%;object-fit:cover;display:block;">`
                : name.charAt(0));
        $('#profile-avatar').html(profileAvatarHtml);
        $('#profile-avatar').css('background', (role.avatarLarge || role.avatar) && (role.avatarLarge || role.avatar).startsWith('http') ? 'transparent' : (role.avatarColor || '#e8a8bc'));
        
        $('#profile-name').text(role.name);
        $('#profile-sub').text(role.relation + ' · ' + role.stage);
        $('#profile-bio').text(role.bio || '这个人很懒，什么都没留下。');
        
        const gallery = $('#profile-gallery');
        gallery.empty();
        const items = role.gallery || [];
        const imageItems = items.filter(item => typeof item === 'string' && item.startsWith('http'));
        const total = imageItems.length;
        imageItems.forEach((item, index) => {
            const randomTime = generateRandomTime(index, total);
            const randomRotation = (Math.random() - 0.5) * 1;
            gallery.append(`
                <div class="gallery-polaroid" style="transform: rotate(${randomRotation}deg);">
                    <img src="${item}" style="width:100%;height:auto;display:block;">
                    <div class="polaroid-time">${randomTime}</div>
                </div>
            `);
        });
        
        $('#profile-page').show().css('display', 'flex');
        $('#chat-page').hide();
    }

    function togglePhone() {
        isOpen = !isOpen;
        if (isOpen) { 
            loadData(); 
            renderUI(); 
            console.log('[小手机] 已打开');
        } else {
            $('#phone-overlay-container').remove();
        }
    }

    // ============================================================
    // 注册 ST 原生按钮
    // ============================================================
    try {
        const buttons = typeof getScriptButtons !== 'undefined' ? getScriptButtons() : [];
        if (!buttons.some(b => b.name === '📱 小手机')) {
            if (typeof replaceScriptButtons !== 'undefined') {
                replaceScriptButtons([...buttons, { name: '📱 小手机', visible: true }]);
            }
        }
        const eventType = typeof getButtonEvent !== 'undefined' ? getButtonEvent('📱 小手机') : null;
        if (eventType && typeof eventOn !== 'undefined') {
            eventOn(eventType, togglePhone);
        }
        console.log('[小手机] ST 原生按钮已注册');
    } catch (e) {
        console.warn('[小手机] 按钮挂载失败', e);
    }

    // ============================================================
    // 初始化自动发言
    // ============================================================
    function initAutoActiveIfEnabled() {
        const config = getAutoActiveConfig();
        if (config.enabled) {
            startAutoActiveTimer();
        }
    }

    initAutoActiveIfEnabled();

    console.log('[小手机] 青 · 最终版加载完毕');

})();
