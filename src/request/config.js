export default {
  method: 'get',
  // 部署后的 Cloudflare Worker 地址，把 <account> 换成你的 workers.dev 子域。
  // 本地调试改成 'http://localhost:8787/api'，跑 `npx wrangler dev`。
  baseURL: 'https://worker.apai.cc.cd/api',  // 本地调试，先运行 `npx wrangler dev`
  // 请求头信息
  headers: {
    'Content-Type': 'application/json',
  },
  // 设置超时时间
  timeout: 10000,
  // 携带凭证
  withCredentials: false,
  // 返回数据类型
  responseType: 'json',
}
