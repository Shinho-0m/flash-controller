/* ============================================
   闪霍控制器 - 个人主页 + 设置
   ============================================ */

const Profile = {
  render() {
    const user = Auth.getCurrentUser();
    if (!user || !user.username) {
      App.showToast('请先登录');
      App.navigateTo('login');
      return;
    }
    const el = document.getElementById('profile-content');
    if (!el) return;

    el.innerHTML = `
      <!-- Banner + 头像 -->
      <div class="profile-banner"></div>
      <div class="profile-info-section">
        <div class="text-center">
          <div class="avatar avatar-xl avatar-ring" style="margin:0 auto 12px;">${App.renderAvatar(user.avatar, '😎')}</div>
          <div style="font-size:20px;font-weight:700;">${user.nickname || user.username}</div>
          <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:4px;">
            <span class="badge badge-gold">Lv.${user.level || 1}</span>
            <span class="badge" style="background:rgba(212,175,55,0.1);color:var(--gold-primary);font-size:10px;">💰 ${user.coins || 0}</span>
          </div>
        </div>

        <!-- 数据统计 -->
        <div class="profile-stats-row">
          <div class="profile-stat" onclick="App.navigateTo('user-posts')"><div class="profile-stat-num">${user.posts || 0}</div><div class="profile-stat-label">动态</div></div>
          <div class="profile-stat" onclick="App.showToast('粉丝列表开发中~')"><div class="profile-stat-num">${user.followers || 0}</div><div class="profile-stat-label">粉丝</div></div>
          <div class="profile-stat" onclick="App.navigateTo('user-following')"><div class="profile-stat-num">${user.following || 0}</div><div class="profile-stat-label">关注</div></div>
          <div class="profile-stat"><div class="profile-stat-num">${user.points || 0}</div><div class="profile-stat-label">积分</div></div>
        </div>

        <p class="profile-bio">${user.bio || '这个人很懒，什么都没写~'}</p>

        <!-- 等级进度条 -->
        <div style="padding:0 var(--spacing-md);">
          <div class="flex-between mb-sm"><span style="font-size:12px;color:var(--text-muted);">等级进度</span><span style="font-size:12px;color:var(--gold-primary);">${user.exp || 0}/${(user.level || 1) * 100} EXP</span></div>
          <div class="level-bar"><div class="level-fill" style="width:${Math.min(100, ((user.exp || 0) / ((user.level || 1) * 100)) * 100)}%"></div></div>
        </div>

        <!-- 功能入口 -->
        <div style="margin-top:var(--spacing-lg);padding:0 var(--spacing-md);">
          <button class="btn btn-outline btn-block btn-round mb-md" onclick="App.navigateTo('edit-profile')">✏️ 编辑资料</button>
          
          <div class="grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;">
            <div class="text-center card-gold" style="padding:14px 6px;" onclick="App.navigateTo('tasks')">
              <div style="font-size:28px;margin-bottom:4px;">✅</div>
              <div style="font-size:11px;color:var(--text-muted);">任务</div>
            </div>
            <div class="text-center card-gold" style="padding:14px 6px;" onclick="App.navigateTo('ai')">
              <div style="font-size:28px;margin-bottom:4px;">🤖</div>
              <div style="font-size:11px;color:var(--text-muted);">AI角色</div>
            </div>
            <div class="text-center card-gold" style="padding:14px 6px;" onclick="App.navigateTo('shop')">
              <div style="font-size:28px;margin-bottom:4px;">🛒</div>
              <div style="font-size:11px;color:var(--text-muted);">商城</div>
            </div>
            <div class="text-center card-gold" style="padding:14px 6px;" onclick="App.showToast('成就系统开发中~')">
              <div style="font-size:28px;margin-bottom:4px;">🏆</div>
              <div style="font-size:11px;color:var(--text-muted);">成就</div>
            </div>
          </div>
        </div>

        <!-- 我的成就预览 -->
        ${this.renderAchievementsMini()}
      `;
  },

  renderAchievementsMini() {
    const achs = AppData.load('achievements', AppData.achievements);
    const unlockedCount = achs.filter(a => a.unlocked).length;
    return `
      <div style="margin-top:var(--spacing-xl);padding:0 var(--spacing-md);">
        <div class="section-title" style="margin-bottom:12px;"><span>我的成就</span><a class="section-more" onclick="App.showToast('成就系统开发中~')">${unlockedCount}/${achs.length} →</a></div>
        <div style="display:flex;gap:10px;overflow-x:auto;padding-bottom:8px;-webkit-overflow-scrolling:touch;">
          ${achs.slice(0, 5).map(a => `
            <div class="flex flex-center" style="min-width:70px;padding:10px;border-radius:12px;background:var(--bg-card);border:1px solid var(--border-subtle);flex-direction:column;gap:4px;${!a.unlocked ? 'opacity:0.4;filter:grayscale(0.5);' : ''}">
              <span style="font-size:24px;">${a.icon}</span>
              <span style="font-size:9px;color:var(--text-muted);text-align:center;">${a.name}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  renderEdit() {
    const user = Auth.getCurrentUser();
    const el = document.getElementById('edit-profile-content');
    if (!el) return;

    // 判断当前头像是否是图片 URL
    const isImageAvatar = user.avatar && (user.avatar.startsWith('data:') || user.avatar.startsWith('http'));
    const avatarDisplay = isImageAvatar
      ? `<img src="${user.avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`
      : user.avatar || '😎';

    el.innerHTML = `
      <div class="text-center mt-lg">
        <div class="avatar avatar-xl" id="preview-avatar" style="margin:0 auto 16px;cursor:pointer;overflow:hidden;display:flex;align-items:center;justify-content:center;" onclick="this.nextElementSibling.nextElementSibling.style.display=this.nextElementSibling.nextElementSibling.style.display==='block'?'none':'block'">
          ${avatarDisplay}
        </div>

        <!-- 上传按钮 -->
        <div style="margin-bottom:12px;">
          <input type="file" id="avatar-upload-input" accept="image/*" style="display:none;" onchange="Profile.handleAvatarUpload(this)">
          <button class="btn btn-sm btn-outline btn-round" onclick="document.getElementById('avatar-upload-input').click()">📷 上传图片</button>
        </div>
        
        <div style="display:none;" id="avatar-picker-panel">
          <div class="avatar-grid">
            ${AppData.avatars.map(a => `<div class="avatar-option${!isImageAvatar && user.avatar === a ? ' selected' : ''}" onclick="Profile.selectAvatar(this,'${a}')">${a}</div>`).join('')}
          </div>
        </div>
        
        <h3 style="font-size:15px;color:var(--text-secondary);margin-bottom:24px;">点击头像更换表情 / 上传自定义图片</h3>
      </div>

      <div class="input-group">
        <label>昵称</label>
        <input type="text" class="input-field" id="edit-nickname" value="${user.nickname || ''}" placeholder="设置昵称">
      </div>
      
      <div class="input-group">
        <label>个人简介</label>
        <textarea class="input-field" id="edit-bio" rows="3" placeholder="写点什么介绍自己..." style="resize:none;">${user.bio || ''}</textarea>
      </div>

      <div class="card mt-lg" style="padding:14px;text-align:center;">
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:6px;">当前等级</div>
        <div style="font-size:32px;font-weight:800;background:var(--gold-gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">Lv.${user.level}</div>
        <div class="level-bar" style="width:60%;margin:10px auto 0;">
          <div class="level-fill" style="width:${Math.min(100,(user.exp/(user.level*100))*100)}%"></div>
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:6px;">${user.exp} / ${user.level*100} EXP</div>
      </div>
    `;
  },

  selectAvatar(el, emoji) {
    document.querySelectorAll('.avatar-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    const preview = document.getElementById('preview-avatar');
    if (preview) {
      // 清除之前的图片，显示 emoji
      preview.innerHTML = emoji;
    }
  },

  // 处理头像图片上传
  handleAvatarUpload(input) {
    const file = input.files && input.files[0];
    if (!file) return;

    // 限制文件大小（最大 2MB）
    if (file.size > 2 * 1024 * 1024) {
      App.showToast('图片太大了，请选择小于 2MB 的图片');
      return;
    }

    // 限制文件类型
    if (!file.type.startsWith('image/')) {
      App.showToast('请选择图片文件');
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      const dataUrl = e.target.result;
      // 压缩大图（如果超过 500KB）
      if (dataUrl.length > 500 * 1024) {
        Profile.compressImage(dataUrl, function(compressed) {
          Profile.setAvatarPreview(compressed);
        });
      } else {
        Profile.setAvatarPreview(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  },

  // 设置头像预览
  setAvatarPreview(dataUrl) {
    const preview = document.getElementById('preview-avatar');
    if (preview) {
      preview.innerHTML = `<img src="${dataUrl}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
    }
    // 取消表情选择
    document.querySelectorAll('.avatar-option').forEach(o => o.classList.remove('selected'));
  },

  // 压缩图片
  compressImage(dataUrl, callback) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const maxSize = 300; // 最大边长
      let w = img.width, h = img.height;
      if (w > h && w > maxSize) { h = h * maxSize / w; w = maxSize; }
      else if (h > maxSize) { w = w * maxSize / h; h = maxSize; }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      callback(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.src = dataUrl;
  },

  // 用户详情页（查看其他用户）
  renderUserDetail(userId) {
    const users = AppData.load('discoverUsers', AppData.discoverUsers);
    const u = users.find(u => u.id === userId) || users[0];
    
    const nameEl = document.getElementById('user-detail-name');
    if (nameEl) nameEl.textContent = u.nickname || u.name || '用户';

    const el = document.getElementById('user-detail-content');
    if (!el) return;

    el.innerHTML = `
      <div class="profile-banner"></div>
      <div class="profile-info-section text-center">
        <div class="avatar avatar-xl avatar-ring" style="margin:0 auto 12px;">${u.avatar}</div>
        <div style="font-size:20px;font-weight:700;">${u.nickname || u.name}</div>
        <div style="display:inline-flex;align-items:center;gap:6px;margin-top:4px;">
          <span class="badge badge-purple">Lv.${u.level}</span>
        </div>
        <p class="profile-bio">${u.bio || '这个人很懒~'}</p>

        <div class="profile-stats-row">
          <div class="profile-stat"><div class="profile-stat-num">${Math.floor(Math.random()*50)+5}</div><div class="profile-stat-label">动态</div></div>
          <div class="profile-stat"><div class="profile-stat-num">${Math.floor(Math.random()*200)+20}</div><div class="profile-stat-label">粉丝</div></div>
          <div class="profile-stat"><div class="profile-stat-num">${Math.floor(Math.random()*50)+10}</div><div class="profile-stat-label">关注</div></div>
        </div>

        <button class="btn ${u.isFollowed ? 'btn-outline' : 'btn-primary'} btn-block btn-round" onclick="Profile.toggleFollow('${u.id}', this)">
          ${u.isFollowed ? '已关注 ✓' : '+ 关注'}
        </button>
      </div>

      <div style="padding:0 var(--spacing-md);margin-top:var(--spacing-lg);">
        <div class="profile-tabs">
          <div class="profile-tab active">动态</div>
          <div class="profile-tab">喜欢</div>
        </div>
        <div class="empty-state" style="padding:40px 20px;">
          <div class="empty-icon" style="font-size:40px;">📝</div>
          <div class="empty-text" style="font-size:13px;">暂无公开动态</div>
        </div>
      </div>
    `;
  },

  toggleFollow(userId, btnEl) {
    let users = AppData.load('discoverUsers', AppData.discoverUsers);
    const idx = users.findIndex(u => u.id === userId);
    if (idx >= 0) {
      users[idx].isFollowed = !users[idx].isFollowed;
      AppData.save('discoverUsers', users);
      
      if (users[idx].isFollowed) {
        btnEl.textContent = '已关注 ✓';
        btnEl.className = 'btn btn-outline btn-block btn-round';
        App.showToast(`已关注 ${users[idx].nickname || users[idx].name}`);
      } else {
        btnEl.textContent = '+ 关注';
        btnEl.className = 'btn btn-primary btn-block btn-round';
        App.showToast(`已取消关注`);
      }
    }
  }
};

/* ============================================
   设置页
   ============================================ */
const Settings = {
  render() {
    const user = Auth.getCurrentUser();
    if (!user || !user.username) {
      App.showToast('请先登录');
      App.navigateTo('login');
      return;
    }
    const el = document.getElementById('settings-content');
    if (!el) return;

    el.innerHTML = `
      <!-- 用户信息卡片 -->
      <div class="card-gold" style="padding:18px;display:flex;align-items:center;gap:14px;margin-bottom:24px;">
        <div class="avatar avatar-lg avatar-ring">${App.renderAvatar(user.avatar, '😎')}</div>
        <div>
          <div style="font-size:17px;font-weight:700;">${user.nickname || user.username}</div>
          <div style="font-size:12px;color:var(--text-muted);">@${user.username} · Lv.${user.level || 1}</div>
        </div>
      </div>

      <!-- 账号设置 -->
      <div class="settings-section">
        <div class="settings-section-title">账号设置</div>
        <div class="setting-item" onclick="App.navigateTo('edit-profile')">
          <div class="setting-left"><div class="setting-icon">👤</div><div class="setting-name">编辑资料</div></div>
          <div class="setting-arrow">→</div>
        </div>
        <div class="setting-item" onclick="App.showToast('账号安全功能开发中~')">
          <div class="setting-left"><div class="setting-icon">🔐</div><div class="setting-name">账号与安全</div></div>
          <div class="setting-arrow">→</div>
        </div>
      </div>

      <!-- 通用设置 -->
      <div class="settings-section">
        <div class="settings-section-title">通用</div>
        <div class="setting-item" onclick="Settings.toggleNotif(this)">
          <div class="setting-left"><div class="setting-icon">🔔</div><div class="setting-name">消息通知</div></div>
          <div class="toggle-switch ${user.settings.notifications ? 'on' : ''}" data-setting="notifications"><div class="toggle-knob"></div></div>
        </div>
        <div class="setting-item" onclick="Settings.toggleSetting(this,'sound')">
          <div class="setting-left"><div class="setting-icon">🔊</div><div class="setting-name">声音效果</div></div>
          <div class="toggle-switch ${user.settings.sound ? 'on' : ''}" data-setting="sound"><div class="toggle-knob"></div></div>
        </div>
        <div class="setting-item" onclick="Settings.toggleSetting(this,'vibration')">
          <div class="setting-left"><div class="setting-icon">📳</div><div class="setting-name">振动反馈</div></div>
          <div class="toggle-switch ${user.settings.vibration ? 'on' : ''}" data-setting="vibration"><div class="toggle-knob"></div></div>
        </div>
      </div>

      <!-- 其他 -->
      <div class="settings-section">
        <div class="settings-section-title">其他</div>
        <div class="setting-item" onclick="App.showToast('当前版本 v2.0.0')">
          <div class="setting-left"><div class="setting-icon">ℹ️</div><div class="setting-name">关于闪霍控制器</div></div>
          <div style="font-size:12px;color:var(--text-muted);">v2.0.0</div>
        </div>
        <div class="setting-item" onclick="Settings.clearAllData()" style="border-color:rgba(239,68,68,0.2);">
          <div class="setting-left"><div class="setting-icon" style="background:rgba(239,68,68,0.1);color:var(--red-accent);">🗑️</div><div class="setting-name" style="color:var(--red-accent);">清除所有数据</div></div>
          <div class="setting-arrow" style="color:var(--red-accent);">→</div>
        </div>
        <div class="setting-item" onclick="Auth.logout()">
          <div class="setting-left"><div class="setting-icon" style="background:rgba(239,68,68,0.1);color:var(--red-accent);">🚪</div><div class="setting-name" style="color:var(--red-accent);">退出登录</div></div>
          <div class="setting-arrow" style="color:var(--red-accent);">→</div>
        </div>
      </div>
    `;
  },

  toggleNotif(el) {
    const toggle = el.querySelector('.toggle-switch');
    toggle.classList.toggle('on');
    const isOn = toggle.classList.contains('on');
    
    let user = Auth.getCurrentUser();
    user.settings.notifications = isOn;
    AppData.save('user', user);
    App.showToast(isOn ? '通知已开启 🔔' : '通知已关闭');
  },

  toggleSetting(el, key) {
    const toggle = el.querySelector('.toggle-switch');
    toggle.classList.toggle('on');
    const isOn = toggle.classList.contains('on');
    
    let user = Auth.getCurrentUser();
    user.settings[key] = isOn;
    AppData.save('user', user);
  },

  clearAllData() {
    if (confirm('⚠️ 确定要清除所有数据吗？此操作不可恢复！')) {
      AppData.reset();
      App.isLoggedIn = false;
      App.showToast('数据已清除');
      setTimeout(() => App.navigateTo('login'), 800);
    }
  }
};
