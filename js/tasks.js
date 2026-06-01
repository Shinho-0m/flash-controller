/**
 * 闪霍控制器 - 任务系统模块
 * 每日任务、成就系统、经验值/等级、奖励领取
 */
const Tasks = {
  // 当前页面状态
  currentView: 'daily', // daily | achievements

  /**
   * 渲染任务中心页面
   */
  render() {
    const user = Data.load('user');
    const tasks = Data.load('tasks') || Data.init('tasks');
    const achievements = Data.load('achievements') || Data.init('achievements');

    // 计算每日进度
    const completedToday = tasks.filter(t => t.completed).length;
    const totalTasks = tasks.length;
    const todayProgress = Math.round((completedToday / totalTasks) * 100);

    return `
        <!-- 用户等级卡片 -->
        <div class="level-card">
          <div class="level-info">
            <div class="level-avatar-ring">
              <span class="level-avatar">${user.avatar || '👤'}</span>
              <span class="level-badge">Lv.${user.level}</span>
            </div>
            <div class="level-detail">
              <div class="level-name">${user.nickname || '探索者'}</div>
              <div class="exp-bar-container">
                <div class="exp-bar">
                  <div class="exp-fill" style="width: ${(user.exp % (user.level * 100)) / (user.level * 100) * 100}%"></div>
                </div>
                <span class="exp-text">${user.exp % (user.level * 100)} / ${user.level * 100} EXP</span>
              </div>
            </div>
            <div class="level-points">
              <span class="points-icon">💰</span>
              <span class="points-value">${user.points}</span>
            </div>
          </div>
        </div>

        <!-- 标签切换 -->
        <div class="tab-switch">
          <button class="tab-btn ${this.currentView === 'daily' ? 'active' : ''}" onclick="Tasks.switchView('daily')">
            📋 每日任务
          </button>
          <button class="tab-btn ${this.currentView === 'achievements' ? 'active' : ''}" onclick="Tasks.switchView('achievements')">
            🏆 成就
          </button>
        </div>

        <!-- 内容区域 -->
        ${this.currentView === 'daily' ? this.renderDailyTasks(tasks, user) : this.renderAchievements(achievements, user)}
    `;
  },

  /**
   * 渲染每日任务列表
   */
  renderDailyTasks(tasks, user) {
    const completedToday = tasks.filter(t => t.completed).length;
    const totalTasks = tasks.length;

    return `
      <div class="daily-tasks-section">
        <div class="section-header">
          <span class="section-title">今日任务</span>
          <span class="task-progress-text">${completedToday}/${totalTasks} 完成</span>
        </div>

        <div class="tasks-list">
          ${tasks.map(task => this.renderTaskItem(task, user)).join('')}
        </div>

        <!-- 一键领取所有奖励 -->
        ${completedToday > 0 && tasks.some(t => t.completed && !t.claimed) ? `
          <button class="claim-all-btn" onclick="Tasks.claimAllRewards()">
            💎 领取全部奖励
          </button>
        ` : ''}
      </div>
    `;
  },

  /**
   * 渲染单个任务项
   */
  renderTaskItem(task, user) {
    const isCompleted = task.completed;
    const isClaimed = task.claimed;
    const canClaim = isCompleted && !isClaimed;

    return `
      <div class="task-item ${isCompleted ? (isClaimed ? 'claimed' : 'can-claim') : ''}" data-task-id="${task.id}">
        <div class="task-icon">${task.icon}</div>
        <div class="task-info">
          <div class="task-name">${task.name}</div>
          <div class="task-desc">${task.description}</div>
          <div class="task-reward">
            <span class="reward-exp">+${task.expReward} EXP</span>
            <span class="reward-coins">+${task.coinReward} 金币</span>
          </div>
        </div>
        <div class="task-action">
          ${!isCompleted ? `
            <button class="task-do-btn" onclick="Tasks.doTask('${task.id}')">去做</button>
          ` : isClaimed ? `
            <span class="task-status-icon claimed-icon">✅</span>
          ` : `
            <button class="task-claim-btn" onclick="Tasks.claimReward('${task.id}')">领取</button>
          `}
        </div>
      </div>
    `;
  },

  /**
   * 渲染成就列表
   */
  renderAchievements(achievements, user) {
    const unlockedCount = achievements.filter(a => a.unlocked).length;
    const totalCount = achievements.length;

    return `
      <div class="achievements-section">
        <div class="achievement-stats">
          <div class="stat-item">
            <span class="stat-value gold">${unlockedCount}</span>
            <span class="stat-label">已解锁</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${totalCount - unlockedCount}</span>
            <span class="stat-label">未解锁</span>
          </div>
          <div class="stat-item">
            <span class="stat-value gold">${Math.round((unlockedCount / totalCount) * 100)}%</span>
            <span class="stat-label">完成度</span>
          </div>
        </div>

        <div class="achievements-grid">
          ${achievements.map(ach => this.renderAchievementItem(ach)).join('')}
        </div>
      </div>
    `;
  },

  /**
   * 渲染单个成就项
   */
  renderAchievementItem(ach) {
    return `
      <div class="achievement-item ${ach.unlocked ? 'unlocked' : 'locked'}" data-ach-id="${ach.id}">
        <div class="achievement-icon">${ach.unlocked ? ach.icon : '🔒'}</div>
        <div class="achievement-detail">
          <div class="achievement-name">${ach.unlocked ? ach.name : '???'}</div>
          <div class="achievement-desc">${ach.unlocked ? ach.desc : '完成特定条件解锁'}</div>
          ${ach.unlocked ? `<div class="achievement-reward">+${ach.reward} 金币</div>` : ''}
        </div>
        ${ach.unlocked ? '<div class="achievement-check">✓</div>' : ''}
      </div>
    `;
  },

  /**
   * 切换视图（每日任务 / 成就）
   */
  switchView(view) {
    this.currentView = view;
    App.navigateTo('tasks');
  },

  /**
   * 执行任务
   */
  doTask(taskId) {
    const tasks = Data.load('tasks') || Data.init('tasks');
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.completed) return;

    // 根据任务类型执行不同动作
    switch (task.type) {
      case 'login':
        // 已登录，直接完成
        break;
      case 'control':
        // 跳转到控制面板
        App.navigateTo('control');
        Toast.show('使用控制面板3次即可完成任务', 'info');
        return;
      case 'social':
        // 跳转到社区
        App.navigateTo('home');
        Toast.show('发布或互动即可完成', 'info');
        return;
      case 'chat':
        // 跳转到AI聊天
        App.navigateTo('ai');
        Toast.show('与AI角色对话3次即可', 'info');
        return;
      case 'share':
        Toast.show('分享功能演示：任务已完成！', 'success');
        break;
      default:
        break;
    }

    // 完成任务
    task.completed = true;
    Data.save('tasks', tasks);
    Toast.show(`任务「${task.name}」已完成！`, 'success');

    // 检查是否触发成就
    this.checkAchievements();

    // 刷新页面
    App.renderPage('tasks');
  },

  /**
   * 领取单个任务奖励
   */
  claimReward(taskId) {
    const tasks = Data.load('tasks') || Data.init('tasks');
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.completed || task.claimed) return;

    const user = Data.load('user');

    // 发放奖励
    user.exp += task.expReward;
    user.points += task.coinReward;
    task.claimed = true;

    // 升级检查
    const leveledUp = this.checkLevelUp(user);
    Data.save('user', user);
    Data.save('tasks', tasks);

    Toast.show(`获得 +${task.expReward} EXP +${task.coinReward} 金币${leveledUp ? ' 🎉 升级了！' : ''}`, 'success');
    App.renderPage('tasks');
  },

  /**
   * 一键领取所有未领取的奖励
   */
  claimAllRewards() {
    const tasks = Data.load('tasks') || Data.init('tasks');
    const user = Data.load('user');

    let totalExp = 0;
    let totalCoins = 0;
    let claimedCount = 0;

    tasks.forEach(task => {
      if (task.completed && !task.claimed) {
        totalExp += task.expReward;
        totalCoins += task.coinReward;
        task.claimed = true;
        claimedCount++;
      }
    });

    if (claimedCount === 0) {
      Toast.show('没有可领取的奖励', 'info');
      return;
    }

    user.exp += totalExp;
    user.points += totalCoins;
    this.checkLevelUp(user);

    Data.save('user', user);
    Data.save('tasks', tasks);

    Toast.show(`领取 ${claimedCount} 个任务奖励！+${totalExp}EXP +${totalCoins}金币`, 'success');
    App.renderPage('tasks');
  },

  /**
   * 检查任务进度 — 由其他模块调用，自动完成达到目标的任务
   * @param {string} taskId — 任务 ID（如 'task_004'）
   * @param {number|boolean} progress — 当前进度值
   */
  checkTaskProgress(taskId, progress) {
    const tasks = Data.load('tasks') || Data.init('tasks');
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.completed) return;

    // 各任务进度阈值
    const thresholds = {
      'task_002': 3,   // 控制面板使用3次
      'task_003': 1,   // 社交互动1次
      'task_004': 3,   // AI对话3次
    };

    const threshold = thresholds[taskId];
    if (!threshold) return;

    // boolean 类型（如社交互动）直接完成
    if (typeof progress === 'boolean' && progress === true) {
      task.completed = true;
    } else if (typeof progress === 'number' && progress >= threshold) {
      task.completed = true;
    } else {
      return; // 未达标
    }

    Data.save('tasks', tasks);
    Toast.show(`任务「${task.name}」已完成！`, 'success');
    this.checkAchievements();
  },

  /**
   * 检查升级
   */
  checkLevelUp(user) {
    const currentLevel = user.level;
    let expNeeded = currentLevel * 100;

    // 防止 level=0 或无效值
    if (expNeeded <= 0) expNeeded = 100;

    // 防止无限循环 — 最多连升 10 级
    let maxIter = 10;
    while (user.exp >= expNeeded && maxIter-- > 0) {
      user.exp -= expNeeded;
      user.level++;
      expNeeded = user.level * 100; // 重新计算下一级所需经验
      // 升级奖励金币
      user.points = (user.points || 0) + user.level * 10;
      Toast.show(`🎉 升级到 Lv.${user.level}！获得 +${user.level * 10} 金币`, 'success');
    }

    return user.level > currentLevel;
  },

  /**
   * 检查并解锁成就
   */
  checkAchievements() {
    const user = Data.load('user');
    const tasks = Data.load('tasks') || [];
    const achievements = Data.load('achievements') || Data.init('achievements');
    let newUnlock = false;

    achievements.forEach(ach => {
      if (ach.unlocked) return;

      let shouldUnlock = false;
      switch (ach.id) {
        case 'ach_first_login':
          shouldUnlock = true; // 登录就解锁
          break;
        case 'ach_first_task':
          shouldUnlock = tasks.some(t => t.completed);
          break;
        case 'ach_task_master':
          shouldUnlock = tasks.filter(t => t.completed).length >= 5;
          break;
        case 'ach_social_butterfly':
          shouldUnlock = (user.following || 0) >= 3;
          break;
        case 'ach_controller':
          shouldUnlock = (user.controlCount || 0) >= 10;
          break;
        case 'ach_level_5':
          shouldUnlock = user.level >= 5;
          break;
        case 'ach_rich':
          shouldUnlock = user.points >= 500;
          break;
        case 'ach_explorer':
          // 使用过所有主要功能
          shouldUnlock = (user.pagesVisited && Object.keys(user.pagesVisited).length >= 5) || false;
          break;
      }

      if (shouldUnlock) {
        ach.unlocked = true;
        user.points += ach.reward;
        newUnlock = true;

        // 延迟显示成就通知，让Toast不冲突
        setTimeout(() => {
          Toast.show(`🏆 成就解锁：${ach.name}`, 'achievement');
        }, 500);
      }
    });

    if (newUnlock) {
      Data.save('achievements', achievements);
      Data.save('user', user);
    }

    return newUnlock;
  },

  /**
   * 记录用户行为（用于成就追踪）
   */
  trackAction(action) {
    const user = Data.load('user');

    switch (action) {
      case 'control_used':
        user.controlCount = (user.controlCount || 0) + 1;
        break;
      case 'post_created':
        user.postCount = (user.postCount || 0) + 1;
        break;
      case 'chat_sent':
        user.chatCount = (user.chatCount || 0) + 1;
        break;
      default:
        break;
    }

    Data.save('user', user);
    // 异步检查成就
    setTimeout(() => this.checkAchievements(), 300);
  }
};

// 将 Tasks 注册到全局
window.Tasks = Tasks;
