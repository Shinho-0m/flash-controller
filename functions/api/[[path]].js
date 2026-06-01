/**
 * Cloudflare Pages Functions - API 代理
 * 把所有 /api/* 请求转发到后端 Worker
 */

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  // 只代理 /api/ 开头的请求
  if (!url.pathname.startsWith('/api/')) {
    return context.next();
  }

  const BACKEND_URL = 'https://flash-controller-api.c4d6c2ae4af1cefede0c645cb18af7e1.workers.dev';

  // 构造目标 URL
  const targetUrl = BACKEND_URL + url.pathname + url.search;

  // 转发请求
  // 注意：不能直接复用 request.headers 对象（是只读的），
  // 需要逐个复制需要的 header，排除 host/transfer-encoding 等
  const skipHeaders = new Set([
    'host', 'transfer-encoding', 'connection',
    'content-length', 'keep-alive', 'expect',
    'proxy-authenticate', 'proxy-authorization', 'te', 'trailer', 'upgrade',
  ]);
  // cf- 开头的 header 也不能传，需要过滤
  const newHeaders = new Headers();
  for (const [key, val] of request.headers.entries()) {
    if (skipHeaders.has(key.toLowerCase()) || key.toLowerCase().startsWith('cf-')) {
      continue;
    }
    newHeaders.set(key, val);
  }

  const body = (request.method !== 'GET' && request.method !== 'HEAD')
    ? request.body
    : undefined;

  const newRequest = new Request(targetUrl, {
    method: request.method,
    headers: newHeaders,
    body: body,
    redirect: 'manual',
  });

  try {
    const response = await fetch(newRequest);
    // 透传后端响应，补上 CORS header
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
