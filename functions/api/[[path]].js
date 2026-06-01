/**
 * Cloudflare Pages Functions - API 处理
 * 直接处理 /api/* 请求
 * 
 * ⚠️ 需要先给 Pages 项目绑定 D1 数据库（flash-controller-db，绑定名 DB）
 * 绑定方法：Cloudflare Dashboard → Pages 项目 → Settings → Functions → D1 bindings
 */

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method;

  // 🔍 调试接口：查看 env 里有什么
  if (pathname === '/api/debug-env') {
    return new Response(JSON.stringify({
      envKeys: Object.keys(env),
      hasDB: !!env.DB,
      DB_type: typeof env.DB,
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  // CORS 预检
  if (method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const DB = env.DB; // D1 数据库绑定（需要在 Cloudflare Dashboard 中配置）

    // ==================== 用户系统 ====================

    if (pathname === '/api/register' && method === 'POST') {
      const { username, password, email } = await request.json();
      const existing = await DB.prepare('SELECT id FROM users WHERE username = ? OR email = ?').bind(username, email).first();
      if (existing) {
        return jsonResp({ error: '用户名或邮箱已存在' }, 400, corsHeaders);
      }
      const useEmail = email || `${username}@flash-controller.local`;
      const result = await DB.prepare('INSERT INTO users (username, password, email) VALUES (?, ?, ?)').bind(username, password, useEmail).run();
      const userId = result.meta.last_row_id;
      await DB.prepare('INSERT INTO user_stats (user_id, nickname, coins) VALUES (?, ?, 100)').bind(userId, username).run();
      return jsonResp({ success: true, userId }, 200, corsHeaders);
    }

    if (pathname === '/api/login' && method === 'POST') {
      const { username, password } = await request.json();
      const user = await DB.prepare('SELECT id, username, email FROM users WHERE username = ? AND password = ?').bind(username, password).first();
      if (!user) {
        return jsonResp({ error: '用户名或密码错误' }, 401, corsHeaders);
      }
      const stats = await DB.prepare('SELECT * FROM user_stats WHERE user_id = ?').bind(user.id).first();
      return jsonResp({ success: true, user: { ...user, ...stats } }, 200, corsHeaders);
    }

    if (pathname === '/api/user' && method === 'GET') {
      const userId = url.searchParams.get('id');
      const user = await DB.prepare(`
        SELECT users.id, users.username, user_stats.nickname, user_stats.avatar, user_stats.bio, user_stats.level, user_stats.coins
        FROM users LEFT JOIN user_stats ON users.id = user_stats.user_id
        WHERE users.id = ?
      `).bind(userId).first();
      if (!user) {
        return jsonResp({ error: '用户不存在' }, 404, corsHeaders);
      }
      return jsonResp(user, 200, corsHeaders);
    }

    // ==================== 社区动态 ====================

    if (pathname === '/api/posts' && method === 'GET') {
      const posts = await DB.prepare(`
        SELECT posts.*, users.username as authorName, user_stats.avatar as authorAvatar
        FROM posts
        JOIN users ON posts.user_id = users.id
        LEFT JOIN user_stats ON users.id = user_stats.user_id
        ORDER BY created_at DESC LIMIT 50
      `).all();
      return jsonResp(posts.results || [], 200, corsHeaders);
    }

    if (pathname === '/api/posts' && method === 'POST') {
      const { user_id, content } = await request.json();
      const result = await DB.prepare('INSERT INTO posts (user_id, content) VALUES (?, ?)').bind(user_id, content).run();
      return jsonResp({ success: true, postId: result.meta.last_row_id }, 200, corsHeaders);
    }

    // 点赞 / 取消点赞
    if (pathname === '/api/posts/like' && method === 'POST') {
      const body = await request.json();
      const post_id = body.post_id || body.postId;
      const user_id = body.user_id || body.userId;
      if (!post_id || !user_id) return jsonResp({ error: '缺少参数' }, 400, corsHeaders);
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
    if (pathname === '/api/comments' && method === 'GET') {
      const postId = url.searchParams.get('post_id') || url.searchParams.get('postId');
      const comments = await DB.prepare(`
        SELECT comments.*, users.username as authorName, user_stats.avatar as authorAvatar
        FROM comments
        JOIN users ON comments.user_id = users.id
        LEFT JOIN user_stats ON users.id = user_stats.user_id
        WHERE comments.post_id = ? ORDER BY created_at ASC
      `).bind(postId).all();
      return jsonResp(comments.results || [], 200, corsHeaders);
    }

    // 发表评论
    if (pathname === '/api/comments' && method === 'POST') {
      const body = await request.json();
      const post_id = body.post_id || body.postId;
      const user_id = body.user_id || body.userId;
      const content = body.content;
      if (!post_id || !user_id || !content) return jsonResp({ error: '缺少参数' }, 400, corsHeaders);
      const result = await DB.prepare('INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)').bind(post_id, user_id, content).run();
      await DB.prepare('UPDATE posts SET comments = comments + 1 WHERE id = ?').bind(post_id).run();
      return jsonResp({ success: true, commentId: result.meta.last_row_id }, 200, corsHeaders);
    }

    // ==================== 消息系统 ====================

    if (pathname === '/api/messages' && method === 'GET') {
      const userId = url.searchParams.get('user_id');
      const messages = await DB.prepare('SELECT * FROM messages WHERE receiver_id = ? OR sender_id = ? ORDER BY created_at DESC').bind(userId, userId).all();
      return jsonResp(messages.results || [], 200, corsHeaders);
    }

    if (pathname === '/api/messages' && method === 'POST') {
      const { sender_id, receiver_id, content } = await request.json();
      const result = await DB.prepare('INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)').bind(sender_id, receiver_id, content).run();
      return jsonResp({ success: true, messageId: result.meta.last_row_id }, 200, corsHeaders);
    }

    // ==================== 商城系统 ====================

    if (pathname === '/api/shop' && method === 'GET') {
      const items = await DB.prepare('SELECT * FROM shop_items').all();
      return jsonResp(items.results || [], 200, corsHeaders);
    }

    if (pathname === '/api/shop/buy' && method === 'POST') {
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

    // ==================== 任务系统 ====================

    if (pathname === '/api/tasks' && method === 'GET') {
      const tasks = await DB.prepare('SELECT * FROM tasks').all();
      return jsonResp(tasks.results || [], 200, corsHeaders);
    }

    if (pathname === '/api/tasks/complete' && method === 'POST') {
      const { user_id, task_id } = await request.json();
      const task = await DB.prepare('SELECT reward FROM tasks WHERE id = ?').bind(task_id).first();
      if (!task) {
        return jsonResp({ error: '任务不存在' }, 404, corsHeaders);
      }
      await DB.prepare('UPDATE user_stats SET coins = coins + ? WHERE user_id = ?').bind(task.reward, user_id).run();
      await DB.prepare('INSERT INTO task_completions (user_id, task_id) VALUES (?, ?)').bind(user_id, task_id).run();
      return jsonResp({ success: true, reward: task.reward }, 200, corsHeaders);
    }

    // ==================== 404 ====================

    return jsonResp({ error: 'API 不存在' }, 404, corsHeaders);

  } catch (e) {
    return jsonResp({ error: '服务器错误：' + e.message }, 500, corsHeaders);
  }
}

function jsonResp(data, status, corsHeaders) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}
