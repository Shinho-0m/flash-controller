export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  // 只处理 /api/ 路径
  if (!url.pathname.startsWith('/api/')) {
    return context.next();
  }

  // 直接返回测试响应，不代理，验证 Functions 是否能正常加载
  const data = {
    ok: true,
    path: url.pathname,
    msg: 'Functions 正常工作！',
  };

  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
