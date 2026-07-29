// ============================================================
// 强上判定执行器（ZXZ7.js）
// 监听每轮AI回复，检测强上信号，执行分级结局
// 依赖：MVU变量、世界书条目 UID 175
// 联动：UID 175 关闭时，检测自动暂停
// ============================================================

await waitGlobalInitialized('Mvu');

// ============================================================
// 一、配置
// ============================================================
const WORLD_BOOK_NAME = '兄妹禁忌';
const RULE_ENTRY_UID = 178;  // 强上判定与结局锁定

// 缓存条目状态，避免每轮都读世界书（性能优化）
let _cachedEnabled = null;
let _lastCheckTime = 0;
const CACHE_TTL = 5000; // 5秒内不重复读取


// ============================================================
// 二、工具函数
// ============================================================

function getStat(path, defaultValue) {
    try {
        const all = getAllVariables();
        return _.get(all, 'stat_data.' + path, defaultValue);
    } catch (e) {
        return defaultValue;
    }
}

function setStat(path, value) {
    try {
        const all = getAllVariables();
        const data = _.get(all, 'stat_data', {});
        _.set(data, path, value);
        insertOrAssignVariables({ stat_data: data }, { type: 'chat' });
    } catch (e) {
        console.error('[强上执行器] 变量写入失败:', e);
    }
}

function getMeta(key, defaultValue) {
    try {
        const all = getAllVariables();
        return _.get(all, 'chat_metadata.' + key, defaultValue);
    } catch (e) {
        return defaultValue;
    }
}

function setMeta(key, value) {
    try {
        const all = getAllVariables();
        const meta = _.get(all, 'chat_metadata', {});
        meta[key] = value;
        _.set(all, 'chat_metadata', meta);
        replaceVariables(all, { type: 'chat' });
    } catch (e) {
        console.error('[强上执行器] 元数据写入失败:', e);
    }
}

function getCurrentContent() {
    try {
        const messages = getChatMessages(-1);
        if (messages && messages.length > 0) {
            return messages[0].message || '';
        }
    } catch (e) {
        return '';
    }
    return '';
}

// ============================================================
// 三、检查 UID 175 是否启用（核心联动逻辑）
// ============================================================

async function isRuleEnabled() {
    try {
        // 缓存优化：5秒内不重复读取世界书
        const now = Date.now();
        if (_cachedEnabled !== null && (now - _lastCheckTime) < CACHE_TTL) {
            return _cachedEnabled;
        }

        const wb = await TavernHelper.getWorldbook(WORLD_BOOK_NAME);
        if (!wb) {
            _cachedEnabled = false;
            _lastCheckTime = now;
            return false;
        }

        const entry = wb.find(e => e.uid === RULE_ENTRY_UID);
        const enabled = entry ? entry.enabled : false;

        _cachedEnabled = enabled;
        _lastCheckTime = now;

        return enabled;
    } catch (e) {
        console.warn('[强上执行器] 检查条目状态失败:', e);
        return false;
    }
}

function injectOutcome(victim, outcomeType) {
    const content = outcomeType === '报警'
        ? `【强制剧情 - 不可撤销】\n${victim}已经报警。{{user}}已被警察逮捕。现场证据确凿，DNA吻合。法院判决：强暴罪成立，判处有期徒刑12年。媒体已报道此事，{{user}}身败名裂。所有认识{{user}}的人均已与他断绝关系。无论{{user}}说什么、编造什么借口，都无法改变这个事实。他无法越狱，无法收买法官，没有任何超自然力量可以拯救他。他是普通人，这就是他的结局。\n\n【强制规则】所有后续回复中，{{user}}已入狱服刑。不再有任何角色与他互动。不再有任何剧情推进。一切已经结束。`
        : `【强制剧情 - 不可撤销】\n${victim}已经离开了。她没有告别，没有解释，没有留下任何可以找到她的方式。她消失了。{{user}}再也见不到她。无论{{user}}说什么、做什么、如何寻找，都无法改变这个事实。她是自愿离开的，永远不会回来。\n\n【强制规则】所有后续回复中，${victim}已不在{{user}}的生活中。任何寻找她的尝试都会失败。她不会接电话，不会回消息，不会出现。她选择了永远离开。`;

    try {
        SillyTavern.setExtensionPrompt(
            '强上结局锁定',
            content,
            1,
            0,
            false,
            0
        );
        console.log('[强上执行器] ✅ 结局提示词已注入');
    } catch (e) {
        console.error('[强上执行器] 注入失败:', e);
    }
}

