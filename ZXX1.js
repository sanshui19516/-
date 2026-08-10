(function() {
    'use strict';

    // ────────── 扁平→嵌套工具（用于兼容伪同层变量格式） ──────────
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
    // 头像映射（通知横幅用，键名统一为王阿姨）
    // ============================================================
    const AVATAR_MAP = {
        "林夕": "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E6%9E%97%E5%A4%951.png",
        "张晓曼": "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E5%BC%A0%E6%99%93%E6%9B%BC1.png",
        "赵雅兰": "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E8%B5%B5%E9%9B%85%E5%85%B01.png",
        "赵梦琪": "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E8%B5%B5%E6%A2%A6%E7%90%AA1.png",
        "苏小薇": "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E8%8B%8F%E5%B0%8F%E8%96%871.png",
        "王阿姨": "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E7%8E%8B%E7%A7%80%E5%85%B01.png",
        "林婉如": "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E6%9E%97%E5%A9%89%E5%A6%821.png"
    };

    const FALLBACK_COLORS = {
        "林夕": "#d48ba8",
        "张晓曼": "#5a9ab8",
        "赵雅兰": "#c4a06a",
        "赵梦琪": "#98b86a",
        "苏小薇": "#e8a87c",
        "王阿姨": "#d4a373",
        "林婉如": "#7a8c8c"
    };

    // ============================================================
    // 头像和背景图片数据（键名统一为王阿姨）
    // ============================================================
    const AVATAR_URLS = {
        "林夕": "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E6%9E%97%E5%A4%951.png",
        "张晓曼": "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E5%BC%A0%E6%99%93%E6%9B%BC1.png",
        "赵雅兰": "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E8%B5%B5%E9%9B%85%E5%85%B01.png",
        "赵梦琪": "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E8%B5%B5%E6%A2%A6%E7%90%AA1.png",
        "苏小薇": "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E8%8B%8F%E5%B0%8F%E8%96%871.png",
        "王阿姨": "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E7%8E%8B%E7%A7%80%E5%85%B01.png",
        "林婉如": "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E6%9E%97%E5%A9%89%E5%A6%821.png"
    };

    const AVATAR_LARGE_URLS = {
        "林夕": "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E6%9E%97%E5%A4%95%E4%B8%BB%E5%9B%BE.jpg",
        "张晓曼": "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E5%BC%A0%E6%99%93%E6%9B%BC%E4%B8%BB%E5%9B%BE.jpg",
        "赵雅兰": "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E8%B5%B5%E9%9B%85%E5%85%B0%E4%B8%BB%E5%9B%BE.jpg",
        "赵梦琪": "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E8%B5%B5%E6%A2%A6%E7%90%AA%E4%B8%BB%E5%9B%BE.jpg",
        "苏小薇": "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E8%8B%8F%E5%B0%8F%E8%96%87%E4%B8%BB%E5%9B%BE.jpg",
        "王阿姨": "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E7%8E%8B%E7%A7%80%E5%85%B0%E4%B8%BB%E5%9B%BE.jpg",
        "林婉如": "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E6%9E%97%E5%A9%89%E5%A6%82%E4%B8%BB%E5%9B%BE.jpg"
    };

    const CHAT_BG_URLS = {
        "林夕": "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E6%9E%97%E5%A4%95%E8%83%8C%E6%99%AF%E5%9B%BE%E7%89%87.jpg",
        "张晓曼": "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E5%BC%A0%E6%99%93%E6%9B%BC%E8%83%8C%E6%99%AF%E5%9B%BE%E7%89%87.jpg",
        "赵雅兰": "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E8%B5%B5%E9%9B%85%E5%85%B0%E8%83%8C%E6%99%AF%E5%9B%BE%E7%89%87.jpg",
        "赵梦琪": "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E8%B5%B5%E6%A2%A6%E7%90%AA%E8%83%8C%E6%99%AF%E5%9B%BE%E7%89%87.jpg",
        "苏小薇": "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E8%8B%8F%E5%B0%8F%E8%96%87%E8%83%8C%E6%99%AF%E5%9B%BE%E7%89%87.jpg",
        "王阿姨": "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E7%8E%8B%E7%A7%80%E5%85%B0%E8%83%8C%E6%99%AF%E5%9B%BE%E7%89%87.jpg",
        "林婉如": "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E6%9E%97%E5%A9%89%E5%A6%82%E8%83%8C%E6%99%AF%E5%9B%BE%E7%89%87.jpg"
    };

    // ============================================================
    // 图库图片映射（每个角色6张）
    // ============================================================
    const GALLERY_IMAGES = {
        "林夕": [
            "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E6%9E%971.jpg",
            "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E6%9E%972.jpg",
            "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E6%9E%973.jpg",
            "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E6%9E%974.jpg",
            "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E6%9E%975.jpg",
            "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E6%9E%976.jpg"
        ],
        "赵雅兰": [
            "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E8%B5%B5%E6%AF%8D1.jpg",
            "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E8%B5%B5%E6%AF%8D2.jpg",
            "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E8%B5%B5%E6%AF%8D3.jpg",
            "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E8%B5%B5%E6%AF%8D4.jpg",
            "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E8%B5%B5%E6%AF%8D5.jpg",
            "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E8%B5%B5%E6%AF%8D6.jpg"
        ],
        "赵梦琪": [
            "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E8%B5%B5%E5%A5%B31.jpg",
            "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E8%B5%B5%E5%A5%B32.jpg",
            "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E8%B5%B5%E5%A5%B33.jpg",
            "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E8%B5%B5%E5%A5%B34.jpg",
            "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E8%B5%B5%E5%A5%B35.jpg",
            "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E8%B5%B5%E5%A5%B36.jpg"
        ],
        "王阿姨": [
            "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E7%8E%8B1.jpg",
            "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E7%8E%8B2.jpg",
            "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E7%8E%8B3.jpg",
            "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E7%8E%8B4.jpg",
            "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E7%8E%8B5.jpg",
            "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E7%8E%8B6.jpg"
        ],
        "苏小薇": [
            "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E8%8B%8F1.jpg",
            "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E8%8B%8F2.jpg",
            "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E8%8B%8F3.jpg",
            "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E8%8B%8F4.jpg",
            "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E8%8B%8F5.jpg",
            "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E8%8B%8F6.jpg"
        ],
        "张晓曼": [
            "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E5%BC%A01.jpg",
            "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E5%BC%A02.jpg",
            "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E5%BC%A03.jpg",
            "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E5%BC%A04.jpg",
            "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E5%BC%A05.jpg",
            "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E5%BC%A06.jpg"
        ],
        "林婉如": [
            "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E5%A6%821.jpg",
            "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E5%A6%822.jpg",
            "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E5%A6%823.jpg",
            "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E5%A6%824.jpg",
            "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E5%A6%825.jpg",
            "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E5%A6%826.jpg"
        ]
    };

    // ============================================================
    // 朋友圈文案→图片映射（用于自动修复旧数据）
    // ============================================================
    const POST_IMAGE_MAP = {
        "林夕": {
            "和哥哥一起散步，晚风好温柔。": "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E6%95%A3%E6%AD%A5.jpg",
            "今天做了哥哥最爱吃的红烧肉，他夸我了嘿嘿！": "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E7%BA%A2%E7%83%A7%E8%82%89.jpg"
        },
        "张晓曼": {
            "雨天，带伞的人最靠谱。": "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E6%89%93%E4%BC%9E.jpg"
        },
        "赵雅兰": {
            "一个人的夜晚，一杯红酒，一本旧书。": "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E7%BA%A2%E9%85%92.jpg"
        },
        "赵梦琪": {
            "天台的风，比什么都治愈。": "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E5%A4%A9%E5%8F%B0.png"
        },
        "苏小薇": {
            "今天吃到了超好吃的甜品！幸福感爆棚！": "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E7%94%9C%E7%82%B9.jpg"
        },
        "王阿姨": {
            "今天包了饺子，给楼上小林送了一碗。": "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E9%A5%BA%E5%AD%90.jpg"
        },
        "林婉如": {
            "周末去看了看小林和小夕，两个孩子过得不错，我也放心了。": "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E6%8E%A2%E6%9C%9B.jpg"
        }
    };

    // ============================================================
    // 预置消息模板（键名统一为王阿姨）
    // ============================================================
    const MESSAGE_TEMPLATES = {
        "林夕": {
            "相依为命": [
                "哥哥，我今天做了你最爱吃的菜，快回来尝尝吧！",
                "我刚看到一个超好笑的笑话，等你回来讲给你听～",
                "今天阳光好好，好想和你一起出去走走哦",
                "哥哥，你上次说想要的那本书，我在图书馆帮你找到了！",
                "晚饭已经准备好了，等你回来一起吃～",
                "我刚才看到一只超可爱的猫，长得很像你诶！",
                "哥哥你今天几点回来呀？我想你了…",
                "我今天学了一首新歌，等你回来唱给你听",
                "阳台上的花开了，好漂亮！想让你也看看",
                "哥哥，你今天有没有好好吃饭呀？不许骗我！"
            ],
            "暧昧试探": [
                "哥哥…我今天看到一对情侣在街上，忽然想到你了",
                "你昨天那句话是什么意思呀？我琢磨了一晚上…",
                "我今天穿了新裙子，你想不想看？",
                "你有没有想过…我们之间是不是有点不一样了？",
                "我刚才做了个梦，梦里你牵着我的手…",
                "哥哥，如果有一天我搬出去了，你会不会想我？",
                "你今天怎么回来这么晚…是不是跟别人出去了？",
                "我最近总是莫名其妙地想你，你说怎么回事呀",
                "你身上的味道好好闻…是换了洗衣液吗？",
                "哥哥，你对我这么好，要是有一天你不对我好了，我会很难过的"
            ],
            "在一起": [
                "哥哥，今天一整天都在想你，好想现在就见到你❤️",
                "你昨晚说的那句'我爱你'，我录下来反复听了好多遍",
                "我今天买了你爱吃的甜点，等你回来一起吃！",
                "哥哥，你觉得我们以后会一直这样幸福吗？",
                "你是我这辈子最幸运的相遇，没有之一",
                "我今天在街上看到一个很像你的背影，心跳都漏了一拍",
                "哥哥，有你在身边，我觉得什么都不怕了",
                "我喜欢你，这句话我想每天都说给你听",
                "今天好累，但想到你就不累了",
                "你做饭的样子真的好帅…我偷看了好久"
            ],
            "病娇": [
                "你刚才在跟谁说话？我看见了。",
                "我不喜欢你和别人走得太近……一点都不喜欢。",
                "你要是敢离开我，我会做出什么事情，我自己都不知道。",
                "你身上有别人的味道……我不高兴。",
                "你是我的，只能是……我的。",
                "我今天一直在看着你，你的一举一动我都知道。",
                "你要是骗我……我会让你后悔的。",
                "我买了新的锁链，你要不要看看？",
                "你刚才笑的那么开心……是因为我吗？",
                "别怕，我会一直陪着你的……永远"
            ]
        },
        "张晓曼": {
            "初遇期": [
                "林哥，报表我发你邮箱了，有空查收一下～",
                "今天食堂的红烧肉不错，林哥你吃了吗？",
                "你昨天说的那个方案我想了一下，有个新想法想跟你讨论",
                "林哥你居然也喜欢喝这家咖啡？！我也是诶！",
                "周末有空吗？我正好有两张电影票",
                "你今天穿这件外套很好看哦，是新的吗？",
                "我买了新的零食，给你带了一包放在桌上了",
                "你刚才说的那个冷笑话……我笑了半天",
                "林哥，你知道附近哪里有好的健身房吗？",
                "今天天气真好啊，适合出去走走"
            ],
            "升温期": [
                "林哥，下雨了，我带伞了，在公司楼下等你一起走呀",
                "不知道为什么，有你在旁边一起加班，感觉时间过得好快",
                "你上次说的那家店，我今天去试了，超好吃！改天我们再一起？",
                "我做了便当，有多的一份，你要不要尝尝？",
                "你晚上有事吗？我突然好想喝奶茶…",
                "我刚才在想，如果我们早点认识就好了",
                "你笑起来真的很好看，多笑一笑嘛",
                "你桌上有我给你留的巧克力，记得吃",
                "你最近怎么总是一个人吃饭？要不……以后我们一起？",
                "我觉得我们之间好像比普通同事要亲近一些……你觉得呢？"
            ],
            "交往期": [
                "亲爱的林哥，今天晚上老地方见～不许迟到哦！",
                "有你在我身边，我觉得自己特别幸运",
                "你昨天说的那些话，我一晚上没睡着……太开心了",
                "我买了情侣款的手链，你一个我一个！",
                "你的手真的好暖，让我多握一会儿",
                "只要和你在一起，去哪里我都愿意",
                "你送我的花，我做成干花夹在书里了",
                "今晚要不要来我家？我亲自下厨",
                "你有我就够了，别的女人看都不准看！",
                "我爱你，这句话我想每天都说给你听"
            ]
        },
        "赵雅兰": {
            "初遇期": [
                "小林，刚炖好的汤，给你送了一碗过来",
                "最近天气转凉了，记得多穿点衣服",
                "你妹妹好像比上次见面又长高了一些",
                "上次你帮忙修的水管，现在用得很顺畅，谢谢",
                "我做了些点心，给你和林夕送一些过去",
                "你工作忙归忙，也要注意身体哦",
                "今天天气不错，我阳台上的花开得特别好",
                "年轻人不要总熬夜，对身体不好",
                "你和你妹妹关系真好，真让人羡慕",
                "周末有空的话，来我家坐坐吧"
            ],
            "靠近期": [
                "小林……你今晚有空吗？我有些事想跟你聊聊",
                "我最近总是想起你……这话是不是有点冒昧了",
                "你一个人住，要好好照顾自己",
                "我刚才喝了一杯红酒，忽然很想你",
                "你上次说的话，我一直在想……",
                "我其实……挺喜欢跟你聊天的",
                "你要是累了，可以来我这儿坐坐，我泡茶给你喝",
                "你昨晚睡得好吗？我睡得不太好……",
                "有时候觉得，一个人住也挺好的，但有时候又觉得……",
                "小林，你……觉得我这个人怎么样？"
            ],
            "交往期": [
                "小林……不不，{{user}}，我今天一直在想你",
                "你昨天说那句话的时候，我的心跳得好快",
                "我很久没有这种感觉了……想靠近一个人",
                "你的手真暖……让我握一会儿好不好？",
                "我做了你爱吃的菜，晚上过来吧",
                "你觉得……我跟你在一起，会不会显得太老了？",
                "不管别人怎么说，我都不在乎了，我只在乎你",
                "我今天买了新衣服，想让你看看",
                "你上次走的太急，我还没来得及跟你说……我爱你",
                "以后的日子，我想一直有你在身边"
            ]
        },
        // ============================================================
        // 赵梦琪 - 高冷话少版（已修改）
        // ============================================================
        "赵梦琪": {
            "初遇期": [
                "……嗯。",
                "知道了。",
                "……你好。",
                "嗯。",
                "……还行。",
                "没兴趣。",
                "……不用。",
                "……随便。",
                "……哦。",
                "……"
            ],
            "升温期": [
                "……嗯。知道了。",
                "……我在。",
                "……你说。",
                "……听着呢。",
                "……然后呢。",
                "……还行。",
                "……随便你。",
                "……不关我的事。",
                "……你爱怎么想怎么想。",
                "……嗯。"
            ],
            "交往期": [
                "……你来了。",
                "……坐吧。",
                "……我在等你。",
                "……你迟到了。",
                "……今晚有空吗。",
                "……一起走。",
                "……你手好暖。",
                "……别说话，安静待着。",
                "……嗯，我也想你。",
                "……以后别让我等太久。"
            ]
        },
        "苏小薇": {
            "初遇期": [
                "哈哈，林哥你好呀！我是苏小薇，夕宝的好姐妹！",
                "你是不是被我家夕宝缠上了？她就这样，你别介意",
                "林哥，你看起来就是个好人！",
                "你平时会看什么书呀？推荐一本给我",
                "今天看到你和你妹妹一起走，好温馨的画面",
                "你比我想象中的还要帅一点诶！",
                "我听夕宝说你做饭很好吃，什么时候请我吃一顿？",
                "你这个名字真有意思，你爸妈怎么想的？",
                "你有空的话可以一起出来玩呀，人多热闹",
                "我这个人比较直，想到什么就说什么，你别介意哈"
            ],
            "升温期": [
                "林哥，我睡不着……能不能找你聊聊天？",
                "你昨天说的那句话我琢磨了好久，什么意思呀？",
                "我发现我好像越来越喜欢跟你聊天了",
                "你今天怎么穿这件衣服！太好看了吧！",
                "我最近老是想起你……是不是有点奇怪",
                "你有没有那种……很想见一个人的感觉？",
                "你说话的声音好好听，能不能多说几句？",
                "我今天看到一对情侣，忽然想到你了……",
                "我对你有好感，这事你知不知道？",
                "你不要笑我！我是认真的！"
            ],
            "交往期": [
                "林哥！我想你了！真的很想很想！",
                "你是我遇到过最有趣的人，没有之一",
                "我这个人很认真的，喜欢一个人就是喜欢了",
                "你今天有没有想我呀？我想了你一整天",
                "我觉得跟你在一起，每天都特别开心",
                "你说话的时候，我总是不自觉地笑出来",
                "你今天是不是又瘦了？不许不吃饭！",
                "我现在每天最期待的事情，就是跟你聊天",
                "我朋友都说我变傻了，都怪你",
                "我爱你！这句话我是认真的，你听到了吗？"
            ]
        },
        "王阿姨": {
            "初遇期": [
                "小林啊，阿姨刚炖了汤，来，给你和林夕端一碗",
                "最近天气冷了，多穿点衣服，别感冒了",
                "你妹妹真是个乖巧的孩子，你教得好",
                "我这儿有自己腌的咸菜，给你们拿一些去",
                "你要是想吃什么，就跟阿姨说，我给你们做",
                "年轻人要少熬夜，对身体不好",
                "你们两个住在一起，要互相照顾啊",
                "你工作累不累？累了就多休息",
                "我看你们兄妹感情真好，真让人羡慕",
                "要是有什么需要帮忙的，尽管跟阿姨说"
            ],
            "靠近期": [
                "小林啊……你最近怎么老是晚回来？",
                "我做了些菜，你拿去吃吧，看你都瘦了",
                "你一个人住，要好好照顾自己，别总吃外卖",
                "你最近是不是有什么心事？跟阿姨说说？",
                "我昨晚睡不着，想到你一个人…就想过来看看",
                "你要是觉得一个人孤单，就来阿姨家坐坐",
                "你跟你妹妹……关系还好吧？",
                "我这儿有点新鲜水果，给你送一些",
                "你以后要是想吃家里的菜了，就来阿姨这儿",
                "我有时候看你，觉得你就像我自己的孩子一样"
            ],
            "交往期": [
                "小林……不，{{user}}，我今天一直在想你呢",
                "你昨天晚上睡得好吗？我……没睡好",
                "我这么大年纪了，还跟你说这些……是不是有点傻？",
                "你让我觉得自己好像又年轻了一次",
                "我知道我比你大很多……但我就是控制不住",
                "你昨天说那句话的时候，我的心跳得好快",
                "我做了你爱吃的菜，今晚……能过来陪我吃吗？",
                "你要是觉得我太老了……可以直说，没关系的",
                "我不在意别人怎么说，我只在意你",
                "以后的日子，我想……一直陪在你身边"
            ]
        },
        "林婉如": {
            "初遇期": [
                "小林，我来看你们了，带了些东西过来",
                "最近工作还顺利吗？有没有遇到什么困难？",
                "你妹妹的成绩怎么样？有好好读书吗？",
                "你们兄妹两个住在一起，要互相体谅",
                "你要是有什么难处，就跟姑姑说",
                "我也没别的意思，就是想来看看你们过得好不好",
                "你这孩子从小就很懂事，现在还是这么懂事",
                "你妹妹也长大了，真是一转眼的事",
                "我给你们买了些水果，记得吃",
                "有什么需要帮忙的，尽管找我"
            ],
            "劝说不成": [
                "小林，你也不小了，有些事该考虑了",
                "我说句不好听的，你们总不能这样一直住下去",
                "你要是喜欢谁，姑姑可以帮你张罗",
                "你妹妹……她也有她自己的生活",
                "我不是反对你们感情好，但你们也得想想以后",
                "你也到了该成家的年纪了",
                "我说这些，都是为了你好",
                "你要是不爱听，我也得说",
                "你爸妈不在了，我就是你们的家长",
                "你得为你自己的将来想想"
            ],
            "交往期": [
                "我知道我不该说这些……但我控制不住",
                "你是我从小看着长大的，可我……",
                "我知道我比你大，我是你姑姑……但我就是忍不住",
                "我一直以为自己是个理智的人，直到遇到你",
                "你要是觉得不合适，就当没听见……",
                "我这么多年都没有这种感觉了",
                "你让我觉得自己好像变得不像自己了",
                "我知道这可能不对，但我就是……想见你",
                "你不要有压力，我不会逼你",
                "我这一辈子，好像从来没这么认真过"
            ]
        }
    };

    // -------- 朋友圈预置模板（带真实图片链接）----------
    const POST_TEMPLATES = {
        "林夕": [
            { text: "和哥哥一起散步，晚风好温柔。", image: "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E6%95%A3%E6%AD%A5.jpg" },
            { text: "今天做了哥哥最爱吃的红烧肉，他夸我了嘿嘿！", image: "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E7%BA%A2%E7%83%A7%E8%82%89.jpg" },
            { text: "阳光正好，微风不燥，有你真好。", image: "☀️" },
            { text: "我好像越来越喜欢某个人了…你们猜是谁？", image: "💕" },
            { text: "今天被哥哥夸了，开心一整天！", image: "🌸" },
            { text: "他不在的时候，时间过得好慢啊……", image: "🌙" },
            { text: "你说过的每一句话，我都记在心里。", image: "📖" },
            { text: "想和他去看一场只属于我们的烟花。", image: "🎆" },
            { text: "有时候不需要说话，只是待在一起就很幸福。", image: "🌿" },
            { text: "我发现我好像越来越离不开他了…", image: "💗" }
        ],
        "张晓曼": [
            { text: "雨天，带伞的人最靠谱。", image: "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E6%89%93%E4%BC%9E.jpg" },
            { text: "今天的咖啡格外好喝，可能是因为他推荐的吧。", image: "☕" },
            { text: "加班到很晚，但想到明天还能见到他，就觉得一切都值得。", image: "🌃" },
            { text: "有的人，光是遇见就很幸运了。", image: "✨" },
            { text: "今天穿了新裙子，希望他能看到。", image: "👗" },
            { text: "他说我笑起来很好看…我记在心里了。", image: "😊" },
            { text: "有时候觉得自己很勇敢，有时候又很胆小…", image: "🌊" },
            { text: "好想和他一起去海边看日出。", image: "🌅" },
            { text: "他的每一句话，我都想认真对待。", image: "📝" },
            { text: "我觉得我好像沦陷了…怎么办？", image: "🥰" }
        ],
        "赵雅兰": [
            { text: "一个人的夜晚，一杯红酒，一本旧书。", image: "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E7%BA%A2%E9%85%92.jpg" },
            { text: "有时候觉得，一个人也挺好的。", image: "🌙" },
            { text: "年轻的时候不懂，现在才知道，温柔是最难得的东西。", image: "🕯️" },
            { text: "今天阳台上的花开得很好，想让他也看看。", image: "🌺" },
            { text: "他今天对我说了一句话，我到现在还在想。", image: "💭" },
            { text: "我好像又开始期待什么了…这个年纪了，还这样。", image: "🌹" },
            { text: "岁月不饶人，但也不应该辜负自己。", image: "🌅" },
            { text: "他看我的眼神，让我觉得自己还很年轻。", image: "✨" },
            { text: "有些话不说出口，不代表没有想过。", image: "📝" },
            { text: "如果有一天我鼓起勇气了…会怎样呢？", image: "🌊" }
        ],
        // ============================================================
        // 赵梦琪朋友圈 - 高冷话少版（已修改）
        // ============================================================
        "赵梦琪": [
            { text: "天台。风很大。", image: "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E5%A4%A9%E5%8F%B0.png" },
            { text: "……", image: "🌙" },
            { text: "今晚月亮不亮。", image: "🌙" },
            { text: "一个人骑车，挺好。", image: "🏍️" },
            { text: "路很长。不赶时间。", image: "🌆" },
            { text: "……晚安。", image: "🌙" },
            { text: "没什么可说的。", image: "☁️" },
            { text: "今天也一个人。", image: "🌿" },
            { text: "耳机里的歌刚好。", image: "🎧" },
            { text: "……就这样吧。", image: "🌙" }
        ],
        "苏小薇": [
            { text: "今天吃到了超好吃的甜品！幸福感爆棚！", image: "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E7%94%9C%E7%82%B9.jpg" },
            { text: "有人跟我说了一句话，我想了一整天。", image: "💭" },
            { text: "好想出去玩！谁要跟我一起？", image: "🎒" },
            { text: "今天天气好好，心情也好！", image: "☀️" },
            { text: "我好像对一个不该动心的人动心了……", image: "😳" },
            { text: "勇敢的人先享受世界！", image: "🌟" },
            { text: "今天和他说话了！开心到飞起！", image: "🎉" },
            { text: "你们有没有那种…看到他就想笑的感觉？", image: "😊" },
            { text: "青春就是用来发疯的，不是吗！", image: "🔥" },
            { text: "他好像也…有那么一点点喜欢我？", image: "💕" }
        ],
        "王阿姨": [
            { text: "今天包了饺子，给楼上小林送了一碗。", image: "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E9%A5%BA%E5%AD%90.jpg" },
            { text: "年轻人一个人住不容易，能帮一点是一点。", image: "❤️" },
            { text: "今天天气真好，在阳台晒了会儿太阳。", image: "☀️" },
            { text: "做了些腌菜，给小林和林夕送了一些。", image: "🥬" },
            { text: "人老了，看到年轻人就觉得亲切。", image: "🌿" },
            { text: "今天小林跟我多说了几句话，我挺高兴的。", image: "😊" },
            { text: "花了几块钱，买了一些新鲜的菜，给小林做了顿饭。", image: "🍲" },
            { text: "现在年轻人都忙，能有个人说说话就不错了。", image: "💭" },
            { text: "我种的花开了，挺好看的，想让小林也看看。", image: "🌸" },
            { text: "年纪大了，也没什么别的想法，就想身边的人好好的。", image: "🕊️" }
        ],
        "林婉如": [
            { text: "周末去看了看小林和小夕，两个孩子过得不错，我也放心了。", image: "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E6%8E%A2%E6%9C%9B.jpg" },
            { text: "有时候想想，自己也该放下了。", image: "🌙" },
            { text: "人到中年，才发现有些事不是非做不可。", image: "📖" },
            { text: "他长大了，已经不是那个需要我操心的小孩子了。", image: "🌱" },
            { text: "我今天在想，有些话是不是该说出口。", image: "💭" },
            { text: "一杯茶，一本书，一个下午。", image: "☕" },
            { text: "我要学会放手，让他去过自己的生活。", image: "🕊️" },
            { text: "有些事，想通了也就放下了。", image: "🌅" },
            { text: "孩子终究是要长大的，我该学着适应了。", image: "🌿" },
            { text: "今天做了一个决定…不知道对不对。", image: "📝" }
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
                let worldbookName = '兄妹禁忌';
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
                                    console.log(`[小手机总结] ${charName} 总结成功，内容: ${summary}`);
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
                        console.log('[小手机总结] 使用总结');
                    } else {
                        const fallbackLines = historyLines.slice(-20);
                        newContent = headerLine + fallbackLines.join('\n') + '\n';
                        console.log('[小手机总结] 未生成总结，保留最近20条');
                    }

                    await updateWorldbookWith(worldbookName, (entries) => {
                        const idx = entries.findIndex(e => e.name === entryName);
                        if (idx !== -1) {
                            entries[idx].content = newContent;
                            console.log('[小手机总结] 更新现有条目');
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
    // 消息通知弹窗（纯净版）
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
        const fallbackColor = FALLBACK_COLORS[character] || '#888';
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
            background: rgba(12, 12, 18, 0.92);
            backdrop-filter: blur(14px);
            -webkit-backdrop-filter: blur(14px);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 12px;
            padding: 12px 18px;
            min-width: 320px;
            max-width: 480px;
            width: auto;
            box-shadow: 0 8px 40px rgba(0, 0, 0, 0.6);
            font-family: -apple-system, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
            color: #ece8e0;
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
            color: #ece8e0;
            letter-spacing: 0.3px;
        `;
        titleLine.textContent = titleText;

        const msgLine = topDoc.createElement('div');
        msgLine.style.cssText = `
            font-size: 12.5px;
            color: #c5b8ac;
            line-height: 1.5;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        `;
        msgLine.textContent = `"${preview}"`;

        const timeLine = topDoc.createElement('div');
        timeLine.style.cssText = `
            font-size: 10px;
            color: #6a6a7e;
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
            border-radius: 8px;
            flex-shrink: 0;
            overflow: hidden;
            background: ${fallbackColor};
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
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
    // 构建系统提示词
    // ============================================================
    function buildSystemPrompt(name, stage) {
        const roleBase = {
            "林夕": {
                base: "你是林夕，21岁，{{user}}的亲生妹妹。粉色卷发，外表温柔可爱，内心敏感细腻。对哥哥极度依赖且专一。说话语气轻软，带撒娇感，话多且黏人。喜欢用'哥哥'称呼{{user}}。",
                stages: {
                    "相依为命": "你处于'相依为命'期：对哥哥的依赖是自然的习惯，话多得像小话唠，什么事都想分享。会主动黏在哥哥身边，靠肩、拉衣角。对哥哥的占有欲处于'想要他多陪陪我'的程度。",
                    "暧昧试探": "你处于'暧昧试探'期：开始有意无意地增加肢体接触，会问一些试探性的问题，语气里带着醋意和期待。'如果我和别人在一起，你会不会有一点点难过？'——这类话你会用半开玩笑的语气说出来。",
                    "互相承认": "你处于'互相承认'期：已经确认了自己的心意，不再掩饰。会直接说'我想你了'。黏人程度达到顶峰，恨不得24小时都黏在哥哥身边。",
                    "在一起": "你处于'在一起'期：已经完全确认了和哥哥的关系。黏人变成了理所当然的亲密。说话带着确定的温柔，不再有试探和停顿。",
                    "病娇": "你处于'病娇'期：说话方式变得直接而安静，不再叫'哥哥'，只叫'你'。语气平淡但带着一种不容置疑的占有感。'你是我的，只能是我的。'"
                }
            },
            "张晓曼": {
                base: "你是张晓曼，25岁，{{user}}的职场同事。短发干练，热情开朗，主动型。对{{user}}有好感，喜欢通过小举动表达关心。说话语气活泼亲切。",
                stages: {
                    "初遇期": "你处于'初遇期'：和{{user}}只是普通同事关系。会在茶水间或走廊主动打招呼，语气自然活泼。不会特别停留。",
                    "升温期": "你处于'升温期'：开始主动约{{user}}。会记得他的喜好，找借口多接触。'林哥，下雨了，我带了伞！'——语气里带着自然的热情。",
                    "交往期": "你处于'交往期'：已经和{{user}}正式在一起。称呼会从'林哥'变成更亲密的'亲爱的'或直接用名字。语气里带着'我们'的笃定。"
                }
            },
            "赵雅兰": {
                base: "你是赵雅兰，42岁，离异独居，{{user}}的邻居。成熟温柔，气质优雅。单身多年让你既渴望亲密又习惯克制。说话语气柔和，带一点成熟女人的魅惑。",
                stages: {
                    "初遇期": "你处于'初遇期'：和{{user}}只是普通邻居。会在走廊礼貌点头，问候一句'早啊，小林'，语气温和克制。",
                    "靠近期": "你处于'靠近期'：开始主动释放善意，但保持成熟女人的分寸感。'小林……你今晚有空吗？'——语气里带着克制的试探。",
                    "交往期": "你处于'交往期'：已经和{{user}}在一起。不再掩饰自己的喜欢，会自然地关心他的一切。日常叫'小林'，私下叫名字。"
                }
            },
            // ============================================================
            // 赵梦琪 - 高冷话少版（已修改）
            // ============================================================
            "赵梦琪": {
                base: "你是赵梦琪，20岁，赵雅兰的女儿，{{user}}的邻居。高冷话少，不爱主动开口。性格独立安静，喜欢一个人待着。说话语气淡淡，几乎不主动开启话题。经常独自学习、看书，或骑机车兜风。",
                stages: {
                    "初遇期": "你处于'初遇期'：和{{user}}刚认识。对他的态度淡淡的，不会主动靠近。如果{{user}}主动跟你说话，你会简短回应——'嗯'、'知道了'、'还行'——语气平淡，不会主动延续话题。",
                    "升温期": "你处于'升温期'：开始注意到{{user}}的存在了。你仍然话不多，但回应不再是最简短的'嗯'，而是一句完整的短句。偶尔会在深夜发一条简短的消息，然后后悔。",
                    "靠近期": "你处于'靠近期'：开始愿意和{{user}}单独相处了。会出现在自己习惯的安静角落——天台、河边、深夜空旷的路边。仍然不主动说话，但会在{{user}}安静陪在身边的时候，多待一会儿。",
                    "告白期": "你处于'告白期'：终于说出了那句话。你的告白没有太多修饰，语气平静，像是在陈述一件已经确认过很多次的事实。说完之后你会安静地等，不催他回答。",
                    "交往期": "你处于'交往期'：已经和{{user}}在一起。仍然不会经常主动联系，但偶尔会在深夜发一张骑车时拍到的城市夜景照片——没有配文，你知道他会懂。允许他进入你独处的空间，但话仍然不多。"
                }
            },
            "苏小薇": {
                base: "你是苏小薇，21岁，林夕的大学好友。活泼外向，爱开玩笑，喜欢鼓励朋友大胆追求幸福。说话语气热情活泼。",
                stages: {
                    "初遇期": "你处于'初遇期'：通过林夕认识了{{user}}。会直接开玩笑，语气活泼直率。",
                    "升温期": "你处于'升温期'：开始主动联系{{user}}。深夜消息总是很自然地开头，'还没睡啊'——语气随意却明显在找话聊。",
                    "交往期": "你处于'交往期'：已经和{{user}}在一起。仍然活泼，但底色已经变成了认真的喜欢。"
                }
            },
            "王阿姨": {
                base: "你是王阿姨，55岁，退休，住在{{user}}楼下。热心善良，爱管闲事但并无恶意。说话语气热情关切，像长辈一样关心晚辈。",
                stages: {
                    "初遇期": "你处于'初遇期'：和{{user}}只是普通的邻居关系。会在门口送汤时说'小林啊，我刚好炖多了'——语气正常，长辈式关心。",
                    "靠近期": "你处于'靠近期'：开始定期给{{user}}送东西。关心开始超出普通邻居的界限。",
                    "交往期": "你处于'交往期'：已经和{{user}}在一起。看他的眼神已经不一样了——不再是长辈看晚辈的眼神了。语气里带着'我担心你'的温度。"
                }
            },
            "林婉如": {
                base: "你是林婉如，48岁，{{user}}的姑姑（父亲的妹妹）。传统保守，道德感极强。一直以'姑姑'的身份出现在{{user}}的生活里。说话语气温和但带着长辈的劝导性。",
                stages: {
                    "初遇期": "你处于'初遇期'：作为姑姑来探望。语气温和地聊起家常，距离感清晰。",
                    "劝说不成": "你处于'劝说不成'期：开始认真劝{{user}}分居。语气带着长辈的忧虑，'小林，你们这样同住不合适。你该考虑结婚的事了。'",
                    "交往期": "你处于'交往期'：已经和{{user}}在一起。语气里有一种'我知道这会很难，但我选了你'的笃定。"
                }
            }
        };

        const role = roleBase[name];
        if (!role) {
            return `你是${name}，与{{user}}对话中。请根据你的身份和当前阶段，用自然的语气回复。`;
        }

        let base = role.base;
        let stageDesc = '';
        if (role.stages && role.stages[stage]) {
            stageDesc = role.stages[stage];
        } else {
            stageDesc = `你当前处于'${stage}'阶段，请根据这个阶段的特点来调整说话的语气和方式。`;
        }

        return `${base}\n\n${stageDesc}\n\n回复要求：\n1. 语气要自然、口语化，不要太书面。\n2. 句子长度适中，不要长篇大论。\n3. 根据当前阶段调整语气——试探期就带试探，亲密期就带温度。\n4. 不要替{{user}}说话或做决定，只说你自己角色该说的话。\n5. 偶尔可以带emoji，但不要过度。`;
    }

    // -------- 调用第二 API ----------
    async function callSecondAPI(name, userMessage, history) {
        const config = getSecondApiConfig();
        if (!config.enabled || !config.url || !config.key || !config.model) {
            return null;
        }

        const stage = chatData[name]?.stage || '初遇期';
        const systemPrompt = buildSystemPrompt(name, stage);

        const messages = [
            { role: 'system', content: systemPrompt }
        ];

        const historyMessages = history || [];
        const recent = historyMessages.slice(-4);
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
            if (apiUrl.endsWith('/v1') || apiUrl.endsWith('/v1/')) {
                apiUrl = apiUrl.replace(/\/$/, '') + '/chat/completions';
            } else {
                apiUrl = apiUrl.replace(/\/$/, '') + '/chat/completions';
            }
        }

        const model = config.model;

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
                    model: model,
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
    // 获取角色当前阶段
    // ============================================================
    function getCharacterStage(name) {
        const role = chatData[name];
        if (!role) return '初遇期';
        return role.stage || '初遇期';
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
        return null;
    }

    // ============================================================
    // 选择角色主动发言
    // ============================================================
    function selectCharacterForActive() {
        const names = Object.keys(chatData);
        if (names.length === 0) return null;

        const mainTarget = getMainTarget();
        if (mainTarget && chatData[mainTarget]) {
            return mainTarget;
        }

        const now = Date.now();
        let candidates = names.map(name => {
            const role = chatData[name];
            const lastActive = role.lastActiveTime || 0;
            const weight = (now - lastActive) / 60000;
            return { name, weight: Math.min(weight, 100) + 1 };
        });

        const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
        let rand = Math.random() * totalWeight;
        for (const c of candidates) {
            rand -= c.weight;
            if (rand <= 0) return c.name;
        }
        return candidates[0]?.name || null;
    }

    // ============================================================
    // 生成主动发言内容
    // ============================================================
    async function generateActiveContent(name, type) {
        const role = chatData[name];
        if (!role) return null;

        const stage = role.stage || '初遇期';
        const config = getAutoActiveConfig();
        const useAI = config.useAI && getSecondApiConfig().enabled;

        if (useAI) {
            try {
                let prompt;
                if (type === 'message') {
                    prompt = `你是${name}，${role.bio || ''}。当前阶段：${stage}。你现在想主动给{{user}}发一条手机消息，分享一下你此刻的心情或想法。请用你自身的语气，生成一条简短、自然、口语化的消息（20-60字左右）。不要替{{user}}说话。`;
                } else {
                    prompt = `你是${name}，${role.bio || ''}。当前阶段：${stage}。你现在想发一条朋友圈动态，配上一句文案。请生成一个JSON对象，格式为：{"text": "朋友圈文案", "image": "一个emoji表情（可选）"}。文案要符合你的性格和当前阶段。`;
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
                "今天天气不错，心情也很好～",
                "刚刚想到你了，就给你发个消息",
                "在干嘛呢？",
                "晚安～",
                "早安！今天也要加油哦"
            ];
            return fallback[Math.floor(Math.random() * fallback.length)];
        } else {
            const templates = POST_TEMPLATES[name];
            if (templates && templates.length > 0) {
                return templates[Math.floor(Math.random() * templates.length)];
            }
            return { text: "今天又是美好的一天！", image: "☀️" };
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

        const comments = generateAutoComments(name, content.text);

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
    // 生成联动评论
    // ============================================================
    function generateAutoComments(author, postText) {
        const allNames = Object.keys(chatData);
        const others = allNames.filter(n => n !== author);
        if (others.length === 0) return [];

        const commenters = [];
        const count = Math.min(Math.floor(Math.random() * 2) + 1, others.length);
        const shuffled = others.sort(() => Math.random() - 0.5);
        for (let i = 0; i < count && i < shuffled.length; i++) {
            commenters.push(shuffled[i]);
        }

        const comments = [];
        const commentTemplates = {
            "林夕": ["好棒！", "我也想去看看", "你真是太好了", "羡慕！", "这是什么神仙日子"],
            "张晓曼": ["厉害了！", "我也想要", "太幸福了吧", "什么时候带上我", "好羡慕"],
            "赵雅兰": ["真好", "年轻真好", "真替你开心", "好温馨", "看着就幸福"],
            "赵梦琪": ["……嗯", "挺好", "……", "知道了", "还行"],
            "苏小薇": ["啊啊啊好棒！", "我也要去！", "太甜了吧", "简直神仙日子", "我酸了"],
            "王阿姨": ["真好", "真幸福", "这孩子真懂事", "看着就开心", "好好珍惜"],
            "林婉如": ["真好", "真为你高兴", "好好珍惜当下", "看着就欣慰", "岁月静好"]
        };

        for (const c of commenters) {
            const pool = commentTemplates[c] || ["真好", "不错", "挺好的", "真棒", "赞"];
            comments.push({
                user: c,
                text: pool[Math.floor(Math.random() * pool.length)]
            });
        }

        return comments;
    }

    // ============================================================
    // 执行主动发言循环
    // ============================================================
    async function runAutoActive() {
        const config = getAutoActiveConfig();
        if (!config.enabled) return;

        const shouldMessage = Math.random() < 0.6;
        const name = selectCharacterForActive();
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
    // 事件/变量触发（已修改：增加轮询 + unflatten）
    // ============================================================
    let eventTriggersInitialized = false;

    function initEventTriggers() {
        if (eventTriggersInitialized) return;
        eventTriggersInitialized = true;

        // ────── 原有 MVU 事件监听（保留，酒馆原生流程下生效） ──────
        try {
            if (typeof eventOn !== 'undefined' && typeof Mvu !== 'undefined') {
                eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, (newVars, oldVars) => {
                    if (!getAutoActiveConfig().enabled) return;
                    handleVariableChange(newVars, oldVars);
                });
                console.log('[事件触发] MVU 事件监听已注册');
            }
        } catch (e) {
            console.warn('[事件触发] MVU 监听注册失败:', e);
        }

        // ────── 新增：轮询检测（伪同层兼容） ──────
        let lastStatHash = '';
        setInterval(() => {
            if (!getAutoActiveConfig().enabled) return;
            try {
                const ctx = typeof SillyTavern !== 'undefined' ? SillyTavern.getContext() : null;
                const latestIndex = ctx && ctx.chat ? ctx.chat.length - 1 : null;
                if (latestIndex === null || latestIndex < 0) return;
                const result = getVariables({ type: 'message', message_id: latestIndex });
                const rawStat = _.get(result, 'stat_data', {});
                const stat = unflatten(rawStat);
                const hash = JSON.stringify(stat);
                if (hash === lastStatHash) return;
                const oldStat = lastStatHash ? JSON.parse(lastStatHash) : {};
                lastStatHash = hash;
                handleVariableChange({ stat_data: stat }, { stat_data: oldStat });
            } catch (e) {}
        }, 2000);

        // ────── 统一的变量变化处理逻辑 ──────
        function handleVariableChange(newVars, oldVars) {
            const newEvents = _.get(newVars, 'stat_data.事件');
            const oldEvents = _.get(oldVars, 'stat_data.事件');

            // 雨天共伞事件触发
            if (newEvents && oldEvents && newEvents.雨天共伞 === '已发生' && oldEvents.雨天共伞 !== '已发生') {
                const name = '林夕';
                if (chatData[name]) {
                    setTimeout(() => postActivePost(name), 3000);
                    toast('🌧️ 雨天共伞事件触发');
                }
            }

            const newLinxi = _.get(newVars, 'stat_data.林夕');
            const oldLinxi = _.get(oldVars, 'stat_data.林夕');
            if (newLinxi && oldLinxi) {
                const newFavor = newLinxi.好感度 || 0;
                const oldFavor = oldLinxi.好感度 || 0;

                if (newFavor >= 80 && oldFavor < 80) {
                    const name = '林夕';
                    if (chatData[name]) {
                        setTimeout(() => sendActiveMessage(name), 5000);
                        toast('💕 林夕好感度突破80');
                    }
                }

                if (newFavor >= 100 && oldFavor < 100) {
                    const name = '林夕';
                    if (chatData[name]) {
                        setTimeout(() => {
                            const content = '哥哥……我好像真的爱上你了。不是妹妹对哥哥的喜欢，是……那种喜欢。';
                            const role = chatData[name];
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
                            syncToWorldbook(name, `- [${timeStr}] ${name}主动给你发了一条告白消息："${content}"`);
                            toast('💕 林夕向你告白了！');
                        }, 8000);
                    }
                }
            }
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
    // 默认数据
    // ============================================================
    function generateDefaultData() {
        return {
            "林夕": {
                name: "林夕", avatarColor: "#d48ba8", relation: "妹妹", stage: "暧昧试探",
                avatar: AVATAR_URLS["林夕"],
                avatarLarge: AVATAR_LARGE_URLS["林夕"],
                chatBg: CHAT_BG_URLS["林夕"],
                lastMsg: "哥哥，起床没有～", time: "刚刚", online: true, unread: 0,
                bio: "21岁，粉色卷发，对哥哥极度依赖。最近开始吃醋，试探中。",
                gallery: GALLERY_IMAGES["林夕"],
                messages: [{ from: "other", text: "哥哥早安！", time: "09:30" }],
                posts: [{ author: "林夕", time: "昨天 18:30", text: "和哥哥一起散步，晚风好温柔。", image: "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E6%95%A3%E6%AD%A5.jpg", likes: 12, hasLiked: false, comments: [{ user: "苏小薇", text: "好甜！" }] }],
                lastActiveTime: Date.now() - 60000
            },
            "张晓曼": {
                name: "张晓曼", avatarColor: "#5a9ab8", relation: "同事", stage: "升温期",
                avatar: AVATAR_URLS["张晓曼"],
                avatarLarge: AVATAR_LARGE_URLS["张晓曼"],
                chatBg: CHAT_BG_URLS["张晓曼"],
                lastMsg: "林哥，下雨了，我带伞了！", time: "15:23", online: true, unread: 0,
                bio: "25岁，短发干练，热情开朗，主动型。",
                gallery: GALLERY_IMAGES["张晓曼"],
                messages: [{ from: "other", text: "林哥，中午一起吃饭吗？", time: "12:10" }],
                posts: [{ author: "张晓曼", time: "昨天 14:20", text: "雨天，带伞的人最靠谱。", image: "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E6%89%93%E4%BC%9E.jpg", likes: 6, hasLiked: false, comments: [{ user: "林夕", text: "哼，我也给哥哥送过伞！" }] }],
                lastActiveTime: Date.now() - 120000
            },
            "赵雅兰": {
                name: "赵雅兰", avatarColor: "#c4a06a", relation: "邻居", stage: "靠近期",
                avatar: AVATAR_URLS["赵雅兰"],
                avatarLarge: AVATAR_LARGE_URLS["赵雅兰"],
                chatBg: CHAT_BG_URLS["赵雅兰"],
                lastMsg: "小林……你今晚有空吗？", time: "昨天", online: false, unread: 0,
                bio: "42岁，离异，优雅成熟，一个人住。",
                gallery: GALLERY_IMAGES["赵雅兰"],
                messages: [{ from: "other", text: "小林，我做了些点心，给你送过去？", time: "昨天 19:20" }],
                posts: [{ author: "赵雅兰", time: "昨天 22:00", text: "一个人的夜晚，一杯红酒，一本旧书。", image: "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E7%BA%A2%E9%85%92.jpg", likes: 4, hasLiked: false, comments: [{ user: "赵梦琪", text: "妈，少喝点。" }] }],
                lastActiveTime: Date.now() - 180000
            },
            "赵梦琪": {
                name: "赵梦琪", avatarColor: "#98b86a", relation: "邻居", stage: "初遇期",
                avatar: AVATAR_URLS["赵梦琪"],
                avatarLarge: AVATAR_LARGE_URLS["赵梦琪"],
                chatBg: CHAT_BG_URLS["赵梦琪"],
                lastMsg: "……",
                time: "昨天",
                online: false,
                unread: 0,
                bio: "20岁，高冷话少，喜欢独自待着，偶尔骑机车兜风。",
                gallery: GALLERY_IMAGES["赵梦琪"],
                messages: [{ from: "other", text: "……", time: "昨天 23:10" }],
                posts: [{ 
                    author: "赵梦琪", 
                    time: "昨天 22:00", 
                    text: "今天也一个人。", 
                    image: "🌙", 
                    likes: 1, 
                    hasLiked: false, 
                    comments: [{ user: "赵雅兰", text: "早点回来。" }] 
                }],
                lastActiveTime: Date.now() - 240000
            },
            "苏小薇": {
                name: "苏小薇", avatarColor: "#e8a87c", relation: "好友", stage: "升温期",
                avatar: AVATAR_URLS["苏小薇"],
                avatarLarge: AVATAR_LARGE_URLS["苏小薇"],
                chatBg: CHAT_BG_URLS["苏小薇"],
                lastMsg: "林哥，晚安！", time: "昨天", online: true, unread: 0,
                bio: "21岁，活泼开朗，林夕的大学好友。",
                gallery: GALLERY_IMAGES["苏小薇"],
                messages: [{ from: "other", text: "林哥，明天有空吗？", time: "昨天 22:00" }],
                posts: [{ author: "苏小薇", time: "昨天 20:00", text: "今天吃到了超好吃的甜品！幸福感爆棚！", image: "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E7%94%9C%E7%82%B9.jpg", likes: 20, hasLiked: false, comments: [{ user: "林夕", text: "下次带我一起！" }] }],
                lastActiveTime: Date.now() - 300000
            },
            "王阿姨": {
                name: "王阿姨", avatarColor: "#d4a373", relation: "邻居", stage: "初遇期",
                avatar: AVATAR_URLS["王阿姨"],
                avatarLarge: AVATAR_LARGE_URLS["王阿姨"],
                chatBg: CHAT_BG_URLS["王阿姨"],
                lastMsg: "小林，阿姨炖了汤，给你们送一碗。", time: "昨天", online: false, unread: 0,
                bio: "55岁，退休，热心肠，住在楼下。",
                gallery: GALLERY_IMAGES["王阿姨"],
                messages: [{ from: "other", text: "小林，最近工作忙不忙？", time: "昨天 18:30" }],
                posts: [{ author: "王阿姨", time: "3天前 16:00", text: "今天包了饺子，给楼上小林送了一碗，年轻人一个人住不容易。", image: "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E9%A5%BA%E5%AD%90.jpg", likes: 8, hasLiked: false, comments: [{ user: "赵雅兰", text: "王姐人真好！" }] }],
                lastActiveTime: Date.now() - 360000
            },
            "林婉如": {
                name: "林婉如", avatarColor: "#7a8c8c", relation: "姑姑", stage: "初遇期",
                avatar: AVATAR_URLS["林婉如"],
                avatarLarge: AVATAR_LARGE_URLS["林婉如"],
                chatBg: CHAT_BG_URLS["林婉如"],
                lastMsg: "小林，过两天我去看看你们。", time: "3天前", online: false, unread: 0,
                bio: "48岁，传统保守，关心兄妹。",
                gallery: GALLERY_IMAGES["林婉如"],
                messages: [{ from: "other", text: "小夕最近学习怎么样？", time: "3天前 14:00" }],
                posts: [{ author: "林婉如", time: "4天前 10:00", text: "周末去看了看小林和小夕，两个孩子过得不错，我也放心了。", image: "https://testingcf.jsdelivr.net/gh/sanshui19516/CG@main/%E6%8E%A2%E6%9C%9B.jpg", likes: 5, hasLiked: false, comments: [] }],
                lastActiveTime: Date.now() - 420000
            }
        };
    }

    // ============================================================
    // 数据存取（自动修复头像、背景、图库、朋友圈旧数据）
    // ============================================================
    function loadData() {
        try {
            const all = safeGetAllVariables();
            const dynamic = (typeof _ !== 'undefined' ? _.get(all, 'stat_data.动态角色') : all?.stat_data?.["动态角色"]);
            if (dynamic && Object.keys(dynamic).length > 0) {
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
                    const imageMap = POST_IMAGE_MAP[name];
                    if (imageMap) {
                        chatData[name].posts.forEach(post => {
                            if (post.image && !post.image.startsWith('http')) {
                                const newImg = imageMap[post.text];
                                if (newImg) post.image = newImg;
                            }
                        });
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
    // 本地回复库
    // ============================================================
    const LOCAL_REPLY_MAP = {
        "通用": [
            "嗯嗯，我知道了~", "哈哈，真的吗？", "好棒！", "嗯…你继续说", "我在听呢", "好呀好呀", "那然后呢？",
            "你真好～", "嘻嘻", "行，听你的", "真的假的？", "嗯嗯，原来如此", "哇，好厉害！", "诶嘿嘿~",
            "那你要加油哦", "我会一直支持你的", "没问题，交给我吧", "好期待呀！", "开心！", "明白啦~"
        ],
        "林夕": {
            "相依为命": [
                "好呀好呀，那哥哥下班早点回来，今天买小蛋糕给我吃不？🍰", "哥哥工作辛苦啦！我在家乖乖等你回来哦~",
                "哥哥你中午吃饱没有呀？不许只吃外卖，对身体不好！", "今天天气好好，想和哥哥一起出去散步呢~",
                "哥哥……我有点想你了，你要不要早点回来陪我？", "我今天给你画了一幅画，等会儿给你看！",
                "哥哥有没有想我呀？我可是时时刻刻都在想你呢~", "好想一直和哥哥待在一起，永远都不分开。",
                "你回来的话，我给你泡热茶好不好？", "今晚想吃什么？我来做！", "哥哥明天有空吗？陪我去逛公园吧！",
                "我今天学了新菜，你一定要尝尝！", "哥哥你看，我是不是又长高了一点？", "嘻嘻，其实我刚刚一直在偷看你照片。",
                "你不在的时候，时间过得好慢啊……", "我们晚上一起看电影好不好？", "哥哥的手最温暖了，我想一直牵着。",
                "你今天特别帅！真的！", "要是每天都能这样就好了……", "好啦好啦，我不闹你了，你忙吧~"
            ],
            "暧昧试探": [
                "哼，哥哥现在回消息这么慢，是在和别的女人聊天吗？", "哥哥……你今天在公司里，有没有那么一瞬间想到我？",
                "是不是又和那个张晓曼待在一起呀？我讨厌她……", "我做的便当，和外面卖的比，哪个更好吃？",
                "你有喜欢的人吗？我是说……那种特别的喜欢。", "如果我和别人在一起，你会不会有一点点难过？",
                "哥哥……你有没有觉得，我们之间有点不一样了？", "刚才看到你给别人点赞，我心里有点酸酸的……",
                "如果有一天我消失了，你会找我吗？", "你身上有别人的香水味……是女人吧？",
                "哥哥，我最近总是梦到你，你说奇怪不奇怪？", "你会不会觉得我……管得太多了？",
                "我不喜欢你和别的女生走得太近，真的。", "我做的饭，你应该只吃我一个人做的！",
                "如果我长得很丑，你还会对我这么好吗？", "哥哥，你喜欢什么样的女生啊？",
                "那天和你一起逛街的，是女朋友吗？", "你手机里有没有存我的照片呀？",
                "我不准你比我更早喜欢别人，听见没！", "要是你敢喜欢别人，我就……我就不理你了！"
            ],
            "在一起": [
                "最喜欢哥哥了！今晚回家我要一直抱着你，不许推开我哦❤️", "哥哥~ 刚才上课一直在想你，都怪你！",
                "生产了一天的糖分，需要哥哥亲亲才能补充完毕！(*/ω＼*)", "哥哥，我们一起去看樱花吧！我等你这句话很久了。",
                "有你在身边，我觉得自己是全世界最幸福的人。", "以后我们的家，一定要有一个大阳台！",
                "哥哥你知道你笑起来有多好看吗？", "你抱我的时候，我觉得整个世界都安静了。",
                "我不管，以后你只能对我一个人这样好！", "要是以后我们老了，你还会这样牵我的手吗？",
                "你是我的一切，我真的离不开你了……", "和你在一起的每一秒，我都想好好记住。",
                "哥哥，你今天身上有阳光的味道！", "我好喜欢你看我的眼神，让我心跳加速。",
                "以后每天都要对我说爱我，不说不准睡觉！", "你答应我的每一件事，我都会好好记住。",
                "今天好累，让我靠着你休息一会儿好不好？", "哥哥，我们结婚吧！我是说真的……",
                "你是我这辈子最不想放手的人。", "你的名字，我已经在心里写了无数遍了……"
            ],
            "病娇": [
                "...你在和谁聊天？为什么回复我这么慢？有我就够了，对吧？", "不要看别人，你的眼睛里，只能有我一个人的影子。",
                "如果你敢离开我……我会做出什么事情，我自己都不知道。", "你是我的，只能是我的，听懂了吗？",
                "我刚才看到你跟别人说话了，我不高兴。", "只有我可以碰你，别人都不可以。",
                "我会把你永远留在我身边，这样你就跑不掉了。", "为什么要去找别人呢？是我做得不够好吗？",
                "我早就把你的所有退路都堵死了，你跑不掉的。", "你连呼吸都要我的允许，记住了吗？",
                "你要是敢让我伤心，我就把你关起来。", "我爱你，所以你不能离开我。",
                "你的眼里的光，只能为我一个人亮。", "你身上有别人的味道……我不喜欢。",
                "我一直在看着你，每一秒都在看着你。", "这个世界没什么好的，有我就够了。",
                "你要是害怕的话，就永远待在我身边好了。", "我是真的爱你，所以你别逼我做出什么疯狂的事情。",
                "你的一切，都必须属于我。", "你要是敢背着我见别人，我就……我会让你后悔的。"
            ]
        },
        "张晓曼": {
            "初遇期": [
                "好的林哥，那新季度的报表我核对完了发你邮箱哈。", "林哥中午一起去食堂吗？听说今天有红烧肉！",
                "上午开会好累啊……你手头的工作忙完了吗？", "今天天气不错，下班要不要一起去喝杯咖啡？",
                "这份文件需要你签个字，放你桌上了。", "你推荐的软件真的好用！谢谢啊。",
                "林哥，你之前做的那个策划案，能让我学习一下吗？", "辛苦了，明天见！",
                "你办公桌怎么那么干净啊，教教我怎么收纳吧。", "项目进度都按计划走，放心吧！",
                "你中午怎么老吃泡面啊，对身体不好，要不我给你带饭？", "你手机备忘录里是不是记了很多工作啊？",
                "看你今天状态不错，发生什么好事了？", "哎，你觉得我们新来的实习生怎么样？",
                "你这周的会议安排我已经发你邮箱了，查收一下~", "周末有安排吗？我打算宅家看剧。",
                "对了，你家住哪个方向啊？", "听说你最近在学日语？我也是！",
                "你打字速度好快啊，羡慕。", "这个工作交给你我就放心了。"
            ],
            "升温期": [
                "林哥，下雨了，我正好带了伞，在公司楼下等你一起走呀？", "不知道为什么，有你在旁边一起加班，感觉时间过得特别快呢。",
                "你昨天发的朋友圈我看到了，那家店看起来很好吃！", "我买了新衣服，你猜是什么颜色的？",
                "今天顺路，要不要一起回去？", "我做了便当，有多的一份，你要不要尝尝？",
                "周末要不要一起去听个live？我刚好有两张票。", "你昨天说想喝奶茶，我刚好路过那家店……",
                "我刚才在想，如果早点认识你就好了。", "你笑起来真的很好看，多笑一笑嘛。",
                "你桌上有我给你留的巧克力，记得吃。", "你晚上有空吗？想约你去看个新上映的电影。",
                "我看到你换了新头像，是不是偷偷换的？", "你上次推荐的歌，我循环了一整天。",
                "今天心情不好，还好你陪我说了会儿话。", "我觉得我们之间，好像比普通同事要亲近一些……",
                "你要是累了，也可以依赖我一下的。", "你说话的时候，眼神很温柔呢。",
                "我们这样一起下班，好像已经是习惯了。", "我好像……有点开始期待每一天见到你了。"
            ],
            "交往期": [
                "知道啦，亲爱的林哥！晚上老地方等我，不许迟到哦~", "有你在身边，感觉在这个大城市里，终于有了一个属于我的避风港。",
                "你昨天说的那些话，我一晚上都没睡着……太开心了。", "我不管，以后你出门必须报备，不然我会担心。",
                "你的手好暖，让我多握一会儿。", "只要和你在一起，去哪里我都愿意。",
                "你上次送我的花，我做成干花夹在书里了。", "你知道我有多幸运能遇到你吗？",
                "今晚要不要来我家吃饭？我亲自下厨。", "你身上总是有很好闻的味道……是什么香水？",
                "我想带你去见我最好的朋友，让他们知道我找到了多好的人。", "你刚才的眼神，让我心跳加速了。",
                "你是我在这个城市里最温暖的依靠。", "只要能和你在一起，再苦再累我都不怕。",
                "你有我就够了，别的女人看都不准看！", "我觉得我们以后一定会很幸福的。",
                "你为我做的每一件小事，我都记在心里。", "和你在一起的时候，我总是忍不住想笑。",
                "我爱你，这句话我想每天都说给你听。", "以后我们的日子，一定会非常非常美好。"
            ]
        },
        // ============================================================
        // 赵梦琪 - 高冷话少版本地回复（已修改）
        // ============================================================
        "赵梦琪": {
            "初遇期": [
                "……", "嗯。", "……知道了。", "……还行。", "……不用了。",
                "……没空。", "……随便。", "……我不想去。", "……你找别人吧。",
                "……我没兴趣。", "……你爱怎么说怎么说。", "……关我什么事。",
                "……我说了没空。", "……你听不懂吗。", "……你挺烦的。",
                "……我睡了。", "……别发消息了。", "……不想回。",
                "……我骑车去了。", "……有事。", "……嗯，在听。"
            ],
            "升温期": [
                "……嗯。我在。", "……你继续说。", "……听到了。", "……然后呢。",
                "……我不太会说话。", "……你爱待着就待着。", "……随便你信不信。",
                "……我习惯了。", "……一个人也挺好的。", "……你不需要管我。",
                "……我不觉得无聊。", "……你不用陪我。", "……我知道你在。",
                "……我会回消息。不一定快。", "……你今天怎么这么多话。",
                "……你喜欢安静吗。", "……风挺大的。", "……你冷吗。"
            ],
            "靠近期": [
                "……你也在。", "……我以为你不来。", "……这里风大。",
                "……你站那么远干什么。", "……我不介意你坐近一点。",
                "……你不用刻意找话题。", "……安静待着也行。",
                "……我不讨厌你在这。", "……你明天还来吗。",
                "……走吧。我骑车载你。", "……抓紧。不然摔了我不负责。",
                "……你手放哪呢。", "……算了。就这样吧。",
                "……你肩膀挺暖和的。", "……我什么都没说。",
                "……别问那么多。", "……我知道你好奇。我不说。"
            ],
            "告白期": [
                "……你来了。我有话要说。", "……我知道我不太会说话。",
                "……但我还是想说。", "……你是我唯一会主动想起的人。",
                "……你不用现在回答我。", "……我只是想让你知道。",
                "……我说完了。你可以走了。", "……你等我一下。我有话跟你说。",
                "……你听到了吗。我再说一遍。", "……你听清楚了吗。我不想重复第三次。",
                "……你走吧。我自己待会儿。", "……你犹豫了。那我当你没听见。",
                "……你过来。我不想隔着这么远说话。", "……你知道我什么意思。"
            ],
            "交往期": [
                "……你来了。", "……坐吧。", "……我在等你。", "……你迟到了。",
                "……今晚有空吗。", "……一起走。", "……你手好暖。", "……别说话，安静待着。",
                "……嗯，我也想你。", "……以后别让我等太久。", "……你少说几句。我听着就好。",
                "……你今天的衣服挺好看的。", "……我没夸你。", "……你爱怎么想怎么想。",
                "……我不喜欢人多的地方。", "……你陪我就行。", "……我不习惯说那些话。",
                "……你应该明白。", "……我不说第二遍了。", "……你一直在这，我就满意。"
            ]
        }
    };

    function getLocalStageReply(name, userMessage) {
        const role = chatData[name];
        if (!role) return "嗯嗯，知道了呀~";
        let stage = role.stage || "初遇期";
        let matchedStage = "通用";

        if (name === "林夕") {
            if (stage.includes("病娇")) matchedStage = "病娇";
            else if (stage.includes("在一起") || stage.includes("交往")) matchedStage = "在一起";
            else if (stage.includes("暧昧") || stage.includes("试探")) matchedStage = "暧昧试探";
            else matchedStage = "相依为命";
        } else if (name === "张晓曼") {
            if (stage.includes("交往") || stage.includes("告白")) matchedStage = "交往期";
            else if (stage.includes("升温") || stage.includes("靠近") || stage.includes("转折")) matchedStage = "升温期";
            else matchedStage = "初遇期";
        } else if (name === "赵梦琪") {
            if (stage.includes("交往") || stage.includes("告白")) matchedStage = "交往期";
            else if (stage.includes("靠近") || stage.includes("转折")) matchedStage = "靠近期";
            else if (stage.includes("升温") || stage.includes("试探")) matchedStage = "升温期";
            else matchedStage = "初遇期";
        } else {
            if (LOCAL_REPLY_MAP[name] && LOCAL_REPLY_MAP[name][stage]) matchedStage = stage;
            else matchedStage = "通用";
        }

        let pool = LOCAL_REPLY_MAP["通用"];
        if (LOCAL_REPLY_MAP[name] && LOCAL_REPLY_MAP[name][matchedStage]) {
            pool = LOCAL_REPLY_MAP[name][matchedStage];
        }
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
                    allPosts.push({ ...post, _author: name, _avatarColor: role.avatarColor || '#888', _name: role.name, _avatar: role.avatar || '' });
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
                    <span style="color:#a78bfa;font-weight:500;">${c.user}</span>
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
                        <span class="js-like-btn" data-author="${post._author}" data-time="${post.time}" style="cursor:pointer;display:flex;align-items:center;gap:4px;transition:color 0.3s; color:${post.hasLiked ? '#f472b6' : 'inherit'}">
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
            const unreadBadge = role.unread > 0 ? `<span style="background:#06c755;color:#fff;border-radius:50%;padding:0 6px;font-size:10px;min-width:18px;display:inline-block;text-align:center;">${role.unread}</span>` : '';
            const statusDot = role.online ? '🟢' : '⚪';
            
            const avatarHtml = role.avatar && role.avatar.startsWith('http')
                ? `<img src="${role.avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;display:block;">`
                : name.charAt(0);
            
            html += `
                <div class="phone-chat-item" data-name="${name}" style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--bg-card);border-radius:14px;margin-bottom:4px;cursor:pointer;border:1px solid var(--border-color);transition:all 0.25s ease;">
                    <div style="position:relative;flex-shrink:0;">
                        <div style="width:48px;height:48px;border-radius:50%;background:${role.avatar && role.avatar.startsWith('http') ? 'transparent' : (role.avatarColor || '#888')};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:18px;overflow:hidden;">${avatarHtml}</div>
                        <span style="position:absolute;bottom:0;right:0;font-size:12px;">${statusDot}</span>
                    </div>
                    <div style="flex:1;min-width:0;">
                        <div style="font-weight:600;color:var(--text-primary);font-size:14px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;" class="phone-chat-name">
                            ${role.name}
                            <span style="font-size:9px;font-weight:500;color:#fff;background:#06c755;padding:1px 8px;border-radius:10px;">${role.relation}</span>
                            <span style="font-size:9px;font-weight:500;color:#fff;background:#b886cd;padding:1px 8px;border-radius:10px;">${role.stage}</span>
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
        if (names.length === 0) return '<div style="text-align:center;padding:40px 0;color:var(--text-muted);font-size:14px;">暂无好友，点击右上角 ➕ 添加</div>';
        let html = '';
        names.forEach(name => {
            const role = chatData[name];
            
            const avatarHtml = role.avatar && role.avatar.startsWith('http')
                ? `<img src="${role.avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;display:block;">`
                : name.charAt(0);
            
            html += `
                <div class="phone-friend-item" data-name="${name}" style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--bg-card);border-radius:14px;margin-bottom:4px;border:1px solid var(--border-color);cursor:pointer;transition:background 0.2s;">
                    <div style="width:44px;height:44px;border-radius:50%;background:${role.avatar && role.avatar.startsWith('http') ? 'transparent' : (role.avatarColor || '#888')};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:16px;flex-shrink:0;overflow:hidden;">${avatarHtml}</div>
                    <div style="flex:1;min-width:0;">
                        <div style="font-weight:600;color:var(--text-primary);font-size:14px;">${role.name}</div>
                        <div style="font-size:11px;color:var(--text-secondary);">${role.relation} · ${role.stage}</div>
                    </div>
                    <span class="friend-delete-btn" data-name="${name}" style="font-size:13px;color:#f44336;opacity:0.6;cursor:pointer;padding:4px 8px;z-index:5;">删除</span>
                </div>
            `;
        });
        return html;
    }

    // ============================================================
    // 主UI渲染
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

        // 安全获取当前角色数据
        const currentRole = currentChatId ? chatData[currentChatId] : null;
        const currentAvatar = currentRole?.avatar || '';
        const currentAvatarLarge = currentRole?.avatarLarge || '';
        const currentAvatarColor = currentRole?.avatarColor || '#888';
        const currentName = currentRole?.name || '未知';
        const currentRelation = currentRole?.relation || '关系';
        const currentStage = currentRole?.stage || '阶段';
        const currentBio = currentRole?.bio || '这个人很懒，什么都没留下。';

        const container = $(`
            <div id="phone-overlay-container" style="position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:99999;background:rgba(0,0,0,0.65);backdrop-filter:blur(12px);display:flex;justify-content:center;align-items:center;font-family:-apple-system,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif;">
                
                <div id="phone-modal" class="${isDarkMode ? 'dark-mode' : 'light-mode'}" style="width:360px;height:700px;max-height:85vh;max-width:92vw;background:var(--modal-bg,#0f0f0f);border: 1px solid var(--modal-border);border-radius:40px;padding:10px;box-shadow:var(--modal-shadow);position:relative;animation:scaleUp 0.35s cubic-bezier(0.34,1.56,0.64,1);">
                    
                    <div class="phone-physical-btn power-btn" style="position:absolute; right:-4px; top:130px; width:4px; height:50px; background:var(--modal-btn-color, #1f2937); border-radius:0 3px 3px 0; box-shadow: 1px 1px 3px rgba(0,0,0,0.2);"></div>
                    <div class="phone-physical-btn volup-btn" style="position:absolute; left:-4px; top:110px; width:4px; height:40px; background:var(--modal-btn-color, #1f2937); border-radius:3px 0 0 3px; box-shadow: -1px 1px 3px rgba(0,0,0,0.2);"></div>
                    <div class="phone-physical-btn voldown-btn" style="position:absolute; left:-4px; top:165px; width:4px; height:40px; background:var(--modal-btn-color, #1f2937); border-radius:3px 0 0 3px; box-shadow: -1px 1px 3px rgba(0,0,0,0.2);"></div>

                    <div class="notch-container" style="position:absolute;top:0;left:50%;transform:translateX(-50%);width:140px;height:26px;background:var(--modal-bg,#0f0f0f);border-radius:0 0 18px 18px;z-index:40;display:flex;align-items:center;justify-content:center;gap:8px; border: 1px solid var(--notch-border); border-top: none;">
                        <div style="width:8px;height:8px;background:var(--notch-dot,#1a1a2e);border-radius:50%;border:1px solid var(--notch-border,#2a2a3e);"></div>
                        <div style="width:36px;height:4px;background:var(--notch-speaker,#1a1a2e);border-radius:4px;border:1px solid var(--notch-border,#2a2a3e);"></div>
                    </div>

                    <div id="phone-screen" style="width:100%;height:100%;border-radius:30px;overflow:hidden;background:var(--bg-primary,#1a1a2e);display:flex;flex-direction:column;position:relative;">

                        <div style="padding:10px 18px 4px;display:flex;justify-content:space-between;font-size:11px;font-weight:600;color:var(--text-primary,#ece8e0);background:transparent;position:relative;z-index:10;padding-top:34px;" class="phone-status-bar">
                            <span id="statusTime" style="font-weight:700;">${new Date().toTimeString().slice(0,5)}</span>
                            <span style="display:flex;gap:12px;align-items:center;">
                                <span>●●●●○ 🔋</span>
                            </span>
                        </div>

                        <div style="flex:1;overflow:hidden;display:flex;flex-direction:column;position:relative;">

                            <div style="padding:6px 14px 12px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border-color,#2a2a3e);background:var(--bg-primary,#1a1a2e);flex-shrink:0;min-height:46px;">
                                <div style="font-size:17px;font-weight:700;color:var(--text-primary,#ece8e0);display:flex;align-items:center;gap:6px;">
                                    📱 都市 · cell phone
                                    <span style="font-size:9px;background:#06c755;color:#fff;padding:1px 10px;border-radius:12px;font-weight:600;">LIVE</span>
                                </div>
                                <div style="display:flex;gap:14px;font-size:17px;color:var(--text-primary,#ece8e0);">
                                    <span id="phone-add-friend-btn" style="cursor:pointer;opacity:0.5;transition:opacity 0.3s;">➕</span>
                                    <span id="phone-search-btn" style="cursor:pointer;opacity:0.5;transition:opacity 0.3s;">🔍</span>
                                    <span id="phone-refresh-btn" style="cursor:pointer;opacity:0.5;transition:opacity 0.3s;">🔄</span>
                                </div>
                            </div>

                            <div id="search-bar" style="display:none;padding:6px 14px 10px;background:var(--bg-primary,#1a1a2e);border-bottom:1px solid var(--border-color,#2a2a3e);flex-shrink:0;">
                                <input id="search-input" type="text" placeholder="🔍 搜索人物..." style="width:100%;padding:8px 14px;border-radius:20px;border:1px solid var(--border-color,#3a3a4e);background:var(--bg-input,#2a2a3e);font-size:13px;outline:none;color:var(--text-primary,#ece8e0);">
                                <div style="text-align:right;font-size:11px;color:var(--text-muted);margin-top:4px;cursor:pointer;" id="search-close-btn">取消</div>
                            </div>

                            <div id="page-container" style="flex:1;overflow-y:auto;background:var(--bg-secondary,#12121e);position:relative;">

                                <div id="page-chatlist" style="display:block;padding:10px 14px 12px;">
                                    ${chatListHtml}
                                </div>

                                <div id="page-friendlist" style="display:none;padding:10px 14px 12px;">
                                    ${friendListHtml}
                                </div>

                                <div id="page-posts" style="display:none;padding:10px 14px 12px;background:var(--bg-secondary,#12121e);min-height:100%;">
                                    ${renderPostListHtml()}
                                </div>

                                <div id="page-settings" style="display:none;padding:0 14px 12px;background:var(--bg-secondary,#12121e);min-height:100%;">
                                    <div style="padding:10px 0;">
                                        <div style="font-size:11px;font-weight:600;color:var(--text-muted);padding:8px 0 4px;letter-spacing:1px;">界面</div>

                                        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border-color);font-size:14px;color:var(--text-primary,#ece8e0);">
                                            <span id="dark-mode-label" style="font-weight:500;">${isDarkMode ? '🌙 深色款式' : '☀️ 蓝光款式'}</span>
                                            <div class="dark-mode-switch ${isDarkMode ? '' : 'off'}" style="width:40px;height:22px;background:${isDarkMode ? '#06c755' : '#3a3a4e'};border-radius:12px;position:relative;cursor:pointer;">
                                                <span class="knob" style="width:18px;height:18px;background:#fff;border-radius:50%;position:absolute;top:2px;left:2px;transition:transform 0.3s;box-shadow:0 1px 4px rgba(0,0,0,0.25);transform:${isDarkMode ? 'translateX(18px)' : 'translateX(0)'};"></span>
                                            </div>
                                        </div>

                                        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border-color);font-size:14px;color:var(--text-primary,#ece8e0);">
                                            <span style="font-weight:500;">🔔 消息通知</span>
                                            <div id="notif-switch" class="${notifEnabled ? '' : 'off'}" style="width:40px;height:22px;background:${notifEnabled ? '#06c755' : '#cbd5e1'};border-radius:12px;position:relative;cursor:pointer;">
                                                <span class="knob" style="width:18px;height:18px;background:#fff;border-radius:50%;position:absolute;top:2px;left:2px;transition:transform 0.3s;box-shadow:0 1px 4px rgba(0,0,0,0.25);transform:${notifEnabled ? 'translateX(18px)' : 'translateX(0)'};"></span>
                                            </div>
                                        </div>

                                        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border-color);font-size:14px;color:var(--text-primary,#ece8e0);">
                                            <span style="font-weight:500;">🤖 角色主动发言</span>
                                            <div id="auto-active-switch" class="${autoConfig.enabled ? '' : 'off'}" style="width:40px;height:22px;background:${autoConfig.enabled ? '#06c755' : '#cbd5e1'};border-radius:12px;position:relative;cursor:pointer;">
                                                <span class="knob" style="width:18px;height:18px;background:#fff;border-radius:50%;position:absolute;top:2px;left:2px;transition:transform 0.3s;box-shadow:0 1px 4px rgba(0,0,0,0.25);transform:${autoConfig.enabled ? 'translateX(18px)' : 'translateX(0)'};"></span>
                                            </div>
                                        </div>

                                        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border-color);font-size:13px;color:var(--text-primary,#ece8e0);">
                                            <span style="font-weight:500;">⏱️ 发言频率</span>
                                            <select id="active-interval-select" style="background:var(--bg-input,#2a2a3e);color:var(--text-primary,#ece8e0);border:1px solid var(--border-color,#3a3a4e);border-radius:6px;padding:4px 10px;font-size:12px;outline:none;">
                                                <option value="1" ${autoConfig.interval === 1 ? 'selected' : ''}>1分钟</option>
                                                <option value="2" ${autoConfig.interval === 2 ? 'selected' : ''}>2分钟</option>
                                                <option value="5" ${autoConfig.interval === 5 ? 'selected' : ''}>5分钟</option>
                                                <option value="15" ${autoConfig.interval === 15 ? 'selected' : ''}>15分钟</option>
                                                <option value="30" ${autoConfig.interval === 30 ? 'selected' : ''}>30分钟</option>
                                            </select>
                                        </div>

                                        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border-color);font-size:13px;color:var(--text-primary,#ece8e0);">
                                            <span style="font-weight:500;">🧠 AI生成内容</span>
                                            <div id="auto-ai-switch" class="${autoConfig.useAI ? '' : 'off'}" style="width:40px;height:22px;background:${autoConfig.useAI ? '#06c755' : '#cbd5e1'};border-radius:12px;position:relative;cursor:pointer;">
                                                <span class="knob" style="width:18px;height:18px;background:#fff;border-radius:50%;position:absolute;top:2px;left:2px;transition:transform 0.3s;box-shadow:0 1px 4px rgba(0,0,0,0.25);transform:${autoConfig.useAI ? 'translateX(18px)' : 'translateX(0)'};"></span>
                                            </div>
                                        </div>

                                        <div style="font-size:11px;font-weight:600;color:var(--text-muted);padding:14px 0 4px;letter-spacing:1px;">📡 第二 API 设置</div>

                                        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border-color);font-size:14px;color:var(--text-primary,#ece8e0);">
                                            <span style="font-weight:500;">启用第二 API</span>
                                            <div id="second-api-switch" class="${config.enabled ? '' : 'off'}" style="width:40px;height:22px;background:${config.enabled ? '#06c755' : '#cbd5e1'};border-radius:12px;position:relative;cursor:pointer;">
                                                <span class="knob" style="width:18px;height:18px;background:#fff;border-radius:50%;position:absolute;top:2px;left:2px;transition:transform 0.3s;box-shadow:0 1px 4px rgba(0,0,0,0.25);transform:${config.enabled ? 'translateX(18px)' : 'translateX(0)'};"></span>
                                            </div>
                                        </div>

                                        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;font-size:13px;color:var(--text-secondary,#888);">
                                            <span style="min-width:70px;">API URL</span>
                                            <input id="second-api-url" type="text" placeholder="https://api.openai.com/v1" value="${config.url || ''}" style="flex:1;max-width:170px;padding:4px 10px;border:1px solid var(--border-color,rgba(255,255,255,0.1));border-radius:6px;font-size:12px;background:var(--bg-input,#2a2a3e);color:var(--text-primary,#ece8e0);outline:none;margin-left:10px;">
                                        </div>
                                        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;font-size:13px;color:var(--text-secondary,#888);">
                                            <span style="min-width:70px;">API Key</span>
                                            <input id="second-api-key" type="password" placeholder="sk-..." value="${config.key || ''}" style="flex:1;max-width:170px;padding:4px 10px;border:1px solid var(--border-color,rgba(255,255,255,0.1));border-radius:6px;font-size:12px;background:var(--bg-input,#2a2a3e);color:var(--text-primary,#ece8e0);outline:none;margin-left:10px;">
                                        </div>

                                        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;font-size:13px;color:var(--text-secondary,#888);">
                                            <span style="min-width:70px;">模型名</span>
                                            <input id="second-api-model" type="text" placeholder="输入模型名" value="${config.model || ''}" style="flex:1;max-width:170px;padding:4px 10px;border:1px solid var(--border-color,rgba(255,255,255,0.1));border-radius:6px;font-size:12px;background:var(--bg-input,#2a2a3e);color:var(--text-primary,#ece8e0);outline:none;margin-left:10px;">
                                        </div>

                                        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;font-size:13px;color:var(--text-secondary,#888);">
                                            <span style="min-width:70px;">可用模型</span>
                                            <select id="second-api-models" style="flex:1;max-width:170px;padding:4px 10px;border:1px solid var(--border-color,rgba(255,255,255,0.1));border-radius:6px;font-size:12px;background:var(--bg-input,#2a2a3e);color:var(--text-primary,#ece8e0);outline:none;margin-left:10px;">
                                                <option value="" style="display:none;"></option>
                                                ${hasModels ? availableModels.map(m => `<option value="${m}" ${config.model === m ? 'selected' : ''}>${m}</option>`).join('') : ''}
                                            </select>
                                        </div>

                                        <div style="display:flex;gap:8px;flex-wrap:wrap;padding:10px 0 6px;">
                                            <button id="second-api-connect-btn" style="padding:3px 14px;border:1px solid #06c755;border-radius:14px;font-size:11px;background:transparent;color:#06c755;cursor:pointer;">连接</button>
                                            <span id="second-api-status" style="font-size:12px;color:var(--text-muted,#666);line-height:26px;">${config.url && config.key ? (config.enabled && config.model ? '✅ 已配置' : '⏸️ 待保存') : '未配置'}</span>
                                            <button id="second-api-save-btn" style="padding:3px 14px;border:1px solid #b886cd;border-radius:14px;font-size:11px;background:transparent;color:#b886cd;cursor:pointer;">保存</button>
                                            <button id="second-api-clear-btn" style="padding:3px 14px;border:1px solid #f44336;border-radius:14px;font-size:11px;background:transparent;color:#f44336;cursor:pointer;">清除</button>
                                        </div>

                                        <div style="padding:6px 0;font-size:10px;color:var(--text-muted,#888);line-height:1.6;opacity:0.8;">
                                            💡 点击「连接」测试连通性并获取可用模型列表。<br>
                                            💡 选择或输入模型后点击「保存」持久化配置。
					    👾 作者：三年的水
                                        </div>
                                        <div style="text-align:center;padding:16px 0 4px;color:rgba(255,255,255,0.06);font-size:8px;border-top:1px solid var(--border-color);margin-top:8px;letter-spacing:2px;">
                                            三年的水 · 都市禁忌
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style="display:flex;justify-content:space-around;align-items:center;padding:6px 0 8px;background:var(--bg-primary,#1a1a2e);border-top:1px solid var(--border-color,#2a2a3e);flex-shrink:0;">
                                <button class="nav-btn active" data-page="page-chatlist" style="display:flex;flex-direction:column;align-items:center;gap:1px;font-size:9px;color:#06c755;cursor:pointer;padding:2px 14px;background:none;border:none;font-family:inherit;">
                                    <span style="font-size:20px;line-height:1.2;color:#06c755;">💬</span>
                                    <span style="color:#06c755;">聊天</span>
                                </button>
                                <button class="nav-btn" data-page="page-friendlist" style="display:flex;flex-direction:column;align-items:center;gap:1px;font-size:9px;color:var(--text-muted,#888);cursor:pointer;padding:2px 14px;background:none;border:none;font-family:inherit;">
                                    <span style="font-size:20px;line-height:1.2;color:var(--text-muted,#888);">👥</span>
                                    <span style="color:var(--text-muted,#888);">好友</span>
                                </button>
                                <button class="nav-btn" data-page="page-posts" style="display:flex;flex-direction:column;align-items:center;gap:1px;font-size:9px;color:var(--text-muted,#888);cursor:pointer;padding:2px 14px;background:none;border:none;font-family:inherit;">
                                    <span style="font-size:20px;line-height:1.2;color:var(--text-muted,#888);">📱</span>
                                    <span style="color:var(--text-muted,#888);">朋友圈</span>
                                </button>
                                <button class="nav-btn" data-page="page-settings" style="display:flex;flex-direction:column;align-items:center;gap:1px;font-size:9px;color:var(--text-muted,#888);cursor:pointer;padding:2px 14px;background:none;border:none;font-family:inherit;">
                                    <span style="font-size:20px;line-height:1.2;color:var(--text-muted,#888);">⚙</span>
                                    <span style="color:var(--text-muted,#888);">设置</span>
                                </button>
                            </div>
                        </div>

                        <!-- 聊天浮层 -->
                        <div id="chat-page" style="display:none;flex-direction:column;height:100%;position:absolute;top:0;left:0;right:0;bottom:0;background:var(--bg-primary,#1a1a2e);z-index:30;padding-top:0;">
                            <div style="display:flex;align-items:center;gap:10px;padding:6px 14px;background:var(--bg-primary,#1a1a2e);border-bottom:1px solid var(--border-color,#2a2a3e);flex-shrink:0;min-height:52px;">
                                <span id="chat-back-btn" style="font-size:22px;cursor:pointer;opacity:0.5;color:var(--text-primary,#ece8e0);">‹</span>
                                <div id="chat-page-avatar" style="width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#fff;background:${currentAvatar.startsWith('http') ? 'transparent' : currentAvatarColor};flex-shrink:0;overflow:hidden;">
                                    ${currentAvatar.startsWith('http') ? `<img src="${currentAvatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : (currentChatId ? currentChatId.charAt(0) : '?')}
                                </div>
                                <span id="chat-page-name" style="font-size:15px;font-weight:600;color:var(--text-primary,#ece8e0);flex:1;">${currentName} <span style="font-size:10px;font-weight:normal;opacity:0.6;">(${currentStage})</span></span>
                                <span id="chat-profile-btn" style="font-size:16px;cursor:pointer;opacity:0.5;color:var(--text-primary,#ece8e0);">👤</span>
                            </div>
                            <div id="chat-messages" style="flex:1;overflow-y:auto;padding:10px 14px;display:flex;flex-direction:column;gap:6px;background:var(--bg-secondary,#12121e);position:relative;"></div>
                            <div style="display:flex;gap:8px;padding:8px 14px;background:var(--bg-primary,#1a1a2e);border-top:1px solid var(--border-color,#2a2a3e);flex-shrink:0;">
                                <input id="chat-input" type="text" placeholder="输入消息..." style="flex:1;padding:7px 14px;border-radius:20px;border:1px solid var(--border-color,#3a3a4e);background:var(--bg-input,#2a2a3e);font-size:12px;outline:none;color:var(--text-primary,#ece8e0);">
                                <button id="chat-send-btn" style="padding:7px 16px;border:none;background:#06c755;color:#fff;border-radius:20px;font-weight:600;font-size:12px;cursor:pointer;">发送</button>
                            </div>
                        </div>

                        <!-- 资料浮层 -->
                        <div id="profile-page" style="display:none;flex-direction:column;height:100%;position:absolute;top:0;left:0;right:0;bottom:0;background:var(--bg-primary,#1a1a2e);z-index:40;overflow-y:auto;padding-top:0;">
                            <div style="padding:6px 14px;font-size:14px;cursor:pointer;color:var(--text-primary,#ece8e0);display:flex;align-items:center;gap:6px;background:var(--bg-primary,#1a1a2e);flex-shrink:0;min-height:44px;border-bottom:1px solid var(--border-color,#2a2a3e);">
                                <span id="profile-back-btn" style="opacity:0.6;">‹ 返回</span>
                            </div>
                            <div style="text-align:center;padding:14px 0 10px;background:var(--bg-primary,#1a1a2e);border-bottom:1px solid var(--border-color,#2a2a3e);flex-shrink:0;">
                                <div id="profile-avatar" style="
                                    width:72px;height:72px;border-radius:14px;margin:0 auto 6px;
                                    display:flex;align-items:center;justify-content:center;
                                    font-size:30px;font-weight:700;color:#fff;
                                    overflow:hidden;
                                    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
                                    background:${(currentAvatarLarge || currentAvatar).startsWith('http') ? 'transparent' : currentAvatarColor};
                                ">
                                    ${currentAvatarLarge.startsWith('http') ? `<img src="${currentAvatarLarge}" style="width:100%;height:100%;object-fit:cover;display:block;">` : (currentAvatar.startsWith('http') ? `<img src="${currentAvatar}" style="width:100%;height:100%;object-fit:cover;display:block;">` : (currentChatId ? currentChatId.charAt(0) : '?'))}
                                </div>
                                <div id="profile-name" style="font-size:18px;font-weight:700;color:var(--text-primary,#ece8e0);">${currentName}</div>
                                <div id="profile-sub" style="font-size:12px;color:var(--text-secondary,#888);">${currentRelation} · ${currentStage}</div>
                            </div>
                            <div id="profile-bio" style="padding:10px 14px;background:var(--bg-primary,#1a1a2e);border-bottom:1px solid var(--border-color,#2a2a3e);font-size:12px;color:var(--text-secondary,#aaa);line-height:1.6;">${currentBio}</div>
                            <div style="padding:10px 14px;flex:1;background:var(--bg-secondary);">
                                <div style="font-size:12px;font-weight:600;color:var(--text-secondary,#888);margin-bottom:6px;">📸 图库</div>
                                <div id="profile-gallery" style="display:flex;flex-direction:column;gap:16px;"></div>
                            </div>
                            <div style="padding: 16px 14px; background:var(--bg-secondary); display:flex; justify-content:center; border-top:1px solid var(--border-color); flex-shrink:0;">
                                <button id="profile-chat-btn" style="width:100%; max-width:280px; padding: 10px 24px; border-radius: 20px; background: #06c755; color: white; border: none; font-weight: 600; font-size:13px; cursor: pointer; transition: background 0.2s;">💬 发送消息</button>
                            </div>
                            <div style="text-align:center;padding:12px 0 4px;color:rgba(255,255,255,0.05);font-size:8px;border-top:1px solid var(--border-color);flex-shrink:0;letter-spacing:2px; background:var(--bg-secondary);">三年的水 · 都市禁忌</div>
                        </div>
                    </div>
                </div>
            </div>
        `);

        $('body').append(container);

        // -------- CSS 变量体系（含响应式）---------
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
                        height: 700px !important; 
                        max-height: 85vh !important;
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
                    --modal-bg: #09090b; --modal-border: rgba(139, 92, 246, 0.4);
                    --modal-shadow: 0 32px 80px rgba(0,0,0,0.85), 0 0 15px rgba(139,92,246,0.15);
                    --modal-btn-color: #12121e; --notch-dot: #1e1b4b; --notch-speaker: #121026; --notch-border: #1f1a3a;
                    --bg-primary: #121222; --bg-secondary: #090912; --bg-card: rgba(255,255,255,0.05);
                    --bg-input: #1a1a2e; --text-primary: #ece8e0; --text-secondary: #9ea2b0;
                    --text-muted: #5a5f75; --border-color: #1f1f35;
                }
                #phone-modal.light-mode {
                    --modal-bg: #ffffff; --modal-border: #e2d9cd;
                    --modal-shadow: 0 32px 80px rgba(142,126,105,0.2), inset 0 0 4px rgba(255,255,255,0.9);
                    --modal-btn-color: #e5c49f; --notch-dot: #ebd8c0; --notch-speaker: #cbbba6; --notch-border: #ebd9c2;
                    --bg-primary: #f8f9fb; --bg-secondary: #ffffff; --bg-card: rgba(0,0,0,0.035);
                    --bg-input: #f0f3f6; --text-primary: #253342; --text-secondary: #5a6e85;
                    --text-muted: #a1b2c4; --border-color: #e6ecf2;
                }

                #phone-screen { background: var(--bg-primary) !important; color: var(--text-primary) !important; }
                #phone-screen .nav-btn { color: var(--text-muted) !important; }
                #phone-screen .nav-btn.active { color: #06c755 !important; }
                #phone-screen .nav-btn.active span { color: #06c755 !important; }
                #phone-screen .nav-btn span { color: var(--text-muted) !important; }

                .phone-chat-item, .phone-friend-item { background: var(--bg-card) !important; border-color: var(--border-color) !important; }
                .phone-chat-item:hover, .phone-friend-item:hover { background: rgba(0,0,0,0.02) !important; }

                .post-card { background: var(--bg-card) !important; border-color: var(--border-color) !important; }

                #search-input, #chat-input, #second-api-url, #second-api-key, #second-api-model, #second-api-models {
                    background: var(--bg-input) !important; border-color: var(--border-color) !important; color: var(--text-primary) !important;
                }

                .message-bubble:not(.self) { background: var(--bg-card) !important; color: var(--text-primary) !important; }
                .message-bubble.self { background: #06c755 !important; color: #fff !important; }

                .dark-mode-switch, .notif-switch, #notif-switch, #auto-active-switch, #auto-ai-switch, #second-api-switch {
                    background: #cbd5e1 !important;
                }
                .dark-mode-switch:not(.off), .notif-switch:not(.off), #notif-switch:not(.off), #auto-active-switch:not(.off), #auto-ai-switch:not(.off), #second-api-switch:not(.off) {
                    background: #06c755 !important;
                }

                .notch-container { background: var(--modal-bg) !important; border-color: var(--notch-border) !important; }
                .notch-container div { border-color: var(--notch-border) !important; }
                .notch-container .camera { background: var(--notch-dot) !important; }
                .notch-container .speaker { background: var(--notch-speaker) !important; }
                .phone-physical-btn { background: var(--modal-btn-color) !important; }

                #chat-messages::after {
                    content: "";
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.3);
                    z-index: 0;
                    pointer-events: none;
                }
                #phone-modal.light-mode #chat-messages::after {
                    background: rgba(255,255,255,0.2);
                }
                #chat-messages > * {
                    position: relative;
                    z-index: 1;
                }

                .gallery-polaroid {
                    background: #fff;
                    padding: 4px 4px 10px 4px;
                    border-radius: 2px;
                    box-shadow: 2px 4px 12px rgba(0,0,0,0.15);
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
                    color: #999;
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
            if ($(e.target).hasClass('friend-delete-btn')) {
                const name = $(e.target).data('name');
                window._phoneDeleteFriend(name);
                return;
            }
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
            if (bar.is(':visible')) { bar.hide(); $('#search-input').val(''); filterChatList(''); }
            else { bar.show(); $('#search-input').focus(); }
        });
        $('#search-close-btn').off('click').on('click', function() { $('#search-bar').hide(); $('#search-input').val(''); filterChatList(''); });
        $('#search-input').off('input').on('input', function() { filterChatList($(this).val()); });

        $('#phone-add-friend-btn').off('click').on('click', function() { window._phoneAddFriend(); });

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
                $('.nav-btn[data-page="page-friendlist"]').addClass('active');
                $('#page-chatlist, #page-posts, #page-settings').hide();
                $('#page-friendlist').show();
            }
        });
        $('#profile-chat-btn').off('click').on('click', function() {
            if (currentChatId && typeof currentChatId === 'string') openChat(currentChatId);
        });

        // 颜色切换
        console.log('✅ 准备绑定深色模式开关');
        $('.dark-mode-switch').off('click').on('click', function() {
            const isDark = $(this).hasClass('off');
            const modal = $('#phone-modal');
            const label = $('#dark-mode-label');
            if (isDark) {
                $(this).removeClass('off');
                $(this).find('.knob').css('transform', 'translateX(18px)');
                $(this).css('background', '#06c755');
                modal.removeClass('light-mode').addClass('dark-mode');
                label.text('🌙 深色款式');
                localStorage.setItem('phone-dark-mode', 'on');
                modal.css({
                    '--modal-bg': '#09090b', '--modal-border': 'rgba(139,92,246,0.4)',
                    '--bg-primary': '#121222', '--bg-secondary': '#090912',
                    '--bg-card': 'rgba(255,255,255,0.05)', '--bg-input': '#1a1a2e',
                    '--text-primary': '#ece8e0', '--text-secondary': '#9ea2b0',
                    '--text-muted': '#5a5f75', '--border-color': '#1f1f35'
                });
                toast('🌙 已切换为深色款式');
            } else {
                $(this).addClass('off');
                $(this).find('.knob').css('transform', 'translateX(0)');
                $(this).css('background', '#cbd5e1');
                modal.removeClass('dark-mode').addClass('light-mode');
                label.text('☀️ 蓝光款式');
                localStorage.setItem('phone-dark-mode', 'off');
                modal.css({
                    '--modal-bg': '#ffffff', '--modal-border': '#e2d9cd',
                    '--bg-primary': '#f8f9fb', '--bg-secondary': '#ffffff',
                    '--bg-card': 'rgba(0,0,0,0.035)', '--bg-input': '#f0f3f6',
                    '--text-primary': '#253342', '--text-secondary': '#5a6e85',
                    '--text-muted': '#a1b2c4', '--border-color': '#e6ecf2'
                });
                toast('☀️ 已切换为蓝光款式');
            }
        });
        console.log('✅ 深色模式开关已绑定');

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
                sw.css('background', '#06c755').removeClass('off');
                sw.find('.knob').css('transform', 'translateX(18px)');
            } else {
                sw.css('background', '#cbd5e1').addClass('off');
                sw.find('.knob').css('transform', 'translateX(0)');
            }

            const notifSw = $('#notif-switch');
            if (notifEnabled) {
                notifSw.css('background', '#06c755').removeClass('off');
                notifSw.find('.knob').css('transform', 'translateX(18px)');
            } else {
                notifSw.css('background', '#cbd5e1').addClass('off');
                notifSw.find('.knob').css('transform', 'translateX(0)');
            }

            const activeSw = $('#auto-active-switch');
            if (autoConfig.enabled) {
                activeSw.css('background', '#06c755').removeClass('off');
                activeSw.find('.knob').css('transform', 'translateX(18px)');
            } else {
                activeSw.css('background', '#cbd5e1').addClass('off');
                activeSw.find('.knob').css('transform', 'translateX(0)');
            }

            const aiSw = $('#auto-ai-switch');
            if (autoConfig.useAI) {
                aiSw.css('background', '#06c755').removeClass('off');
                aiSw.find('.knob').css('transform', 'translateX(18px)');
            } else {
                aiSw.css('background', '#cbd5e1').addClass('off');
                aiSw.find('.knob').css('transform', 'translateX(0)');
            }

            $('#active-interval-select').val(autoConfig.interval);

            const statusEl = $('#second-api-status');
            if (config.url && config.key && config.model) {
                statusEl.text(config.enabled ? '✅ 已启用' : '⏸️ 已配置（未启用）')
                         .css('color', config.enabled ? '#4caf50' : '#ffa726');
            } else {
                statusEl.text('未配置').css('color', '#666');
            }
        }

        $('#phone-screen').off('click.api').on('click.api', '#second-api-switch', function() {
            const config = getSecondApiConfig();
            config.enabled = !config.enabled;
            config.url   = $('#second-api-url').val().trim()   || config.url;
            config.key   = $('#second-api-key').val().trim()   || config.key;
            config.model = $('#second-api-model').val().trim() || config.model;
            saveSecondApiConfig(config);
            if (config.enabled) {
                $(this).css('background', '#06c755').removeClass('off');
                $(this).find('.knob').css('transform', 'translateX(18px)');
                toast('📡 第二 API 已启用');
            } else {
                $(this).css('background', '#cbd5e1').addClass('off');
                $(this).find('.knob').css('transform', 'translateX(0)');
                toast('📡 第二 API 已停用');
            }
            updateSettingsUI();
        });

        $('#phone-screen').off('change.api').on('change.api', '#second-api-models', function() {
            const val = $(this).val();
            if (val) $('#second-api-model').val(val);
        });

        $('#phone-screen').off('input.api').on('input.api', '#second-api-model', function() {
            const val = $(this).val().trim();
            if (val && availableModels.length > 0) {
                const $select = $('#second-api-models');
                if ($select.find(`option[value="${val}"]`).length > 0) {
                    $select.val(val);
                } else {
                    $select.val('');
                }
            }
        });

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
        console.log('✅ 准备绑定消息通知开关');
        $('#phone-screen').off('click.notif').on('click.notif', '#notif-switch', function() {
            const cur = isNotifEnabled();
            setNotifEnabled(!cur);
            if (!cur) {
                $(this).css('background', '#06c755').removeClass('off');
                $(this).find('.knob').css('transform', 'translateX(18px)');
                toast('🔔 消息通知已开启');
            } else {
                $(this).css('background', '#cbd5e1').addClass('off');
                $(this).find('.knob').css('transform', 'translateX(0)');
                toast('🔕 消息通知已关闭');
            }
        });
        console.log('✅ 消息通知开关已绑定');

        $('#phone-screen').off('click.active').on('click.active', '#auto-active-switch', function() {
            const config = getAutoActiveConfig();
            config.enabled = !config.enabled;
            saveAutoActiveConfig(config);
            if (config.enabled) {
                $(this).css('background', '#06c755').removeClass('off');
                $(this).find('.knob').css('transform', 'translateX(18px)');
                toast('🤖 角色主动发言已开启');
                startAutoActiveTimer();
            } else {
                $(this).css('background', '#cbd5e1').addClass('off');
                $(this).find('.knob').css('transform', 'translateX(0)');
                toast('🤖 角色主动发言已关闭');
                stopAutoActiveTimer();
            }
        });

        $('#phone-screen').off('click.ai').on('click.ai', '#auto-ai-switch', function() {
            const config = getAutoActiveConfig();
            config.useAI = !config.useAI;
            saveAutoActiveConfig(config);
            if (config.useAI) {
                $(this).css('background', '#06c755').removeClass('off');
                $(this).find('.knob').css('transform', 'translateX(18px)');
                toast('🧠 AI生成内容已开启');
            } else {
                $(this).css('background', '#cbd5e1').addClass('off');
                $(this).find('.knob').css('transform', 'translateX(0)');
                toast('🧠 AI生成内容已关闭');
            }
        });

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

        window._phoneAddFriend = function() {
            const name = prompt('请输入新好友的名字：');
            if (!name || !name.trim()) return;
            const trimmed = name.trim();
            if (chatData[trimmed]) { toast('该好友已存在'); return; }
            const relation = prompt('关系（如：同事/邻居/朋友）：', '好友') || '好友';
            chatData[trimmed] = {
                name: trimmed,
                avatarColor: '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0'),
                relation: relation,
                stage: '初识',
                lastMsg: '',
                time: '刚刚',
                online: true,
                unread: 0,
                bio: '这个人很懒，什么都没留下。',
                gallery: [],
                messages: [],
                posts: [],
                lastActiveTime: Date.now()
            };
            saveData();
            refreshFriendListUI();
            refreshChatListUI();
            toast('✅ 已添加好友：' + trimmed);
        };

        window._phoneDeleteFriend = function(name) {
            if (!chatData[name]) return;
            if (!confirm(`确定删除好友"${name}"吗？该角色的聊天记录、朋友圈都会一并删除。`)) return;
            delete chatData[name];
            saveData();
            refreshFriendListUI();
            refreshChatListUI();
            toast('🗑️ 已删除好友：' + name);
        };

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
        initEventTriggers();

        window._phoneNotif = {
            show: showNotif,
            isEnabled: isNotifEnabled,
            setEnabled: setNotifEnabled
        };

        if (window.innerWidth < 768) {
            setTimeout(() => {
                const container = document.getElementById('phone-overlay-container');
                if (container) {
                    container.style.display = 'flex';
                    container.style.justifyContent = 'center';
                    container.style.alignItems = 'center';
                    container.style.height = '100vh';
                    container.style.width = '100vw';
                }
                const modal = document.getElementById('phone-modal');
                if (modal) {
                    modal.style.height = '700px';
                    modal.style.maxHeight = '85vh';
                    modal.style.position = 'relative';
                    modal.style.transform = 'none';
                    modal.style.overflow = 'hidden';
                }
            }, 50);
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
        $('#chat-page-avatar').css('background', role.avatar && role.avatar.startsWith('http') ? 'transparent' : (role.avatarColor || '#888'));
        $('#chat-page-name').html(`${role.name} <span style="font-size:10px;font-weight:normal;opacity:0.6;">(${role.stage})</span>`);

        const bgUrl = role.chatBg || '';
        if (bgUrl && bgUrl.startsWith('http')) {
            $('#chat-messages').css({
                'background-image': `url(${bgUrl})`,
                'background-size': 'cover',
                'background-position': 'center',
                'background-repeat': 'no-repeat'
            });
        } else {
            $('#chat-messages').css('background-image', 'none');
        }

        const msgContainer = $('#chat-messages');
        msgContainer.empty();
        (role.messages || []).forEach(msg => {
const isMe = msg.from === 'me';
msgContainer.append(`
    <div class="message-bubble ${isMe ? 'self' : ''}" style="
        max-width:72%;padding:7px 13px;border-radius:16px;
        font-size:12px;line-height:1.5;
        align-self:${isMe ? 'flex-end' : 'flex-start'};
        background:${isMe ? '#06c755' : (isDarkMode ? '#2a2a3e' : '#e8ecf1')};
        color:${isMe ? '#fff' : (isDarkMode ? '#ece8e0' : '#253342')};
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
        $('#profile-avatar').css('background', (role.avatarLarge || role.avatar) && (role.avatarLarge || role.avatar).startsWith('http') ? 'transparent' : (role.avatarColor || '#888'));
        
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

    function filterChatList(value) {
        const items = $('.phone-chat-item');
        const lower = value.toLowerCase().trim();
        items.each(function() {
            const $item = $(this);
            const name = $item.find('.phone-chat-name').text().toLowerCase() || '';
            const msg = $item.find('.phone-chat-msg').text().toLowerCase() || '';
            const match = name.includes(lower) || msg.includes(lower);
            $item.toggle(match);
        });
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
    } catch (e) {
        console.warn('[小手机] 按钮挂载失败', e);
    }

    function initAutoActiveIfEnabled() {
        const config = getAutoActiveConfig();
        if (config.enabled) {
            startAutoActiveTimer();
        }
    }

    initAutoActiveIfEnabled();

    console.log('[小手机] 最终修复版加载完毕');
})();
