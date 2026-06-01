/* ============================================
   闪霍控制器 - 社交/社区模块
   首页信息流 / 发布动态 / 点赞评论
   ============================================ */

const Social = {
  newPostContent: '',
  selectedImage: null,

  renderHome() {
    const el = document.getElementById('home-content');
    if (!el) return;

    // 从后端获取动态列表
    API.get('/api/posts')
      .then(posts => {
        el.innerHTML = `
          <!-- 发布入口 -->
          <div class="card" style="padding:12px;display:flex;align-items:center;gap:10px;margin-bottom:16px;cursor:pointer;" onclick="App.navigateTo('post-create')">
            <div class="avatar avatar-sm">${App.renderAvatar(Auth.getCurrentUser().avatar)}</div>
            <span style="font-size:13px;color:var(--text-muted);flex:1;">分享你的想法...</span>
            <span style="color:var(--gold-primary);font-size:20px;">+</span>
          </div>

          <!-- 动态列表 -->
          <div id="posts-container">
            ${posts.length > 0 ? posts.map(p => this.renderPostCard(p)).join('') : `
              <div class="empty-state">
                <div class="empty-icon">📝</div>
                <div class="empty-text">还没有动态</div>
                <div class="empty-hint">成为第一个发布动态的人吧！</div>
              </div>
            `}
          </div>
        `;
      })
      .catch(err => {
        el.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-text">加载失败</div><div class="empty-hint">${err.message}</div></div>`;
      });
  },

  renderPostCard(post) {
    const liked = post.liked || false;
    return `
      <div class="post-card" id="post-${post.id}">
        <div class="post-header">
          <div class="avatar">${post.authorAvatar || '😎'}</div>
          <div class="post-author-info">
            <div class="post-author-name">${post.authorName || '匿名'}</div>
            <div class="post-time">${post.time || '刚刚'}</div>
          </div>
        </div>
        <div class="post-content">${this.formatContent(post.content || '')}</div>
        ${post.image ? `<div class="post-image">${post.image}</div>` : ''}
        <div class="post-actions">
          <div class="post-action ${liked ? 'liked' : ''}" onclick="Social.toggleLike(${post.id}, this)">
            ${liked ? '❤️' : '🤍'} ${post.likes || 0}
          </div>
          <div class="post-action" onclick="Social.showComments(${post.id})">
            💬 ${post.comments || 0}
          </div>
          <div class="post-action" onclick="App.showToast('已分享')">↗️ 分享</div>
        </div>
      </div>
    `;
  },

  formatContent(text) {
    return text.replace(/\n/g, '<br>');
  },

  toggleLike(postId, el) {
    // 先乐观更新 UI
    const postEl = document.getElementById('post-' + postId);
    // 简单切换：发请求到后端
    API.post('/api/posts/like', { postId, userId: Auth.getCurrentUser().username })
      .then(() => {
        // 重新加载动态列表
        Social.renderHome();
      })
      .catch(() => {
        App.showToast('操作失败，请重试', 'error');
      });
  },

  showComments(postId) {
    API.get(`/api/comments?post_id=${postId}`)
      .then(comments => {
        App.showModal(`
          <div style="padding:16px;">
            <div style="font-weight:600;margin-bottom:12px;">评论（${comments.length}）</div>
            ${comments.length === 0 ? '<div style="color:var(--text-muted);padding:16px;">暂无评论</div>' : ''}
            ${comments.map(c => `
              <div style="padding:8px 0;border-bottom:1px solid var(--border-subtle);">
                <div style="font-size:13px;font-weight:500;">${c.authorName || '匿名'}</div>
                <div style="font-size:13px;margin-top:4px;">${c.content}</div>
              </div>
            `).join('')}
          </div>
        `);
      })
      .catch(() => App.showToast('加载评论失败', 'error'));
  },

  // ===== 发布动态 =====
  renderCreatePost() {
    const user = Auth.getCurrentUser();
    const images = ['🌃', '🌙', '💜', '⚡', '🔥', '🦋', '🖤', '✨', '🌹', '🎭'];

    const el = document.getElementById('post-create-content');
    if (!el) return;

    el.innerHTML = `
      <div class="card mt-lg">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
          <div class="avatar">${user.avatar}</div>
          <span style="font-size:13px;color:var(--text-secondary);">${user.nickname || user.username}</span>
        </div>
        
        <textarea class="input-field" id="new-post-text" rows="5" placeholder="在想什么？分享给社区吧..." style="resize:none;border:1px solid var(--border-subtle);border-radius:var(--radius-md);width:100%;min-height:100px;" oninput="Social.newPostContent=this.value"></textarea>
        
        <div style="margin-top:12px;">
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">选择配图（可选）</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${images.map(img => `
              <div class="avatar-option${this.selectedImage === img ? ' selected' : ''}" 
                   style="width:60px;height:60px;border-radius:12px;font-size:28px;" 
                   onclick="Social.selectPostImage(this,'${img}')">${img}</div>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="mt-lg text-center text-muted" style="font-size:12px;padding:0 4px;">
        发布动态即表示同意社区规范，请勿发布违规内容
      </div>
    `;
  },

  selectPostImage(el, img) {
    document.querySelectorAll('#post-create-content .avatar-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    this.selectedImage = img;
  },

  publishPost() {
    const content = document.getElementById('new-post-text')?.value?.trim();
    
    if (!content && !this.selectedImage) {
      App.showToast('请输入内容或选择配图');
      return;
    }

    const user = Auth.getCurrentUser();
    // user.id 可能不存在，用 username 作为 user_id
    const userId = user.id || 1;

    API.post('/api/posts', { user_id: userId, content: content || '分享了这张图片~' })
      .then(() => {
        // 重置状态
        this.newPostContent = '';
        this.selectedImage = null;

        // 检查任务
        Tasks.checkTaskProgress('task_003', true);

        App.showToast('发布成功 ✅');
        setTimeout(() => App.navigateTo('home'), 500);
      })
      .catch(err => {
        App.showToast('发布失败：' + (err.message || '未知错误'), 'error');
      });
  }
};

/* ============================================
   发现/广场页面
   ============================================ */
const Discover = {
  searchQuery: '',

  render() {
    const el = document.getElementById('discover-content');
    if (!el) return;

    const users = AppData.load('discoverUsers', AppData.discoverUsers);

    el.innerHTML = `
      <!-- 搜索栏 -->
      <div class="search-bar" onclick="document.getElementById('discover-search-input').focus()">
        <span class="search-icon">🔍</span>
        <input type="text" class="search-input" id="discover-search-input" placeholder="搜索用户或内容..." oninput="Discover.onSearch(this.value)">
      </div>

      <!-- 热门标签 -->
      <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:12px;-webkit-overflow-scrolling:touch;margin-bottom:16px;">
        ${['🔥 热门', '✨ 新人', '💬 求组队', '📝 经验分享', '🎮 搞事情', '🎁 活动'].map(tag => `
          <button class="btn btn-sm btn-outline btn-round" style="white-space:nowrap;">${tag}</button>
        `).join('')}
      </div>

      <!-- 推荐用户 -->
      <div class="section-title"><span>推荐用户</span><a class="section-more" onclick="App.showToast('更多功能开发中~')">换一批 ↻</a></div>
      <div id="discover-users-grid" style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:24px;">
        ${users.map(u => `
          <div class="card" style="padding:14px;text-align:center;" onclick="App.navigateTo('user-detail',{userId:'${u.id}'})">
            <div class="avatar avatar-md" style="margin:0 auto 6px;">${u.avatar}</div>
            <div style="font-size:14px;font-weight:600;">${u.nickname || u.name}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${u.bio || ''}</div>
            <div style="display:inline-flex;align-items:center;gap:4px;margin-top:6px;">
              <span class="badge badge-purple" style="font-size:10px;">Lv.${u.level}</span>
              ${u.isFollowed ? '<span class="badge badge-gold" style="font-size:10px;">已关注</span>' : ''}
            </div>
          </div>
        `).join('')}
      </div>

      <!-- 热门动态 -->
      <div class="section-title"><span>热门动态</span></div>
      <div id="discover-posts">
        ${this.renderHotPosts()}
      </div>
    `;
  },

  renderHotPosts() {
    const posts = AppData.load('posts', AppData.posts);
    // 按 likes 排序取前3
    const hotPosts = [...posts].sort((a, b) => b.likes - a.likes).slice(0, 3);
    
    return hotPosts.map(p => `
      <div class="post-card" onclick="App.showToast('查看详情')">
        <div class="post-header">
          <div class="avatar avatar-sm">${p.authorAvatar}</div>
          <div class="post-author-info">
            <div class="post-author-name">${p.authorName}</div>
            <div class="post-time">${p.time} · 🔥 ${p.likes}赞</div>
          </div>
        </div>
        <div class="post-content" style="-webkit-line-clamp:2;display:-webkit-box;-webkit-box-orient:vertical;overflow:hidden;">${p.content.replace(/\n/g, ' ')}</div>
      </div>
    `).join('');
  },

  onSearch(query) {
    this.searchQuery = query;
    // 实时搜索（简单实现）
    if (query.length > 0) {
      const users = AppData.load('discoverUsers', AppData.discoverUsers);
      const filtered = users.filter(u => (u.nickname || u.name || '').includes(query) || (u.bio || '').includes(query));
      const grid = document.getElementById('discover-users-grid');
      if (grid && filtered.length > 0) {
        grid.innerHTML = filtered.map(u => `
          <div class="card" style="padding:14px;text-align:center;" onclick="App.navigateTo('user-detail',{userId:'${u.id}'})">
            <div class="avatar avatar-md" style="margin:0 auto 6px;">${u.avatar}</div>
            <div style="font-size:14px;font-weight:600;">${u.nickname || u.name}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${u.bio || ''}</div>
          </div>
        `).join('');
      }
    } else {
      Discover.render();
    }
  }
};
