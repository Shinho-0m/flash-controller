/* ============================================
   闪霍控制器 - AI 角色系统
   多角色 / 对话交互 / 情绪变化
   ============================================ */

const AICenter = {
  currentChatId: null,
  chatHistory: {},
  chatCount: AppData.load('aiChatCount', 0),

  render() {
    const el = document.getElementById('ai-content');
    if (!el) return;

    el.innerHTML = `
      <div style="text-align:center;margin-bottom:20px;">
        <div style="font-size:13px;color:var(--text-muted);">AI 角色 · 永不离线 · 24h陪伴</div>
      </div>

      <div id="ai-characters-grid" style="display:grid;grid-template-columns:1fr;gap:14px;">
        ${AppData.aiCharacters.map(ai => this.renderAICard(ai)).join('')}
      </div>
    `;
  },

  renderAICard(ai) {
    return `
      <div class="ai-card" onclick="AICenter.startChat('${ai.id}')">
        <div class="ai-avatar">${ai.avatar}</div>
        <div class="ai-name">${ai.name}</div>
        <div class="ai-role-tag">${this.getRoleLabel(ai.role)}</div>
        <div class="ai-desc">${ai.desc}</div>
        <div class="ai-status">
          <span class="ai-status-dot"></span>${ai.online ? '在线' : '离线'}
          <span style="margin-left:auto;font-size:11px;color:var(--text-muted);">情绪值 ${ai.mood}/10</span>
        </div>
      </div>
    `;
  },

  getRoleLabel(role) {
    const map = { '支配型': '👑 支配型', '诱惑型': '💋 诱惑型', '严肃型': '🎩 严肃型', '顽皮型': '🎪 顽皮型', '神秘型': '🔮 神秘型' };
    return map[role] || role;
  },

  startChat(aiId) {
    this.currentChatId = aiId;
    
    // 初始化聊天记录
    let chats = AppData.load('chats', {});
    if (!chats[aiId]) {
      const ai = AppData.aiCharacters.find(a => a.id === aiId);
      if (ai) {
        chats[aiId] = [
          { from: 'ai', text: `你好，我是${ai.name}。${ai.replies[Math.floor(Math.random() * ai.replies.length)]}`, time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }
        ];
        AppData.save('chats', chats);
      }
    }
    this.chatHistory = chats[aiId] || [];

    App.navigateTo('ai-chat', aiId);
  },

  // 渲染对话页
  renderChat(aiId) {
    const ai = AppData.aiCharacters.find(a => a.id === (aiId || this.currentChatId));
    if (!ai) return;

    const nameEl = document.getElementById('ai-chat-name');
    if (nameEl) nameEl.textContent = `${ai.avatar} ${ai.name}`;

    let chats = AppData.load('chats', {});
    const messages = chats[aiId || this.currentChatId] || [];

    // 渲染消息
    const msgContainer = document.getElementById('ai-chat-messages');
    if (msgContainer) {
      msgContainer.innerHTML = messages.map(m =>
        `<div class="msg-bubble ${m.from === 'me' ? 'msg-sent' : m.from === 'ai' ? 'msg-from-ai' : 'msg-received'}">${m.text}</div>`
      ).join('');
      
      // 滚动到底部
      setTimeout(() => msgContainer.scrollTop = msgContainer.scrollHeight, 100);
    }

    // 快捷回复
    const replyEl = document.getElementById('ai-reply-options');
    if (replyEl && ai) {
      replyEl.innerHTML = ai.quickReplies.map(r =>
        `<button class="reply-option" onclick="AICenter.sendQuickReply('${r}')">${r}</button>`
      ).join('');
    }
  },

  sendQuickReply(text) {
    if (!this.currentChatId) return;

    const nowTime = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

    // 用户消息
    this.addMessage('me', text, nowTime);

    // AI 回复
    setTimeout(() => {
      const ai = AppData.aiCharacters.find(a => a.id === this.currentChatId);
      if (ai) {
        // 随机选择回复
        let replies = [...ai.replies];
        const reply = replies[Math.floor(Math.random() * replies.length)];
        
        // 更新情绪
        ai.mood = Math.max(0, Math.min(10, ai.mood + Math.floor(Math.random() * 3) - 1));

        this.addMessage('ai', reply, nowTime);

        // 计数
        this.chatCount++;
        AppData.save('aiChatCount', this.chatCount);
        Tasks.checkTaskProgress('task_004', this.chatCount);
      }
    }, 600 + Math.random() * 800);
  },

  addMessage(from, text, time) {
    let chats = AppData.load('chats', {});
    if (!chats[this.currentChatId]) chats[this.currentChatId] = [];
    chats[this.currentChatId].push({ from, text, time });
    AppData.save('chats', chats);
    AICenter.renderChat(this.currentChatId);
  }
};