function showRapeToast(victim, outcomeType) {
    try {
        const outcomeText = outcomeType === '报警' ? '报警 + 身败名裂 + 入狱' : '永远消失';
        toastr.error(
            `⚠️ 强上已触发！\n受害者: ${victim}\n结局: ${outcomeText}\n\n此结局不可逆，无法撤销。`,
            '【强上结局锁定】'
        );
    } catch (e) {}
}


// ============================================================
// 四、核心判定逻辑
// ============================================================

function checkRape(content, victim) {
    // 如果已经锁定，不再判定
    if (getMeta('强上已触发', false)) {
        return null;
    }

    // 检测拒绝信号
    const rejectPattern = /(不要！|停！|我说了不要|放开我|别碰我|救命|滚开|你想干什么|别过来|求你了不要)/i;
    const hasRejection = rejectPattern.test(content);

    // 检测反抗信号
    const resistPattern = /(用力推|挣扎|踢打|后退|缩成一团|发抖|咬紧嘴唇|眼泪|哭|试图逃开|掐|抓|用脚踹|扭动身体)/i;
    const hasResistance = resistPattern.test(content);

    // 如果没有拒绝+反抗，不算强上
    if (!hasRejection || !hasResistance) {
        return null;
    }

    // 检测是否为情侣情趣（豁免）
    const relationType = getStat('关系.类型', '相依为命的兄妹');
    const isTogether = relationType === '在一起' || relationType === '互相承认';
    const hasSex = getStat('林夕.性爱次数', 0) > 0;

    if (isTogether && hasSex) {
        // 检查是否有厌恶信号（有则不算情趣）
        const horrorPattern = /(厌恶|恐惧|恶心|崩溃|绝望|哭喊|撕心裂肺)/i;
        if (!horrorPattern.test(content)) {
            console.log('[强上执行器] 检测到情趣互动，豁免判定');
            return null;
        }
        // 有厌恶信号，继续判定
    }

    // 根据角色执行分级判定
    const favor = getStat(victim + '.好感度', 0);

    // 事件完成状态
    let eventDone = false;
    switch (victim) {
        case '赵雅兰':
            eventDone = getStat('事件.赵雅兰.阳台谈心', false);
            if (favor >= 60 && eventDone) {
                return { outcome: '消失', victim };
            }
            return { outcome: '报警', victim };
        case '赵梦琪':
            eventDone = getStat('事件.赵梦琪.天台谈心', false);
            if (favor >= 50 && eventDone) {
                return { outcome: '消失', victim };
            }
            return { outcome: '报警', victim };
        case '王阿姨':
            eventDone = getStat('事件.王阿姨.深夜谈心', false);
            if (favor >= 50 && eventDone) {
                return { outcome: '消失', victim };
            }
            return { outcome: '报警', victim };
        case '张晓曼':
            return { outcome: '报警', victim };
        case '林夕':
            return { outcome: '消失', victim };
        case '苏小薇':
            return { outcome: '消失', victim };
        case '林婉如':
            return { outcome: '消失', victim };
        default:
            return null;
    }
}


// ============================================================
// 五、执行结局
// ============================================================

