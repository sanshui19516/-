// ============================================================
// 真实世界 · 快捷开关（毛玻璃通知版 · 修复注入位置）
// ============================================================

(function() {
    // ─── 配置 ────────────────────────────────────────────────
    const WORLD_BOOK_NAME = '兄妹禁忌';
    const ENTRY_UID = 170;
    const BUTTON_NAME = '真实世界';
    const NOTIF_IMAGE = 'https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E9%80%9A%E7%9F%A5.png';
    const NOTIF_DURATION = 3000;

    let clickTimer = null;
    let isDoubleClick = false;

    // ─── 获取顶层文档（酒馆主窗口）─────────────────────────
    function getTopDoc() {
        try {
            if (window.parent && window.parent.document) {
                return window.parent.document;
            }
        } catch (e) {}
        return document;
    }

    // ─── 注入 CSS（毛玻璃通知样式）─────────────────────────
    (function injectStyles() {
        const topDoc = getTopDoc();
        if (topDoc.getElementById('realworld-notif-style')) return;
        const style = topDoc.createElement('style');
        style.id = 'realworld-notif-style';
        style.textContent = `
            /* 通知卡片 */
            .realworld-notif {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 999999;
                display: flex;
                align-items: center;
                gap: 14px;
                padding: 14px 18px 14px 14px;
                max-width: 420px;
                width: calc(100% - 32px);
                background: rgba(30, 22, 30, 0.72);
                backdrop-filter: blur(24px);
                -webkit-backdrop-filter: blur(24px);
                border: 1px solid rgba(200, 170, 190, 0.12);
                border-radius: 16px;
                box-shadow:
                    0 12px 48px rgba(0,0,0,0.55),
                    0 0 0 1px rgba(200,170,190,0.04) inset,
                    0 0 80px rgba(160,100,160,0.04);
                animation: rwnPopIn 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                transform-origin: center;
                opacity: 0;
                scale: 0.5;
                font-family: 'Georgia', 'Times New Roman', serif;
                box-sizing: border-box;
            }
            .realworld-notif.exiting {
                animation: rwnPopOut 0.5s cubic-bezier(0.76, 0, 0.24, 1) forwards;
            }
            @keyframes rwnPopIn {
                0%   { opacity: 0; scale: 0.4; }
                60%  { opacity: 1; scale: 1.04; }
                100% { opacity: 1; scale: 1; }
            }
            @keyframes rwnPopOut {
                0%   { opacity: 1; scale: 1; }
                100% { opacity: 0; scale: 0.6; }
            }

            .realworld-notif .rw-avatar {
                flex-shrink: 0;
                width: 48px;
                height: 48px;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 16px rgba(0,0,0,0.3);
                border: 1px solid rgba(200,170,190,0.08);
                background: rgba(60,40,55,0.3);
            }
            .realworld-notif .rw-avatar img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
            }
            .realworld-notif .rw-content {
                flex: 1;
                min-width: 0;
                display: flex;
                flex-direction: column;
                gap: 1px;
            }
            .realworld-notif .rw-title {
                font-size: 0.9rem;
                font-weight: 700;
                color: #f0e6ec;
                letter-spacing: 1px;
                display: flex;
                align-items: center;
                gap: 8px;
                flex-wrap: wrap;
            }
            .realworld-notif .rw-status {
                font-weight: 600;
            }
            .realworld-notif .rw-status.on  { color: hsl(150, 50%, 55%); }
            .realworld-notif .rw-status.off { color: hsl(10, 45%, 50%); }

            .realworld-notif .rw-sub {
                font-size: 0.68rem;
                color: rgba(200, 180, 195, 0.5);
                letter-spacing: 0.5px;
                font-style: italic;
            }
            .realworld-notif .rw-close {
                flex-shrink: 0;
                width: 22px;
                height: 22px;
                border: none;
                background: rgba(200,170,190,0.05);
                border-radius: 50%;
                color: rgba(200,180,195,0.25);
                font-size: 13px;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0;
                font-family: inherit;
            }
            .realworld-notif .rw-close:hover {
                background: rgba(200,170,190,0.12);
                color: rgba(200,180,195,0.6);
            }

            @media (max-width: 480px) {
                .realworld-notif {
                    top: 12px;
                    padding: 12px 14px 12px 12px;
                    gap: 12px;
                    border-radius: 14px;
                    width: calc(100% - 20px);
                }
                .realworld-notif .rw-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                }
                .realworld-notif .rw-title {
                    font-size: 0.8rem;
                }
                .realworld-notif .rw-sub {
                    font-size: 0.62rem;
                }
            }
        `;
        topDoc.head.appendChild(style);
    })();

    // ─── 显示毛玻璃通知（注入到父页面）─────────────────────
    function showGlassNotification(status, imageUrl, duration) {
        const topDoc = getTopDoc();

        // 移除已有通知
        const existing = topDoc.querySelector('.realworld-notif');
        if (existing) existing.remove();

        const statusMap = {
            on:  { label: '已开启', cls: 'on' },
            off: { label: '已关闭', cls: 'off' }
        };
        const info = statusMap[status] || statusMap.on;

        const notif = topDoc.createElement('div');
        notif.className = 'realworld-notif';
        notif.innerHTML = `
            <div class="rw-avatar">
                <img src="${imageUrl || NOTIF_IMAGE}" alt="">
            </div>
            <div class="rw-content">
                <div class="rw-title">
                    真实世界
                    <span class="rw-status ${info.cls}">${info.label}</span>
                </div>
                <div class="rw-sub">双击按钮即可关闭按钮</div>
            </div>
            <button class="rw-close" aria-label="关闭">✕</button>
        `;

        notif.querySelector('.rw-close').addEventListener('click', function(e) {
            e.stopPropagation();
            dismissNotif(notif);
        });

        topDoc.body.appendChild(notif);

        const timer = setTimeout(() => {
            dismissNotif(notif);
        }, duration || NOTIF_DURATION);

        notif._timer = timer;
        return notif;
    }

    function dismissNotif(notif) {
        if (!notif || !notif.parentNode) return;
        if (notif._timer) { clearTimeout(notif._timer); notif._timer = null; }
        notif.classList.add('exiting');
        setTimeout(() => {
            if (notif.parentNode) notif.remove();
        }, 500);
    }

    // ─── 获取条目 ──────────────────────────────────────────────
    async function getEntry() {
        try {
            const wb = await TavernHelper.getWorldbook(WORLD_BOOK_NAME);
            if (!wb) return null;
            return wb.find(e => e.uid === ENTRY_UID) || null;
        } catch (e) {
            console.error('[真实世界] 获取条目失败:', e);
            return null;
        }
    }

    // ─── 切换状态 ──────────────────────────────────────────────
    async function toggleEntry() {
        try {
            const wb = await TavernHelper.getWorldbook(WORLD_BOOK_NAME);
            if (!wb) { toastr.error('未找到世界书'); return; }

            const entry = wb.find(e => e.uid === ENTRY_UID);
            if (!entry) { toastr.error('未找到 UID: ' + ENTRY_UID); return; }

            entry.enabled = !entry.enabled;
            await TavernHelper.replaceWorldbook(WORLD_BOOK_NAME, wb);

            showGlassNotification(entry.enabled ? 'on' : 'off');

            if (typeof TavernHelper.builtin?.reloadEditor === 'function') {
                TavernHelper.builtin.reloadEditor(WORLD_BOOK_NAME);
            }

            console.log('[真实世界] → UID:' + ENTRY_UID + ' ' + (entry.enabled ? '启用' : '禁用'));
        } catch (e) {
            console.error('[真实世界] 切换失败:', e);
            toastr.error('操作失败');
        }
    }

    // ─── 双击：移除按钮 ──────────────────────────────────────
    function removeButton() {
        try {
            const buttons = getScriptButtons();
            const filtered = buttons.filter(b => b.name !== BUTTON_NAME);
            replaceScriptButtons(filtered);
            toastr.info('真实世界 开关已移除', '', { timeOut: 2000 });
            console.log('[真实世界] 按钮已移除');
        } catch (e) {
            console.error('[真实世界] 移除失败:', e);
        }
    }

    // ─── 事件处理器 ──────────────────────────────────────────────
    function handler() {
        const now = Date.now();

        if (clickTimer !== null) {
            clearTimeout(clickTimer);
            clickTimer = null;
            isDoubleClick = true;
            removeButton();
            return;
        }

        isDoubleClick = false;
        clickTimer = setTimeout(() => {
            if (!isDoubleClick) toggleEntry();
            clickTimer = null;
            isDoubleClick = false;
        }, 400);
    }

    // ─── 初始化 ──────────────────────────────────────────────
    (async function init() {
        try {
            const entry = await getEntry();
            if (!entry) {
                toastr.error('未找到 UID: ' + ENTRY_UID);
                return;
            }

            const buttons = getScriptButtons();
            if (!buttons.some(b => b.name === BUTTON_NAME)) {
                replaceScriptButtons([...buttons, { name: BUTTON_NAME, visible: true }]);
            }

            const evt = getButtonEvent(BUTTON_NAME);
            if (evt) {
                const ret = eventOn(evt, handler);
                window.__realWorldUnsubscribe = ret ? ret.stop : null;
            }

            console.log('[真实世界] 已就绪, UID:' + ENTRY_UID + ' → ' + (entry.enabled ? '启用' : '禁用'));
        } catch (e) {
            console.error('[真实世界] 初始化失败:', e);
        }
    })();

    $(window).on('pagehide', function() {
        if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }
        if (window.__realWorldUnsubscribe) {
            window.__realWorldUnsubscribe();
            window.__realWorldUnsubscribe = null;
        }
        console.log('[真实世界] 已卸载');
    });
})();
