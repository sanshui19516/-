// ============================================================
// 【剧情推进】陪读妈妈 · 核心控制脚本（最终美化版）
// 功能：弹窗询问 + 控制正则 + 控制世界书(通过uid) + 自动触发 + 新建聊天检测
// ============================================================

(function() {
    'use strict';

    // ============================================================
    // 配置
    // ============================================================
    var CONFIG = {
        regexScriptName: '【剧情推进】陪读妈妈',
        worldbookName: '为了让我考上高校，妈妈成为了我的性处理肉便器母狗',
        worldEntryUids: [49, 50],
        statusKey: 'peidu_plot_system_status',
        wizardShownKey: 'peidu_wizard_shown'
    };

    // ============================================================
    // ★ 背景图片链接
    // ============================================================
    var BG_IMAGE = 'https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E7%8E%8B%E6%98%A5%E9%A3%8E%E7%8A%B6%E6%80%81%E6%A0%8F.png';

    // ============================================================
    // 调试日志
    // ============================================================
    function log(msg) {
        console.log('[剧情推进核心] ' + msg);
    }

    // ============================================================
    // 状态管理
    // ============================================================
    function getSystemStatus() {
        try { return localStorage.getItem(CONFIG.statusKey) || 'inactive'; } catch (e) { return 'inactive'; }
    }

    function setSystemStatus(status) {
        try { localStorage.setItem(CONFIG.statusKey, status); } catch (e) {}
    }

    function hasShownWizard() {
        try { return localStorage.getItem(CONFIG.wizardShownKey) === 'true'; } catch (e) { return false; }
    }

    function markWizardShown() {
        try { localStorage.setItem(CONFIG.wizardShownKey, 'true'); } catch (e) {}
    }

    function clearWizardShown() {
        try { localStorage.removeItem(CONFIG.wizardShownKey); } catch (e) {}
    }

    // ============================================================
    // Toast 提示
    // ============================================================
    function showToast(text) {
        if (typeof toastr !== 'undefined') {
            toastr.success(text, '', { timeOut: 3000 });
        } else {
            console.log('[剧情推进核心] ' + text);
        }
    }

    // ============================================================
    // 控制正则脚本
    // ============================================================
    function setRegexScriptEnabled(enabled) {
        log('正在' + (enabled ? '启用' : '禁用') + '正则脚本: ' + CONFIG.regexScriptName);

        try {
            var regexes = getTavernRegexes({ scope: 'character' });
            var scope = 'character';

            if (!regexes || regexes.length === 0) {
                regexes = getTavernRegexes({ scope: 'global' });
                scope = 'global';
            }

            if (!regexes || regexes.length === 0) {
                log('⚠️ 无法获取正则脚本列表');
                return false;
            }

            var targetFound = false;
            for (var i = 0; i < regexes.length; i++) {
                var name = regexes[i].script_name || regexes[i].name || regexes[i].scriptName || '';
                if (name === CONFIG.regexScriptName) {
                    regexes[i].enabled = enabled;
                    targetFound = true;
                    log('✅ 已' + (enabled ? '启用' : '禁用') + '正则脚本: ' + name);
                    break;
                }
            }

            if (!targetFound) {
                log('⚠️ 未找到正则脚本: ' + CONFIG.regexScriptName);
                return false;
            }

            replaceTavernRegexes(regexes, { scope: scope });
            log('✅ 正则脚本状态已保存');
            return true;

        } catch (e) {
            log('控制正则脚本失败: ' + e.message);
            return false;
        }
    }

    // ============================================================
    // ★ 控制世界书条目（使用 TavernHelper API）
    // ============================================================
    async function setWorldbookEntriesEnabled(enabled) {
        log('正在' + (enabled ? '启用' : '禁用') + '世界书条目 (uids: ' + CONFIG.worldEntryUids.join(', ') + ')');

        try {
            if (typeof TavernHelper === 'undefined' || typeof TavernHelper.getWorldbook !== 'function') {
                log('⚠️ TavernHelper 不可用');
                showToast('⚠️ TavernHelper 不可用');
                return false;
            }

            var wb = await TavernHelper.getWorldbook(CONFIG.worldbookName);
            if (!wb) {
                log('⚠️ 未找到世界书: ' + CONFIG.worldbookName);
                showToast('⚠️ 未找到世界书: ' + CONFIG.worldbookName);
                return false;
            }

            log('✅ 成功获取世界书: ' + CONFIG.worldbookName);

            var foundCount = 0;
            for (var i = 0; i < wb.length; i++) {
                var entry = wb[i];
                var uid = entry.uid || entry.id || entry.index || '';
                if (CONFIG.worldEntryUids.indexOf(uid) !== -1) {
                    entry.enabled = enabled;
                    foundCount++;
                    var name = entry.name || entry.title || entry.key || 'untitled';
                    log('✅ 已' + (enabled ? '启用' : '禁用') + '世界书条目 (uid:' + uid + '): ' + name);
                }
            }

            if (foundCount === 0) {
                log('⚠️ 未找到任何匹配的 uid: ' + CONFIG.worldEntryUids.join(', '));
                showToast('⚠️ 未找到 uid: ' + CONFIG.worldEntryUids.join(', '));
                return false;
            }

            await TavernHelper.replaceWorldbook(CONFIG.worldbookName, wb);
            log('✅ 世界书条目状态已保存（共 ' + foundCount + ' 个）');

            if (typeof TavernHelper.builtin?.reloadEditor === 'function') {
                TavernHelper.builtin.reloadEditor(CONFIG.worldbookName);
            }

            return true;

        } catch (e) {
            log('控制世界书条目失败: ' + e.message);
            showToast('⚠️ 世界书控制失败: ' + e.message);
            return false;
        }
    }

    // ============================================================
    // 启用/禁用完整系统
    // ============================================================
    async function enableSystem() {
        log('正在启用系统...');

        markWizardShown();

        var regexOk = setRegexScriptEnabled(true);
        var worldOk = await setWorldbookEntriesEnabled(true);

        setSystemStatus('active');

        var msg = '';
        if (regexOk && worldOk) {
            msg = '✅ 剧情推进系统已完全启用';
        } else if (regexOk) {
            msg = '✅ 正则脚本已启用（世界书未完全开启）';
        } else if (worldOk) {
            msg = '✅ 世界书条目已启用（正则脚本未找到）';
        } else {
            msg = '⚠️ 组件启用失败，请检查配置';
        }

        showToast(msg);
        log(msg);
    }

    async function disableSystem() {
        log('正在禁用系统...');

        markWizardShown();

        var regexOk = setRegexScriptEnabled(false);
        var worldOk = await setWorldbookEntriesEnabled(false);

        setSystemStatus('inactive');

        var msg = '⏸ 剧情推进系统已禁用';
        showToast(msg);
        log(msg);
    }

    // ============================================================
    // 弹窗逻辑（防重复锁）
    // ============================================================
    var isPopupShowing = false;

    function showWizardPopup() {
        if (hasShownWizard()) {
            log('向导已显示过，跳过弹窗');
            return;
        }

        if (isPopupShowing) {
            log('已有弹窗正在显示，跳过');
            return;
        }

        log('尝试弹出启动向导...');

        isPopupShowing = true;

        if (typeof SillyTavern === 'undefined' || typeof SillyTavern.callGenericPopup !== 'function') {
            log('⚠️ SillyTavern API 不可用');
            isPopupShowing = false;
            injectWizardUI();
            return;
        }

        var html = `
            <div style="
                text-align: center;
                padding: 4px 0;
                background-image: url('${BG_IMAGE}');
                background-size: cover;
                background-position: center;
                background-blend-mode: overlay;
                background-color: rgba(30, 25, 22, 0.4);
                border-radius: 12px;
                padding: 24px 20px;
                backdrop-filter: blur(4px);
                -webkit-backdrop-filter: blur(4px);
            ">
                <div style="font-size: 18px; font-weight: 600; color: #d4a574; margin-bottom: 8px; letter-spacing: 2px; text-shadow: 0 2px 8px rgba(0,0,0,0.5);">
                    ✦ 剧情推进 · 启动向导
                </div>
                <div style="height:1px;background:rgba(180,140,100,0.08);margin:8px 0 14px;"></div>
                <div style="font-size: 14px; color: #c8c0b8; line-height: 1.8; margin-bottom: 6px; text-shadow: 0 1px 4px rgba(0,0,0,0.6);">
                    是否启用「陪读妈妈」剧情推进系统？
                </div>
                <div style="font-size: 12px; color: rgba(200,200,200,0.5); line-height: 1.6; margin-bottom: 12px; text-shadow: 0 1px 4px rgba(0,0,0,0.5);">
                    启用后将自动打开：<br>
                    世界书条目（2个） · 正则脚本 · 自动触发
                </div>
                <div style="font-size: 11px; color: rgba(200,200,200,0.3); border-top: 1px solid rgba(255,255,255,0.04); padding-top: 8px;">
                    <span style="color: #aa8a6a;">提示：</span>新建聊天后会再次询问
                </div>
            </div>
        `;

        SillyTavern.callGenericPopup(
            html,
            SillyTavern.POPUP_TYPE.CONFIRM,
            '',
            {
                okButton: '✅ 开启',
                cancelButton: '⏸ 暂不'
            }
        ).then(function(result) {
            isPopupShowing = false;
            if (result === SillyTavern.POPUP_RESULT.AFFIRMATIVE) {
                log('用户点击「开启」');
                enableSystem();
            } else {
                log('用户点击「暂不」');
                disableSystem();
            }
        }).catch(function(err) {
            isPopupShowing = false;
            log('弹窗出错: ' + err.message);
            injectWizardUI();
        });
    }

    // ============================================================
    // ★ 后备弹窗（带毛玻璃背景 + 图片）
    // ============================================================
    function injectWizardUI() {
        log('使用后备方案：手动注入 HTML 弹窗...');

        var old = document.getElementById('peidu-core-wizard');
        if (old) { old.parentNode.removeChild(old); }

        if (!document.body) {
            setTimeout(injectWizardUI, 500);
            return;
        }

        var overlay = document.createElement('div');
        overlay.id = 'peidu-core-wizard';
        overlay.setAttribute('style', [
            'position: fixed !important',
            'top: 0 !important',
            'left: 0 !important',
            'width: 100% !important',
            'height: 100% !important',
            'z-index: 999999 !important',
            'background: rgba(0,0,0,0.50) !important',
            'backdrop-filter: blur(12px) !important',
            '-webkit-backdrop-filter: blur(12px) !important',
            'display: flex !important',
            'justify-content: center !important',
            'align-items: center !important',
            'font-family: "Noto Serif SC", "PingFang SC", sans-serif !important'
        ].join(' '));

        overlay.innerHTML = `
            <div style="
                max-width: 420px;
                width: 90%;
                background-image: url('${BG_IMAGE}');
                background-size: cover;
                background-position: center;
                background-blend-mode: overlay;
                background-color: rgba(30, 25, 22, 0.45);
                backdrop-filter: blur(20px) saturate(1.4);
                -webkit-backdrop-filter: blur(20px) saturate(1.4);
                border: 1px solid rgba(255, 255, 255, 0.06);
                border-radius: 16px;
                padding: 32px 28px 28px;
                box-shadow: 0 16px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04);
                text-align: center;
                position: relative;
                overflow: hidden;
            ">
                <!-- 装饰光晕 -->
                <div style="
                    position: absolute;
                    top: -80px;
                    right: -80px;
                    width: 200px;
                    height: 200px;
                    background: radial-gradient(circle, rgba(180,140,100,0.06) 0%, transparent 70%);
                    border-radius: 50%;
                    pointer-events: none;
                "></div>
                <div style="
                    position: absolute;
                    bottom: -60px;
                    left: -60px;
                    width: 160px;
                    height: 160px;
                    background: radial-gradient(circle, rgba(180,140,100,0.04) 0%, transparent 70%);
                    border-radius: 50%;
                    pointer-events: none;
                "></div>

                <!-- 标题 -->
                <div style="position:relative;z-index:1;">
                    <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:4px;">
                        <span style="width:20px;height:1px;background:linear-gradient(90deg,transparent,hsla(350,55%,40%,0.08));"></span>
                        <span style="font-family:'Noto Serif SC',serif;font-size:12px;color:hsla(350,55%,40%,0.2);letter-spacing:6px;">✦</span>
                        <span style="width:20px;height:1px;background:linear-gradient(90deg,hsla(350,55%,40%,0.08),transparent);"></span>
                    </div>
                    <div style="font-family:'Noto Serif SC',serif;font-size:18px;font-weight:700;color:#d4a574;letter-spacing:6px;text-shadow: 0 2px 20px rgba(180,140,100,0.1);">
                        剧情推进
                    </div>
                    <div style="font-size:10px;color:hsla(350,55%,40%,0.15);letter-spacing:8px;margin-top:2px;">
                        · 启 动 向 导 ·
                    </div>
                </div>

                <!-- 分割线 -->
                <div style="height:1px;background:rgba(180,140,100,0.08);margin:12px 0 18px;position:relative;z-index:1;"></div>

                <!-- 内容 -->
                <div style="text-align:center;position:relative;z-index:1;">
                    <div style="font-size:14px;color:#c8c0b8;letter-spacing:1px;line-height:1.8;margin-bottom:6px;">
                        是否启用「陪读妈妈」剧情推进系统？
                    </div>
                    <div style="font-size:12px;color:rgba(200,200,200,0.35);letter-spacing:2px;margin-bottom:18px;line-height:1.6;">
                        启用后将自动打开：<br>
                        世界书条目（2个） · 正则脚本 · 自动触发
                    </div>

                    <!-- 按钮 -->
                    <div style="display:flex;gap:12px;justify-content:center;">
                        <button id="peidu-core-enable" style="
                            padding:8px 36px;
                            border:1px solid #d4a574;
                            border-radius:8px;
                            background:linear-gradient(135deg, rgba(180,140,100,0.08), rgba(180,140,100,0.02));
                            color:#d4a574;
                            font-family:'Noto Serif SC',serif;
                            font-size:13px;
                            font-weight:600;
                            letter-spacing:4px;
                            cursor:pointer;
                            transition:all 0.3s ease;
                            backdrop-filter:blur(4px);
                        " onmouseover="this.style.background='rgba(180,140,100,0.15)';this.style.transform='scale(1.02)'" onmouseout="this.style.background='linear-gradient(135deg, rgba(180,140,100,0.08), rgba(180,140,100,0.02))';this.style.transform='scale(1)'">
                            开 启
                        </button>
                        <button id="peidu-core-disable" style="
                            padding:8px 28px;
                            border:1px solid rgba(255,255,255,0.06);
                            border-radius:8px;
                            background:transparent;
                            color:rgba(200,200,200,0.3);
                            font-family:'Noto Serif SC',serif;
                            font-size:13px;
                            font-weight:400;
                            letter-spacing:4px;
                            cursor:pointer;
                            transition:all 0.3s ease;
                        " onmouseover="this.style.color='rgba(200,200,200,0.5)';this.style.borderColor='rgba(255,255,255,0.12)';this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.color='rgba(200,200,200,0.3)';this.style.borderColor='rgba(255,255,255,0.06)';this.style.background='transparent'">
                            暂 不
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        document.getElementById('peidu-core-enable').addEventListener('click', function() {
            markWizardShown();
            enableSystem();
            removeWizardUI();
        });

        document.getElementById('peidu-core-disable').addEventListener('click', function() {
            markWizardShown();
            disableSystem();
            removeWizardUI();
        });
    }

    function removeWizardUI() {
        var el = document.getElementById('peidu-core-wizard');
        if (el) {
            el.style.transition = 'opacity 0.4s ease';
            el.style.opacity = '0';
            setTimeout(function() {
                if (el.parentNode) { el.parentNode.removeChild(el); }
            }, 400);
        }
    }

    // ============================================================
    // 自动触发
    // ============================================================
    function setupAutoTrigger() {
        if (typeof eventOn !== 'function') {
            log('⚠️ eventOn 不可用，自动触发未注册');
            return;
        }

        var isActive = function() {
            return localStorage.getItem(CONFIG.statusKey) === 'active';
        };

        var onMessageReceived = async function(message_id) {
            if (!isActive()) return;
            try {
                var lastMessages = getChatMessages(-1);
                if (!lastMessages || lastMessages.length === 0) return;
                var lastMessage = lastMessages[0];
                if (!lastMessage || !lastMessage.message) return;
                if (lastMessage.message.includes('【剧情推进】')) return;
                if (lastMessage.message.includes('step_data')) {
                    log('检测到 step_data，添加触发标记');
                    var updatedMessage = lastMessage.message + '\n\n【剧情推进】';
                    await setChatMessages([
                        { message_id: lastMessage.message_id, message: updatedMessage }
                    ]);
                    log('✅ 已添加触发标记');
                }
            } catch (e) {
                log('处理消息出错: ' + e.message);
            }
        };

        eventOn(tavern_events.MESSAGE_RECEIVED, onMessageReceived);
        log('✅ 自动触发已注册');
    }

    // ============================================================
    // 辅助函数
    // ============================================================
    function isNewEmptyChat() {
        try {
            if (typeof getChatMessages !== 'function') {
                return false;
            }
            var messages = getChatMessages(-1);
            if (!messages || messages.length === 0) {
                return true;
            }
            for (var i = 0; i < messages.length; i++) {
                var msg = messages[i];
                if (msg && msg.is_user === true) {
                    return false;
                }
            }
            return true;
        } catch (e) {
            return false;
        }
    }

    // ============================================================
    // ★ 核心：监听 CHAT_CHANGED（精准检测新建聊天）
    // ============================================================
    function setupChatChangedListener() {
        if (typeof eventOn !== 'function' || typeof tavern_events === 'undefined') {
            log('⚠️ eventOn 或 tavern_events 不可用');
            return;
        }

        var currentChatId = null;
        try {
            if (typeof SillyTavern !== 'undefined' && SillyTavern.getCurrentChatId) {
                currentChatId = SillyTavern.getCurrentChatId();
            }
        } catch (e) {}

        eventOn(tavern_events.CHAT_CHANGED, function(chat_id) {
            log('检测到 CHAT_CHANGED 事件，新 chat_id:', chat_id);

            if (currentChatId !== chat_id) {
                currentChatId = chat_id;
                log('chat_id 已变更，处理聊天切换');

                setTimeout(function() {
                    if (isNewEmptyChat()) {
                        log('✅ 检测到新建空聊天，重置向导状态');
                        clearWizardShown();
                        setSystemStatus('inactive');

                        if (!hasShownWizard()) {
                            log('准备显示启动向导（新建空聊天）');
                            showWizardPopup();
                        }
                    } else {
                        log('目标聊天非空，保持现有状态');
                    }
                }, 600);
            } else {
                log('chat_id 未变更，忽略此次事件');
            }
        });

        log('✅ CHAT_CHANGED 监听已注册');
    }

    // ============================================================
    // 手动 API
    // ============================================================
    window.showPeiduWizard = function() {
        if (hasShownWizard()) {
            log('向导已显示过，如需重新显示请先执行 reset');
            return;
        }
        showWizardPopup();
    };

    window.resetPeiduWizard = function() {
        clearWizardShown();
        setSystemStatus('inactive');
        log('✅ 已重置所有状态');
        showToast('✅ 已重置，将重新弹窗');
        setTimeout(function() {
            if (!hasShownWizard()) {
                showWizardPopup();
            }
        }, 500);
    };

    window.forceShowPeiduWizard = function() {
        clearWizardShown();
        setSystemStatus('inactive');
        setTimeout(function() {
            isPopupShowing = false;
            showWizardPopup();
        }, 500);
    };

    // ============================================================
    // 初始化
    // ============================================================
    function init() {
        log('开始初始化...');
        log('当前状态: ' + getSystemStatus());
        log('向导已显示: ' + hasShownWizard());

        setupAutoTrigger();
        setupChatChangedListener();

        if (hasShownWizard()) {
            log('向导已显示过，跳过');
            return;
        }

        if (getSystemStatus() === 'active') {
            log('系统已激活，标记向导为已显示');
            markWizardShown();
            return;
        }

        if (isNewEmptyChat()) {
            log('当前为空聊天，准备显示启动向导');
            setTimeout(showWizardPopup, 800);
            return;
        }

        log('当前为非空聊天，首次运行，准备显示启动向导');
        setTimeout(showWizardPopup, 800);
    }

    // 启动
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(init, 500);
    } else {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(init, 500);
        });
    }

    // ============================================================
    // 暴露 API
    // ============================================================
    window.__peiduPlot = {
        enable: enableSystem,
        disable: disableSystem,
        status: getSystemStatus,
        showWizard: window.showPeiduWizard,
        reset: window.resetPeiduWizard,
        forceShow: window.forceShowPeiduWizard,
        setWorldbookEnabled: setWorldbookEntriesEnabled
    };

    log('✅ 核心控制脚本已加载完成（最终美化版）');

})();
