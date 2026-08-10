// ============================================================
// 都市回廊 · 地图系统（完整修复版 - 第 1/3 段）
// 使用方式：放在酒馆助手全局脚本
// ============================================================
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

    const CONFIG = {
        WORLD_BOOK_NAME: '兄妹禁忌',
        THEME: 'octopath',
    };

    // ═══════════════════════ 图片映射表 ═══════════════════════
    const IMAGE_MAP = {
        '公寓': 'https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E5%9C%B0%E5%9B%BE-%E5%85%AC%E5%AF%93.jpg',
        '樱花小路': 'https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E5%9C%B0%E5%9B%BE-%E6%A8%B1%E8%8A%B1%E5%B0%8F%E8%B7%AF.jpg',
        '河边散步道': 'https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E5%9C%B0%E5%9B%BE-%E6%B2%B3%E8%BE%B9%E6%95%A3%E6%AD%A5%E9%81%93.jpg',
        '天台': 'https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E5%9C%B0%E5%9B%BE-%E5%A4%A9%E5%8F%B0.jpg',
        '公园': 'https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E5%9C%B0%E5%9B%BE-%E5%85%AC%E5%9B%AD.jpg',
        '咖啡厅': 'https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E5%9C%B0%E5%9B%BE-%E5%92%96%E5%95%A1%E5%8E%85.jpg',
        '王阿姨家': 'https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E5%9C%B0%E5%9B%BE-%E7%8E%8B%E9%98%BF%E5%A7%A8%E5%AE%B6.jpg',
        '赵雅兰·赵梦琪家': 'https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E5%9C%B0%E5%9B%BE-%E8%B5%B5%E9%9B%85%E5%85%B0%E8%B5%B5%E6%A2%A6%E7%90%AA%E5%AE%B6.jpg',
        '公司': 'https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E5%9C%B0%E5%9B%BE-%E5%85%AC%E5%8F%B8.jpg',
        '张晓曼家': 'https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E5%9C%B0%E5%9B%BE-%E5%BC%A0%E6%99%93%E6%9B%BC%E5%AE%B6.jpg',
        '超市': 'https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E5%9C%B0%E5%9B%BE-%E8%B6%85%E5%B8%82.jpg',
        '电影院': 'https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E5%9C%B0%E5%9B%BE-%E7%94%B5%E5%BD%B1%E9%99%A2.jpg',
        '游乐场': 'https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E5%9C%B0%E5%9B%BE-%E6%B8%B8%E4%B9%90%E5%9C%BA.jpg',
        '海边': 'https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E5%9C%B0%E5%9B%BE-%E6%B5%B7%E8%BE%B9.jpg',
        '姑姑家': 'https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E5%9C%B0%E5%9B%BE-%E5%A7%91%E5%A7%91%E5%AE%B6.jpg',
        '大学校园': 'https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E5%9C%B0%E5%9B%BE-%E5%A4%A7%E5%AD%A6%E6%A0%A1%E5%9B%AD.jpg',
        '苏小薇家': 'https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E5%9C%B0%E5%9B%BE-%E8%8B%8F%E5%B0%8F%E8%96%87%E5%AE%B6.jpg',
        '客厅': 'https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E5%9C%B0%E5%9B%BE-%E5%AE%A2%E5%8E%85.jpg',
        '厨房': 'https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E5%9C%B0%E5%9B%BE-%E5%8E%A8%E6%88%BF.jpg',
        '阳台': 'https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E5%9C%B0%E5%9B%BE-%E9%98%B3%E5%8F%B0.jpg',
        '卧室': 'https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E5%9C%B0%E5%9B%BE-%E5%8D%A7%E5%AE%A4.jpg',
        '书房': 'https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E5%9C%B0%E5%9B%BE-%E4%B9%A6%E6%88%BF.jpg',
        '林夕': 'https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E5%9C%B0%E5%9B%BE-%E6%9E%97%E5%A4%95.jpg',
        '张晓曼': 'https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E5%9C%B0%E5%9B%BE-%E5%BC%A0%E6%99%93%E6%9B%BC.jpg',
        '王阿姨': 'https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E5%9C%B0%E5%9B%BE-%E7%8E%8B%E9%98%BF%E5%A7%A8.jpg',
        '赵雅兰': 'https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E5%9C%B0%E5%9B%BE-%E8%B5%B5%E9%9B%85%E5%85%B0%E8%B5%B5%E6%A2%A6%E7%90%AA.jpg',
        '赵梦琪': 'https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E5%9C%B0%E5%9B%BE-%E8%B5%B5%E9%9B%85%E5%85%B0%E8%B5%B5%E6%A2%A6%E7%90%AA.jpg',
        '苏小薇': 'https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E5%9C%B0%E5%9B%BE-%E8%8B%8F%E5%B0%8F%E8%96%87.jpg',
        '林婉如': 'https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E5%9C%B0%E5%9B%BE-%E6%9E%97%E5%A9%89%E5%A6%82.jpg',
    };

    // ═══════════════════════ 节点数据 ═══════════════════════
    const NODES = [
        { id: '天台', row: 0, col: 2, status: 'unlocked', region: '大学城' },
        { id: '公园', row: 1, col: 1, status: 'unlocked', region: '大学城' },
        { id: '大学校园', row: 1, col: 3, status: 'locked', region: '大学城' },
        { id: '苏小薇家', row: 1, col: 0, status: 'locked', region: '大学城' },
        { id: '河边散步道', row: 2, col: 0, status: 'unlocked', region: '东侧住宅区' },
        { id: '王阿姨家', row: 2, col: 1, status: 'locked', region: '东侧住宅区' },
        { id: '公寓', row: 2, col: 2, status: 'unlocked', region: '东侧住宅区' },
        { id: '赵雅兰·赵梦琪家', row: 2, col: 3, status: 'locked', region: '东侧住宅区' },
        { id: '樱花小路', row: 2, col: 4, status: 'unlocked', region: '东侧住宅区' },
        { id: '咖啡厅', row: 3, col: 0, status: 'unlocked', region: '西侧商业区' },
        { id: '公司', row: 3, col: 2, status: 'locked', region: '西侧商业区' },
        { id: '张晓曼家', row: 3, col: 3, status: 'locked', region: '西侧商业区' },
        { id: '超市', row: 3, col: 4, status: 'locked', region: '西侧商业区' },
        { id: '电影院', row: 4, col: 1, status: 'locked', region: '西侧商业区' },
        { id: '游乐场', row: 4, col: 2, status: 'locked', region: '西侧商业区' },
        { id: '海边', row: 4, col: 3, status: 'locked', region: '西侧商业区' },
        { id: '姑姑家', row: 4, col: 4, status: 'locked', region: '姑姑家区域' },
    ];

    // ═══════════════════════ 地点详情（完整描述） ═══════════════════════
    const LOCATION_DETAILS = {
        '公寓': {
            desc: '城市东侧住宅区的温馨两居室。厨房的台面被用得微微发亮，客厅的沙发因为经常两个人一起窝着看剧而变得特别柔软。这里是你和林夕共同生活了多年的地方，每一个角落都留着生活的痕迹——冰箱上贴着一起买的磁贴，阳台上的绿植见证了无数个夜晚的聊天，书房里堆着她画了一半的设计稿。',
            subScenes: ['客厅', '厨房', '阳台', '卧室', '书房'],
            characters: ['林夕'],
            imageKey: '公寓'
        },
        '樱花小路': {
            desc: '公寓楼下的一条种满樱花树的林荫小路。春天花开的时候，整条路都笼在浅粉色的光影里，花瓣会轻轻落在头发上、肩上，也落在两人并肩走过的石板缝隙里。路不长，从一头走到另一头大概只需要五分钟，但你们常常走得很慢很慢，慢到足够看一片花瓣从枝头飘落到地上。',
            subScenes: [],
            characters: [],
            imageKey: '樱花小路'
        },
        '河边散步道': {
            desc: '出小区往北走大约十分钟，一条沿着河堤延伸的散步道。河堤上种着柳树，春天枝条垂得很低，几乎要拂到水面。夏天傍晚会有凉风吹来，带着河水的湿润气息和远处桂花的隐约香气。秋天落叶会铺满小径，踩上去有细碎的声响。冬天偶尔有薄薄的霜落在栏杆上，她呵出的气变成白雾，融在灰蓝色的空气里。',
            subScenes: [],
            characters: [],
            imageKey: '河边散步道'
        },
        '天台': {
            desc: '公寓楼顶的天台，是一个被风包裹的狭小空间。地面铺着老旧的防水层，边缘围了一圈及腰的栏杆。站在那里能看到远处整座城市的灯火——写字楼的玻璃幕墙反射着零星的光，居民区的窗户一格一格地亮着暖黄色的灯。她喜欢靠在栏杆上看远处，晚风把她的头发吹得有些乱，有时候她会安静地靠在你身边，什么也不说。',
            subScenes: [],
            characters: [],
            imageKey: '天台'
        },
        '公园': {
            desc: '距离公寓不远的社区公园，不算大，但该有的都有——几条石板小径、一片不大的草坪、几棵老榕树和一张常被阳光晒得发烫的长椅。周末的时候你们会来这里散步，有时候买两杯咖啡坐在长椅上喝完再回去。秋天的时候落叶会铺满小径，踩上去的声音很好听。她经常会在某个瞬间停下来，指给你看正在落的叶子，说："你看，又一片。"',
            subScenes: [],
            characters: [],
            imageKey: '公园'
        },
        '咖啡厅': {
            desc: '往西走大约二十分钟，一家藏在街角的小咖啡厅。店面不大，窗边摆着三四张桌子，阳光好的时候会斜斜地照进来，在木桌面上拉出长长的光影。她喜欢坐在靠窗的位置，点一杯拿铁，然后托着下巴看窗外偶尔经过的行人，偶尔转头对你笑一下，说："今天窗外的光好好看。"',
            subScenes: [],
            characters: [],
            imageKey: '咖啡厅'
        },
        '王阿姨家': {
            desc: '公寓楼下，王秀兰阿姨的家。不算宽敞，但收拾得很干净，客厅里摆着绿植和旧照片，空气中常年飘着饭菜的香气。她总说你工作忙，一个人住不容易，所以隔三差五就端着汤或菜上来敲门，用那双布满细纹却温暖有力的手把碗塞到你手里。沙发上的抱枕被洗得有些褪色，但靠着很舒服。',
            subScenes: [],
            characters: ['王阿姨'],
            imageKey: '王阿姨家'
        },
        '赵雅兰·赵梦琪家': {
            desc: '同一栋楼，赵雅兰和女儿赵梦琪的住所。客厅阳台种着几盆花草，茶几上摆着母女两人的合照。空气里常年飘着淡淡的香薰味道，赵雅兰喜欢在客厅里放一些安静的音乐，有时候是爵士，有时候是老歌。赵梦琪的房间门经常关着，偶尔会从里面传出吉他的声响，断断续续的，像在练习同一段旋律。',
            subScenes: [],
            characters: ['赵雅兰', '赵梦琪'],
            imageKey: '赵雅兰·赵梦琪家'
        },
        '公司': {
            desc: '城市西侧的现代办公园区，一栋玻璃幕墙的12层办公楼。你在这里工作，习惯了每天早上九点踏入电梯，习惯了工位上冷色调的灯光和窗外模糊的城市轮廓。茶水间的咖啡机总是发出沉闷的声响，楼下的便利店灯光明亮，夜晚加班的时候会去买一罐咖啡，站在玻璃门前看外面车流的光影。',
            subScenes: [],
            characters: ['张晓曼'],
            imageKey: '公司'
        },
        '张晓曼家': {
            desc: '距离公司不远的单身公寓，装修简约时尚。小客厅有舒适的沙发和电视，阳台上晾着几件刚洗的衣服。厨房干净整洁，偶尔会飘出炒菜的香味。她性格热情，家里总是收拾得井井有条，茶几上会放几本时尚杂志和一盘切好的水果。沙发上的抱枕被揉得有些皱，是有人坐过的痕迹。',
            subScenes: [],
            characters: ['张晓曼'],
            imageKey: '张晓曼家'
        },
        '超市': {
            desc: '公寓附近的普通超市，是日常采购食材的地方。明亮的通道，货架上摆满了熟悉的东西——你常买的那个牌子的挂面、她喜欢的草莓味酸奶、放在冰柜最下层的那款冰淇淋。购物车偶尔会发出吱呀的声响，她会在零食区逗留很久，拿起一包薯片翻来覆去地看，然后放回去，过一会儿又拿起来。',
            subScenes: [],
            characters: [],
            imageKey: '超市'
        },
        '电影院': {
            desc: '距离公寓不远的商业区电影院，开了有些年头了。大厅的地毯是深红色的，踩上去柔软无声。放映厅不算太大，座位有些旧了，但坐下去的时候会发出舒适的声响。黑暗里屏幕的光映在脸上，偶尔她会侧过头看你一眼，借着屏幕的光，能看见她眼睛里细碎的光点。',
            subScenes: [],
            characters: [],
            imageKey: '电影院'
        },
        '游乐场': {
            desc: '城市郊区的游乐园，不算大，但该有的都有。摩天轮缓缓转动，坐在最高处能看到整座城市的轮廓；旋转木马亮着暖黄色的灯，音乐是有些年头的调子。她会在射击游戏摊位前停下脚步，看着那些毛绒玩具出神，然后转过头来用一种不经意的语气说："那个兔子还挺可爱的。"',
            subScenes: [],
            characters: [],
            imageKey: '游乐场'
        },
        '海边': {
            desc: '距离城市约一小时车程的海滩。沙不算细，但踩上去是柔软的。浪声一阵一阵，不急不缓，像是某种不需要被听懂的语言。她脱了鞋赤脚走在沙滩上，会被凉凉的海水漫过脚背，然后在沙滩上留下几行浅浅的脚印。风吹过来的时候，她按住被吹乱的头发，侧过脸看你，嘴角带着一点笑意。',
            subScenes: [],
            characters: [],
            imageKey: '海边'
        },
        '姑姑家': {
            desc: '中档小区的一套三居室，姑姑林婉如的家。客厅里摆放着老式家具和家庭照片，茶几上永远放着一壶热茶和几个洗干净的玻璃杯。她说话的时候习惯微微皱眉，语气温和却带着长辈式的认真。沙发旁边的书架上堆着一些旧书和家族相册，翻开的时候会落出几张泛黄的照片。',
            subScenes: [],
            characters: ['林婉如'],
            imageKey: '姑姑家'
        },
        '大学校园': {
            desc: '城市南侧的一所综合性大学，校园里种了很多树，夏天的时候林荫道会遮出一片阴凉。中心广场上有几棵老榕树，树干粗得需要两个人才能合抱。她常去的图书馆自习室在二楼，窗边位置能看到湖面反射的光。傍晚的时候会有学生背着书包从教学楼出来，夕阳把他们的影子拉得很长很长。',
            subScenes: [],
            characters: ['苏小薇', '赵梦琪'],
            imageKey: '大学校园'
        },
        '苏小薇家': {
            desc: '大学附近的一间出租屋，不算大，但充满青春的气息。墙上贴着几张乐队的海报和朋友们拍的照片，床上堆着几个颜色鲜艳的抱枕，小茶几上散落着零食包装和一本翻到一半的小说。窗户开着一条缝，风吹进来的时候窗帘会轻轻地鼓起来。她会在深夜发来一张窗外的夜景照片，配文只有一行字："还没睡啊？"',
            subScenes: [],
            characters: ['苏小薇'],
            imageKey: '苏小薇家'
        }
    };

    // ═══════════════════════ 子场景详情（完整描述） ═══════════════════════
    const SUB_DETAILS = {
        '公寓|客厅': {
            name: '客厅',
            desc: '客厅不大，但足够容纳两个人的生活。那张深灰色的布艺沙发是整间屋子里最柔软的地方，因为你们经常窝在上面看剧、聊天、或者什么也不做只是靠着。茶几上永远放着一杯没喝完的水和一本翻到一半的书。电视很少开，但偶尔周末的夜晚会一起看一部老电影，她缩在你身边，空调开得低低的，毯子盖到脖子。',
            imageKey: '客厅',
            parent: '公寓'
        },
        '公寓|厨房': {
            name: '厨房',
            desc: '厨房不大，操作台只够两个人并肩站立，但这里却是整间公寓里最有烟火气的地方。锅铲碰撞的声响、切菜时刀刃与砧板接触的节奏、炖汤时咕嘟咕嘟冒出的热气，以及她靠在门边小话唠似的和你聊天的声音，构成了日常的背景音。窗户朝东，早晨的阳光会斜斜地照进来，落在她粉色卷发上。',
            imageKey: '厨房',
            parent: '公寓'
        },
        '公寓|阳台': {
            name: '阳台',
            desc: '阳台是这间公寓里最让人安静的地方。面积不大，只能放下两把藤编椅和几盆绿植，但视野极好——站在这里能看到远处城市的轮廓，夜晚的灯火像碎落的星辰。她喜欢在这里靠着栏杆，晚风把她的头发吹得有些凌乱，偶尔她会安静地靠过来，不需要说话，就只是站着。',
            imageKey: '阳台',
            parent: '公寓'
        },
        '公寓|卧室': {
            name: '卧室',
            desc: '她的房间是整间公寓里最柔软的角落。粉色调的床单被揉得有些皱，床头柜上放着一盏暖黄色的台灯和一本读到一半的书。被子总是没有叠整齐，她习惯把自己卷在里面，只露出一个头顶。窗帘是米白色的，薄薄一层，早晨的光线会透过它洒进来，把整个房间染成柔和的金色。枕头上有淡淡的花香洗发水味道，那是你闭上眼睛就能认出的气味。',
            imageKey: '卧室',
            parent: '公寓'
        },
        '公寓|书房': {
            name: '书房',
            desc: '书房是整间公寓里最安静的地方。书桌上堆着设计稿、彩铅和一台旧笔记本电脑，台灯的角度总是调到刚好照亮她的手稿。书架上的书排列得很随意，一半是她的设计类书籍，一半是你随手放进去的小说。这里很少有对话，只有笔尖划过纸面的沙沙声和偶尔翻页的轻响。',
            imageKey: '书房',
            parent: '公寓'
        }
    };

    // ═══════════════════════ 人物详情（完整描述） ═══════════════════════
    const CHARACTER_DETAILS = {
        '林夕': {
            name: '林夕',
            desc: '林夕，21岁，你的亲生妹妹。粉色卷发，外表温柔可爱，内心敏感细腻。父母早年意外离世后，你独自把她抚养长大。她对你极度依赖，喜欢黏在你身边，话很多，像个小话唠。她会在你加班晚归时坐在客厅等，迷迷糊糊睡着了也不肯回房间。她会记得你所有的喜好——你爱吃的菜、你常穿的衬衫颜色、你喝咖啡的习惯。她的存在像家里一件柔软而重要的事物，你早已习惯了有她在身边的日子。',
            imageKey: '林夕'
        },
        '王阿姨': {
            name: '王阿姨',
            desc: '王秀兰，55岁，住在公寓楼下。离异多年，一个人住，生活简单却充实。她总说自己闲不住，喜欢给自己找事做——养几盆花、腌一坛咸菜、给楼上那对年轻人炖一锅汤。她说话的语气带着这个年纪特有的坦然，不急不缓，像是时间已经教会了她很多东西，也带走了很多东西。她会在门口站很久，把汤碗递到你手里的时候，手指轻轻擦过你的手背。',
            imageKey: '王阿姨'
        },
        '赵雅兰': {
            name: '赵雅兰',
            desc: '赵雅兰，42岁，离异多年，独自抚养女儿赵梦琪。她身上有一种经历了很多事之后沉淀下来的温柔，说话不紧不慢，眼神里带着一种柔软的理解力。她会在阳台上种很多花，有时候自己一个人坐在那里喝一杯酒，看着远处城市的灯光慢慢亮起来。她的沉默并不空旷，而是像一间被整理好的房间——整洁、安静、不慌不忙。',
            imageKey: '赵雅兰'
        },
        '赵梦琪': {
            name: '赵梦琪',
            desc: '赵梦琪，20岁，赵雅兰的女儿。她身上有一种这个年纪特有的沉默——不是冷漠，是还在学习如何表达自己的阶段。她不太主动说话，但如果你坐在她旁边安静地待着，她会慢慢放松下来，有时候会从口袋里掏出一颗糖递给你，不说一句话。她会在深夜发来一条消息，只有几个字，然后很久很久不再说话。',
            imageKey: '赵梦琪'
        },
        '张晓曼': {
            name: '张晓曼',
            desc: '张晓曼，25岁，你的同事。热情、主动、笑起来的时候眼睛会弯成一道月牙。她会在你加班的时候留下来陪你，说反正回去也没什么事；会在下雨天多带一把伞，站在门口等你一起走。她身上有一种接近明朗的亲近感，像是春天的第一缕阳光照进窗户，让人几乎忘了外面还有些凉意。',
            imageKey: '张晓曼'
        },
        '苏小薇': {
            name: '苏小薇',
            desc: '苏小薇，21岁，林夕的大学好友。性格活泼外向，说话的时候喜欢比划手势，笑起来声音很响。她似乎永远有用不完的精力，约你的时候语气总是轻快得像什么事都不算大。但你偶尔会注意到——她在深夜里发来的消息比白天短很多，只有一行字，像是白天的那层热闹已经被夜晚的安静缓慢地融化了。',
            imageKey: '苏小薇'
        },
        '林婉如': {
            name: '林婉如',
            desc: '林婉如，48岁，是你父亲的妹妹，所以是你的姑姑。她身上带着一种传统长辈的认真感——说话的时候习惯微微皱眉，语气温和但带着不容回避的重量。她站在你面前的时候，会让你想起一些旧事、旧照片、旧的家庭聚会上那些不太被记住的瞬间。她的关心像一件有些厚重的外套，穿上会热，但你知道那是为你挡风的。',
            imageKey: '林婉如'
        }
    };

    // ═══════════════════════ 连接关系 ═══════════════════════
    const CONNECTIONS = {
        '天台': ['公园'],
        '公园': ['天台', '河边散步道', '大学校园', '公寓', '苏小薇家'],
        '大学校园': ['公园', '赵雅兰·赵梦琪家', '苏小薇家'],
        '苏小薇家': ['大学校园', '河边散步道', '公园'],
        '河边散步道': ['公园', '苏小薇家', '王阿姨家', '咖啡厅'],
        '王阿姨家': ['河边散步道', '公寓'],
        '公寓': ['王阿姨家', '赵雅兰·赵梦琪家', '樱花小路', '公园', '河边散步道', '公司', '超市'],
        '赵雅兰·赵梦琪家': ['公寓', '大学校园', '樱花小路', '咖啡厅'],
        '樱花小路': ['公寓', '赵雅兰·赵梦琪家', '电影院', '超市'],
        '咖啡厅': ['赵雅兰·赵梦琪家', '公司', '河边散步道'],
        '公司': ['咖啡厅', '公寓', '超市', '海边', '张晓曼家'],
        '张晓曼家': ['公司', '超市'],
        '超市': ['公司', '樱花小路', '电影院', '游乐场', '张晓曼家', '公寓'],
        '电影院': ['超市', '樱花小路'],
        '游乐场': ['超市', '海边'],
        '海边': ['游乐场', '公司', '姑姑家'],
        '姑姑家': ['海边']
    };

    // ═══════════════════════ 解锁规则 ═══════════════════════
    const UNLOCK_RULES = {
        '公寓': 'initial',
        '樱花小路': 'initial',
        '河边散步道': 'initial',
        '天台': 'initial',
        '公园': 'initial',
        '咖啡厅': 'initial',
        '王阿姨家': 'stat_data.事件.王阿姨.门口送汤',
        '赵雅兰·赵梦琪家': 'stat_data.事件.赵雅兰.走廊相遇',
        '公司': 'stat_data.事件.张晓曼.公司初遇',
        '张晓曼家': 'stat_data.事件.张晓曼.深夜加班',
        '大学校园': 'stat_data.事件.赵梦琪.校园偶遇',
        '苏小薇家': 'stat_data.事件.苏小薇.大学初见',
        '游乐场': 'stat_data.事件.赵梦琪.正式约会',
        '姑姑家': 'stat_data.事件.林婉如.登门探望',
        '电影院': '_通用.电影院已解锁',
        '海边': '_通用.海边已解锁',
    };

    // ═══════════════════════ 已探索规则 ═══════════════════════
    const EXPLORED_RULES = {
        '公园': 'stat_data.事件.公园散步 > 0',
        '天台': 'stat_data.事件.天台夜话次数 > 0',
        '咖啡厅': "stat_data.事件.咖啡厅约会 === '已发生'",
        '樱花小路': "stat_data.事件.雨天共伞 === '已发生'",
    };

    // ═══════════════════════ 状态变量 ═══════════════════════
    let currentLocationId = '公寓';
    let selectedNodeId = null;
    let currentTheme = CONFIG.THEME;
    let typingTimer = null;
    let currentPage = 0;
    let isMounted = false;
    let nodeStatusCache = {};
    let l3ReturnTarget = 'detail';

    // ────────── DOM 工具 ──────────
    function getTopDoc() {
        try { if (window.parent && window.parent.document) return window.parent.document; } catch (e) {}
        return document;
    }
    function getTopWindow() {
        try { if (window.parent && window.parent.window) return window.parent.window; } catch (e) {}
        return window;
    }
    // ═══════════════════════ 样式注入 ═══════════════════════
    function injectStyles() {
        const topDoc = getTopDoc();
        if (topDoc.getElementById('map-system-styles')) return;
        const style = topDoc.createElement('style');
        style.id = 'map-system-styles';
        style.textContent = `
            .map-system-panel {
                position: fixed; top: 0; left: 0; width: 100vw; height: 100%; z-index: 99999;
                display: flex; justify-content: center; align-items: center; pointer-events: none;
                transition: opacity 0.3s ease;
            }
            .map-system-panel.closed { opacity: 0; pointer-events: none; }
            .map-system-panel .map-card {
                max-width: 820px; width: 92vw; max-height: 96vh;
                background: var(--map-panel-bg, rgba(20,16,20,0.92));
                border: 1px solid var(--map-panel-border, rgba(200,170,190,0.07));
                border-radius: 28px; padding: 16px 18px 12px;
                box-shadow: 0 24px 80px rgba(0,0,0,0.6);
                transition: all 0.4s cubic-bezier(0.34,1.0,0.64,1);
                font-family: 'Georgia','Times New Roman',serif;
                color: var(--map-text-primary, hsl(270,20%,80%));
                display: flex; flex-direction: column;
                pointer-events: auto;
                overflow: hidden;
                margin: auto;
            }
            .map-system-panel.closed .map-card { opacity: 0; transform: scale(0.95); }
            .map-system-panel.theme-octopath {
                --map-panel-bg: rgba(20,16,14,0.92);
                --map-panel-border: rgba(200,180,160,0.08);
                --map-text-primary: hsl(30,20%,85%);
                --map-text-secondary: hsl(30,15%,35%);
                --map-text-muted: hsl(30,15%,20%);
                --map-node-unlocked: hsl(30,40%,50%);
                --map-node-explored: hsl(30,45%,60%);
                --map-node-current: hsl(0,70%,55%);
                --map-node-current-glow: hsla(0,70%,55%,0.35);
                --map-path-color: hsl(30,25%,30%);
                --map-path-locked: hsl(30,15%,15%);
                --map-bg: rgba(20,16,14,0.92);
                font-family: 'Georgia','Times New Roman',serif;
            }
            .map-system-panel.theme-pokemon {
                --map-panel-bg: rgba(20,30,35,0.92);
                --map-panel-border: rgba(200,220,230,0.08);
                --map-text-primary: hsl(200,15%,90%);
                --map-text-secondary: hsl(200,15%,40%);
                --map-text-muted: hsl(200,15%,25%);
                --map-node-unlocked: hsl(210,50%,55%);
                --map-node-explored: hsl(150,45%,50%);
                --map-node-current: hsl(0,70%,55%);
                --map-node-current-glow: hsla(0,70%,55%,0.35);
                --map-path-color: hsl(200,20%,35%);
                --map-path-locked: hsl(200,15%,20%);
                --map-bg: rgba(20,30,35,0.92);
                font-family: 'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif;
            }
            .map-system-panel.theme-persona {
                --map-panel-bg: rgba(10,8,16,0.92);
                --map-panel-border: rgba(180,150,200,0.08);
                --map-text-primary: hsl(280,20%,90%);
                --map-text-secondary: hsl(280,15%,40%);
                --map-text-muted: hsl(280,15%,20%);
                --map-node-unlocked: hsl(280,60%,55%);
                --map-node-explored: hsl(320,60%,55%);
                --map-node-current: hsl(0,70%,55%);
                --map-node-current-glow: hsla(0,70%,55%,0.40);
                --map-path-color: hsl(280,30%,30%);
                --map-path-locked: hsl(280,15%,18%);
                --map-bg: rgba(10,8,16,0.92);
                font-family: 'Helvetica Neue','Arial',sans-serif;
            }
            .map-system-panel .map-header {
                display: flex; justify-content: space-between; align-items: center;
                margin-bottom: 8px; padding-bottom: 6px;
                border-bottom: 1px solid var(--map-panel-border);
                flex-shrink: 0; flex-wrap: wrap; gap: 4px;
            }
            .map-system-panel .map-header .title { font-size: 0.9rem; font-weight: 700; color: var(--map-text-primary); letter-spacing: 3px; }
            .map-system-panel .map-header .title span { font-weight: 400; color: var(--map-text-secondary); font-size: 0.65rem; letter-spacing: 1px; }
            .map-system-panel .map-header .controls { display: flex; gap: 4px; align-items: center; flex-wrap: wrap; }
            .map-system-panel .map-header .theme-btn {
                padding: 3px 10px; border: 1px solid var(--map-panel-border); border-radius: 14px;
                background: transparent; color: var(--map-text-secondary); font-size: 0.5rem;
                letter-spacing: 1px; cursor: pointer; transition: all 0.3s ease; font-family: inherit;
            }
            .map-system-panel .map-header .theme-btn:hover { background: rgba(200,170,190,0.06); color: var(--map-text-primary); }
            .map-system-panel .map-header .theme-btn.active { border-color: var(--map-node-unlocked); color: var(--map-node-unlocked); background: rgba(200,170,190,0.04); }
            .map-system-panel .map-header .close-btn {
                width: 26px; height: 26px; border: none; background: rgba(200,170,190,0.04); border-radius: 50%;
                color: var(--map-text-secondary); font-size: 13px; cursor: pointer; transition: all 0.3s ease;
                display: flex; align-items: center; justify-content: center;
            }
            .map-system-panel .map-header .close-btn:hover { background: rgba(200,170,190,0.08); color: var(--map-text-primary); }
            .map-system-panel .location-bar {
                display: flex; align-items: center; gap: 8px; padding: 4px 12px 6px;
                margin-bottom: 8px; border-radius: 10px; background: rgba(200,170,190,0.02);
                border: 1px solid var(--map-panel-border); flex-shrink: 0;
            }
            .map-system-panel .location-bar .dot {
                width: 8px; height: 8px; border-radius: 50%; background: var(--map-node-current);
                flex-shrink: 0; box-shadow: 0 0 20px var(--map-node-current-glow);
                animation: mapPulseDot 2.2s ease-in-out infinite;
            }
            @keyframes mapPulseDot { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.5); } }
            .map-system-panel .location-bar .label { font-size: 0.5rem; color: var(--map-text-secondary); letter-spacing: 2px; text-transform: uppercase; }
            .map-system-panel .location-bar .name { font-size: 0.75rem; font-weight: 600; color: var(--map-text-primary); letter-spacing: 1px; margin-left: auto; }
            .map-system-panel .compass {
                display: flex; justify-content: center; align-items: center; gap: 4px;
                padding: 2px 12px; margin-bottom: 6px; border-radius: 16px;
                border: 1px solid var(--map-panel-border); background: rgba(200,170,190,0.01);
                font-size: 0.45rem; color: var(--map-text-secondary); letter-spacing: 1px; flex-wrap: wrap; flex-shrink: 0;
            }
            .map-system-panel .compass .dir { padding: 1px 4px; border-radius: 6px; transition: all 0.3s ease; }
            .map-system-panel .compass .dir.active { color: var(--map-node-current); background: rgba(200,170,190,0.04); }
            .map-system-panel .compass .line { width: 1px; height: 10px; background: var(--map-panel-border); }
            .map-system-panel .page-container { position: relative; overflow: hidden; flex: 1 1 0; min-height: 55vh; height: auto; }
            .map-system-panel .pages-wrapper { display: flex; height: 100%; transition: transform 0.5s cubic-bezier(0.34,1.0,0.64,1); }
            .map-system-panel .map-page { flex: 0 0 100%; overflow-y: auto; padding: 4px 2px 8px; display: flex; flex-direction: column; }
            .map-system-panel .map-page::-webkit-scrollbar { width: 3px; }
            .map-system-panel .map-page::-webkit-scrollbar-thumb { background: rgba(200,170,190,0.06); border-radius: 4px; }
            .map-system-panel .page-title {
                display: flex; align-items: center; gap: 8px; margin-bottom: 8px; padding-bottom: 6px;
                border-bottom: 1px solid var(--map-panel-border); flex-shrink: 0;
            }
            .map-system-panel .page-title .back-btn {
                width: 26px; height: 26px; border: none; background: rgba(200,170,190,0.04); border-radius: 50%;
                color: var(--map-text-secondary); font-size: 15px; cursor: pointer; transition: all 0.3s ease;
                display: flex; align-items: center; justify-content: center;
            }
            .map-system-panel .page-title .back-btn:hover { background: rgba(200,170,190,0.08); color: var(--map-text-primary); }
            .map-system-panel .page-title .page-label { font-size: 0.6rem; color: var(--map-text-secondary); letter-spacing: 2px; }
            .map-system-panel .page-title .page-name { font-size: 0.8rem; font-weight: 600; color: var(--map-text-primary); letter-spacing: 1px; margin-left: auto; }
            .map-system-panel .map-canvas {
                position: relative; width: 100%; padding: 8px 6px 12px; border-radius: 14px;
                background: var(--map-bg); border: 1px solid var(--map-panel-border);
                transition: all 0.4s ease; overflow: hidden;
                display: flex; flex-direction: column; flex: 1; justify-content: center; will-change: transform;
            }
            .map-system-panel .map-canvas.fade-in { animation: mapFadeIn 0.4s cubic-bezier(0.34,1.0,0.64,1) forwards; }
            @keyframes mapFadeIn { 0% { opacity: 0.4; transform: scale(0.97); } 100% { opacity: 1; transform: scale(1); } }
            .map-system-panel .map-canvas.fade-out { animation: mapFadeOut 0.25s ease forwards; }
            @keyframes mapFadeOut { 0% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(0.96); } }
            .map-system-panel .path-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1; }
            .map-system-panel .path-overlay svg { width: 100%; height: 100%; }
            .map-system-panel .node-grid {
                position: relative; z-index: 2; display: grid;
                grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
                grid-template-rows: auto auto auto auto auto;
                gap: 4px 2px; padding: 2px; max-width: 560px; margin: 0 auto; align-content: center;
            }
            .map-system-panel .location-node {
                display: flex; flex-direction: column; align-items: center; gap: 2px;
                cursor: pointer; padding: 6px 2px; border-radius: 12px;
                transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
                position: relative; background: transparent; min-width: 32px; opacity: 0.35;
            }
            .map-system-panel .location-node.lit { opacity: 1; }
            .map-system-panel .location-node.locked { cursor: not-allowed; opacity: 0.45 !important; }
            .map-system-panel .location-node.locked .node-label { color: var(--map-text-muted) !important; }
            .map-system-panel .location-node:hover.lit:not(.locked) { transform: translateY(-2px); }
            .map-system-panel .location-node.selected {
                border: 2px solid var(--map-node-current); background: rgba(200,170,190,0.04);
                box-shadow: 0 0 30px var(--map-node-current-glow);
            }
            .map-system-panel .location-node .node-ring { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.4s ease; position: relative; }
            .map-system-panel .location-node .node-ring .inner { width: 12px; height: 12px; border-radius: 50%; transition: all 0.4s ease; }
            .map-system-panel .location-node.current .node-ring .inner {
                width: 0; height: 0; border-radius: 0; background: transparent !important;
                border-left: 9px solid transparent; border-right: 9px solid transparent;
                border-bottom: 14px solid var(--map-node-current);
                filter: drop-shadow(0 0 20px var(--map-node-current-glow));
            }
            .map-system-panel .location-node.current .node-ring { border: none; background: transparent !important; animation: none; }
            .map-system-panel .location-node.current::before {
                content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
                width: 44px; height: 44px; border-radius: 50%; background: var(--map-node-current-glow);
                opacity: 0.12; animation: mapGlowPulse 2.5s ease-in-out infinite; pointer-events: none; z-index: -1;
            }
            @keyframes mapGlowPulse { 0%,100% { transform: translate(-50%,-50%) scale(1); opacity: 0.12; } 50% { transform: translate(-50%,-50%) scale(1.5); opacity: 0.04; } }
            .map-system-panel .location-node.unlocked .node-ring { border: 1.5px solid var(--map-node-unlocked); background: rgba(200,170,190,0.03); }
            .map-system-panel .location-node.unlocked .inner { background: var(--map-node-unlocked); }
            .map-system-panel .location-node.unlocked .node-label { color: var(--map-text-secondary); }
            .map-system-panel .location-node.explored .node-ring { border: 1.5px solid var(--map-node-explored); background: rgba(200,170,190,0.04); }
            .map-system-panel .location-node.explored .inner { background: var(--map-node-explored); }
            .map-system-panel .location-node.explored .node-label { color: var(--map-text-primary); }
            .map-system-panel .location-node.locked .node-ring { border: 1.5px solid var(--map-text-muted); background: rgba(200,170,190,0.02); }
            .map-system-panel .location-node.locked .inner { background: var(--map-text-muted); }
            .map-system-panel .location-node.current .node-label { color: var(--map-node-current); font-weight: 700; }
            .map-system-panel .location-node .node-label { font-size: 0.5rem; text-align: center; letter-spacing: 0.5px; line-height: 1.2; transition: all 0.3s ease; max-width: 50px; word-break: break-all; color: var(--map-text-secondary); }
            .map-system-panel .location-node .sub-badge { font-size: 0.3rem; color: var(--map-text-muted); background: rgba(200,170,190,0.04); padding: 0 5px; border-radius: 6px; border: 1px solid var(--map-panel-border); }
            .map-system-panel .map-actions { display: flex; justify-content: center; gap: 12px; padding: 8px 0 2px; margin-top: 6px; border-top: 1px solid var(--map-panel-border); flex-wrap: wrap; align-items: center; flex-shrink: 0; }
            .map-system-panel .map-actions .action-btn { padding: 5px 18px; border: 1px solid var(--map-panel-border); border-radius: 18px; background: rgba(200,170,190,0.02); color: var(--map-text-secondary); font-size: 0.6rem; font-family: inherit; letter-spacing: 1px; cursor: pointer; transition: all 0.3s ease; }
            .map-system-panel .map-actions .action-btn:hover { background: rgba(200,170,190,0.04); color: var(--map-text-primary); }
            .map-system-panel .map-actions .action-btn.primary { border-color: var(--map-node-current); color: var(--map-node-current); }
            .map-system-panel .map-actions .action-btn.primary:hover { background: rgba(200,170,190,0.06); box-shadow: 0 0 20px var(--map-node-current-glow); }
            .map-system-panel .map-actions .action-btn:disabled { opacity: 0.25; cursor: not-allowed; }
            .map-system-panel .map-actions .selected-hint { font-size: 0.5rem; color: var(--map-text-muted); letter-spacing: 1px; }
            .map-system-panel .map-actions .selected-hint strong { color: var(--map-node-current); font-weight: 600; }
            .map-system-panel .map-legend { display: flex; justify-content: center; gap: 10px; padding: 6px 0 2px; border-top: 1px solid var(--map-panel-border); margin-top: 4px; flex-wrap: wrap; flex-shrink: 0; }
            .map-system-panel .map-legend .legend-item { display: flex; align-items: center; gap: 4px; font-size: 0.45rem; color: var(--map-text-secondary); letter-spacing: 0.5px; }
            .map-system-panel .map-legend .legend-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
            .legend-dot.locked { background: var(--map-text-muted); border: 1px solid var(--map-text-muted); }
            .legend-dot.unlocked { background: var(--map-node-unlocked); }
            .legend-dot.explored { background: var(--map-node-explored); }
            .legend-dot.current { background: var(--map-node-current); box-shadow: 0 0 12px var(--map-node-current-glow); }
            .map-system-panel .map-footer-hint { display: flex; justify-content: center; padding-top: 4px; border-top: 1px solid var(--map-panel-border); margin-top: 2px; flex-shrink: 0; }
            .map-system-panel .map-footer-hint span { font-size: 0.38rem; color: var(--map-text-muted); letter-spacing: 1px; }
            .map-system-panel .detail-layout { display: flex; flex-direction: row; gap: 16px; align-items: flex-start; padding: 4px 0; }
            .map-system-panel .detail-layout .detail-image { flex: 0 0 40%; max-width: 200px; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.4); border: 1px solid var(--map-panel-border); background: rgba(200,170,190,0.03); aspect-ratio: 3/4; display: flex; align-items: center; justify-content: center; color: var(--map-text-muted); font-size: 2.5rem; }
            .map-system-panel .detail-layout .detail-image img { width: 100%; height: 100%; object-fit: cover; display: block; }
            .map-system-panel .detail-layout .detail-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
            .map-system-panel .detail-layout .detail-info .detail-name { font-size: 1rem; font-weight: 700; color: var(--map-text-primary); letter-spacing: 2px; }
            .map-system-panel .detail-layout .detail-info .detail-status { font-size: 0.55rem; color: var(--map-text-secondary); letter-spacing: 1px; }
            .map-system-panel .detail-layout .detail-info .detail-desc, #mapSubDesc {
                font-size: 0.7rem;
                color: #ffffff !important;
                text-shadow: 0 1px 4px rgba(0,0,0,0.8);
                line-height: 1.7; letter-spacing: 0.3px;
                max-height: 120px; overflow-y: auto; padding-right: 4px;
                contain: layout style;
            }
            .map-system-panel .detail-layout .detail-info .detail-desc::-webkit-scrollbar { width: 2px; }
            .map-system-panel .detail-layout .detail-info .detail-desc::-webkit-scrollbar-thumb { background: rgba(200,170,190,0.06); border-radius: 4px; }
            .map-system-panel .clickable-tag { display: inline-block; padding: 3px 12px; border: 1px solid var(--map-panel-border); border-radius: 14px; font-size: 0.5rem; color: var(--map-text-secondary); background: rgba(200,170,190,0.02); cursor: pointer; transition: all 0.3s ease; font-family: inherit; margin: 2px 4px 2px 0; }
            .map-system-panel .clickable-tag:hover { background: rgba(200,170,190,0.08); color: var(--map-text-primary); border-color: var(--map-node-unlocked); transform: translateY(-1px); }
            .map-system-panel .clickable-tag .tag-icon { margin-right: 4px; opacity: 0.5; }
            .map-system-panel .detail-sub-scenes, .map-system-panel .detail-characters { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
            .map-system-panel .typing-cursor { display: inline-block; width: 2px; height: 0.8em; background: var(--map-node-current); margin-left: 2px; vertical-align: text-bottom; animation: mapBlink 0.8s step-end infinite; }
            @keyframes mapBlink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
            .map-system-panel .detail-actions { display: flex; gap: 8px; margin-top: 6px; flex-wrap: wrap; }
            .map-system-panel .detail-actions .act-btn { padding: 4px 14px; border: 1px solid var(--map-panel-border); border-radius: 16px; background: rgba(200,170,190,0.02); color: var(--map-text-secondary); font-size: 0.55rem; font-family: inherit; cursor: pointer; transition: all 0.3s ease; letter-spacing: 1px; }
            .map-system-panel .detail-actions .act-btn:hover { background: rgba(200,170,190,0.06); color: var(--map-text-primary); }
            .map-system-panel .detail-actions .act-btn.primary { border-color: var(--map-node-current); color: var(--map-node-current); }
            .map-system-panel .detail-actions .act-btn.primary:hover { background: rgba(200,170,190,0.06); box-shadow: 0 0 20px var(--map-node-current-glow); }
            .map-system-panel .detail-sub-label { font-size: 0.5rem; color: var(--map-text-muted); letter-spacing: 1px; padding: 2px 8px; border-radius: 10px; background: rgba(200,170,190,0.04); border: 1px solid var(--map-panel-border); }
            .map-system-toast { position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); background: rgba(20,16,20,0.85); backdrop-filter: blur(16px); padding: 8px 20px; border-radius: 20px; border: 1px solid var(--map-panel-border); color: var(--map-text-secondary); font-size: 0.7rem; letter-spacing: 1px; z-index: 999999; font-family: 'Georgia','Times New Roman',serif; transition: all 0.3s ease; opacity: 0; animation: mapToastIn 0.4s cubic-bezier(0.34,1.0,0.64,1) forwards; }
            @keyframes mapToastIn { 0% { opacity: 0; transform: translateX(-50%) translateY(10px); } 100% { opacity: 1; transform: translateX(-50%) translateY(0); } }
            @media (max-width: 640px) {
                .map-system-panel .map-card { width: 96vw; padding: 10px 10px 8px; border-radius: 20px; max-height: 96vh; }
                .map-system-panel .map-header .title { font-size: 0.7rem; letter-spacing: 2px; }
                .map-system-panel .map-header .title span { font-size: 0.5rem; }
                .map-system-panel .map-header .theme-btn { font-size: 0.4rem; padding: 2px 6px; }
                .map-system-panel .node-grid { grid-template-columns: 1fr 1fr 1fr 1fr 1fr; gap: 2px 1px; }
                .map-system-panel .location-node { padding: 3px 1px; }
                .map-system-panel .location-node .node-ring { width: 22px; height: 22px; }
                .map-system-panel .location-node .node-ring .inner { width: 9px; height: 9px; }
                .map-system-panel .location-node.current .node-ring .inner { border-left-width: 7px; border-right-width: 7px; border-bottom-width: 11px; }
                .map-system-panel .location-node .node-label { font-size: 0.4rem; max-width: 34px; }
                .map-system-panel .location-node .sub-badge { font-size: 0.28rem; }
                .map-system-panel .compass { font-size: 0.4rem; padding: 2px 8px; gap: 2px; }
                .map-system-panel .compass .dir { padding: 1px 3px; }
                .map-system-panel .detail-layout { flex-direction: column; align-items: center; }
                .map-system-panel .detail-layout .detail-image { flex: 0 0 auto; max-width: 120px; width: 100%; aspect-ratio: 3/4; }
                .map-system-panel .map-actions .action-btn { font-size: 0.5rem; padding: 4px 12px; }
                .map-system-panel .map-actions .selected-hint { font-size: 0.45rem; }
                .map-system-panel .map-canvas { overflow-y: auto; }
            }
            @media (max-width: 400px) {
                .map-system-panel .node-grid { grid-template-columns: 1fr 1fr 1fr 1fr; }
                .map-system-panel .location-node .node-ring { width: 18px; height: 18px; }
                .map-system-panel .location-node .node-ring .inner { width: 7px; height: 7px; }
                .map-system-panel .location-node.current .node-ring .inner { border-left-width: 5px; border-right-width: 5px; border-bottom-width: 9px; }
                .map-system-panel .location-node .node-label { font-size: 0.35rem; max-width: 28px; }
                .map-system-panel .detail-layout .detail-image { max-width: 90px; }
            }
            @media (min-width: 1024px) {
                .map-system-panel .location-node .node-ring { width: 34px; height: 34px; }
                .map-system-panel .location-node .node-ring .inner { width: 15px; height: 15px; }
                .map-system-panel .location-node.current .node-ring .inner { border-left-width: 11px; border-right-width: 11px; border-bottom-width: 17px; }
                .map-system-panel .location-node .node-label { font-size: 0.6rem; max-width: 60px; }
                .map-system-panel .node-grid { max-width: 620px; gap: 6px 3px; }
                .map-system-panel .detail-layout .detail-image { max-width: 220px; }
            }
        `;
        topDoc.head.appendChild(style);
    }

    // ═══════════════════════ Toast ═══════════════════════
    function showToast(msg) {
        const topDoc = getTopDoc();
        const existing = topDoc.querySelector('.map-system-toast');
        if (existing) existing.remove();
        const toast = topDoc.createElement('div');
        toast.className = 'map-system-toast';
        toast.textContent = msg;
        topDoc.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(10px)';
            setTimeout(() => { if (toast.parentNode) toast.remove(); }, 400);
        }, 2500);
    }

    // ═══════════════════════ 变量读取 ═══════════════════════
    function getStatData() {
        try {
            const ctx = typeof SillyTavern !== 'undefined' ? SillyTavern.getContext() : null;
            const latestIndex = ctx && ctx.chat ? ctx.chat.length - 1 : null;
            if (latestIndex !== null && latestIndex >= 0) {
                const result = getVariables({ type: 'message', message_id: latestIndex });
                const raw = _.get(result, 'stat_data', {});
                return unflatten(raw);
            }
            return {};
        } catch (e) { return {}; }
    }
    function getVar(path) {
        try { const data = getStatData(); return _.get(data, path); } catch (e) { return undefined; }
    }
    function getChatVar(key) {
        try { const vars = getVariables({ type: 'chat' }); return _.get(vars, key); } catch (e) { return undefined; }
    }
    function setChatVar(key, value) {
        try { const vars = getVariables({ type: 'chat' }); _.set(vars, key, value); replaceVariables(vars, { type: 'chat' }); } catch (e) {}
    }

    // ═══════════════════════ 节点状态 ═══════════════════════
    function getNodeStatus(nodeId) {
        if (nodeStatusCache[nodeId] !== undefined) return nodeStatusCache[nodeId];
        const rule = UNLOCK_RULES[nodeId];
        let status = 'locked';
        if (rule === 'initial' || rule === 'always') status = 'unlocked';
        else if (rule && rule.startsWith('stat_data.')) {
            const val = getVar(rule.replace('stat_data.', ''));
            status = val === true ? 'unlocked' : 'locked';
        } else if (rule && rule.startsWith('_通用.')) {
            const val = getChatVar(rule);
            status = val === true ? 'unlocked' : 'locked';
        }
        if (nodeId === currentLocationId) status = 'current';
        if (status === 'unlocked' || status === 'current') {
            const exploredRule = EXPLORED_RULES[nodeId];
            if (exploredRule) {
                let isExplored = false;
                if (exploredRule.startsWith('stat_data.')) {
                    const val = getVar(exploredRule.replace('stat_data.', ''));
                    if (typeof val === 'number' && val > 0) isExplored = true;
                    else if (typeof val === 'string' && val === '已发生') isExplored = true;
                    else if (val === true) isExplored = true;
                }
                if (isExplored && status !== 'current') status = 'explored';
            }
        }
        nodeStatusCache[nodeId] = status;
        return status;
    }

    function refreshNodeCache() { nodeStatusCache = {}; NODES.forEach(n => getNodeStatus(n.id)); }
    function isNodeInteractable(id) { return getNodeStatus(id) !== 'locked'; }

    function getCurrentLocation() {
        const scene = getVar('世界.当前场景');
        if (scene && NODES.some(n => n.id === scene)) return scene;
        return '公寓';
    }

    function updateMVULocation(locationId) {
        try {
            const allVars = getAllVariables();
            const data = _.get(allVars, 'stat_data', {});
            _.set(data, '世界.当前场景', locationId);
            insertOrAssignVariables({ stat_data: data }, { type: 'chat' });
        } catch (e) {}
    }

    function unlockGeneralLocation(locationId) {
        const key = '_通用.' + locationId + '已解锁';
        setChatVar(key, true);
        refreshNodeCache();
        renderL1(false);
    }

    // ═══════════════════════ 渲染引擎引用 ═══════════════════════
    let panelElement, gridElement, pathSvgElement, canvasElement, locationNameEl, enterBtn, selectedHint, wrapperElement, backBtn;
    let detailNameEl, detailTitleEl, detailStatusEl, detailDescEl, detailImageEl, detailSubScenesEl, detailCharsEl, detailGoBtn, detailCloseBtn;
    let subBackBtn, subLabelEl, subNameEl, subTitleEl, subStatusEl, subDescEl, subImageEl, subGoBtn, subCloseBtn;

    function getNodeById(id) { return NODES.find(n => n.id === id); }
    function getNeighbors(id) { return CONNECTIONS[id] || []; }
    function getImage(key) { return IMAGE_MAP[key] || '📍'; }
    function getDetail(id) { return LOCATION_DETAILS[id] || { desc: '暂无详细描述。', subScenes: [], characters: [], imageKey: null }; }
    function getSubDetail(key) { return SUB_DETAILS[key] || null; }
    function getCharacterDetail(name) { return CHARACTER_DETAILS[name] || null; }
    function goToPage(idx) { currentPage = idx; if (wrapperElement) wrapperElement.style.transform = `translateX(-${idx * 100}%)`; }

    // ═══════════════════════ 渲染 L1 地图 ═══════════════════════
    function renderNodes() {
        if (!gridElement) return;
        const cols = 5;
        const gridMap = {};
        NODES.forEach(n => { gridMap[n.row + '-' + n.col] = n; });
        const neighbors = getNeighbors(currentLocationId);
        const litNodes = new Set([currentLocationId, ...neighbors]);
        let html = '';
        for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
                const key = r + '-' + c;
                const node = gridMap[key];
                if (node) {
                    const status = getNodeStatus(node.id);
                    const isCurrent = (node.id === currentLocationId);
                    const isSelected = (node.id === selectedNodeId);
                    const isLit = litNodes.has(node.id) && isNodeInteractable(node.id);
                    const detail = getDetail(node.id);
                    const hasSubs = detail.subScenes && detail.subScenes.length > 0;
                    const subCount = hasSubs ? detail.subScenes.length : 0;
                    let statusClass = status;
                    if (isCurrent) statusClass = 'current';
                    html += `<div class="location-node ${statusClass} ${isSelected ? 'selected' : ''} ${isLit ? 'lit' : ''}" data-id="${node.id}"><div class="node-ring"><span class="inner"></span></div><span class="node-label">${node.id}</span>${hasSubs ? `<span class="sub-badge">${subCount} 处</span>` : ''}</div>`;
                } else {
                    html += '<div style="visibility:hidden;padding:4px 2px;"></div>';
                }
            }
        }
        gridElement.innerHTML = html;
        gridElement.querySelectorAll('.location-node').forEach(el => {
            const id = el.dataset.id;
            el.addEventListener('click', function(e) {
                if (!id || !isNodeInteractable(id)) { showToast('🔒 "' + id + '" 尚未解锁'); return; }
                gridElement.querySelectorAll('.location-node.selected').forEach(n => n.classList.remove('selected'));
                this.classList.add('selected');
                selectedNodeId = id;
                updateActions();
            });
            el.addEventListener('dblclick', function(e) {
                if (!id || !isNodeInteractable(id)) { showToast('🔒 "' + id + '" 尚未解锁'); return; }
                gridElement.querySelectorAll('.location-node.selected').forEach(n => n.classList.remove('selected'));
                this.classList.add('selected');
                selectedNodeId = id;
                updateActions();
                openDetail(id);
            });
        });
    }

    function renderPaths() {
        if (!pathSvgElement) return;
        const neighbors = getNeighbors(currentLocationId);
        const currentNode = getNodeById(currentLocationId);
        if (!currentNode) return;
        const rows = 5, cols = 5;
        const padX = 60, padY = 50;
        const stepX = (580 - padX * 2) / (cols - 1);
        const stepY = (460 - padY * 2) / (rows - 1);
        function getPos(row, col) { return { x: padX + col * stepX, y: padY + row * stepY }; }
        const cp = getPos(currentNode.row, currentNode.col);
        let svgContent = '';
        neighbors.forEach(nId => {
            const nn = getNodeById(nId);
            if (!nn) return;
            const np = getPos(nn.row, nn.col);
            const isLocked = getNodeStatus(nId) === 'locked';
            const strokeColor = isLocked ? 'var(--map-path-locked)' : 'var(--map-path-color)';
            const opacity = isLocked ? 0.15 : 0.5;
            const dash = isLocked ? '4 4' : 'none';
            svgContent += `<line x1="${cp.x}" y1="${cp.y}" x2="${np.x}" y2="${np.y}" stroke="${strokeColor}" stroke-width="${isLocked ? 1.5 : 2.5}" opacity="${opacity}" stroke-dasharray="${dash}" />`;
        });
        const extraPairs = [['公园', '大学校园'], ['大学校园', '苏小薇家'], ['河边散步道', '咖啡厅'], ['赵雅兰·赵梦琪家', '咖啡厅'], ['公司', '超市'], ['超市', '电影院'], ['游乐场', '海边']];
        extraPairs.forEach(pair => {
            const na = getNodeById(pair[0]), nb = getNodeById(pair[1]);
            if (!na || !nb) return;
            const pa = getPos(na.row, na.col), pb = getPos(nb.row, nb.col);
            const dist = Math.sqrt(Math.pow(pa.x - pb.x, 2) + Math.pow(pa.y - pb.y, 2));
            if (dist > 160) return;
            svgContent += `<line x1="${pa.x}" y1="${pa.y}" x2="${pb.x}" y2="${pb.y}" stroke="var(--map-path-locked)" stroke-width="1" opacity="0.06" stroke-dasharray="2 4" />`;
        });
        svgContent += `<circle cx="${cp.x}" cy="${cp.y}" r="16" fill="none" stroke="var(--map-node-current)" stroke-width="1.5" opacity="0.25"><animate attributeName="r" values="16;26;16" dur="2.5s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.25;0.05;0.25" dur="2.5s" repeatCount="indefinite"/></circle><line x1="${cp.x - 7}" y1="${cp.y}" x2="${cp.x + 7}" y2="${cp.y}" stroke="var(--map-node-current)" stroke-width="1.5" opacity="0.5"/><line x1="${cp.x}" y1="${cp.y - 7}" x2="${cp.x}" y2="${cp.y + 7}" stroke="var(--map-node-current)" stroke-width="1.5" opacity="0.5"/>`;
        pathSvgElement.innerHTML = svgContent;
    }

    function updateActions() {
        if (!enterBtn || !selectedHint) return;
        if (selectedNodeId && isNodeInteractable(selectedNodeId)) {
            enterBtn.disabled = false;
            selectedHint.innerHTML = '📍 已选中 <strong>' + selectedNodeId + '</strong> · 双击或点击「进入此地」查看详情';
        } else {
            enterBtn.disabled = true;
            selectedHint.innerHTML = '💡 单击选中 · 双击进入';
        }
    }

    function renderL1(animate = true) {
        if (!canvasElement) return;
        if (animate) {
            canvasElement.classList.remove('fade-in'); canvasElement.classList.add('fade-out');
            setTimeout(() => {
                refreshNodeCache();
                renderNodes(); renderPaths();
                if (locationNameEl) locationNameEl.textContent = currentLocationId;
                selectedNodeId = null;
                updateActions();
                canvasElement.classList.remove('fade-out'); canvasElement.classList.add('fade-in');
                canvasElement.style.animation = 'none';
                requestAnimationFrame(() => { canvasElement.style.animation = ''; });
            }, 250);
        } else {
            refreshNodeCache();
            renderNodes(); renderPaths();
            if (locationNameEl) locationNameEl.textContent = currentLocationId;
            updateActions();
        }
    }
    // ═══════════════════════ L2: 地点详情 ═══════════════════════
    function openDetail(id) {
        const detail = getDetail(id);
        const status = getNodeStatus(id);
        if (detailNameEl) detailNameEl.textContent = id;
        if (detailTitleEl) detailTitleEl.textContent = id;
        const statusMap = { 'locked': '🔒 未解锁', 'unlocked': '📍 可前往', 'explored': '✅ 已探索', 'current': '📍 当前位置' };
        if (detailStatusEl) detailStatusEl.textContent = (id === currentLocationId) ? '📍 当前位置' : statusMap[status] || '未知';
        if (detailImageEl) {
            const imgUrl = getImage(detail.imageKey);
            if (imgUrl && imgUrl.startsWith('http')) detailImageEl.innerHTML = `<img src="${imgUrl}" alt="${id}">`;
            else { detailImageEl.textContent = imgUrl || '📍'; detailImageEl.style.fontSize = '2.5rem'; detailImageEl.style.display = 'flex'; detailImageEl.style.alignItems = 'center'; detailImageEl.style.justifyContent = 'center'; }
        }
        if (typingTimer) { clearTimeout(typingTimer); typingTimer = null; }
        const fullText = detail.desc || '暂无详细描述。';
        if (detailDescEl) {
            detailDescEl.innerHTML = '';
            let charIndex = 0;
            function typeChar() {
                if (charIndex < fullText.length) {
                    const chunk = fullText.substr(charIndex, 2);
                    const currentHtml = detailDescEl.innerHTML;
                    const base = currentHtml.slice(0, -('<span class="typing-cursor"></span>'.length));
                    detailDescEl.innerHTML = base + chunk + '<span class="typing-cursor"></span>';
                    charIndex += chunk.length;
                    typingTimer = setTimeout(typeChar, 50);
                } else {
                    detailDescEl.innerHTML = detailDescEl.innerHTML.replace('<span class="typing-cursor"></span>', '');
                }
            }
            typeChar();
        }
        if (detailSubScenesEl) {
            detailSubScenesEl.innerHTML = '';
            if (detail.subScenes && detail.subScenes.length > 0) {
                detail.subScenes.forEach(subName => {
                    const tag = document.createElement('button'); tag.className = 'clickable-tag';
                    tag.innerHTML = '<span class="tag-icon">📍</span>' + subName;
                    tag.addEventListener('click', e => { e.stopPropagation(); openSubDetail(id + '|' + subName, 'detail'); });
                    detailSubScenesEl.appendChild(tag);
                });
            } else detailSubScenesEl.innerHTML = '<span style="font-size:0.5rem;color:var(--map-text-muted);">无子场景</span>';
        }
        if (detailCharsEl) {
            detailCharsEl.innerHTML = '';
            if (detail.characters && detail.characters.length > 0) {
                const filtered = (id === '公寓') ? detail.characters : detail.characters.filter(c => c !== '林夕');
                if (filtered.length > 0) {
                    filtered.forEach(c => {
                        const tag = document.createElement('button'); tag.className = 'clickable-tag';
                        tag.innerHTML = '<span class="tag-icon">👤</span>' + c;
                        tag.addEventListener('click', e => { e.stopPropagation(); openCharacterDetail(c, 'detail'); });
                        detailCharsEl.appendChild(tag);
                    });
                } else detailCharsEl.innerHTML = '<span style="font-size:0.5rem;color:var(--map-text-muted);">无关联人物</span>';
            } else detailCharsEl.innerHTML = '<span style="font-size:0.5rem;color:var(--map-text-muted);">无关联人物</span>';
        }
        const isCurrent = (id === currentLocationId);
        if (detailGoBtn) {
            detailGoBtn.textContent = isCurrent ? '📍 当前位置' : '前往此地';
            detailGoBtn.disabled = (status === 'locked' || isCurrent);
            detailGoBtn.onclick = () => {
                if (status !== 'locked' && !isCurrent) {
                    if (UNLOCK_RULES[id] && UNLOCK_RULES[id].startsWith('_通用.')) { if (!getChatVar(UNLOCK_RULES[id])) unlockGeneralLocation(id); }
                    currentLocationId = id; selectedNodeId = null;
                    gridElement?.querySelectorAll('.location-node.selected').forEach(n => n.classList.remove('selected'));
                    updateMVULocation(id); goToPage(0); renderL1(false); showToast('📍 已前往 "' + id + '"');
                }
            };
        }
        if (detailCloseBtn) detailCloseBtn.onclick = () => goToPage(0);
        l3ReturnTarget = 'detail';
        goToPage(1);
    }

    // ═══════════════════════ L3: 子场景详情 ═══════════════════════
    function openSubDetail(key, returnTarget) {
        const data = getSubDetail(key);
        if (!data) { showToast('⚠️ 找不到该子场景数据'); return; }
        l3ReturnTarget = returnTarget || 'detail';
        if (subLabelEl) subLabelEl.textContent = '子场景 ·';
        if (subNameEl) subNameEl.textContent = data.name;
        if (subTitleEl) subTitleEl.textContent = data.name;
        if (subStatusEl) subStatusEl.textContent = '📍 子场景';
        if (subImageEl) {
            const imgUrl = getImage(data.imageKey);
            if (imgUrl && imgUrl.startsWith('http')) subImageEl.innerHTML = `<img src="${imgUrl}" alt="${data.name}">`;
            else { subImageEl.textContent = imgUrl || '🏠'; subImageEl.style.fontSize = '2.5rem'; subImageEl.style.display = 'flex'; subImageEl.style.alignItems = 'center'; subImageEl.style.justifyContent = 'center'; }
        }
        if (typingTimer) { clearTimeout(typingTimer); typingTimer = null; }
        const fullText = data.desc || '暂无详细描述。';
        if (subDescEl) {
            subDescEl.innerHTML = '';
            let charIndex = 0;
            function typeChar() {
                if (charIndex < fullText.length) {
                    const chunk = fullText.substr(charIndex, 2);
                    const currentHtml = subDescEl.innerHTML;
                    const base = currentHtml.slice(0, -('<span class="typing-cursor"></span>'.length));
                    subDescEl.innerHTML = base + chunk + '<span class="typing-cursor"></span>';
                    charIndex += chunk.length;
                    typingTimer = setTimeout(typeChar, 50);
                } else {
                    subDescEl.innerHTML = subDescEl.innerHTML.replace('<span class="typing-cursor"></span>', '');
                }
            }
            typeChar();
        }
        if (subGoBtn) {
            const parentId = data.parent || '';
            const parentStatus = parentId ? getNodeStatus(parentId) : 'unlocked';
            const isCurrentParent = (parentId === currentLocationId);
            subGoBtn.textContent = isCurrentParent ? '📍 当前位置' : '前往此地';
            subGoBtn.disabled = (parentStatus === 'locked' || isCurrentParent);
            subGoBtn.onclick = () => {
                if (parentStatus !== 'locked' && !isCurrentParent && parentId) {
                    if (UNLOCK_RULES[parentId] && UNLOCK_RULES[parentId].startsWith('_通用.')) { if (!getChatVar(UNLOCK_RULES[parentId])) unlockGeneralLocation(parentId); }
                    currentLocationId = parentId; selectedNodeId = null;
                    gridElement?.querySelectorAll('.location-node.selected').forEach(n => n.classList.remove('selected'));
                    updateMVULocation(parentId); goToPage(0); renderL1(false); showToast('📍 已前往 "' + parentId + '"');
                }
            };
        }
        if (subCloseBtn) subCloseBtn.onclick = () => { l3ReturnTarget === 'detail' ? (selectedNodeId ? openDetail(selectedNodeId) : openDetail(currentLocationId)) : goToPage(0); };
        goToPage(2);
    }

    // ═══════════════════════ L3: 人物详情 ═══════════════════════
    function openCharacterDetail(name, returnTarget) {
        const data = getCharacterDetail(name);
        if (!data) { showToast('⚠️ 找不到该人物数据'); return; }
        l3ReturnTarget = returnTarget || 'detail';
        if (subLabelEl) subLabelEl.textContent = '人物 ·';
        if (subNameEl) subNameEl.textContent = data.name;
        if (subTitleEl) subTitleEl.textContent = data.name;
        if (subStatusEl) subStatusEl.textContent = '👤 人物档案';
        if (subImageEl) {
            const imgUrl = getImage(data.imageKey);
            if (imgUrl && imgUrl.startsWith('http')) subImageEl.innerHTML = `<img src="${imgUrl}" alt="${data.name}">`;
            else { subImageEl.textContent = imgUrl || '👤'; subImageEl.style.fontSize = '2.5rem'; subImageEl.style.display = 'flex'; subImageEl.style.alignItems = 'center'; subImageEl.style.justifyContent = 'center'; }
        }
        if (typingTimer) { clearTimeout(typingTimer); typingTimer = null; }
        const fullText = data.desc || '暂无详细描述。';
        if (subDescEl) {
            subDescEl.innerHTML = '';
            let charIndex = 0;
            function typeChar() {
                if (charIndex < fullText.length) {
                    const chunk = fullText.substr(charIndex, 2);
                    const currentHtml = subDescEl.innerHTML;
                    const base = currentHtml.slice(0, -('<span class="typing-cursor"></span>'.length));
                    subDescEl.innerHTML = base + chunk + '<span class="typing-cursor"></span>';
                    charIndex += chunk.length;
                    typingTimer = setTimeout(typeChar, 50);
                } else {
                    subDescEl.innerHTML = subDescEl.innerHTML.replace('<span class="typing-cursor"></span>', '');
                }
            }
            typeChar();
        }
        if (subGoBtn) {
            subGoBtn.textContent = '返回';
            subGoBtn.disabled = false;
            subGoBtn.onclick = () => { l3ReturnTarget === 'detail' ? (selectedNodeId ? openDetail(selectedNodeId) : openDetail(currentLocationId)) : goToPage(0); };
        }
        if (subCloseBtn) subCloseBtn.onclick = () => { l3ReturnTarget === 'detail' ? (selectedNodeId ? openDetail(selectedNodeId) : openDetail(currentLocationId)) : goToPage(0); };
        goToPage(2);
    }

    // ═══════════════════════ 主题切换 ═══════════════════════
    function setTheme(theme) {
        currentTheme = theme;
        if (panelElement) { panelElement.classList.remove('theme-octopath', 'theme-pokemon', 'theme-persona'); panelElement.classList.add('theme-' + theme); }
        document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.theme === theme));
        renderPaths();
    }

    // ═══════════════════════ 构建 UI ═══════════════════════
    function buildUI() {
        const topDoc = getTopDoc();
        const oldPanel = topDoc.getElementById('map-system-panel');
        if (oldPanel) oldPanel.remove();
        injectStyles();

        const panel = topDoc.createElement('div');
        panel.id = 'map-system-panel';
        panel.className = 'map-system-panel theme-' + currentTheme;
        panel.innerHTML = `
            <div class="map-card">
                <div class="map-header">
                    <span class="title">关于我们越界的那件事 <span>· 地图</span></span>
                    <div class="controls">
                        <button class="theme-btn active" data-theme="octopath">HD-2D</button>
                        <button class="theme-btn" data-theme="pokemon">RPG</button>
                        <button class="theme-btn" data-theme="persona">霓虹</button>
                        <button class="close-btn" id="mapCloseBtn">✕</button>
                    </div>
                </div>
                <div class="location-bar">
                    <span class="dot"></span><span class="label">当前位置</span><span class="name" id="mapLocationName">公寓</span>
                </div>
                <div class="compass">
                    <span class="dir active">北</span><span class="line"></span><span class="dir">东北</span><span class="line"></span><span class="dir">东</span><span class="line"></span><span class="dir">东南</span><span class="line"></span><span class="dir">南</span><span class="line"></span><span class="dir">西南</span><span class="line"></span><span class="dir">西</span><span class="line"></span><span class="dir">西北</span>
                </div>
                <div class="page-container">
                    <div class="pages-wrapper" id="mapPagesWrapper">
                        <div class="map-page" id="mapPageL1">
                            <div class="map-canvas fade-in" id="mapCanvas">
                                <div class="path-overlay" id="mapPathOverlay"><svg viewBox="0 0 580 460" preserveAspectRatio="xMidYMid meet" id="mapPathSvg"></svg></div>
                                <div class="node-grid" id="mapNodeGrid"></div>
                            </div>
                            <div class="map-actions">
                                <span class="selected-hint" id="mapSelectedHint">💡 单击选中 · 双击进入</span>
                                <button class="action-btn primary" id="mapEnterBtn" disabled>进入此地</button>
                            </div>
                            <div class="map-legend">
                                <span class="legend-item"><span class="legend-dot locked"></span> 未解锁</span>
                                <span class="legend-item"><span class="legend-dot unlocked"></span> 可前往</span>
                                <span class="legend-item"><span class="legend-dot explored"></span> 已探索</span>
                                <span class="legend-item"><span class="legend-dot current"></span> 当前位置</span>
                            </div>
                            <div class="map-footer-hint"><span>单击选中 · 双击进入详情 · 红色菱形为当前位置 · 周围节点已点亮</span><span>作者 · 三年的水</span></div>
                        </div>
                        <div class="map-page" id="mapPageDetail">
                            <div class="page-title">
                                <button class="back-btn" id="mapBackBtn">‹</button><span class="page-label">地点 ·</span><span class="page-name" id="mapDetailName">公寓</span>
                            </div>
                            <div class="detail-layout" id="mapDetailLayout">
                                <div class="detail-image" id="mapDetailImage">🏠 无图</div>
                                <div class="detail-info">
                                    <div class="detail-name" id="mapDetailTitle">公寓</div>
                                    <div class="detail-status" id="mapDetailStatus">📍 当前位置</div>
                                    <div class="detail-desc" id="mapDetailDesc">加载中...<span class="typing-cursor"></span></div>
                                    <div class="detail-sub-scenes" id="mapDetailSubScenes"></div>
                                    <div class="detail-characters" id="mapDetailChars"></div>
                                    <div class="detail-actions">
                                        <button class="act-btn primary" id="mapDetailGoBtn">前往此地</button>
                                        <button class="act-btn" id="mapDetailCloseBtn">返回地图</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="map-page" id="mapPageSubDetail">
                            <div class="page-title">
                                <button class="back-btn" id="mapSubBackBtn">‹</button><span class="page-label" id="mapSubLabel">子场景 ·</span><span class="page-name" id="mapSubName">客厅</span>
                            </div>
                            <div class="detail-layout">
                                <div class="detail-image" id="mapSubImage">🏠 无图</div>
                                <div class="detail-info">
                                    <div class="detail-name" id="mapSubTitle">客厅</div>
                                    <div class="detail-status" id="mapSubStatus">📍 子场景</div>
                                    <div class="detail-desc" id="mapSubDesc">加载中...<span class="typing-cursor"></span></div>
                                    <div class="detail-actions" style="margin-top:8px;">
                                        <button class="act-btn primary" id="mapSubGoBtn">前往此地</button>
                                        <button class="act-btn" id="mapSubCloseBtn">返回</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        topDoc.body.appendChild(panel);

        function adjustPanelHeight() {
            const topWin = getTopWindow();
            const vv = topWin.visualViewport;
            const h = vv ? vv.height : (topWin.innerHeight || topWin.document.documentElement.clientHeight);
            if (h > 0) {
                panel.style.height = h + 'px';
                const card = panel.querySelector('.map-card');
                if (card) card.style.maxHeight = Math.round(h * 0.9) + 'px';
            }
        }
        adjustPanelHeight();
        const topWin = getTopWindow();
        const resizeHandler = () => adjustPanelHeight();
        topWin.addEventListener('resize', resizeHandler);
        topWin.addEventListener('orientationchange', () => setTimeout(adjustPanelHeight, 300));
        panel._resizeHandler = resizeHandler;

        panelElement = panel;
        gridElement = panel.querySelector('#mapNodeGrid');
        pathSvgElement = panel.querySelector('#mapPathSvg');
        canvasElement = panel.querySelector('#mapCanvas');
        locationNameEl = panel.querySelector('#mapLocationName');
        enterBtn = panel.querySelector('#mapEnterBtn');
        selectedHint = panel.querySelector('#mapSelectedHint');
        wrapperElement = panel.querySelector('#mapPagesWrapper');
        backBtn = panel.querySelector('#mapBackBtn');
        detailNameEl = panel.querySelector('#mapDetailName');
        detailTitleEl = panel.querySelector('#mapDetailTitle');
        detailStatusEl = panel.querySelector('#mapDetailStatus');
        detailDescEl = panel.querySelector('#mapDetailDesc');
        detailImageEl = panel.querySelector('#mapDetailImage');
        detailSubScenesEl = panel.querySelector('#mapDetailSubScenes');
        detailCharsEl = panel.querySelector('#mapDetailChars');
        detailGoBtn = panel.querySelector('#mapDetailGoBtn');
        detailCloseBtn = panel.querySelector('#mapDetailCloseBtn');
        subBackBtn = panel.querySelector('#mapSubBackBtn');
        subLabelEl = panel.querySelector('#mapSubLabel');
        subNameEl = panel.querySelector('#mapSubName');
        subTitleEl = panel.querySelector('#mapSubTitle');
        subStatusEl = panel.querySelector('#mapSubStatus');
        subDescEl = panel.querySelector('#mapSubDesc');
        subImageEl = panel.querySelector('#mapSubImage');
        subGoBtn = panel.querySelector('#mapSubGoBtn');
        subCloseBtn = panel.querySelector('#mapSubCloseBtn');

        panel.querySelectorAll('.theme-btn').forEach(btn => btn.addEventListener('click', () => setTheme(btn.dataset.theme)));
        panel.querySelector('#mapCloseBtn').addEventListener('click', () => {
            if (panelElement) {
                panelElement.classList.add('closed');
                setTimeout(() => { if (panelElement && panelElement.parentNode) panelElement.remove(); }, 400);
            }
            isMounted = false;
        });
        enterBtn.addEventListener('click', () => { if (!enterBtn.disabled && selectedNodeId) openDetail(selectedNodeId); });
        backBtn.addEventListener('click', () => goToPage(0));
        subBackBtn.addEventListener('click', () => {
            if (l3ReturnTarget === 'detail') { goToPage(1); if (selectedNodeId) openDetail(selectedNodeId); else openDetail(currentLocationId); }
            else goToPage(0);
        });

        isMounted = true;
        const scene = getCurrentLocation();
        if (scene) currentLocationId = scene;
        refreshNodeCache();
        renderL1(false);
        console.log('[地图] 已加载，当前位置:', currentLocationId);
    }

    // ═══════════════════════ MVU 监听 + 自动轮询 ═══════════════════════
    let pollingTimer = null;

    function syncLocationFromVars() {
        if (!isMounted) return;
        const newScene = getCurrentLocation();
        const prevLocation = currentLocationId;
        if (newScene && NODES.some(n => n.id === newScene)) {
            currentLocationId = newScene;
        }
        if (newScene !== prevLocation) {
            renderL1(true);
            console.log('[地图] 自动同步位置 →', currentLocationId);
        } else {
            renderL1(false);
        }
    }

    function startPolling() {
        if (pollingTimer) clearInterval(pollingTimer);
        pollingTimer = setInterval(syncLocationFromVars, 1500);
    }

    function initMvuListener() {
        try {
            if (typeof eventOn !== 'undefined' && typeof Mvu !== 'undefined') {
                eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, (newVars) => {
                    if (!isMounted) return;
                    const rawStat = _.get(newVars, 'stat_data', {});
                    const nestedStat = unflatten(rawStat);
                    const newScene = _.get(nestedStat, '世界.当前场景');
                    const prevLocation = currentLocationId;
                    if (newScene && NODES.some(n => n.id === newScene)) {
                        currentLocationId = newScene;
                    }
                    if (newScene !== prevLocation) {
                        renderL1(true);
                    } else {
                        renderL1(false);
                    }
                });
                console.log('[地图] MVU 事件监听已注册');
            }
        } catch (e) { console.warn('[地图] MVU 监听注册失败:', e); }
        startPolling();
    }

    // ═══════════════════════ 公开 API ═══════════════════════
    function openMap() {
        if (isMounted) {
            const scene = getCurrentLocation();
            if (scene) currentLocationId = scene;
            renderL1(false);
            if (panelElement) panelElement.classList.remove('closed');
        } else {
            buildUI();
            initMvuListener();
        }
    }

    function closeMap() {
        if (panelElement) {
            panelElement.classList.add('closed');
            setTimeout(() => { if (panelElement && panelElement.parentNode) panelElement.remove(); }, 400);
        }
        isMounted = false;
        if (pollingTimer) { clearInterval(pollingTimer); pollingTimer = null; }
    }

    function toggleMap() { if (isMounted) closeMap(); else openMap(); }

    const topWin2 = getTopWindow();
    topWin2.__mapSystem = {
        toggle: toggleMap,
        open: openMap,
        close: closeMap,
        setTheme: setTheme,
        getCurrent: () => currentLocationId,
        refresh: () => { if (isMounted) { refreshNodeCache(); renderL1(false); } },
        moveTo: (id) => {
            const node = getNodeById(id);
            if (node && isNodeInteractable(id)) {
                if (UNLOCK_RULES[id] && UNLOCK_RULES[id].startsWith('_通用.')) { if (!getChatVar(UNLOCK_RULES[id])) unlockGeneralLocation(id); }
                currentLocationId = id; selectedNodeId = null;
                gridElement?.querySelectorAll('.location-node.selected').forEach(n => n.classList.remove('selected'));
                updateMVULocation(id); renderL1(false); showToast('📍 已前往 "' + id + '"');
            } else { showToast('🔒 "' + id + '" 尚未解锁'); }
        }
    };

    // ═══════════════════════ 按钮注册 ═══════════════════════
    try {
        const buttons = getScriptButtons();
        const btnName = '🗺️ 都市地图';
        if (!buttons.some(b => b.name === btnName)) {
            replaceScriptButtons([...buttons, { name: btnName, visible: true }]);
        }
        const evt = getButtonEvent(btnName);
        if (evt) eventOn(evt, toggleMap);
    } catch (e) {
        console.warn('[地图] 按钮注册失败:', e);
        topWin2.__mapSystemOpen = openMap;
    }

    $(window).on('pagehide', () => { if (isMounted) closeMap(); });
    console.log('[地图] 系统已初始化（扁平兼容+防闪烁），点击 "🗺️ 都市地图" 按钮打开');
})();
