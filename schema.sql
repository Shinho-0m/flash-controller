-- 闪霍控制器 - D1 数据库建表 SQL
-- 在 Cloudflare D1 控制台执行这些 SQL

-- ==================== 用户表 ====================
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,  -- 简化版,实际应该用 bcrypt 加密
  email TEXT NOT NULL UNIQUE,
  points INTEGER DEFAULT 0,  -- 积分/余额
  avatar TEXT DEFAULT '',     -- 头像 URL
  bio TEXT DEFAULT '',        -- 个人简介
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==================== 任务表 ====================
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  difficulty INTEGER DEFAULT 1,  -- 难度 1-5
  reward INTEGER DEFAULT 0,      -- 奖励积分
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed, failed
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ==================== 消息表 ====================
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id INTEGER NOT NULL,
  receiver_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,  -- 0=未读, 1=已读
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id),
  FOREIGN KEY (receiver_id) REFERENCES users(id)
);

-- ==================== 社区动态表 ====================
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ==================== 评论表 ====================
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ==================== 商城商品表 ====================
CREATE TABLE IF NOT EXISTS shop_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  image TEXT DEFAULT '',
  available INTEGER DEFAULT 1,  -- 0=下架, 1=在售
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==================== 购买记录表 ====================
CREATE TABLE IF NOT EXISTS purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (item_id) REFERENCES shop_items(id)
);

-- ==================== AI 角色表 ====================
CREATE TABLE IF NOT EXISTS ai_characters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  personality TEXT,  -- 性格描述
  avatar TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==================== 训练记录表 ====================
CREATE TABLE IF NOT EXISTS training_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  training_type TEXT NOT NULL,  -- 训练类型
  duration INTEGER DEFAULT 0,     -- 时长(分钟)
  intensity INTEGER DEFAULT 1,    -- 强度 1-5
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ==================== 插入测试数据 ====================

-- 插入测试用户 (密码: 123456)
INSERT OR IGNORE INTO users (id, username, password, email, points) VALUES
(1, 'shinho', '123456', 'shinho@example.com', 1000);

-- 插入测试任务
INSERT OR IGNORE INTO tasks (id, user_id, title, description, difficulty, reward, status) VALUES
(1, 1, '完成前端页面', '完成闪霍控制器的前端页面开发', 3, 100, 'completed'),
(2, 1, '部署到 Cloudflare', '将项目部署到 Cloudflare Pages', 2, 50, 'in_progress');

-- 插入测试商品
INSERT OR IGNORE INTO shop_items (id, name, description, price, image, available) VALUES
(1, 'VIP 会员', '享受所有高级功能', 500, '', 1),
(2, '自定义头像框', '独一无二的头像框', 200, '', 1),
(3, '积分加成卡', '24小时内获得的积分翻倍', 100, '', 1);

-- 插入测试 AI 角色
INSERT OR IGNORE INTO ai_characters (id, name, personality, avatar) VALUES
(1, '小闪', '温柔体贴,善于倾听', ''),
(2, '霍霍', '霸道总裁,控制欲强', '');

-- ==================== 创建索引 ====================
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_training_logs_user_id ON training_logs(user_id);
