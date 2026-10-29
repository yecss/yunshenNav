/**
 * HTTP 客户端
 *
 * 约定：
 * - 后端统一返回 `{ status, message, data }`，HTTP 状态码与 status 保持一致；
 * - 业务成功（status === 200）时 resolve 整个响应体，失败时 reject；
 * - 传 `silent: true` 可关闭该请求的全局提示，由调用方自行处理（例如密码错误）。
 */

import axios from 'axios'
import { ElMessage } from 'element-plus'
import { API_BASE_URL, REQUEST_TIMEOUT } from './config'
import { STORAGE_KEYS } from '@/constants'
import { readText, removeKey } from '@/utils/storage'

/** 401 处理钩子，由应用入口注册，避免 http 层直接依赖路由造成循环引用 */
let onUnauthorized = null

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler
}

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
  responseType: 'json',
})

http.interceptors.request.use((config) => {
  const token = readText(STORAGE_KEYS.authToken)
  if (token) config.headers.Authorization = token
  return config
})

const STATUS_TEXT = {
  400: '请求参数有误',
  401: '登录已过期，请重新登录',
  403: '没有权限执行该操作',
  404: '请求的资源不存在',
  500: '服务器开小差了，请稍后再试',
}

/** 把 axios 错误转换成可展示的中文提示 */
function resolveErrorMessage(error) {
  if (error?.response) {
    const { status, data } = error.response
    return data?.message || STATUS_TEXT[status] || `请求失败（${status}）`
  }
  if (error?.code === 'ECONNABORTED') return '请求超时，请检查网络'
  if (error?.code === 'ERR_NETWORK') return '网络连接失败，请检查网络'
  return error?.message || '发生了未知错误'
}

http.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error?.response?.status
    // 令牌失效：清掉本地登录态并交给上层决定是否跳转登录页
    if (status === 401) {
      removeKey(STORAGE_KEYS.authToken)
      onUnauthorized?.()
    }
    if (!error?.config?.silent) {
      ElMessage.error(resolveErrorMessage(error))
    }
    return Promise.reject(error)
  }
)

/**
 * 发起请求
 * @param {import('axios').AxiosRequestConfig & { silent?: boolean, successMessage?: string }} options
 */
export function request(options) {
  const { silent = false, successMessage, ...axiosOptions } = options

  return http(axiosOptions).then((body) => {
    const status = body?.status

    if (status === 200) {
      if (!silent) {
        ElMessage.success(successMessage || body.message || '操作成功')
      }
      return body
    }

    // 少数接口用 HTTP 200 包裹业务错误，这里统一按失败处理
    if (!silent) {
      ElMessage.error(body?.message || '操作失败')
    }
    return Promise.reject(body)
  })
}

export default request
