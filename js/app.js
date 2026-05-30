/* ============================================
   闪霍控制器 - 主应用
   SPA 路由 + 页面管理 + 全局状态
   ============================================ */

const App = {
  currentPage: 'splash',
  isLoggedIn: false,
  previousPage: null,
  pageHistory: [],

  // ===== 初始化 =====
  init() {
    AppData.init();

    // 严格判断：users 注册表有记录 = 真正注册过
    const users = AppData.load('users', {});
    const user = AppData.load('user');

    // 三种情况认为已登录：
    // 1. users 表有记录（注册过）
    // 2. user 对象存在且 username 不是默认值
    this.isLoggedIn = (users && typeof users === 'object' && Object.keys(users).length > 0)
      || (user && user.username && user.username !== AppData.defaultUser.username);

    this.renderApp();
    this.bindEvents();

    // 启动页自动跳转
    const seenGuide = AppData.load('seenGuide');
    if (this.isLoggedIn) {
      setTimeout(() => this.navigateTo('home'), 2000);
    } else {
      // 未登录 → 强制走引导/登录流程
      setTimeout(() => {
        this.navigateTo(seenGuide ? 'login' : 'guide');
      }, 2500);
    }
  },

  // ===== 渲染整个 App 结构 =====
  renderApp() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <!-- 启动页 -->
      <div id="page-splash" class="page active">
        <div id="splash-page">
          <div class="splash-particles" id="particles"></div>
          <div class="splash-logo"><img src="assets/mascot.png" alt="闪霍" class="mascot-img"></div>
          <div class="splash-title">闪霍控制器</div>
          <div class="splash-subtitle">FLASH CONTROLLER</div>
        </div>
      </div>

      <!-- 引导页 -->
      <div id="page-guide" class="page">
        <div class="guide-container" id="guide-container"></div>
      </div>

      <!-- 登录/注册 -->
      <div id="page-login" class="page"></div>

      <!-- 首页（信息流） -->
      <div id="page-home" class="page">
        <div class="header">
          <span></span>
          <span class="header-title"><img src="assets/mascot.png" alt="" class="header-mascot">闪霍控制器</span>
          <button class="header-btn" onclick="App.navigateTo('notifications')">🔔<span class="count-badge" style="${App.getUnreadNotifs() > 0 ? '' : 'display:none'}">${App.getUnreadNotifs()}</span></button>
        </div>
        <div class="page-content" id="home-content"></div>
        ${this.renderTabbar()}
      </div>

      <!-- 控制面板 -->
      <div id="page-control" class="page">
        <div class="header">
          <span></span>
          <span class="header-title">控制面板</span>
          <span></span>
        </div>
        <div class="page-content" id="control-content"></div>
        ${this.renderTabbar()}
      </div>

      <!-- 发现/广场 -->
      <div id="page-discover" class="page">
        <div class="header">
          <span></span>
          <span class="header-title">发现</span>
          <span></span>
        </div>
        <div class="page-content" id="discover-content"></div>
        ${this.renderTabbar()}
      </div>

      <!-- 消息/聊天 -->
      <div id="page-chat" class="page">
        <div class="header">
          <span></span>
          <span class="header-title">消息</span>
          <button class="header-btn" onclick="">✏️</button>
        </div>
        <div class="page-content" id="chat-list-content"></div>
        ${this.renderTabbar()}
      </div>

      <!-- 个人主页 -->
      <div id="page-profile" class="page">
        <div class="header">
          <span></span>
          <span class="header-title">我的</span>
          <button class="header-btn" onclick="App.navigateTo('settings')">⚙️</button>
        </div>
        <div class="page-content" id="profile-content"></div>
        ${this.renderTabbar()}
      </div>

      <!-- 玩法/训练 -->
      <div id="page-training" class="page">
        <div class="header">
          <span></span>
          <span class="header-title">玩法</span>
          <span></span>
        </div>
        <div class="page-content" id="training-content"></div>
        ${this.renderTabbar()}
      </div>

      <!-- AI 角色中心 -->
      <div id="page-ai" class="page">
        <div class="header">
          <button class="header-btn" onclick="App.goBack()">←</button>
          <span class="header-title">AI 角色中心</span>
          <span></span>
        </div>
        <div class="page-content" id="ai-content"></div>
      </div>

      <!-- AI 对话页 -->
      <div id="page-ai-chat" class="page">
        <div class="header">
          <button class="header-btn" onclick="App.goBack()">←</button>
          <span class="header-title" id="ai-chat-name">对话中...</span>
          <span></span>
        </div>
        <div id="ai-chat-messages" class="chat-messages"></div>
        <div class="reply-options" id="ai-reply-options"></div>
      </div>

      <!-- 任务中心 -->
      <div id="page-tasks" class="page">
        <div class="header">
          <button class="header-btn" onclick="App.goBack()">←</button>
          <span class="header-title">任务中心</span>
          <span></span>
        </div>
        <div class="page-content" id="tasks-content"></div>
      </div>

      <!-- 商城 -->
      <div id="page-shop" class="page">
        <div class="header">
          <button class="header-btn" onclick="App.goBack()">←</button>
          <span class="header-title">商城</span>
          <span class="header-badge text-gold" style="font-size:13px;">💰 ${AppData.load('user', AppData.defaultUser).coins}</span>
        </div>
        <div class="page-content" id="shop-content"></div>
      </div>

      <!-- 设置页 -->
      <div id="page-settings" class="page">
        <div class="header">
          <button class="header-btn" onclick="App.goBack()">←</button>
          <span class="header-title">设置</span>
          <span></span>
        </div>
        <div class="page-content" id="settings-content"></div>
      </div>

      <!-- 编辑资料页 -->
      <div id="page-edit-profile" class="page">
        <div class="header">
          <button class="header-btn" onclick="App.goBack()">←</button>
          <span class="header-title">编辑资料</span>
          <button class="header-btn btn-ghost" style="font-size:13px;" onclick="Auth.saveProfile()">保存</button>
        </div>
        <div class="page-content" id="edit-profile-content"></div>
      </div>

      <!-- 发布动态页 -->
      <div id="page-post-create" class="page">
        <div class="header">
          <button class="header-btn" onclick="App.goBack()">取消</button>
          <span class="header-title">发布动态</span>
          <button class="header-btn btn-ghost" style="font-size:13px;color:var(--gold-primary);" onclick="Social.publishPost()">发布</button>
        </div>
        <div class="page-content" id="post-create-content"></div>
      </div>

      <!-- 用户详情页 -->
      <div id="page-user-detail" class="page">
        <div class="header">
          <button class="header-btn" onclick="App.goBack()">←</button>
          <span class="header-title" id="user-detail-name">用户</span>
          <span></span>
        </div>
        <div class="page-content" id="user-detail-content"></div>
      </div>

      <!-- 通知列表页 -->
      <div id="page-notifications" class="page">
        <div class="header">
          <button class="header-btn" onclick="App.goBack()">←</button>
          <span class="header-title">通知</span>
          <button class="header-btn btn-ghost" style="font-size:12px;" onclick="App.markAllRead()">全部已读</button>
        </div>
        <div class="page-content" id="notif-content"></div>
      </div>

      <!-- Toast -->
      <div class="toast" id="toast"></div>
    `;

    // 生成启动页粒子
    this.createParticles();
  },

  // ===== TabBar 底部导航 =====
  renderTabbar() {
    return `
    <nav class="tabbar" id="tabbar">
      <div class="tab-item active" data-page="home" onclick="App.switchTab(this)">
        <span class="tab-icon">🏠</span>
        <span class="tab-label">首页</span>
      </div>
      <div class="tab-item" data-page="control" onclick="App.switchTab(this)">
        <span class="tab-icon">🎛️</span>
        <span class="tab-label">控制</span>
      </div>
      <div class="tab-item" data-page="discover" onclick="App.switchTab(this)">
        <span class="tab-icon">🔍</span>
        <span class="tab-label">发现</span>
      </div>
      <div class="tab-item" data-page="chat" onclick="App.switchTab(this)">
        <span class="tab-icon">💬</span>
        <span class="tab-label">消息</span>
      </div>
      <div class="tab-item" data-page="profile" onclick="App.switchTab(this)">
        <span class="tab-icon">👤</span>
        <span class="tab-label">我的</span>
      </div>
      <div class="tab-item" data-page="training" onclick="App.switchTab(this)">
        <span class="tab-icon">🕹️</span>
        <span class="tab-label">玩法</span>
      </div>
    </nav>`;
  },

  // ===== 创建粒子效果 =====
  createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    const count = 60;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const size = 2 + Math.random() * 5;
      const colors = ['#d4af37','#f0d060','#c9a227','#ffe066','#ffd700'];
      p.style.cssText = `
        left: ${Math.random() * 100}%;
        bottom: ${-10 + Math.random() * 30}%;
        width: ${size}px;
        height: ${size}px;
        background: ${colors[Math.floor(Math.random()*colors.length)]};
        opacity: 0;
        animation-delay: ${Math.random() * 5}s;
        animation-duration: ${3 + Math.random() * 4}s;
        animation-name: particle-float-${Math.floor(Math.random()*3)};
      `;
      container.appendChild(p);
    }
  },

  // ===== 页面导航 =====
  navigateTo(page, data) {
    const pages = document.querySelectorAll('.page');
    let target = document.getElementById('page-' + page);

    // 🔧 对于 chat-detail 等动态页面，先创建容器
    if (!target && page === 'chat-detail') {
      target = document.createElement('div');
      target.id = 'page-chat-detail';
      target.className = 'page';
      document.getElementById('app').appendChild(target);
    }

    if (!target) return;

    // 记录历史
    if (this.currentPage !== page) {
      this.previousPage = this.currentPage;
      this.pageHistory.push(this.currentPage);
    }

    // 隐藏所有页面
    pages.forEach(p => {
      p.classList.remove('active', 'slide-left');
    });

    // 显示目标页面
    target.classList.add('active');

    // 更新 TabBar 状态
    const tabItems = document.querySelectorAll('.tab-item');
    tabItems.forEach(t => t.classList.remove('active'));
    const activeTab = document.querySelector(`.tab-item[data-page="${page}"]`);
    if (activeTab) activeTab.classList.add('active');

    this.currentPage = page;

    // 🔧 滚动到顶部 — 确保用户总能看到页面顶部内容
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    const appEl = document.getElementById('app');
    if (appEl) appEl.scrollTop = 0;
    // 重置所有页面容器内部的滚动位置
    document.querySelectorAll('.page').forEach(p => { p.scrollTop = 0; });

    // 渲染页面内容
    this.renderPageContent(page, data);
  },

  // ===== 返回上一页 =====
  goBack() {
    // 特殊页面：设置/编辑资料 等直接回到 profile
    const alwaysBackToProfile = ['settings', 'edit-profile'];
    if (alwaysBackToProfile.includes(this.currentPage)) {
      this.pageHistory = [];
      this.navigateTo('profile');
      return;
    }

    if (this.pageHistory.length > 0) {
      const prev = this.pageHistory.pop();
      // 防止循环：如果上一页就是当前页，继续往前找
      if (prev === this.currentPage && this.pageHistory.length > 0) {
        const prevPrev = this.pageHistory.pop();
        this.navigateTo(prevPrev);
      } else {
        this.navigateTo(prev);
      }
    } else {
      // 默认返回个人页或首页
      const mainPages = ['home', 'control', 'discover', 'chat', 'profile', 'training'];
      if (mainPages.includes(this.currentPage)) return;
      this.navigateTo('profile');
    }
  },

  // ===== Tab 切换（无动画） =====
  switchTab(tabEl) {
    const page = tabEl.dataset.page;
    this.pageHistory = [];
    this.navigateTo(page);
  },

  // ===== 渲染各页面内容 =====
  renderPageContent(page, data) {
    const appEl = document.getElementById('app');

    switch (page) {
      case 'splash': break; // 静态内容，无需渲染
      case 'guide': this.renderGuide(); break;
      case 'login': Auth.renderLogin(); break;

      // TabBar 主页面
      case 'home': Social.renderHome(); break;           // 自己操作 DOM
      case 'control': ControlPanel.render(); break;       // 自己操作 DOM
      case 'discover': Discover.render(); break;          // 自己操作 DOM
      case 'chat': {                                     // 返回 HTML 字符串
        const chatEl = document.getElementById('chat-list-content');
        if (chatEl) chatEl.innerHTML = Chat.render();
        break;
      }
      case 'profile': Profile.render(); break;           // 自己操作 DOM
      case 'training': {
        // 离开时清理之前的训练状态
        if (Training && Training.destroy) Training.destroy();
        const el = document.getElementById('training-content');
        if (el) {
          el.innerHTML = Training.render();
          Training.init();
        }
        break;
      }

      // 子页面（直接调用模块渲染函数，它们自己操作 DOM）
      case 'ai': {
        AICenter.render();
        break;
      }
      case 'ai-chat': {
        AICenter.renderChat(data);
        break;
      }
      case 'tasks': {
        const el = document.getElementById('tasks-content');
        if (el) el.innerHTML = Tasks.render();
        break;
      }
      case 'shop': {
        const el = document.getElementById('shop-content');
        if (el) el.innerHTML = Shop.render();
        break;
      }
      case 'settings': {
        Settings.render();
        break;
      }
      case 'edit-profile': {
        Profile.renderEdit();
        break;
      }
      case 'post-create': {
        Social.renderCreatePost();
        break;
      }
      case 'user-detail': {
        Profile.renderUserDetail(data);
        break;
      }

      // 聊天详情页
      case 'chat-detail': {
        const chatDetailPage = document.getElementById('page-chat-detail');
        if (chatDetailPage) chatDetailPage.innerHTML = Chat.renderDetail(data?.targetId);
        break;
      }

      case 'notifications': this.renderNotifications(); break;
    }
  },

  // ===== 渲染引导页 =====
  renderGuide() {
    const slides = [
      { icon: '🎛️', title: '掌控一切', desc: '强大的虚拟控制面板，多种设备、多种模式，尽在指尖。' },
      { icon: '🤖', title: 'AI 伴侣', desc: '多位性格各异的 AI 角色，24小时陪你互动，永不离线。' },
      { icon: '🌐', title: '神秘社区', desc: '与志同道合的伙伴分享交流，发现更多有趣玩法。' },
      { icon: '🎁', title: '任务与奖励', desc: '完成任务获取积分和成就，解锁专属主题和特权。' },
    ];

    let dotsHtml = '';
    for (let i = 0; i < slides.length; i++) {
      dotsHtml += `<div class="guide-dot${i === 0 ? ' active' : ''}" onclick="Guide.goToSlide(${i})"></div>`;
    }

    let slidesHtml = '';
    slides.forEach((s, i) => {
      slidesHtml += `
        <div class="guide-slide${i === 0 ? ' active' : ''}" data-slide="${i}">
          <div class="guide-icon">${s.icon}</div>
          <div class="guide-title">${s.title}</div>
          <div class="guide-desc">${s.desc}</div>
        </div>`;
    });

    const container = document.getElementById('guide-container');
    if (container) {
      container.innerHTML = `
        ${slidesHtml}
        <div class="guide-dots">${dotsHtml}</div>
        <button class="guide-start-btn" onclick="Guide.start()">立即开始 →</button>
      `;
    }
  },

  // ===== 渲染通知列表 =====
  renderNotifications() {
    const notifs = AppData.load('notifications', AppData.notifications);
    if (!Array.isArray(notifs)) return;
    const el = document.getElementById('notif-content');
    if (!el) return;

    if (notifs.length === 0) {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">🔔</div><div class="empty-text">暂无通知</div><div class="empty-hint">有新消息时会在这里显示哦~</div></div>`;
      return;
    }

    el.innerHTML = notifs.map(n => `
      <div class="list-item" style="${n.read ? 'opacity:0.6;' : ''}">
        <div class="avatar avatar-sm">${n.type === 'system' ? '🔔' : n.type === 'follow' ? '👤' : n.type === 'like' ? '❤️' : '✅'}</div>
        <div class="list-item-info">
          <div class="list-item-name">${n.text}</div>
          <div class="list-item-desc">${n.time}</div>
        </div>
        ${!n.read ? '<div style="width:8px;height:8px;border-radius:50%;background:var(--gold-primary);flex-shrink:0;"></div>' : ''}
      </div>
    `).join('');
  },

  markAllRead() {
    let notifs = AppData.load('notifications', AppData.notifications);
    if (!Array.isArray(notifs)) return;
    notifs.forEach(n => n.read = true);
    AppData.save('notifications', notifs);
    this.renderNotifications();
    App.showToast('已全部标记为已读');
  },

  getUnreadNotifs() {
    const notifs = AppData.load('notifications', AppData.notifications);
    if (!Array.isArray(notifs)) return 0;
    return notifs.filter(n => !n.read).length;
  },

  // ===== Toast 提示 =====
  showToast(msg, duration = 2000) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
  },

  // ===== 全局事件绑定 =====
  bindEvents() {
    // 返回键处理
    window.addEventListener('popstate', () => this.goBack());
  },

  // ===== Modal 弹窗系统 =====
  showModal(contentHTML, onClose) {
    // 移除已有 modal
    this.closeModal();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'global-modal';
    overlay.innerHTML = `<div class="modal-box">${contentHTML}</div>`;
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.closeModal();
        if (onClose) onClose();
      }
    });
    document.body.appendChild(overlay);

    requestAnimationFrame(() => overlay.classList.add('show'));
  },

  closeModal() {
    const modal = document.getElementById('global-modal');
    if (modal) {
      modal.classList.remove('show');
      setTimeout(() => modal.remove(), 300);
    }
  },

  // ===== 便捷方法：重新渲染当前页面 =====
  renderPage(pageName) {
    const target = document.getElementById('page-' + pageName);
    if (target && target.classList.contains('active')) {
      this.renderPageContent(pageName, null);
    } else {
      this.navigateTo(pageName);
    }
  },

  // ===== 头像渲染辅助 =====
  // 支持 emoji 和图片 URL（data: / http:）
  renderAvatar(avatar, fallback = '😎') {
    const src = avatar || fallback;
    if (src.startsWith('data:') || src.startsWith('http')) {
      return `<img src="${src}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
    }
    return src;
  },
};

// ===== 全局 Toast（供各模块使用）=====
const Toast = {
  show(msg, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    // 设置类型样式
    toast.className = 'toast';
    if (type === 'success') toast.classList.add('toast-success');
    else if (type === 'error') toast.classList.add('toast-error');
    else if (type === 'achievement') toast.classList.add('toast-achievement');

    // 根据类型加图标前缀
    const icon = { success: '✅', error: '❌', achievement: '🏆', info: 'ℹ️', warning: '⚠️' };
    toast.textContent = (icon[type] || '') + ' ' + msg;

    toast.classList.add('show');

    // 自动隐藏
    if (Toast._timer) clearTimeout(Toast._timer);
    Toast._timer = setTimeout(() => {
      toast.classList.remove('show');
    }, type === 'achievement' ? 3000 : 2200);
  }
};
window.Toast = Toast;
