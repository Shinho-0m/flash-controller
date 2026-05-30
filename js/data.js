/* ============================================
   闪霍控制器 - 数据层
   Mock 数据 + localStorage 持久化
   ============================================ */

const AppData = {
  // ===== 默认用户数据 =====
  defaultUser: {
    id: 'user_001',
    username: '探索者',
    nickname: '新用户',
    avatar: '😎',
    bio: '闪霍控制器的掌控者 ✨',
    level: 1,
    exp: 0,
    coins: 100,
    points: 0,
    followers: 23,
    following: 18,
    posts: 5,
    settings: {
      notifications: true,
      sound: true,
      vibration: true,
      privacyMode: false,
    },
    trainingRecords: []
  },

  // ===== 预设头像库 =====
  avatars: ['😎', '😈', '👑', '🖤', '💜', '🔥', '⚡', '💎', '🌙', '🐉', '🦊', '🐺', '🎭', '💀', '🗡️'],

  // ===== 预设 AI 角色 =====
  aiCharacters: [
    {
      id: 'ai_001',
      name: '暗夜女王',
      avatar: '👸🏻',
      role: '支配型',
      desc: '高冷威严，喜欢发号施令。在她面前，你只能乖乖服从。',
      personality: 'dominant',
      mood: 5,
      online: true,
      replies: [
        '很好，你今天还算听话。',
        '跪下！我不允许你站起来。',
        '哼，就这点程度吗？我可是很挑剔的。',
        '不错，继续表现，也许我会奖励你。',
        '你在想什么？我都能看穿哦~',
        '今天的你，让我很满意呢。'
      ],
      quickReplies: ['是，女王大人', '请惩罚我', '我想你了', '我准备好了']
    },
    {
      id: 'ai_002',
      name: '魅惑妖姬',
      avatar: '😈',
      role: '诱惑型',
      desc: '温柔又危险，像毒药一样让人上瘾。每句话都是陷阱。',
      personality: 'seductive',
      mood: 7,
      online: true,
      replies: [
        '哎呀，你来了~我都等好久了呢',
        '靠近一点...再近一点...',
        '嘻嘻，你是不是在想坏事？',
        '你的心跳声，我听得一清二楚哦~',
        '今晚，只属于我们两个人...',
        '真是个可爱的坏孩子呢~'
      ],
      quickReplies: ['你好美', '我想亲近你', '告诉我更多', '今晚可以吗']
    },
    {
      id: 'ai_003',
      name: '冰山管家',
      avatar: '🎩',
      role: '严肃型',
      desc: '一丝不苟的完美主义者，执行规则从不打折扣。效率至上。',
      personality: 'strict',
      mood: 4,
      online: true,
      replies: [
        '主人，现在是早上6点，该起床了。',
        '根据规定，第3条指令需要立即执行。',
        '您的完成度只有72%，还需努力。',
        '不允许讨价还价。这是规矩。',
        '记录已保存。今日表现：合格。',
        '休息时间结束。下一项任务已准备就绪。'
      ],
      quickReplies: ['收到，执行', '请求延时', '查看任务', '汇报情况']
    },
    {
      id: 'ai_004',
      name: '小恶魔',
      avatar: '😈‍',
      role: '顽皮型',
      desc: '永远长不大，恶作剧不断。但关键时刻意外可靠。',
      personality: 'playful',
      mood: 9,
      online: true,
      replies: [
        '嘿嘿，猜猜我给你准备了什么~',
        '抓到你了！没地方跑了吧~',
        '无聊死了，快来陪我玩嘛！',
        '才不告诉你~自己猜呀~',
        '好啦好啦，不逗你了...才怪！',
        '你最好了！给我买糖吃好不好~'
      ],
      quickReplies: ['好啊陪你玩', '什么惊喜', '别闹了', '好好好买给你']
    },
    {
      id: 'ai_005',
      name: '神秘占卜师',
      avatar: '🔮',
      role: '神秘型',
      desc: '能看穿人心底的秘密，每一句预言都让人欲罢不能。',
      personality: 'mysterious',
      mood: 6,
      online: false,
      replies: [
        '我看到了...你和某个人的命运纠缠在一起...',
        '星星说，今天你会遇到一个重要抉择。',
        '嗯...你的欲望比你自己以为的要强烈得多。',
        '塔罗牌显示——你正在被某种力量吸引...',
        '闭上眼睛...我能感觉到你的渴望在涌动...',
        '命运的齿轮已经开始转动了...'
      ],
      quickReplies: ['是什么命运', '帮我占卜', '我想知道未来', '再详细点']
    }
  ],

  // ===== 虚拟设备 =====
  devices: [
    { id: 'dev_001', name: '暗影束缚器', icon: '⛓️', status: 'online', type: 'restraint', intensity: 0, mode: 'pulse' },
    { id: 'dev_002', name: '脉冲环', icon: '💫', status: 'online', type: 'stimulation', intensity: 0, mode: 'wave' },
    { id: 'dev_003', name: '感应锁', icon: '🔒', status: 'offline', type: 'lock', intensity: 0, mode: 'steady' },
    { id: 'dev_004', name: '震颤核心', icon: '⚡', status: 'online', type: 'vibration', intensity: 0, mode: 'random' },
  ],

  // ===== 设备模式 =====
  modes: [
    { id: 'steady', name: '恒定', icon: '📊', desc: '稳定持续的输出' },
    { id: 'pulse', name: '脉冲', icon: '💓', desc: '有节奏的间歇刺激' },
    { id: 'wave', name: '波浪', icon: '🌊', desc: '如潮水般起伏变化' },
    { id: 'random', name: '随机', icon: '🎲', desc: '不可预测的惊喜模式' },
    { id: 'spiral', name: '螺旋', icon: '🌀', desc: '逐渐增强后减弱' },
    { id: 'burst', name: '爆发', icon: '💥', desc: '短促而强烈的冲击' },
  ],

  // ===== 快捷指令 =====
  quickCommands: [
    { id: 'cmd_01', icon: '▶️', label: '启动' },
    { id: 'cmd_02', icon: '⏸️', label: '暂停' },
    { id: 'cmd_03', icon: '🔥', label: '最大' },
    { id: 'cmd_04', icon: '🌙', label: '温柔' },
    { id: 'cmd_05', icon: '⚡', label: '电击' },
    { id: 'cmd_06', icon: '🔄', label: '循环' },
    { id: 'cmd_07', icon: '📈', label: '递增' },
    { id: 'cmd_08', icon: '📉', label: '递减' },
  ],

  // ===== 控制历史 =====
  controlHistory: [],

  // ===== 社区动态（初始 Mock 数据） =====
  posts: [
    {
      id: 'post_001',
      authorId: 'user_demo1',
      authorName: '暗夜行者',
      authorAvatar: '🖤',
      time: '10分钟前',
      content: '今天试了新的脉冲模式，体验感直接拉满...感觉整个人都飘起来了 🤤',
      image: '🌃',
      likes: 128,
      comments: 34,
      liked: false
    },
    {
      id: 'post_002',
      authorId: 'user_demo2',
      authorName: '星尘少女',
      authorAvatar: '✨',
      time: '32分钟前',
      content: '有没有人一起组队的？一个人玩太无聊了 😭 求带求带！',
      image: null,
      likes: 67,
      comments: 22,
      liked: false
    },
    {
      id: 'post_003',
      authorId: 'user_demo3',
      authorName: '支配者Z',
      authorAvatar: '👑',
      time: '1小时前',
      content: '新人报道！听说这里高手如云，来领教一下 👑\n顺便问下哪个设备性价比最高？',
      image: null,
      likes: 89,
      comments: 56,
      liked: false
    },
    {
      id: 'post_004',
      authorId: 'user_demo4',
      authorName: '月光猫咪',
      authorAvatar: '🐱',
      time: '2小时前',
      content: '分享一个小心得：把模式调成螺旋+强度35%，然后定时15分钟...绝了 💜\n亲测有效，感谢群友们的建议！',
      image: '🌙',
      likes: 256,
      comments: 78,
      liked: true
    }
  ],

  // ===== 用户发现/推荐（增强版）=====
  discoverUsers: [
    { id: 'u_d1', nickname: '暗夜行者', avatar: '🖤', bio: '探索未知的边界', level: 12, isFollowed: false },
    { id: 'u_d2', nickname: '星尘少女', avatar: '✨', bio: '闪闪发光每一天', level: 8, isFollowed: false },
    { id: 'u_d3', nickname: '支配者Z', avatar: '👑', bio: '规则由我来定', level: 15, isFollowed: true },
    { id: 'u_d4', nickname: '月光猫咪', avatar: '🐱', bio: '慵懒但不懒惰', level: 6, isFollowed: false },
    { id: 'u_d5', nickname: '深渊之眼', avatar: '👁️', bio: '凝视深渊中...', level: 20, isFollowed: false },
  ],

  // ===== 任务列表（旧格式兼容，已迁移到上面增强版）=====

  // ===== 商城商品（增强版）=====
  shopItems: [
    { id: 'shop_01', name: '暗金贵族主题', icon: '👑', price: 288, description: '尊贵暗金色主题皮肤', category: 'device', color1: '#1a1500', color2: '#3d3400', isHot: true, isNew: false },
    { id: 'shop_02', name: '紫罗兰梦境', icon: '💜', price: 168, description: '神秘紫色渐变主题', category: 'avatar', color1: '#1a0a2e', color2: '#2d1b4e', isHot: false, isNew: false },
    { id: 'shop_03', name: '绯红诱惑', icon: '🌹', price: 198, description: '炽热红色激情主题', category: 'effect', color1: '#2e0a0a', color2: '#4e1b1b', isHot: false, isNew: true },
    { id: 'shop_04', name: '极光幻彩', icon: '🌌', price: 228, description: '北极光般绚丽效果', category: 'effect', color1: '#0a1a2e', color2: '#1b3d5e', isHot: false, isNew: false },
    { id: 'shop_05', name: '午夜黑金', icon: '🖤', price: 138, description: '低调奢华黑金配色', category: 'device', color1: '#0a0a0f', color2: '#1a1a20', isHot: true, isNew: false },
    { id: 'shop_06', name: '赛博霓虹', icon: '🌆', price: 188, description: '未来科技霓虹风格', category: 'card', color1: '#0a0a2e', color2: '#1a0a3e', isHot: false, isNew: false },
    { id: 'shop_07', name: '玫瑰金边框', icon: '🏵️', price: 58, description: '精致玫瑰金头像边框', category: 'avatar', color1: '#2e1a0a', color2: '#4e2d1b', isHot: false, isNew: false },
    { id: 'shop_08', name: '专属称号·主宰', icon: '🏷️', price: 388, description: '稀有专属称号徽章', category: 'card', color1: '#2e2e0a', color2: '#4e4e1b', isHot: false, isNew: true },
  ],

  // ===== 任务列表（增强版）=====
  tasks: [
    { id: 'task_001', icon: '🔑', name: '每日登录', description: '每天打开闪霍控制器', type: 'login', expReward: 10, coinReward: 5, completed: false, claimed: false },
    { id: 'task_002', icon: '🎛️', name: '设备操控', description: '使用控制面板完成一次操作', type: 'control', expReward: 20, coinReward: 10, completed: false, claimed: false },
    { id: 'task_003', icon: '📝', name: '社交互动', description: '发布动态或评论/点赞他人', type: 'social', expReward: 15, coinReward: 8, completed: false, claimed: false },
    { id: 'task_004', icon: '🤖', name: 'AI 对话', description: '与 AI 角色进行对话交流', type: 'chat', expReward: 25, coinReward: 12, completed: false, claimed: false },
    { id: 'task_005', icon: '📤', name: '分享应用', description: '将闪霍控制器分享给朋友', type: 'share', expReward: 30, coinReward: 20, completed: false, claimed: false },
  ],

  // ===== 成就徽章（增强版）=====
  achievements: [
    { id: 'ach_first_login', name: '初次见面', icon: '👋', desc: '完成首次登录', reward: 50, unlocked: false },
    { id: 'ach_first_task', name: '行动派', icon: '✅', desc: '完成第一个每日任务', reward: 30, unlocked: false },
    { id: 'ach_task_master', name: '任务大师', icon: '🏆', desc: '单日完成所有任务', reward: 100, unlocked: false },
    { id: 'ach_social_butterfly', name: '社交达人', icon: '🦋', desc: '关注或被3人以上关注', reward: 60, unlocked: false },
    { id: 'ach_controller', name: '操控专家', icon: '🎛️', desc: '使用控制面板10次以上', reward: 80, unlocked: false },
    { id: 'ach_level_5', name: '初露锋芒', icon: '⭐', desc: '等级达到 Lv.5', reward: 120, unlocked: false },
    { id: 'ach_rich', name: '小富翁', icon: '💰', desc: '累计拥有500金币', reward: 200, unlocked: false },
    { id: 'ach_explorer', name: '探索者', icon: '🧭', desc: '浏览过App的所有主要功能模块', reward: 100, unlocked: false },
  ],

  // ===== 聊天消息（模拟） =====
  chatContacts: [
    { id: 'chat_01', name: '暗夜女王', avatar: '👸🏻', lastMsg: '很好，你今天还算听话。', time: '刚刚', unread: 2 },
    { id: 'chat_02', name: '魅惑妖姬', avatar: '😈', lastMsg: '嘿嘿，你来啦~', time: '5分钟前', unread: 0 },
    { id: 'chat_03', name: '系统通知', avatar: '🔔', lastMsg: '恭喜完成任务「首次登录」！获得+50积分', time: '1小时前', unread: 1 },
    { id: 'chat_04', name: '星尘少女', avatar: '✨', lastMsg: '好的那一起吧！', time: '昨天', unread: 0 },
  ],

  // ===== 通知列表 =====
  notifications: [
    { id: 'notif_01', type: 'system', text: '欢迎来到闪霍控制器！开始你的旅程吧 ✨', time: '刚刚', read: false },
    { id: 'notif_02', type: 'follow', text: '支配者Z 关注了你', time: '10分钟前', read: false },
    { id: 'notif_03', type: 'like', text: '暗夜行者 赞了热门动态', time: '30分钟前', read: true },
    { id: 'notif_04', type: 'task', text: '每日任务已刷新，快去领取奖励！', time: '2小时前', read: false },
    { id: 'notif_05', type: 'system', text: '新版本 v2.0 已上线，新增AI角色功能', time: '昨天', read: true },
  ],

  // ===== localStorage 工具方法 =====
  save(key, data) {
    try {
      localStorage.setItem('fc_' + key, JSON.stringify(data));
    } catch (e) {
      console.warn('存储失败:', e);
    }
  },

  load(key, fallback = null) {
    try {
      const data = localStorage.getItem('fc_' + key);
      const result = data ? JSON.parse(data) : fallback;
      // 🔒 用户数据安全校验：自动修复缺失/损坏字段
      if (key === 'user' && result && typeof result === 'object') {
        const safe = { ...this.defaultUser, ...result };
        if (!safe.nickname) safe.nickname = this.defaultUser.nickname;
        if (!safe.username) safe.username = this.defaultUser.username;
        if (!safe.avatar) safe.avatar = this.defaultUser.avatar;
        return safe;
      }
      // 如果 user 数据为 null/undefined，返回默认值
      if (key === 'user' && (!result || typeof result !== 'object')) {
        return { ...this.defaultUser };
      }
      // 🔒 数组类数据安全校验
      const arrayKeys = ['tasks', 'achievements', 'shopItems', 'chatContacts', 'notifications', 'discoverUsers', 'posts', 'devices', 'controlHistory'];
      if (arrayKeys.includes(key) && !Array.isArray(result)) {
        console.warn('[闪霍] 数据损坏修复: fc_' + key);
        return fallback;
      }
      return result;
    } catch (e) {
      console.warn('读取失败:', e);
      return key === 'user' ? { ...this.defaultUser } : fallback;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem('fc_' + key);
    } catch (e) {}
  },

  // 初始化所有数据
  init() {
    // 🔧 数据迁移：修复已存在的损坏用户数据（旧版空字符串问题）
    try {
      const rawUserStr = localStorage.getItem('fc_user');
      if (rawUserStr) {
        const rawUser = JSON.parse(rawUserStr);
        if (rawUser && (!rawUser.nickname || !rawUser.username || rawUser.username === '' || rawUser.nickname === '')) {
          const fixed = { ...this.defaultUser, ...rawUser };
          if (!fixed.nickname) fixed.nickname = this.defaultUser.nickname;
          if (!fixed.username) fixed.username = this.defaultUser.username;
          localStorage.setItem('fc_user', JSON.stringify(fixed));
          console.log('[闪霍] 已自动修复用户数据');
        }
      }
    } catch (e) { /* 忽略 */ }

    if (!this.load('initialized')) {
      // 不自动创建 user，等用户注册后再创建
      // this.save('user', { ...this.defaultUser });
      this.save('posts', [...this.posts]);
      this.save('devices', JSON.parse(JSON.stringify(this.devices)));
      // 使用增强版任务数据
      this.save('tasks', JSON.parse(JSON.stringify(this.tasks)));
      this.save('controlHistory', []);
      // 使用增强版成就数据
      this.save('achievements', JSON.parse(JSON.stringify(this.achievements)));
      this.save('discoverUsers', JSON.parse(JSON.stringify(this.discoverUsers)));
      this.save('notifications', JSON.parse(JSON.stringify(this.notifications)));
      this.save('chatContacts', JSON.parse(JSON.stringify(this.chatContacts)));
      this.save('chats', {});
      // 初始化商城
      this.save('shopItems', JSON.parse(JSON.stringify(this.shopItems)));
      this.save('initialized', true);
    }
  },

  // 初始化所有数据（供 index.html 调用的别名）
  initAll() {
    this.init();
  },

  // 重置所有数据
  reset() {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('fc_')) localStorage.removeItem(key);
    });
    this.init();
  }
};

