/* ============================================
   闪霍控制器 - 认证模块
   登录/注册/用户管理
   ============================================ */

const Auth = {
  isLoginMode: true,

  renderLogin() {
    const el = document.getElementById('page-login');
    if (!el) return;
    el.innerHTML = `
      <div class="auth-container">
        <div class="auth-logo"><img src="assets/mascot.png" alt="闪霍" class="auth-mascot-img"></div>
        <div class="auth-title">闪霍控制器</div>
        <div class="auth-subtitle">你的专属控制中心</div>
        <form class="auth-form" onsubmit="Auth.handleSubmit(event)">
          <div class="input-group">
            <label>用户名</label>
            <input type="text" class="input-field" id="login-username" placeholder="输入用户名" required autocomplete="username">
          </div>
          <div class="input-group">
            <label>密码</label>
            <input type="password" class="input-field" id="login-password" placeholder="输入密码（至少4位）" required minlength="4" autocomplete="current-password">
          </div>
          ${!this.isLoginMode ? `
          <div class="input-group">
            <label>昵称</label>
            <input type="text" class="input-field" id="register-nickname" placeholder="设置昵称（选填）" autocomplete="nickname">
          </div>` : ''}
          <button type="submit" class="auth-btn">${this.isLoginMode ? '登 录' : '注 册'}</button>
          <div class="auth-switch">
            ${this.isLoginMode ? '还没有账号？<a onclick="Auth.toggleMode()">立即注册</a>' : '已有账号？<a onclick="Auth.toggleMode()">返回登录</a>'}
          </div>
        </form>
      </div>
    `;
  },

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    Auth.renderLogin();
  },

  handleSubmit(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    if (!username || !password) {
      App.showToast('请填写完整信息');
      return;
    }

    if (this.isLoginMode) {
      this.doLogin(username, password);
    } else {
      const nickname = document.getElementById('register-nickname')?.value.trim() || username;
      this.doRegister(username, password, nickname);
    }
  },

  doRegister(username, password, nickname) {
    // 检查是否已注册
    const users = AppData.load('users', {});
    if (users[username]) {
      App.showToast('该用户名已被注册');
      return;
    }

    // 保存用户
    users[username] = { password, nickname };
    AppData.save('users', users);

    // 设置当前用户
    let user = { ...AppData.defaultUser };
    user.username = username;
    user.nickname = nickname;
    user.bio = `我是${nickname}，掌控者预备役 ✨`;
    AppData.save('user', user);

    App.isLoggedIn = true;
    App.showToast(`欢迎加入，${nickname}！`);
    setTimeout(() => App.navigateTo('home'), 800);
  },

  doLogin(username, password) {
    const users = AppData.load('users', {});
    
    // 首次登录自动注册（方便体验）
    if (!users[username]) {
      this.isLoginMode = false;
      App.showToast('该账号不存在，已切换到注册模式');
      setTimeout(() => Auth.toggleMode(), 500);
      return;
    }

    if (users[username].password !== password) {
      App.showToast('密码错误');
      return;
    }

    // 恢复或创建用户数据
    let user = { ...AppData.defaultUser };
    user.username = username;
    user.nickname = users[username].nickname || username;
    AppData.save('user', user);

    App.isLoggedIn = true;
    App.showToast(`欢迎回来，${user.nickname}！`);
    setTimeout(() => App.navigateTo('home'), 800);
  },

  logout() {
    App.isLoggedIn = false;
    this.isLoginMode = true;
    AppData.save('seenGuide', false);
    App.navigateTo('login');
    App.showToast('已退出登录');
  },

  getCurrentUser() {
    let user = AppData.load('user', AppData.defaultUser);
    // 数据校验 + 自动修复：确保关键字段不为空
    if (!user || typeof user !== 'object') {
      user = { ...AppData.defaultUser };
    }
    // 合并默认值，防止缺失字段导致 Undefined
    const merged = { ...AppData.defaultUser, ...user };
    // 如果 nickname/username 仍为空，强制赋默认值
    if (!merged.nickname) { merged.nickname = AppData.defaultUser.nickname; }
    if (!merged.username) { merged.username = AppData.defaultUser.username; }
    if (!merged.avatar) { merged.avatar = AppData.defaultUser.avatar; }
    return merged;
  },

  saveProfile() {
    const bio = document.getElementById('edit-bio')?.value?.trim();
    const user = this.getCurrentUser();

    if (bio) user.bio = bio;

    // 头像：优先检查是否有上传的图片
    const previewImg = document.querySelector('#preview-avatar img');
    if (previewImg && previewImg.src) {
      user.avatar = previewImg.src; // 保存 data URL
    } else {
      const selectedEmoji = document.querySelector('.avatar-option.selected')?.textContent;
      if (selectedEmoji) user.avatar = selectedEmoji;
    }

    const nicknameEl = document.getElementById('edit-nickname');
    if (nicknameEl?.value) user.nickname = nicknameEl.value.trim();

    AppData.save('user', user);
    App.showToast('资料保存成功 ✅');
    setTimeout(() => App.goBack(), 600);
  }
};

/* ============================================
   引导页
   ============================================ */
const Guide = {
  currentSlide: 0,
  totalSlides: 4,

  render() {
    App.renderGuide();
  },

  goToSlide(index) {
    this.currentSlide = index;
    const slides = document.querySelectorAll('.guide-slide');
    const dots = document.querySelectorAll('.guide-dot');

    slides.forEach((s, i) => s.classList.toggle('active', i === index));
    dots.forEach((d, i) => d.classList.toggle('active', i === index));
  },

  nextSlide() {
    if (this.currentSlide < this.totalSlides - 1) {
      this.goToSlide(this.currentSlide + 1);
    }
  },

  start() {
    AppData.save('seenGuide', true);
    App.navigateTo('login');
  }
};
