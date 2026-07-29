// ============================================================
// 加载器（副本版本）：玩家可自己切换国内/国际
// 加载：ZXZ12.js（真实世界）、ZXZ13.js（强上执行器）
// ============================================================

// 从浏览器缓存读取用户的选择，默认国内
let USE_CN = localStorage.getItem('ZXZ_USE_CN');
if (USE_CN === null) {
    USE_CN = 'true';
}
USE_CN = USE_CN === 'true';

// 根据选择决定基础URL
const BASE_URL = USE_CN 
    ? 'https://testingcf.jsdelivr.net/gh/sanshui19516/-@main/' 
    : 'https://cdn.jsdelivr.net/gh/sanshui19516/-@main/';

// 动态加载功能脚本（副本版本）
import(BASE_URL + 'ZXZ3.js');   // 事件触发器（共用）
import(BASE_URL + 'ZXZ4.js');   // 小手机（共用）
import(BASE_URL + 'ZXZ5.js');   // 地图（共用）
import(BASE_URL + 'ZXZ12.js');  // 真实世界开关（副本版本）
import(BASE_URL + 'ZXZ13.js');  // 强上执行器（副本版本）

console.log('[加载器-副本] 当前使用 ' + (USE_CN ? '国内' : '国际') + ' 版本');

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
// 切换按钮
// ============================================================

const buttons = getScriptButtons();
if (!buttons.some(b => b.name === '🌐 切换节点')) {
    replaceScriptButtons([...buttons, { name: '🌐 切换节点', visible: true }]);
}

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
