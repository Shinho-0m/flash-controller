/**
 * Cloudflare Pages Functions - API 处理
 * 直接处理 /api/* 请求
 */

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method;

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

  try {
    const body = method === 'POST' ? await request.json().catch(() => ({})) : {};

    // 注册
    if (pathname === '/api/register' && method === 'POST') {
      return jsonResp({ success: true, userId: Date.now() }, 200);
    }

    // 登录
    if (pathname === '/api/login' && method === 'POST') {
      return jsonResp({
        success: true,
        user: {
          id: 1,
          username: body.username || 'user',
          nickname: body.username || 'user',
          coins: 100,
          level: 1,
          avatar: '',
          bio: ''
        }
      }, 200);
    }

    // 获取动态列表
    if (pathname === '/api/posts' && method === 'GET') {
      return jsonResp([], 200);
    }

    return jsonResp({ error: 'API 不存在' }, 404);
  } catch (e) {
    return jsonResp({ error: '服务器错误：' + e.message }, 500);
  }
}

function jsonResp(data, status) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