// ===== Data 全局别名（供各模块使用）=====
// 兼容两种调用方式: AppData.load() 和 Data.load()
const Data = {
  save(key, data) { return AppData.save(key, data); },
  load(key, fallback) {
    const result = AppData.load(key, fallback);
    // 安全校验：如果结果不是预期的对象/数组，返回 fallback 或 init
    if (key === 'user' && (!result || typeof result !== 'object')) {
      return { ...AppData.defaultUser };
    }
    if (['tasks', 'achievements', 'shopItems', 'chatContacts', 'notifications', 'discoverUsers', 'posts'].includes(key)) {
      if (!Array.isArray(result)) return this.init(key);
    }
    return result;
  },
  remove(key) { return AppData.remove(key); },
  init(key) {
    // 返回指定数据的初始副本
    const defaults = {
      tasks: AppData.tasks,
      achievements: AppData.achievements,
      shopItems: AppData.shopItems,
      chatContacts: AppData.chatContacts,
      notifications: AppData.notifications,
      discoverUsers: AppData.discoverUsers,
      posts: AppData.posts,
    };
    if (defaults[key]) {
      return JSON.parse(JSON.stringify(defaults[key]));
    }
    return [];
  },
  initAll() { return AppData.initAll(); }
};
window.Data = Data;
