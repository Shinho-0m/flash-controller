/**
 * 闪霍控制器 - 消息聊天模块
 * 聊天列表、私信对话、消息收发
 */
const Chat = {
  // 当前聊天对象
  currentChatTarget: null,

  /**
   * 渲染消息中心（聊天列表页）
   */
  render() {
    const user = Data.load('user');
    const chatContacts = Data.load('chatContacts') || Data.init('chatContacts');
    let notifications = Data.load('notifications') || Data.init('notifications');
    if (!Array.isArray(notifications)) notifications = Data.init('notifications');
    const unreadCount = notifications.filter(n => !n.read).length;

    return `
        <!-- 搜索栏 -->
        <div class="search-bar">
          <span class="search-icon">🔍</span>
          <input type="text" placeholder="搜索联系人..." class="search-input" id="chat-search" oninput="Chat.searchContacts(this.value)">
        </div>

        <!-- 功能入口 -->
        <div class="chat-quick-entry">
          <div class="entry-item" onclick="App.navigateTo('notifications')">
            <div class="entry-icon-wrap notification">
              <span>🔔</span>
              ${unreadCount > 0 ? `<span class="unread-badge">${unreadCount}</span>` : ''}
            </div>
            <span>通知</span>
          </div>
          <div class="entry-item" onclick="App.navigateTo('ai')">
            <div class="entry-icon-wrap ai">
              <span>🤖</span>
            </div>
            <span>AI助手</span>
          </div>
          <div class="entry-item" onclick="Chat.showNewChat()">
            <div class="entry-icon-wrap new">
              <span>➕</span>
            </div>
            <span>新对话</span>
          </div>
        </div>

        <!-- 聊天列表 -->
        <div class="section-header">
          <span class="section-title">最近消息</span>
        </div>

        <div class="chat-list" id="chat-list">
          ${chatContacts.map(contact => this.renderChatItem(contact)).join('')}
        </div>

        ${chatContacts.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">💬</div>
            <p>还没有聊天记录<br>去社区认识一些朋友吧~</p>
          </div>
        ` : ''}
    `;
  },

  /**
   * 渲染单个聊天列表项
   */
  renderChatItem(contact) {
    // 兼容旧格式（扁平结构：lastMsg/time/unread）和新格式（带 messages 数组）
    const lastMsg = contact.messages
      ? contact.messages[contact.messages.length - 1]
      : (contact.lastMsg ? { text: contact.lastMsg, time: contact.time || contact.lastActive } : null);
    const lastTime = contact.messages
      ? (lastMsg ? lastMsg.time : contact.lastActive)
      : (contact.time || contact.lastActive);
    const unread = contact.unread || 0;
    return `
      <div class="chat-item" onclick="Chat.openChat('${contact.id}')">
        <div class="chat-avatar">
          ${contact.avatar}
          ${contact.online ? '<span class="online-dot"></span>' : ''}
        </div>
        <div class="chat-info">
          <div class="chat-top">
            <span class="chat-name">${contact.name}</span>
            <span class="chat-time">${lastMsg ? Chat.formatTime(lastTime) : ''}</span>
          </div>
          <div class="chat-preview">
            ${unread ? '<span class="unread-dot"></span>' : ''}
            <span class="${unread ? 'unread-text' : ''}">${lastMsg ? (lastMsg.type === 'image' ? '[图片]' : (lastMsg.text || '').substring(0, 30)) : '暂无消息'}</span>
          </div>
        </div>
        ${unread ? `<span class="chat-unread-count">${unread}</span>` : ''}
      </div>
    `;
  },

  /**
   * 渲染聊天详情页
   */
  renderDetail(targetId) {
    const contacts = Data.load('chatContacts') || Data.init('chatContacts');
    const contact = contacts.find(c => c.id === targetId);

    if (!contact) {
      return `
          <div class="page-header">
            <div class="header-left" onclick="App.goBack()"><span class="back-icon">&#xe5c4;</span></div>
            <h1 class="header-title">聊天</h1>
          </div>
          <div class="empty-state"><p>联系人不存在</p></div>
      `;
    }

    // 标记为已读
    if (contact.unread) {
      contact.unread = 0;
      Data.save('chatContacts', contacts);
    }

    this.currentChatTarget = targetId;

    return `
        <div class="page-header chat-detail-header">
          <div class="header-left" onclick="App.goBack()">
            <span class="back-icon">&#xe5c4;</span>
          </div>
          <div class="header-center chat-target-info">
            <span class="target-avatar">${contact.avatar}</span>
            <span class="target-name">${contact.name}</span>
            <span class="target-status ${contact.online ? 'online' : ''}">${contact.online ? '在线' : '离线'}</span>
          </div>
          <div class="header-right">
            <button class="header-action-btn" onclick="Chat.showMoreOptions('${targetId}')">⋯</button>
          </div>
        </div>

        <!-- 消息区域 -->
        <div class="chat-messages" id="chat-messages">
          ${this.renderMessages(contact.messages)}
        </div>

        <!-- 输入区域 -->
        <div class="chat-input-bar">
          <button class="input-voice-btn" onclick="Chat.sendVoiceHint()">🎤</button>
          <div class="input-wrapper">
            <textarea
              id="chat-input"
              placeholder="输入消息..."
              rows="1"
              onkeydown="Chat.handleKeyDown(event, '${targetId}')"
              oninput="Chat.autoResize(this)"
            ></textarea>
          </div>
          <button class="input-more-btn" onclick="Chat.showInputMore()">+</button>
          <button class="send-btn" onclick="Chat.sendMessage('${targetId}')">发送</button>
        </div>
    `;
  },

  /**
   * 渲染消息列表
   */
  renderMessages(messages) {
    if (!messages || messages.length === 0) {
      return `
        <div class="chat-empty-hint">
          <span class="hint-avatar">${this.currentChatTarget ? (Data.load('chatContacts').find(c => c.id === this.currentChatTarget)?.avatar || '') : ''}</span>
          <p>你们还没开始聊天，说点什么吧~</p>
        </div>
      `;
    }

    return messages.map((msg, idx) => {
      // 添加时间分隔（超过5分钟显示时间）
      let timeDiv = '';
      if (idx === 0 || (messages[idx - 1] && msg.time - messages[idx - 1].time > 5 * 60 * 1000)) {
        timeDiv = `<div class="msg-time-divider">${Chat.formatTimeFull(msg.time)}</div>`;
      }

      if (msg.type === 'system') {
        return `${timeDiv}<div class="msg-system">${msg.text}</div>`;
      }

      const isSent = msg.sender === 'me';

      return `
        ${timeDiv}
        <div class="msg-row ${isSent ? 'sent' : 'received'}">
          ${!isSent ? `<img src="" class="msg-avatar-fallback" onerror="this.style.display='none'"><span class="msg-avatar-text">👤</span>` : ''}
          <div class="msg-bubble-wrapper">
            <div class="msg-bubble ${isSent ? 'sent-bubble' : 'received-bubble'} ${msg.type}">
              ${msg.type === 'image'
                ? `<div class="msg-image" style="background: linear-gradient(135deg, #2a2a4a, #3a3a6a); display:flex;align-items:center;justify-content:center;min-height:100px;border-radius:8px;">${msg.text}</div>`
                : Chat.formatMessageText(msg.text)
              }
            </div>
            <span class="msg-status">${isSent && msg.read ? '已读' : isSent ? '已发送' : ''}</span>
          </div>
        </div>
      `;
    }).join('');
  },

  /**
   * 格式化消息文本（简单处理换行）
   */
  formatMessageText(text) {
    return text.replace(/\n/g, '<br>');
  },

  /**
   * 打开聊天详情
   */
  openChat(targetId) {
    App.navigateTo('chat-detail', { targetId });
  },

  /**
   * 发送消息
   */
  sendMessage(targetId) {
    const input = document.getElementById('chat-input');
    if (!input) return;

    const text = input.value.trim();
    if (!text) return;

    const contacts = Data.load('chatContacts') || Data.init('chatContacts');
    const contact = contacts.find(c => c.id === targetId);

    if (!contact) return;

    // 兼容旧数据格式 — 确保 messages 数组存在
    if (!Array.isArray(contact.messages)) contact.messages = [];

    // 添加消息
    contact.messages.push({
      id: Date.now().toString(),
      sender: 'me',
      type: 'text',
      text: text,
      time: Date.now(),
      read: false
    });

    // 更新最后交互时间
    contact.lastActive = Date.now();

    Data.save('chatContacts', contacts);

    // 清空输入框
    input.value = '';
    input.style.height = 'auto';

    // 刷新消息区域
    this.refreshMessages(targetId);

    // 记录聊天行为用于成就
    Tasks.trackAction('chat_sent');

    // 模拟对方回复
    setTimeout(() => {
      this.simulateReply(targetId);
    }, 1500 + Math.random() * 2000);
  },

  /**
   * 模拟对方自动回复
   */
  simulateReply(targetId) {
    const contacts = Data.load('chatContacts') || [];
    const contact = contacts.find(c => c.id === targetId);
    if (!contact) return;

    // 兼容旧数据格式 — 确保 messages 数组存在
    if (!Array.isArray(contact.messages)) contact.messages = [];

    const replies = [
      '哈哈，好的呢~ 😊',
      '真的吗？太有趣了！',
      '嗯嗯，我也有同感',
      '你说得对 👍',
      '等一下，我想想...',
      '这个想法不错！',
      '哈哈你真会说话',
      '我也这么觉得~',
      '有意思！继续说？',
      '收到！📩',
      '好滴，没问题~',
      '哇，厉害了！',
      '我也是这样想的 ✨',
    ];

    const reply = replies[Math.floor(Math.random() * replies.length)];

    contact.messages.push({
      id: Date.now().toString(),
      sender: contact.name,
      type: 'text',
      text: reply,
      time: Date.now(),
      read: true  // 对方发的，默认已读
    });

    contact.lastActive = Date.now();
    Data.save('chatContacts', contacts);

    // 如果当前正在看这个聊天，刷新显示
    if (this.currentChatTarget === targetId) {
      this.refreshMessages(targetId);
    } else {
      contact.unread = (contact.unread || 0) + 1;
      Data.save('chatContacts', contacts);
    }
  },

  /**
   * 刷新消息显示
   */
  refreshMessages(targetId) {
    const contacts = Data.load('chatContacts') || [];
    const contact = contacts.find(c => c.id === targetId);
    if (!contact) return;

    const messagesEl = document.getElementById('chat-messages');
    if (messagesEl) {
      messagesEl.innerHTML = this.renderMessages(contact.messages);
      // 滚动到底部
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  },

  /**
   * 处理键盘事件（Enter发送）
   */
  handleKeyDown(event, targetId) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage(targetId);
    }
  },

  /**
   * 自动调整输入框高度
   */
  autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  },

  /**
   * 搜索联系人
   */
  searchContacts(query) {
    const listEl = document.getElementById('chat-list');
    if (!listEl) return;

    const contacts = Data.load('chatContacts') || Data.init('chatContacts');

    if (!query.trim()) {
      listEl.innerHTML = contacts.map(c => this.renderChatItem(c)).join('');
      return;
    }

    const filtered = contacts.filter(c =>
      c.name.toLowerCase().includes(query.toLowerCase())
    );

    listEl.innerHTML = filtered.length > 0
      ? filtered.map(c => this.renderChatItem(c)).join('')
      : '<div class="empty-state"><p>未找到匹配的联系人</p></div>';
  },

  /**
   * 显示新对话选择器
   */
  showNewChat() {
    const discoverUsers = Data.load('discoverUsers') || Data.init('discoverUsers');

    App.showModal(`
      <div class="modal-header"><h3>💬 开始新对话</h3></div>
      <div class="user-select-list">
        ${discoverUsers.map(u => `
          <div class="user-select-item" onclick="Chat.startNewChat('${u.id}')">
            <span class="user-select-avatar">${u.avatar}</span>
            <span class="user-select-name">${u.nickname}</span>
            <span class="user-select-desc">${u.bio?.substring(0, 20) || ''}</span>
          </div>
        `).join('')}
      </div>
    `, () => {});
  },

  /**
   * 开始新对话
   */
  startNewChat(userId) {
    const users = Data.load('discoverUsers') || Data.init('discoverUsers');
    const user = users.find(u => u.id === userId);
    if (!user) return;

    let contacts = Data.load('chatContacts') || [];

    // 检查是否已有聊天
    let contact = contacts.find(c => c.id === userId);

    if (!contact) {
      // 创建新聊天
      contact = {
        id: userId,
        name: user.nickname || user.username || '未知用户',
        avatar: user.avatar,
        online: Math.random() > 0.3,
        unread: 0,
        messages: [],
        lastActive: Date.now()
      };
      contacts.push(contact);
      Data.save('chatContacts', contacts);
    }

    App.closeModal();
    App.navigateTo('chat-detail', { targetId: userId });
  },

  /**
   * 显示更多选项
   */
  showMoreOptions(targetId) {
    App.showModal(`
      <div class="modal-content more-options">
        <div class="option-item" onclick="Chat.viewProfile('${targetId}')">
          <span class="opt-icon">👤</span><span>查看资料</span>
        </div>
        <div class="option-item" onclick="Chat.clearChat('${targetId}')">
          <span class="opt-icon">🗑️</span><span>清空聊天记录</span>
        </div>
        <div class="option-item danger" onclick="Chat.blockUser('${targetId}')">
          <span class="opt-icon">🚫</span><span>拉黑用户</span>
        </div>
      </div>
    `, () => {});
  },

  /**
   * 查看对方资料
   */
  viewProfile(targetId) {
    App.closeModal();
    App.navigateTo('user-detail', { userId: targetId });
  },

  /**
   * 清空聊天记录
   */
  clearChat(targetId) {
    if (!confirm('确定要清空与该用户的聊天记录吗？')) return;

    const contacts = Data.load('chatContacts') || [];
    const contact = contacts.find(c => c.id === targetId);
    if (contact) {
      contact.messages = [];
      contact.unread = 0;
      Data.save('chatContacts', contacts);
    }

    App.closeModal();
    Toast.show('聊天记录已清空', 'success');
    this.refreshMessages(targetId);
  },

  /**
   * 拉黑用户
   */
  blockUser(targetId) {
    if (!confirm('确定要拉黑该用户吗？拉黑后将无法接收对方消息。')) return;

    App.closeModal();
    Toast.show('已将用户拉黑', 'success');
    // 实际项目中这里需要后端支持
  },

  /**
   * 发送语音提示
   */
  sendVoiceHint() {
    Toast.show('语音功能开发中，敬请期待~', 'info');
  },

  /**
   * 显示更多输入选项
   */
  showInputMore() {
    Toast.show('图片/表情功能即将上线~', 'info');
  },

  /**
   * 格式化时间（简洁版）
   */
  formatTime(timestamp) {
    if (!timestamp) return '';
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
    if (diff < 604800000) return Math.floor(diff / 86400000) + '天前';

    const d = new Date(timestamp);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  },

  /**
   * 格式化时间（完整版）
   */
  formatTimeFull(timestamp) {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    const pad = n => n.toString().padStart(2, '0');
    return `${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
};

// 将 Chat 注册到全局
window.Chat = Chat;
