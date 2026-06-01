/**
 * Cloudflare Pages Functions - /api/* 代理到后端 Worker
 * 标准写法：直接把原始 Request 转发到后端
 */

export async function onRequest(context) {
  var request = context.request;
  var url = new URL(request.url);

  // 非 /api/ 路径，跳过
  if (url.pathname.indexOf('/api/') !== 0) {
    return context.next();
  }

  var UPSTREAM = 'https://flash-controller-api.c4d6c2ae4af1cefede0c645cb18af7e1.workers.dev';
  var targetUrl = UPSTREAM + url.pathname + url.search;

  // ✅ 关键：用原始 request 构造新 Request，Cloudflare 会自动处理 headers
  // 不手动操作 headers，避免只读 header 异常
  var upstreamRequest = new Request(targetUrl, {
    method: request.method,
    headers: request.headers,
    body: (request.method !== 'GET' && request.method !== 'HEAD') ? request.body : undefined,
    redirect: 'manual',
    // 保留原始请求的 mode、credentials 等
  });

  try {
    var resp = await fetch(upstreamRequest);

    // 透传响应，补充 CORS
    var respOpts = {
      status: resp.status,
      statusText: resp.statusText,
      headers: resp.headers,
    };
    var corsResp = new Response(resp.body, respOpts);

    // 设 CORS（允许前端直接从 pages.dev 调用）
    corsResp.headers.set('Access-Control-Allow-Origin', '*');
    corsResp.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    corsResp.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return corsResp;
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Backend unreachable', message: err.message }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