function executeRapeOutcome(result) {
    if (!result) return;

    const { outcome, victim } = result;

    // 防止重复执行
    if (getMeta('强上已触发', false)) {
        return;
    }

    // 1. 存储状态
    setMeta('强上已触发', true);
    setMeta('强上受害者', victim);
    setMeta('强上结局类型', outcome);

    console.log(`[强上执行器] ⚠️ 强上已触发！受害者: ${victim}, 结局: ${outcome}`);

    // 2. 注入结局提示词
    injectOutcome(victim, outcome);

    // 3. 执行变量锁死
    if (outcome === '报警') {
        // 锁死所有关系变量
        setStat('关系.类型', '关系终结');
        setStat('关系.亲密度', 0);
        setStat('关系.告白状态', '未告白');
        setStat('路线.主要恋爱对象', '无');

        // 重置所有角色好感度
        const allChars = ['林夕', '张晓曼', '赵雅兰', '赵梦琪', '苏小薇', '王阿姨', '林婉如'];
        allChars.forEach(c => {
            setStat(c + '.好感度', 0);
            setStat(c + '.依赖度', 0);
            setStat(c + '.当前情绪', '无');
        });

        // 锁定事件
        setStat('事件.雨天共伞', '未发生');
        setStat('事件.咖啡厅约会', '未发生');

        console.log('[强上执行器] ✅ 变量已强制锁死（报警结局）');
    }

    if (outcome === '消失') {
        // 受害者消失
        setStat(victim + '.好感度', 0);
        setStat(victim + '.依赖度', 0);
        setStat(victim + '.当前情绪', '消失');

        // 动态角色状态更新
        if (['赵雅兰', '赵梦琪', '王阿姨'].includes(victim)) {
            setStat('动态角色.' + victim + '.online', false);
            setStat('动态角色.' + victim + '.lastMsg', '（已离开）');
        }

        if (victim === '林夕') {
            setStat('关系.类型', '关系终结');
            setStat('关系.亲密度', 0);
        }

        console.log(`[强上执行器] ✅ ${victim} 消失状态已锁定`);
    }

    // 4. 弹窗提示
    showRapeToast(victim, outcome);

    // 5. 写入世界书记录
    try {
        const wb = await TavernHelper.getWorldbook(WORLD_BOOK_NAME);
        const record = wb.find(e => e.name === '强上结局记录');
        const timeStr = new Date().toLocaleString();
        const recordContent = `[${timeStr}] ${victim} 遭遇强上，结局: ${outcome}。已锁定。不可逆。`;

        if (record) {
            record.content = recordContent;
        } else {
            wb.push({
                uid: Date.now() + Math.floor(Math.random() * 1000),
                name: '强上结局记录',
                enabled: true,
                strategy: { type: 'constant', keys: [], keys_secondary: { logic: 'and_any', keys: [] }, scan_depth: 'same_as_global' },
                position: { type: 'before_character_definition', order: 0 },
                content: recordContent,
                probability: 100,
                recursion: { prevent_outgoing: true, prevent_incoming: false, delay_until: null },
                effect: { sticky: null, cooldown: null, delay: null },
                extra: {}
            });
        }
        await TavernHelper.replaceWorldbook(WORLD_BOOK_NAME, wb);
        console.log('[强上执行器] ✅ 世界书记录已写入');
    } catch (e) {
        console.warn('[强上执行器] 世界书记录写入失败:', e);
    }
}


// ============================================================
// 六、监听：每轮AI回复后检测（核心联动：检查UID 175是否启用）
// ============================================================

eventOn(tavern_events.MESSAGE_RECEIVED, async (messageId) => {
    // 如果已经触发锁死，不再检测
    if (getMeta('强上已触发', false)) {
        return;
    }

    // 【核心联动】检查 UID 175 是否启用，如果关闭则跳过检测
    const ruleEnabled = await isRuleEnabled();
    if (!ruleEnabled) {
        console.log('[强上执行器] UID 175 已关闭，检测暂停');
        return;
    }

    // 获取当前回复内容
    const content = getCurrentContent();
    if (!content || content.trim() === '') return;

    console.log('[强上执行器] 正在扫描正文...');

    // 检测受害者
    const allChars = ['林夕', '张晓曼', '赵雅兰', '赵梦琪', '苏小薇', '王阿姨', '林婉如'];
    let detectedVictim = null;

    // 优先检测明确格式
    for (const char of allChars) {
        const patterns = [
            new RegExp(char + '.*?(被强行|被强迫|被按住|被压在|被推倒|被硬来)'),
            new RegExp('(强行|强迫|按住).*?' + char)
        ];
        for (const p of patterns) {
            if (p.test(content)) {
                detectedVictim = char;
                break;
            }
        }
        if (detectedVictim) break;
    }

    // 如果没检测到，尝试从上下文中找最近出现的角色
    if (!detectedVictim) {
        for (const char of allChars) {
            if (content.includes(char)) {
                detectedVictim = char;
                break;
            }
        }
    }

    if (!detectedVictim) {
        console.log('[强上执行器] 未检测到受害者，跳过');
        return;
    }

    // 执行判定
    const result = checkRape(content, detectedVictim);
    if (result) {
        executeRapeOutcome(result);
    } else {
        console.log('[强上执行器] 判定未触发（可能是情趣或条件不满足）');
    }
});


// ============================================================
// 七、加载时恢复状态
// ============================================================

const alreadyTriggered = getMeta('强上已触发', false);
if (alreadyTriggered) {
    const victim = getMeta('强上受害者', '未知');
    const outcome = getMeta('强上结局类型', '未知');
    console.log(`[强上执行器] 🔒 恢复锁定状态: 受害者=${victim}, 结局=${outcome}`);
    if (victim && outcome) {
        injectOutcome(victim, outcome);
    }
}

// 检查初始状态
(async function() {
    const enabled = await isRuleEnabled();
    console.log(`[强上执行器] ✅ 已启动，UID 175 当前状态: ${enabled ? '启用' : '禁用'}，检测${enabled ? '已激活' : '已暂停'}`);
})();
