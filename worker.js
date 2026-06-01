/**
 * 闪霍控制器 - Cloudflare Worker 后端 API
 * ES Module 格式（D1 绑定要求）
 * 数据库表需要补充：post_likes 表（用于点赞）
 */

// D1 数据库绑定在 env.DB

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const DB = env.DB;

      // ==================== 用户系统 ====================

      if (path === '/api/register' && method === 'POST') {
        const { username, password, email } = await request.json();
        const existing = await DB.prepare('SELECT id FROM users WHERE username = ? OR email = ?').bind(username, email).first();
        if (existing) {
          return jsonResp({ error: '用户名或邮箱已存在' }, 400, corsHeaders);
        }
        // 同时使用 username 作为 email（如果没有提供）
        const useEmail = email || `${username}@flash-controller.local`;
        const result = await DB.prepare('INSERT INTO users (username, password, email) VALUES (?, ?, ?)').bind(username, password, useEmail).run();
        const userId = result.meta.last_row_id;
        // 初始化用户游戏数据
        await DB.prepare('INSERT INTO user_stats (user_id, nickname, coins, level, exp) VALUES (?, ?, 100, 1, 0)').bind(userId, username).run();
        return jsonResp({ success: true, userId }, 200, corsHeaders);
      }

      if (path === '/api/login' && method === 'POST') {
        const { username, password } = await request.json();
        const user = await DB.prepare('SELECT id, username, email FROM users WHERE username = ? AND password = ?').bind(username, password).first();
        if (!user) {
          return jsonResp({ error: '用户名或密码错误' }, 401, corsHeaders);
        }
        // 获取用户游戏数据
        const stats = await DB.prepare('SELECT * FROM user_stats WHERE user_id = ?').bind(user.id).first();
        return jsonResp({ success: true, user: { ...user, ...stats }}, 200, corsHeaders);
      }

      if (path === '/api/user' && method === 'GET') {
        const userId = url.searchParams.get('id');
        const user = await DB.prepare('SELECT users.id, users.username, user_stats.nickname, user_stats.avatar, user_stats.bio, user_stats.level, user_stats.coins FROM users LEFT JOIN user_stats ON users.id = user_stats.user_id WHERE users.id = ?').bind(userId).first();
        if (!user) {
          return jsonResp({ error: '用户不存在' }, 404, corsHeaders);
        }
        return jsonResp(user, 200, corsHeaders);
      }

      // ==================== 社区动态 ====================

      if (path === '/api/posts' && method === 'GET') {
        const posts = await DB.prepare(`
          SELECT posts.*, users.username as authorName, user_stats.avatar as authorAvatar
          FROM posts
          JOIN users ON posts.user_id = users.id
          LEFT JOIN user_stats ON users.id = user_stats.user_id
          ORDER BY created_at DESC LIMIT 50
        `).all();
        return jsonResp(posts.results, 200, corsHeaders);
      }

      if (path === '/api/posts' && method === 'POST') {
        const { user_id, content } = await request.json();
        const result = await DB.prepare('INSERT INTO posts (user_id, content) VALUES (?, ?)').bind(user_id, content).run();
        return jsonResp({ success: true, postId: result.meta.last_row_id }, 200, corsHeaders);
      }

      // 点赞 / 取消点赞
      if (path === '/api/posts/like' && method === 'POST') {
        const { post_id, user_id } = await request.json();
        const existing = await DB.prepare('SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?').bind(post_id, user_id).first();
        if (existing) {
          await DB.prepare('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?').bind(post_id, user_id).run();
          await DB.prepare('UPDATE posts SET likes = likes - 1 WHERE id = ?').bind(post_id).run();
          return jsonResp({ success: true, liked: false }, 200, corsHeaders);
        } else {
          await DB.prepare('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)').bind(post_id, user_id).run();
          await DB.prepare('UPDATE posts SET likes = likes + 1 WHERE id = ?').bind(post_id).run();
          return jsonResp({ success: true, liked: true }, 200, corsHeaders);
        }
      }

      // 获取评论
      if (path === '/api/comments' && method === 'GET') {
        const postId = url.searchParams.get('post_id');
        const comments = await DB.prepare(`
          SELECT comments.*, users.username as authorName, user_stats.avatar as authorAvatar
          FROM comments
          JOIN users ON comments.user_id = users.id
          LEFT JOIN user_stats ON users.id = user_stats.user_id
          WHERE comments.post_id = ? ORDER BY created_at ASC
        `).bind(postId).all();
        return jsonResp(comments.results, 200, corsHeaders);
      }

      // 发表评论
      if (path === '/api/comments' && method === 'POST') {
        const { post_id, user_id, content } = await request.json();
        const result = await DB.prepare('INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)').bind(post_id, user_id, content).run();
        await DB.prepare('UPDATE posts SET comments = comments + 1 WHERE id = ?').bind(post_id).run();
        return jsonResp({ success: true, commentId: result.meta.last_row_id }, 200, corsHeaders);
      }

      // ==================== 消息系统 ====================

      if (path === '/api/messages' && method === 'GET') {
        const userId = url.searchParams.get('user_id');
        const messages = await DB.prepare('SELECT * FROM messages WHERE receiver_id = ? OR sender_id = ? ORDER BY created_at DESC').bind(userId, userId).all();
        return jsonResp(messages.results, 200, corsHeaders);
      }

      if (path === '/api/messages' && method === 'POST') {
        const { sender_id, receiver_id, content } = await request.json();
        const result = await DB.prepare('INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)').bind(sender_id, receiver_id, content).run();
        return jsonResp({ success: true, messageId: result.meta.last_row_id }, 200, corsHeaders);
      }

      // ==================== 商城系统 ====================

      if (path === '/api/shop' && method === 'GET') {
        const items = await DB.prepare('SELECT * FROM shop_items WHERE available = 1').all();
        return jsonResp(items.results, 200, corsHeaders);
      }

      if (path === '/api/shop/buy' && method === 'POST') {
        const { user_id, item_id } = await request.json();
        const stats = await DB.prepare('SELECT coins FROM user_stats WHERE user_id = ?').bind(user_id).first();
        const item = await DB.prepare('SELECT price FROM shop_items WHERE id = ?').bind(item_id).first();
        if (!stats || !item) {
          return jsonResp({ error: '用户或商品不存在' }, 400, corsHeaders);
        }
        if (stats.coins < item.price) {
          return jsonResp({ error: '积分不足' }, 400, corsHeaders);
        }
        await DB.prepare('UPDATE user_stats SET coins = coins - ? WHERE user_id = ?').bind(item.price, user_id).run();
        await DB.prepare('INSERT INTO purchases (user_id, item_id) VALUES (?, ?)').bind(user_id, item_id).run();
        return jsonResp({ success: true }, 200, corsHeaders);
      }

      // ==================== 404 ====================

      return jsonResp({ error: 'API 不存在' }, 404, corsHeaders);

    } catch (error) {
      return jsonResp({ error: error.message }, 500, corsHeaders);
    }
  }
};

function jsonResp(data, status, corsHeaders) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}
