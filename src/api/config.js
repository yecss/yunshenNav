/**
 * 接口基础配置
 * 本地联调时在 `.env.local` 中设置 VITE_API_BASE_URL=http://127.0.0.1:8787/api，
 * 无需改动源码（避免误提交本地地址）。
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.navapi.de5.net/api'

/** 请求超时时间（毫秒） */
export const REQUEST_TIMEOUT = 10000
