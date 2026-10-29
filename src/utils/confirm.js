import { ElMessageBox } from 'element-plus'

/**
 * 统一的二次确认弹窗
 * 用 Promise<boolean> 表达结果，调用方不需要再关心 ElMessageBox 的 reject 语义。
 *
 * 注意：文案一律按纯文本渲染，不开启 dangerouslyUseHTMLString，
 * 避免调用方不小心把用户输入拼进 message 时产生 XSS。
 *
 * @param {{ title?: string, message: string, confirmText?: string, cancelText?: string,
 *           type?: 'warning'|'info'|'success'|'error' }} options
 * @returns {Promise<boolean>} 用户点击确定返回 true，取消或关闭返回 false
 */
export async function confirmAction({
  title = '操作确认',
  message,
  confirmText = '确定',
  cancelText = '取消',
  type = 'warning',
} = {}) {
  try {
    await ElMessageBox.confirm(message, title, {
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      type,
      lockScroll: false,
    })
    return true
  } catch {
    return false
  }
}
