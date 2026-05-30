/* ============================================
   闪霍控制器 - 虚拟控制面板（核心功能⭐）
   设备控制 / 强度滑块 / 模式切换 / 定时器
   ============================================ */

const ControlPanel = {
  currentDeviceId: null,
  timerInterval: null,
  timerSeconds: 0,
  timerRunning: false,
  useCount: 0,

  render() {
    const el = document.getElementById('control-content');
    if (!el) return;

    const devices = AppData.load('devices', AppData.devices);
    this.currentDeviceId = this.currentDeviceId || (devices.find(d => d.status === 'online')?.id || devices[0]?.id);

    // 统计使用次数
    this.useCount = AppData.load('controlUseCount', 0);

    el.innerHTML = `
      <!-- 当前设备卡片 -->
      ${this.renderCurrentDevice(devices)}

      <!-- 其他设备列表 -->
      <div class="section-title" style="margin-top:var(--spacing-lg);"><span>我的设备</span><span class="section-more">${devices.filter(d=>d.status==='online').length} 在线</span></div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;">
        ${devices.map(d => `
          <div class="card" style="padding:14px;text-align:center;cursor:pointer;${d.id===this.currentDeviceId?'border-color:var(--gold-primary);box-shadow:var(--shadow-gold);':''}" onclick="ControlPanel.selectDevice('${d.id}')">
            <div style="font-size:32px;margin-bottom:6px;">${d.icon}</div>
            <div style="font-size:13px;font-weight:600;">${d.name}</div>
            <div class="device-state ${d.status==='online'?'online':'offline'}" style="margin-top:4px;font-size:10px;">${d.status==='online' ? '● 在线' : '○ 离线'}</div>
          </div>
        `).join('')}
      </div>

      <!-- 控制历史 -->
      <div class="section-title"><span>操作记录</span></div>
      <div id="history-list">
        ${this.renderHistory()}
      </div>

      <!-- 快捷指令 -->
      <div class="section-title"><span>快捷指令</span></div>
      <div class="quick-cmds">
        ${AppData.quickCommands.map(cmd => `
          <button class="cmd-btn" onclick="ControlPanel.execCommand('${cmd.id}','${cmd.label}')">
            ${cmd.icon}<span class="cmd-label">${cmd.label}</span>
          </button>
        `).join('')}
      </div>
    `;

    // 初始化滑块交互
    this.initSlider();
    // 初始化定时器显示
    this.renderTimer();
  },

  renderCurrentDevice(devices) {
    const device = devices.find(d => d.id === this.currentDeviceId) || devices[0];
    if (!device) return '';

    return `
      <div class="device-card card-gold" id="device-main-card">
        <div class="device-status">
          <div class="device-name">${device.icon} ${device.name}</div>
          <div class="device-state ${device.intensity > 0 ? 'active' : device.status}">${device.intensity > 0 ? '● 运行中' : device.status === 'online' ? '● 待命' : '○ 离线'}</div>
        </div>

        <!-- 强度滑块 -->
        <div class="slider-container">
          <div class="slider-label">
            <span class="slider-text">输出强度</span>
            <span class="slider-value" id="intensity-value">${device.intensity}%</span>
          </div>
          <div class="slider-track" id="slider-track" onclick="ControlPanel.handleSliderClick(event)">
            <div class="slider-fill" id="slider-fill" style="width:${device.intensity}%"></div>
            <div class="slider-thumb" id="slider-thumb" style="left:${device.intensity}%"></div>
          </div>
          <div class="slider-marks"><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></div>
        </div>

        <!-- 模式选择 -->
        <div style="font-size:13px;color:var(--text-secondary);margin-bottom:8px;">运行模式</div>
        <div class="mode-grid">
          ${AppData.modes.map(m => `
            <button class="mode-btn ${device.mode === m.id ? 'active' : ''}" onclick="ControlPanel.setMode('${m.id}',this)">
              <span class="mode-icon">${m.icon}</span>${m.name}
            </button>
          `).join('')}
        </div>

        <!-- 定时器区域 -->
        <div class="timer-display" id="timer-area">
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">⏱️ 定时关闭</div>
          <div class="timer-value" id="timer-value">00:00</div>
          <div class="timer-controls">
            <button class="btn btn-sm btn-outline" onclick="ControlPanel.setTimer(300)">5分</button>
            <button class="btn btn-sm btn-outline" onclick="ControlPanel.setTimer(600)">10分</button>
            <button class="btn btn-sm btn-outline" onclick="ControlPanel.setTimer(900)">15分</button>
            <button class="btn btn-sm btn-outline" onclick="ControlPanel.setTimer(1800)">30分</button>
          </div>
          <div style="display:flex;justify-content:center;gap:12px;margin-top:14px;">
            <button class="btn ${this.timerRunning ? 'btn-danger' : 'btn-primary'} btn-sm" onclick="ControlPanel.toggleTimer()">
              ${this.timerRunning ? '⏹ 停止' : '▶ 启动'}
            </button>
            <button class="btn btn-ghost btn-sm" onclick="ControlPanel.resetTimer()">↺ 重置</button>
          </div>
        </div>

        <!-- 主控按钮 -->
        <div style="display:flex;gap:12px;margin-top:20px;">
          <button class="btn btn-primary btn-block btn-lg btn-round flex-1" onclick="ControlPanel.activateDevice()" id="main-control-btn">
            ${device.intensity > 0 ? '⏹ 停止' : '▶️ 启动设备'}
          </button>
        </div>
      </div>
    `;
  },

  selectDevice(deviceId) {
    this.currentDeviceId = deviceId;
    ControlPanel.render();
  },

  initSlider() {
    const track = document.getElementById('slider-track');
    const thumb = document.getElementById('slider-thumb');
    if (!track || !thumb) return;

    let isDragging = false;

    const updateSlider = (e) => {
      const rect = track.getBoundingClientRect();
      let clientX = e.touches ? e.touches[0].clientX : e.clientX;
      let percent = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      
      this.setIntensity(Math.round(percent));
    };

    thumb.addEventListener('mousedown', () => { isDragging = true; });
    thumb.addEventListener('touchstart', () => { isDragging = true; }, { passive: true });
    
    document.addEventListener('mousemove', (e) => { if (isDragging) updateSlider(e); });
    document.addEventListener('touchmove', (e) => { if (isDragging) updateSlider(e); }, { passive: true });
    
    document.addEventListener('mouseup', () => { isDragging = false; });
    document.addEventListener('touchend', () => { isDragging = false; });
  },

  handleSliderClick(e) {
    const track = document.getElementById('slider-track');
    if (!track) return;
    const rect = track.getBoundingClientRect();
    let percent = ((e.clientX - rect.left) / rect.width) * 100;
    this.setIntensity(Math.round(Math.max(0, Math.min(100, percent))));
  },

  setIntensity(value) {
    value = Math.max(0, Math.min(100, value));
    let devices = AppData.load('devices', AppData.devices);
    const idx = devices.findIndex(d => d.id === this.currentDeviceId);
    if (idx >= 0) {
      devices[idx].intensity = value;
      AppData.save('devices', devices);

      // 更新 UI
      const valEl = document.getElementById('intensity-value');
      const fillEl = document.getElementById('slider-fill');
      const thumbEl = document.getElementById('slider-thumb');
      if (valEl) valEl.textContent = value + '%';
      if (fillEl) fillEl.style.width = value + '%';
      if (thumbEl) thumbEl.style.left = value + '%';

      // 更新状态文字
      const stateEl = document.querySelector('.device-state.active, .device-state.online, .device-state.offline');
      if (stateEl && idx >= 0) {
        stateEl.className = 'device-state ' + (value > 0 ? 'active' : devices[idx].status === 'online' ? 'online' : 'offline');
        stateEl.textContent = value > 0 ? '● 运行中' : devices[idx].status === 'online' ? '● 待命' : '○ 离线';
      }

      // 更新主按钮
      const mainBtn = document.getElementById('main-control-btn');
      if (mainBtn) {
        mainBtn.textContent = value > 0 ? '⏹ 停止' : '▶️ 启动设备';
      }
    }
  },

  setMode(modeId, btnEl) {
    let devices = AppData.load('devices', AppData.devices);
    const idx = devices.findIndex(d => d.id === this.currentDeviceId);
    if (idx >= 0) {
      devices[idx].mode = modeId;
      AppData.save('devices', devices);

      // 更新 UI
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      if (btnEl) btnEl.classList.add('active');

      const mode = AppData.modes.find(m => m.id === modeId);
      App.showToast(`模式已切换：${mode?.name || modeId}`);
      this.addHistory(`🔄 切换为「${mode?.name || modeId}」模式`);
    }
  },

  activateDevice() {
    let devices = AppData.load('devices', AppData.devices);
    const idx = devices.findIndex(d => d.id === this.currentDeviceId);
    if (idx >= 0) {
      const currentVal = devices[idx].intensity;
      if (currentVal > 0) {
        // 停止
        devices[idx].intensity = 0;
        App.showToast('设备已停止 ⏹');
        this.addHistory(`⏹ 停止了 ${devices[idx].name}`);
      } else {
        // 启动（默认30%强度）
        devices[idx].intensity = 30;
        App.showToast(`${devices[idx].name} 已启动 ▶`);
        this.addHistory(`▶️ 启动了 ${devices[idx].name}，强度30%`);

        // 计数
        this.useCount++;
        AppData.save('controlUseCount', this.useCount);

        // 检查任务
        Tasks.checkTaskProgress('task_002', this.useCount);
      }
      AppData.save('devices', devices);
      ControlPanel.render();
    }
  },

  execCommand(cmdId, cmdLabel) {
    const cmdMap = {
      'cmd_01': () => this.activateDevice(),
      'cmd_02': () => { this.setIntensity(0); this.addHistory('⏸️ 已暂停'); App.showToast('已暂停'); },
      'cmd_03': () => { this.setIntensity(100); this.addHistory('🔥 最大强度！'); App.showToast('最大火力 🔥'); },
      'cmd_04': () => { this.setIntensity(15); this.addHistory('🌙 温柔模式~'); App.showToast('温柔模式 🌙'); },
      'cmd_05': () => { this.setIntensity(80); setTimeout(() => this.setIntensity(20), 200); this.addHistory('⚡ 电击！'); App.showToast('电击！⚡'); },
      'cmd_06': () => { this.startCycleMode(); },
      'cmd_07': () => { this.rampUp(); },
      'cmd_08': () => { this.rampDown(); }
    };

    if (cmdMap[cmdId]) cmdMap[cmdId]();
  },

  startCycleMode() {
    App.showToast('循环模式启动 🔄');
    this.addHistory('🔄 循环模式启动');
    let cycleStep = 0;
    const interval = setInterval(() => {
      cycleStep++;
      const values = [20, 50, 80, 40, 70, 25];
      this.setIntensity(values[cycleStep % values.length]);
      if (cycleStep > 8) { clearInterval(interval); this.setIntensity(0); App.showToast('循环结束'); }
    }, 1200);
  },

  rampUp() {
    App.showToast('递增中 📈...');
    this.addHistory('📈 开始递增');
    let v = 0;
    const interval = setInterval(() => {
      v += 10;
      if (v > 90) { clearInterval(interval); return; }
      this.setIntensity(v);
    }, 400);
  },

  rampDown() {
    App.showToast('递减中 📉...');
    this.addHistory('📉 开始递减');
    let v = 80;
    const interval = setInterval(() => {
      v -= 10;
      if (v <= 0) { clearInterval(interval); this.setIntensity(0); return; }
      this.setIntensity(v);
    }, 400);
  },

  // ===== 定时器 =====
  setTimer(seconds) {
    this.timerSeconds = seconds || 0;
    this.updateTimerDisplay();
    App.showToast(`定时 ${Math.floor(seconds/60)} 分钟`);
  },

  toggleTimer() {
    if (this.timerRunning) {
      clearInterval(this.timerInterval);
      this.timerRunning = false;
      App.showToast('定时器已暂停');
    } else {
      if (this.timerSeconds <= 0) {
        this.timerSeconds = 300; // 默认5分钟
      }
      this.timerRunning = true;
      this.timerInterval = setInterval(() => {
        this.timerSeconds--;
        this.updateTimerDisplay();
        if (this.timerSeconds <= 0) {
          this.toggleTimer();
          this.setIntensity(0);
          App.showToast('⏱️ 定时到！设备已停止');
          this.addHistory('⏱️ 定时结束，设备自动停止');
        }
      }, 1000);
      App.showToast('定时器开始 ▶');
    }
    ControlPanel.render();
  },

  resetTimer() {
    clearInterval(this.timerInterval);
    this.timerRunning = false;
    this.timerSeconds = 0;
    App.showToast('定时器已重置');
    ControlPanel.render();
  },

  updateTimerDisplay() {
    const el = document.getElementById('timer-value');
    if (!el) return;
    const m = String(Math.floor(this.timerSeconds / 60)).padStart(2, '0');
    const s = String(this.timerSeconds % 60).padStart(2, '0');
    el.textContent = `${m}:${s}`;
  },

  renderTimer() {
    this.updateTimerDisplay();
  },

  // ===== 操作记录 =====
  addHistory(action) {
    let history = AppData.load('controlHistory', []);
    history.unshift({
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      action: action
    });
    // 只保留最近20条
    if (history.length > 20) history = history.slice(0, 20);
    AppData.save('controlHistory', history);
    
    // 更新历史 UI
    const histList = document.getElementById('history-list');
    if (histList) histList.innerHTML = this.renderHistory();
  },

  renderHistory() {
    const history = AppData.load('controlHistory', []);
    if (history.length === 0) {
      return `<div class="empty-state" style="padding:30px;"><div class="empty-icon" style="font-size:32px;">📋</div><div class="empty-text" style="font-size:13px;">暂无操作记录</div></div>`;
    }
    return history.slice(0, 8).map(h => `
      <div class="list-item" style="padding:10px 14px;">
        <div style="width:4px;height:4px;border-radius:50%;background:var(--gold-primary);flex-shrink:0;"></div>
        <div class="list-item-info">
          <div class="list-item-name" style="font-size:13px;">${h.action}</div>
          <div class="list-item-desc">${h.time}</div>
        </div>
      </div>
    `).join('');
  }
};
