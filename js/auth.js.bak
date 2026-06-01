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
        <form class="auth-form" onsubmit="Auth.handleSubmit(event)" id="auth-form">
          <div class="input-group">
            <label>用户名</label>
            <input type="text" class="input-field" id="login-username"
              placeholder="2-20个字符，字母/数字/下划线" required
              autocomplete="username" maxlength="20">
            <div class="input-error" id="err-username"></div>
          </div>
          <div class="input-group">
            <label>密码</label>
            <input type="password" class="input-field" id="login-password"
              placeholder="至少4位" required minlength="4"
              autocomplete="${this.isLoginMode ? 'current-password' : 'new-password'}">
            <div class="input-error" id="err-password"></div>
          </div>
          ${!this.isLoginMode ? `
          <div class="input-group">
            <label>确认密码</label>
            <input type="password" class="input-field" id="register-password2"
              placeholder="再次输入密码" required autocomplete="new-password">
            <div class="input-error" id="err-password2"></div>
          </div>
          <div class="input-group">
            <label>昵称 <span style="opacity:.5;font-size:12px;">（选填）</span></label>
            <input type="text" class="input-field" id="register-nickname"
              placeholder="不填则与用户名相同" autocomplete="nickname" maxlength="20">
          </div>` : ''}
          <button type="submit" class="auth-btn">${this.isLoginMode ? '登 录' : '注 册'}</button>
          <div class="auth-switch">
            ${this.isLoginMode
              ? '还没有账号？<a onclick="Auth.toggleMode()">立即注册</a>'
              : '已有账号？<a onclick="Auth.toggleMode()">返回登录</a>'}
          </div>
        </form>
      </div>
    `;
  },

  /** 显示输入框错误 */
  _showFieldError(fieldId, errId, msg) {
    const field = document.getElementById(fieldId);
    const errEl = document.getElementById(errId);
    if (field) field.classList.add('input-error-state');
    if (errEl) errEl.textContent = msg;
  },

  /** 清除所有错误 */
  _clearErrors() {
    document.querySelectorAll('.input-error-state').forEach(el => el.classList.remove('input-error-state'));
    document.querySelectorAll('.input-error').forEach(el => el.textContent = '');
  },

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    Auth.renderLogin();
  },

  handleSubmit(e) {
    e.preventDefault();
    this._clearErrors();

    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    // 用户名格式校验
    if (!username) {
      this._showFieldError('login-username', 'err-username', '用户名不能为空');
      return;
    }
    if (username.length < 2 || username.length > 20) {
      this._showFieldError('login-username', 'err-username', '用户名需2-20个字符');
      return;
    }
    if (!/^[\u4e00-\u9fa5a-zA-Z0-9_]+$/.test(username)) {
      this._showFieldError('login-username', 'err-username', '用户名只能包含汉字、字母、数字和下划线');
      return;
    }

    if (!password) {
      this._showFieldError('login-password', 'err-password', '密码不能为空');
      return;
    }
    if (password.length < 4) {
      this._showFieldError('login-password', 'err-password', '密码至少4位');
      return;
    }

    if (this.isLoginMode) {
      this.doLogin(username, password);
    } else {
      // 注册模式：校验确认密码
      const password2 = document.getElementById('register-password2')?.value;
      if (password !== password2) {
        this._showFieldError('register-password2', 'err-password2', '两次输入的密码不一致');
        return;
      }
      const nickname = document.getElementById('register-nickname')?.value.trim() || username;
      this.doRegister(username, password, nickname);
    }
  },

  doRegister(username, password, nickname) {
    API.post('/api/register', { username, password, email: username + '@flash-controller.local' })
      .then(data => {
        if (data.error) {
          this._showFieldError('login-username', 'err-username', data.error);
          return;
        }
        // ✅ 把账号存到本地 users 表（刷新后登录态判断需要）
        const users = AppData.load('users', {});
        users[username] = { password, nickname: nickname || username };
        AppData.save('users', users);

        AppData.saveCurrentUser(username);
        let user = { ...AppData.defaultUser };
        user.username = username;
        user.nickname = nickname || username;
        user.bio = `我是${nickname || username}，掌控者预备役 ✨`;
        AppData.save('user', user);
        App.isLoggedIn = true;
        App.showToast(`欢迎加入，${nickname || username}！`);
        setTimeout(() => App.navigateTo('home'), 800);
      })
      .catch(err => {
        this._showFieldError('login-username', 'err-username', err.message || '注册失败，请重试');
      });
  },

  doLogin(username, password) {
    API.post('/api/login', { username, password })
      .then(data => {
        if (data.error) {
          this._showFieldError('login-password', 'err-password', data.error);
          return;
        }
        // ✅ 把账号存到本地 users 表（刷新后登录态判断需要）
        const users = AppData.load('users', {});
        users[username] = { password, nickname: data.user?.nickname || username };
        AppData.save('users', users);

        AppData.saveCurrentUser(username);
        let user = { ...AppData.defaultUser };
        user.username = username;
        user.nickname = data.user?.nickname || username;
        user.avatar = data.user?.avatar || '';
        user.bio = data.user?.bio || '';
        user.level = data.user?.level || 1;
        user.coins = data.user?.coins ?? 100;
        AppData.save('user', user);
        App.isLoggedIn = true;
        App.showToast(`欢迎回来，${user.nickname}！`);
        setTimeout(() => App.navigateTo('home'), 800);
      })
      .catch(err => {
        this._showFieldError('login-password', 'err-password', err.message || '登录失败，请重试');
      });
  },

  logout() {
    App.isLoggedIn = false;
    this.isLoginMode = true;
    AppData.save('seenGuide', false);
    // ✅ 清除登录态
    AppData.clearCurrentUser();
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
