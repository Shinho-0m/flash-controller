/**
 * 闪霍控制器 - 商城模块
 * 虚拟物品商店、金币购买、背包展示
 */
const Shop = {
  // 分类
  currentCategory: 'all',

  /**
   * 渲染商城页面
   */
  render() {
    const user = Data.load('user');
    const shopItems = Data.load('shopItems') || Data.init('shopItems');
    const ownedItems = (user && user.ownedItems) ? user.ownedItems : [];
    const userPoints = (user && user.points != null) ? user.points : 0;

    return `
        <!-- 金币余额卡片 -->
        <div class="shop-balance-card">
          <div class="balance-info">
            <span class="balance-label">我的金币</span>
            <span class="balance-value">${userPoints}</span>
          </div>
          <button class="recharge-btn" onclick="Shop.showRechargeInfo()">💎 充值</button>
        </div>

        <!-- 分类标签 -->
        <div class="shop-categories">
          <button class="cat-btn ${this.currentCategory === 'all' ? 'active' : ''}" onclick="Shop.filterCategory('all')">
            全部
          </button>
          <button class="cat-btn ${this.currentCategory === 'device' ? 'active' : ''}" onclick="Shop.filterCategory('device')">
            🎮 设备皮肤
          </button>
          <button class="cat-btn ${this.currentCategory === 'avatar' ? 'active' : ''}" onclick="Shop.filterCategory('avatar')">
            👤 头像框
          </button>
          <button class="cat-btn ${this.currentCategory === 'effect' ? 'active' : ''}" onclick="Shop.filterCategory('effect')">
            ✨ 特效
          </button>
          <button class="cat-btn ${this.currentCategory === 'card' ? 'active' : ''}" onclick="Shop.filterCategory('card')">
            🃏 名片
          </button>
        </div>

        <!-- 商品列表 -->
        <div class="shop-items-grid">
          ${this.getFilteredItems(shopItems).map(item => this.renderShopItem(item, ownedItems, user)).join('')}
        </div>

        <!-- 空状态 -->
        ${this.getFilteredItems(shopItems).length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">🏷️</div>
            <p>该分类暂无商品</p>
          </div>
        ` : ''}
    `;
  },

  /**
   * 按分类筛选商品
   */
  getFilteredItems(items) {
    if (this.currentCategory === 'all') return items;
    return items.filter(item => item.category === this.currentCategory);
  },

  /**
   * 渲染单个商品卡片
   */
  renderShopItem(item, ownedItems, user) {
    const isOwned = ownedItems.includes(item.id);
    const canAfford = (user.points || 0) >= item.price;

    return `
      <div class="shop-item ${isOwned ? 'owned' : ''}" data-item-id="${item.id}">
        <div class="item-preview" style="background: linear-gradient(135deg, ${item.color1 || '#1a1a2e'}, ${item.color2 || '#16213e'})">
          <span class="item-icon-large">${item.icon}</span>
          ${item.isHot ? '<span class="hot-badge">🔥 热卖</span>' : ''}
          ${item.isNew ? '<span class="new-badge">NEW</span>' : ''}
          ${isOwned ? '<span class="owned-overlay">已拥有</span>' : ''}
        </div>
        <div class="item-info">
          <div class="item-name">${item.name}</div>
          <div class="item-desc">${item.description}</div>
          <div class="item-bottom">
            <span class="item-price ${!canAfford && !isOwned ? 'too-expensive' : ''}">💰 ${item.price}</span>
            ${isOwned ? `
              <button class="item-btn owned-btn" disabled>已购</button>
            ` : `
              <button class="item-btn buy-btn" onclick="Shop.purchaseItem('${item.id}')" ${!canAfford ? 'disabled style="opacity:0.5"' : ''}>
                购买
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  },

  /**
   * 切换分类
   */
  filterCategory(cat) {
    this.currentCategory = cat;
    App.renderPage('shop');
  },

  /**
   * 购买商品
   */
  purchaseItem(itemId) {
    const shopItems = Data.load('shopItems') || Data.init('shopItems');
    const user = Data.load('user');
    const item = shopItems.find(i => i.id === itemId);

    if (!item) return;

    // 检查是否已拥有
    if (user.ownedItems && user.ownedItems.includes(itemId)) {
      Toast.show('你已经拥有这个商品了', 'info');
      return;
    }

    // 检查金币是否足够
    if ((user.points || 0) < item.price) {
      Toast.show('金币不足，快去完成任务赚取吧！', 'error');
      return;
    }

    // 扣除金币
    user.points = (user.points || 0) - item.price;

    // 添加到拥有列表
    if (!user.ownedItems) user.ownedItems = [];
    user.ownedItems.push(itemId);

    Data.save('user', user);

    // 显示购买成功动画
    this.showPurchaseAnimation(item);

    Toast.show(`🛒 成功购买「${item.name}」！`, 'success');
    App.renderPage('shop');
  },

  /**
   * 购买成功动画
   */
  showPurchaseAnimation(item) {
    // 创建一个全屏覆盖动画层
    const overlay = document.createElement('div');
    overlay.className = 'purchase-animation';
    overlay.innerHTML = `
      <div class="purchase-particle">✨</div>
      <div class="purchase-text">${item.icon} ${item.name}</div>
    `;
    document.body.appendChild(overlay);

    setTimeout(() => {
      overlay.classList.add('show');
      setTimeout(() => {
        overlay.classList.remove('show');
        setTimeout(() => overlay.remove(), 500);
      }, 1500);
    }, 50);
  },

  /**
   * 显示充值信息（演示用）
   */
  showRechargeInfo() {
    App.showModal(`
      <div class="modal-header">
        <h3>💎 充值中心</h3>
      </div>
      <div class="recharge-options">
        ${[
          { coins: 100, price: '¥6', bonus: '', popular: false },
          { coins: 300, price: '¥15', bonus: '+30', popular: true },
          { coins: 680, price: '¥30', bonus: '+80', popular: false },
          { coins: 1280, price: '¥50', bonus: '+200', popular: false },
          { coins: 3280, price: '¥128', bonus: '+680', popular: false },
          { coins: 6480, price: '¥248', bonus: '+1480', popular: false },
        ].map(opt => `
          <div class="recharge-option ${opt.popular ? 'popular' : ''}" onclick="Shop.doRecharge(${opt.coins}, '${opt.price}')">
            ${opt.popular ? '<span class="popular-tag">推荐</span>' : ''}
            <span class="recharge-coins">${opt.coins}</span>
            <span class="recharge-bonus">${opt.bonus ? opt.bonus + '赠送' : ''}</span>
            <span class="recharge-price">${opt.price}</span>
          </div>
        `).join('')}
      </div>
    `, () => {});
  },

  /**
   * 执行充值（演示：直接加金币）
   */
  doRecharge(coins, _price) {
    const user = Data.load('user');

    // 计算含赠送的金币数
    let totalCoins = coins;
    if (coins >= 300 && coins < 680) totalCoins += 30;
    else if (coins >= 680 && coins < 1280) totalCoins += 80;
    else if (coins >= 1280 && coins < 3280) totalCoins += 200;
    else if (coins >= 3280 && coins < 6480) totalCoins += 680;
    else if (coins >= 6480) totalCoins += 1480;

    user.points = (user.points || 0) + totalCoins;
    Data.save('user', user);

    App.closeModal();
    Toast.show(`💰 充值成功！获得 ${totalCoins} 金币`, 'success');
    App.renderPage('shop');
  },

  /**
   * 显示已拥有的商品（背包）
   */
  showOwnedItems() {
    const user = Data.load('user');
    const shopItems = Data.load('shopItems') || Data.init('shopItems');
    const ownedIds = user.ownedItems || [];

    if (ownedIds.length === 0) {
      Toast.show('背包空空的，去逛逛吧~', 'info');
      return;
    }

    const ownedItems = shopItems.filter(item => ownedIds.includes(item.id));

    App.showModal(`
      <div class="modal-header">
        <h3>🎒 我的背包</h3>
      </div>
      <div class="inventory-grid">
        ${ownedItems.map(item => `
          <div class="inventory-item">
            <div class="inv-preview" style="background: linear-gradient(135deg, ${item.color1 || '#1a1a2e'}, ${item.color2 || '#16213e'})">
              <span class="inv-icon">${item.icon}</span>
            </div>
            <span class="inv-name">${item.name}</span>
          </div>
        `).join('')}
      </div>
    `, () => {});
  }
};

// 将 Shop 注册到全局
window.Shop = Shop;
