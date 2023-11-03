export default {
  method:'get',
  // 基础URL前缀
  baseURL:'https://api.yecss.com/',
  // 请求头信息
  headers: {
    'Content-Type':'application/json'
  },
  // 设置超时时间
  timeout:10000,
  // 携带凭证
  withCredentials: false,
  // 返回数据类型
  responseType:'json'
}