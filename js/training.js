/* ============================================
   闪霍控制器 - 训练/玩法 模块
   高精度计时 + 视频 + 图表（Canvas）+ 导出
   合并 App 用户系统（不使用独立用户）
   ============================================ */

const Training = {
  // ===== 状态 =====
  running: false,
  startTime: 0,
  elapsed: 0,        // ms
  timerHandle: null,
  currentView: 'timer', // 'timer' | 'chart'
  // 图表年月
  chartYear: new Date().getFullYear(),
  chartMonth: new Date().getMonth(),

  // ===== 初始化入口（由 app.js 调用）=====
  init() {
    this.render();
    this.bindEvents();
  },

  // ===== 渲染训练主页面 =====
  render() {
    return `
      <div class="training-page">
        <div class="training-nav">
          <button class="training-nav-btn active" id="tnav-timer" data-view="timer">⏱ 计时</button>
          <button class="training-nav-btn" id="tnav-chart" data-view="chart">📊 图表</button>
        </div>

        <!-- 计时视图 -->
        <div class="training-view active" id="tview-timer">
          <div class="timer-section">
            <div class="timer-display" id="t-timeDisplay">00:00:00</div>
            <button class="timer-big-btn" id="t-bigBtn">开始</button>
            <div class="timer-actions">
              <button class="timer-action-btn primary" id="t-saveBtn">💾 保存记录</button>
              <button class="timer-action-btn" id="t-clearBtn">🗑 清除</button>
            </div>
          </div>

          <div class="video-section">
            <div class="video-wrapper">
              <video id="t-video" controls loop></video>
            </div>
            <input type="file" id="t-videoFile" accept="video/*" class="video-file-input"
                   value="" placeholder="🎬 选择视频文件">
          </div>
        </div>

        <!-- 图表视图 -->
        <div class="training-view" id="tview-chart">
          ${this.renderChartPage()}
        </div>
      </div>
    `;
  },

  // ===== 渲染图表页面内容 =====
  renderChartPage() {
    const records = this.getRecords();
    const hasData = records && records.length > 0;

    if (!hasData) {
      return `
        <div class="training-empty">
          <div class="training-empty-icon">📊</div>
          <div class="training-empty-text">暂无训练记录</div>
          <div class="training-empty-hint">完成计时后点击「保存记录」即可在此查看趋势图</div>
        </div>
      `;
    }

    return `
      <div class="chart-page">
        <div class="chart-wrapper" id="t-chartWrapper">
          <canvas id="t-chartCanvas" width="2600" height="1000" class="chart-canvas"></canvas>
        </div>
        <div class="chart-scroll-hint" id="t-chartHint">
          <span>👆</span> 左右滑动查看完整图表 <span>👆</span>
        </div>
        <div class="chart-controls">
          <button id="tc-py">◀ 年-</button>
          <button id="tc-pm">◀ 月-</button>
          <span class="chart-month-label" id="tc-ym">${this.chartYear}年 ${this.chartMonth + 1}月</span>
          <button id="tc-nm">月+ ▶</button>
          <button id="tc-ny">年+ ▶</button>
          <button class="chart-export-btn" id="tc-export">📥 导出图片</button>
        </div>
      </div>
    `;
  },

  // ===== 绑定事件 =====
  bindEvents() {
    // 导航切换
    const navTimer = document.getElementById('tnav-timer');
    const navChart = document.getElementById('tnav-chart');
    if (navTimer) navTimer.addEventListener('click', () => this.switchView('timer'));
    if (navChart) navChart.addEventListener('click', () => this.switchView('chart'));

    // 大按钮 - 开始/暂停
    const bigBtn = document.getElementById('t-bigBtn');
    if (bigBtn) bigBtn.addEventListener('click', () => this.toggleTimer());

    // 保存
    const saveBtn = document.getElementById('t-saveBtn');
    if (saveBtn) saveBtn.addEventListener('click', () => this.saveRecord());

    // 清除
    const clearBtn = document.getElementById('t-clearBtn');
    if (clearBtn) clearBtn.addEventListener('click', () => this.clearTimer());

    // 视频文件选择
    const videoFileInput = document.getElementById('t-videoFile');
    if (videoFileInput) {
      videoFileInput.addEventListener('change', (e) => this.handleVideoSelect(e));
    }
  },

  // ===== 绑定图表事件（每次渲染图表后调用）=====
  bindChartEvents() {
    const py = document.getElementById('tc-py');
    const pm = document.getElementById('tc-pm');
    const nm = document.getElementById('tc-nm');
    const ny = document.getElementById('tc-ny');
    const exp = document.getElementById('tc-export');

    if (py) py.addEventListener('click', () => { this.chartYear--; this.drawChart(); this._scrollChartToLeft(); });
    if (pm) pm.addEventListener('click', () => { this.chartMonth--; if (this.chartMonth < 0) { this.chartMonth = 11; this.chartYear--; } this.drawChart(); this._scrollChartToLeft(); });
    if (nm) nm.addEventListener('click', () => { this.chartMonth++; if (this.chartMonth > 11) { this.chartMonth = 0; this.chartYear++; } this.drawChart(); this._scrollChartToLeft(); });
    if (ny) ny.addEventListener('click', () => { this.chartYear++; this.drawChart(); this._scrollChartToLeft(); });
    if (exp) exp.addEventListener('click', () => this.exportChart());
  },

  // 图表区域滚动到最左边
  _scrollChartToLeft() {
    const wrapper = document.getElementById('t-chartWrapper');
    if (wrapper) wrapper.scrollLeft = 0;
  },

  // ===== 切换视图 =====
  switchView(view) {
    this.currentView = view;

    // 更新导航按钮状态
    document.querySelectorAll('.training-nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });

    // 切换视图显示
    document.querySelectorAll('.training-view').forEach(v => {
      v.classList.remove('active');
    });
    const target = document.getElementById('tview-' + view);
    if (target) target.classList.add('active');

    // 如果切换到图表，绘制
    if (view === 'chart') {
      // 重新渲染图表页面以获取最新数据
      const chartContainer = document.getElementById('tview-chart');
      if (chartContainer) {
        chartContainer.innerHTML = this.renderChartPage();
        this.bindChartEvents();
        this.drawChart();
        // 自动滚动到最左边 + 显示滑动提示
        const wrapper = document.getElementById('t-chartWrapper');
        if (wrapper) {
          wrapper.scrollLeft = 0;
          // 3秒后隐藏提示
          const hint = document.getElementById('t-chartHint');
          if (hint) {
            setTimeout(() => { hint.style.opacity = '0'; hint.style.transition = 'opacity 1s'; }, 3000);
          }
        }
      }
    }
  },

  // ==================== 计时器逻辑 ====================

  // 格式化毫秒为 MM:SS:MS
  formatTime(ms) {
    let s = Math.floor(ms / 1000);
    let m = Math.floor(s / 60);
    s %= 60;
    let ms2 = Math.floor((ms % 1000) / 10);
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0') + ':' + String(ms2).padStart(2, '0');
  },

  // 计时器 tick
  _tick() {
    this.elapsed = Date.now() - this.startTime;
    const el = document.getElementById('t-timeDisplay');
    if (el) el.innerText = this.formatTime(this.elapsed);
  },

  // 开始/暂停切换
  toggleTimer() {
    const btn = document.getElementById('t-bigBtn');
    const video = document.getElementById('t-video');

    if (!this.running) {
      // 开始
      this.running = true;
      this.startTime = Date.now() - this.elapsed;
      this.timerHandle = setInterval(() => this._tick(), 10);
      if (btn) { btn.textContent = '暂停'; btn.classList.add('running'); }
      if (video) video.play().catch(() => {});
    } else {
      // 暂停
      this.running = false;
      if (this.timerHandle) clearInterval(this.timerHandle);
      this.timerHandle = null;
      if (btn) { btn.textContent = '开始'; btn.classList.remove('running'); }
      if (video) video.pause();
    }
  },

  // 保存记录
  saveRecord() {
    if (this.running || this.elapsed <= 0) {
      App.showToast('请先计时后再保存 ⚠️', 'warning');
      return;
    }

    const user = Auth.getCurrentUser();
    if (!user || !user.id) {
      App.showToast('用户信息异常，无法保存 ❌', 'error');
      return;
    }

    // 获取当前用户的 records
    let allUsersData = AppData.load('user', AppData.defaultUser);
    if (!allUsersData || !allUsersData.trainingRecords) {
      if (allUsersData) allUsersData.trainingRecords = [];
      else return; // 用户数据不存在，放弃保存
    }

    allUsersData.trainingRecords.push({
      date: new Date().toISOString().split('T')[0],
      value: this.elapsed
    });

    AppData.save('user', allUsersData);

    // 重置计时器
    this.elapsed = 0;
    const el = document.getElementById('t-timeDisplay');
    if (el) el.innerText = '00:00:00';

    App.showToast('训练记录已保存 ✅', 'success');
  },

  // 清除计时器
  clearTimer() {
    if (this.running) {
      // 先暂停再清除
      this.toggleTimer();
    }
    this.elapsed = 0;
    const el = document.getElementById('t-timeDisplay');
    if (el) el.innerText = '00:00:00';
  },

  // ==================== 视频逻辑 ====================

  handleVideoSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    const video = document.getElementById('t-video');
    if (!video) return;

    video.src = URL.createObjectURL(file);
    video.load();
  },

  // ==================== 图表逻辑 ====================

  // 获取当前用户的训练记录
  getRecords() {
    const user = Auth.getCurrentUser();
    if (!user) return [];
    return user.trainingRecords || [];
  },

  // 绘制 Canvas 图表
  drawChart() {
    const canvas = document.getElementById('t-chartCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const cv = canvas;

    const records = this.getRecords();
    const Y = this.chartYear;
    const M = this.chartMonth;

    // 过滤当月数据
    const data = records.filter(r => {
      const d = new Date(r.date);
      return d.getFullYear() === Y && d.getMonth() === M;
    });

    // 更新年月标签
    const ymEl = document.getElementById('tc-ym');
    if (ymEl) ymEl.textContent = Y + '年 ' + (M + 1) + '月';

    // 清空画布
    ctx.clearRect(0, 0, cv.width, cv.height);

    const pad = 90;
    const w = cv.width - pad * 2;
    const h = cv.height - pad * 2;

    // ---- 绘制网格线（Y轴：秒数）----
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    for (let i = 0; i <= 24; i++) {
      const y = pad + (i / 24) * h;
      ctx.beginPath();
      ctx.moveTo(pad, y);
      ctx.lineTo(cv.width - pad, y);
      ctx.stroke();
    }

    // ---- 绘制网格线（X轴：日期）----
    const maxDays = new Date(Y, M + 1, 0).getDate();
    for (let d = 1; d <= maxDays; d++) {
      const x = pad + (d / maxDays) * w;
      ctx.beginPath();
      ctx.moveTo(x, pad);
      ctx.lineTo(x, cv.height - pad);
      ctx.stroke();
    }

    // ---- Y轴标签（秒）----
    ctx.fillStyle = '#aaa';
    ctx.font = '14px Arial';
    for (let i = 0; i <= 24; i++) {
      const y = pad + (i / 24) * h;
      ctx.fillText(i * 5 + 's', 10, y + 5);
    }

    // ---- X轴标签（日期）----
    for (let d = 1; d <= maxDays; d++) {
      if (d % 2 === 0) {
        const x = pad + (d / maxDays) * w;
        ctx.fillText(d + '日', x, cv.height - 15);
      }
    }

    // 坐标转换函数
    function X(d) { return pad + (d / maxDays) * w; }
    function Yf(ms) { return pad + (ms / 1000 / 120) * h; }

    // 按日期排序
    data.sort((a, b) => new Date(a.date) - new Date(b.date));

    // ---- 绘制折线 ----
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    let first = true;
    data.forEach(r => {
      const d = new Date(r.date);
      const x = X(d.getDate());
      const y = Yf(r.value);
      if (first) { ctx.moveTo(x, y); first = false; }
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // ---- 绘制数据点 ----
    ctx.fillStyle = '#ffea00';
    data.forEach(r => {
      const d = new Date(r.date);
      ctx.beginPath();
      ctx.arc(X(d.getDate()), Yf(r.value), 5, 0, Math.PI * 2);
      ctx.fill();
    });

    // 如果没有数据显示提示
    if (data.length === 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.font = '28px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('本月暂无训练记录', cv.width / 2, cv.height / 2);
      ctx.textAlign = 'left';
    }
  },

  // 导出图表图片
  exportChart() {
    const canvas = document.getElementById('t-chartCanvas');
    if (!canvas) {
      App.showToast('图表不存在 ❌', 'error');
      return;
    }

    try {
      const link = document.createElement('a');
      link.download = 'training_chart_' + this.chartYear + '_' + (this.chartMonth + 1) + '.png';
      link.href = canvas.toDataURL('image/png');
      link.click();

      App.showToast('图表已导出 📥', 'success');
    } catch (e) {
      App.showToast('导出失败，请重试 ❌', 'error');
    }
  },

  // ===== 销毁/清理（离开页面时调用）=====
  destroy() {
    if (this.timerHandle) {
      clearInterval(this.timerHandle);
      this.timerHandle = null;
    }
    this.running = false;
    this.elapsed = 0;
  }
};
