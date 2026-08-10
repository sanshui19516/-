// ============================================================
// 加载器：玩家可自己切换国内/国际
// ============================================================

// 从浏览器缓存读取用户的选择，默认国内
let USE_CN = localStorage.getItem('ZXZ_USE_CN');
if (USE_CN === null) {
    USE_CN = 'true'; // 默认国内
}
USE_CN = USE_CN === 'true';

// 根据选择决定基础URL
const BASE_URL = USE_CN 
    ? 'https://testingcf.jsdelivr.net/gh/sanshui19516/-@main/' 
    : 'https://cdn.jsdelivr.net/gh/sanshui19516/-@main/';

// 动态加载五个功能脚本
import(BASE_URL + 'ZXX3.js');  // 事件触发器
import(BASE_URL + 'ZXZ8.js');  // 真实世界开关
import(BASE_URL + 'ZXX1.js');  // 小手机
import(BASE_URL + 'ZXX2.js');  // 地图
import(BASE_URL + 'ZXZ7.js');  // 强上执行器

console.log('[加载器] 当前使用 ' + (USE_CN ? '国内' : '国际') + ' 版本，已加载 5 个功能脚本');

// ============================================================
// 检测是否刚切换过节点（用于刷新后显示提示）
// ============================================================
const justSwitched = localStorage.getItem('ZXZ_JUST_SWITCHED');
if (justSwitched) {
    const label = justSwitched === 'cn' ? '🇨🇳 国内节点' : '🌍 国际节点';
    toastr.success('✅ 已切换到 ' + label + '，页面已刷新', '', { timeOut: 3000 });
    localStorage.removeItem('ZXZ_JUST_SWITCHED');
}

// ============================================================
// 给玩家用的切换按钮（会在酒馆输入框上方显示）
// ============================================================

// 注册按钮
const buttons = getScriptButtons();
if (!buttons.some(b => b.name === '🌐 切换节点')) {
    replaceScriptButtons([...buttons, { name: '🌐 切换节点', visible: true }]);
}

// 监听按钮点击
eventOn(getButtonEvent('🌐 切换节点'), () => {
    const current = localStorage.getItem('ZXZ_USE_CN') !== 'false';
    const next = !current;
    const label = next ? 'cn' : 'global';
    
    localStorage.setItem('ZXZ_USE_CN', next ? 'true' : 'false');
    localStorage.setItem('ZXZ_JUST_SWITCHED', label);
    
    toastr.info('已切换到 ' + (next ? '🇨🇳 国内节点' : '🌍 国际节点') + '，正在刷新...', '', { timeOut: 1500 });
    
    setTimeout(() => {
        if (window.top) {
            window.top.location.reload();
        } else {
            window.location.reload();
        }
    }, 1500);
});
