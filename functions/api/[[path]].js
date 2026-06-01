/**
 * Cloudflare Pages Functions - API 处理
 * 直接处理 /api/* 请求，不代理
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
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  // 注册
  if (pathname === '/api/register' && method === 'POST') {
    const body = await request.json();
    return jsonResp({ success: true, userId: 999, mock: true }, 200);
  }

  // 登录
  if (pathname === '/api/login' && method === 'POST') {
    const body = await request.json();
    return jsonResp({
      success: true,
      user: { id: 1, username: body.username, nickname: body.username, coins: 100, level: 1 }
    }, 200);
  }

  // 获取动态
  if (pathname === '/api/posts' && method === 'GET') {
    return jsonResp([
      { id: 1, content: '测试动态', authorName: '测试用户', likes: 0, comments: 0 }
    ], 200);
  }

  return jsonResp({ error: 'API 不存在' }, 404);
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
