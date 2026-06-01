/**
 * Cloudflare Pages Functions - API 代理
 * 把所有 /api/* 请求转发到后端 Worker
 */

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // 只代理 /api/ 开头的请求
  if (!url.pathname.startsWith('/api/')) {
    return context.next();
  }

  const BACKEND_URL = 'https://flash-controller-api.c4d6c2ae4af1cefede0c645cb18af7e1.workers.dev';

  // 构造目标 URL
  const targetUrl = BACKEND_URL + url.pathname + url.search;

  // 转发请求（保留 method、headers、body）
  const newRequest = new Request(targetUrl, {
    method: request.method,
    headers: request.headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
    redirect: 'manual',
  });

  // 删除可能引起问题的 headers（不能用模糊匹配，只能逐个删）
  newRequest.headers.delete('host');

  try {
    const response = await fetch(newRequest);
    // 处理 CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    const newResp = new Response(response.body, response);
    Object.entries(corsHeaders).forEach(([k, v]) => newResp.headers.set(k, v));
    return newResp;
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Backend unreachable: ' + err.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
