/**
 * 留言板数据逻辑
 *
 * 列表、分页、删除都在这里，视图组件只负责渲染。
 * 新增留言由 MessageForm 自行提交（成功的留言通过事件回传），
 * 避免表单状态和列表状态互相牵扯。
 */
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deleteMessage as deleteMessageApi, fetchMessages } from '@/api'
import { getToken } from '@/stores/session'

/** 每页条数 */
const PAGE_SIZE = 4

export function useMessageBoard() {
  const messages = ref([])
  const page = ref(1)

  const sortedMessages = computed(() =>
    [...messages.value].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  )

  const totalPages = computed(() => Math.max(1, Math.ceil(messages.value.length / PAGE_SIZE)))

  const pagedMessages = computed(() => {
    const start = (page.value - 1) * PAGE_SIZE
    return sortedMessages.value.slice(start, start + PAGE_SIZE)
  })

  async function load() {
    try {
      const res = await fetchMessages()
      messages.value = res.data || []
    } catch {
      ElMessage.error('获取留言失败，请稍后再试')
    }
  }

  function prepend(message) {
    messages.value.push(message)
    page.value = 1
  }

  /**
   * 删除凭证：管理员直接确认；游客需要输入留言时使用的 QQ 号
   * 用户取消时抛出异常，由调用方处理
   */
  async function requestDeleteCredentials(token) {
    if (token) {
      await ElMessageBox.confirm('确定删除这条留言吗？', '删除确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })
      return { qqNumber: null }
    }

    const { value } = await ElMessageBox.prompt(
      '请输入留言时使用的 QQ 号以确认删除：',
      '删除确认',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        inputPattern: /^\d+$/,
        inputErrorMessage: 'QQ 号格式不正确',
      }
    )
    return { qqNumber: value }
  }

  async function remove(message) {
    let credentials
    try {
      credentials = await requestDeleteCredentials(getToken())
    } catch {
      ElMessage.info('已取消删除')
      return
    }

    try {
      await deleteMessageApi({
        messageId: message.id,
        qqNumber: credentials.qqNumber,
        token: getToken(),
      })
      messages.value = messages.value.filter((item) => item.id !== message.id)
      if (page.value > totalPages.value) page.value = totalPages.value
      ElMessage.success('留言已删除')
    } catch {
      ElMessage.error('删除留言失败，请稍后再试')
    }
  }

  function prevPage() {
    if (page.value > 1) page.value -= 1
  }

  function nextPage() {
    if (page.value < totalPages.value) page.value += 1
  }

  return {
    messages,
    page,
    totalPages,
    pagedMessages,
    load,
    prepend,
    remove,
    prevPage,
    nextPage,
  }
}
