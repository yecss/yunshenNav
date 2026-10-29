<template>
  <div class="message-form">
    <input v-model="form.username" class="message-form__input" placeholder="输入你的昵称…" />
    <input
      v-model="form.qqNumber"
      class="message-form__input"
      placeholder="输入你的 QQ（不填则默认为 10000）"
    />
    <textarea
      v-model="form.text"
      class="message-form__input message-form__textarea"
      rows="4"
      placeholder="输入你的留言…"
    />

    <div class="message-form__actions">
      <button type="button" class="btn btn--green" @click="goHome">返回主页</button>
      <button type="button" class="btn btn--blue" :disabled="submitting" @click="submit">
        提交留言
      </button>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { createMessage } from '@/api'

/** 未填 QQ 时使用的默认头像号 */
const DEFAULT_QQ = '10000'

const emit = defineEmits(['created'])

const router = useRouter()
const form = reactive({ username: '', qqNumber: '', text: '' })
const submitting = ref(false)

async function submit() {
  const username = form.username.trim()
  const text = form.text.trim()

  if (!username || !text) {
    ElMessage.error('昵称和留言不能为空')
    return
  }

  submitting.value = true
  try {
    const qqNumber = form.qqNumber.trim() || DEFAULT_QQ
    const res = await createMessage({ username, qqNumber, text })

    emit('created', {
      id: res.data?.id ?? Date.now(),
      username,
      qqNumber,
      text,
      timestamp: new Date().toISOString(),
    })

    form.text = ''
    form.qqNumber = ''
  } catch {
    ElMessage.error('留言失败，请稍后再试')
  } finally {
    submitting.value = false
  }
}

function goHome() {
  router.push('/app')
}
</script>

<style lang="scss" scoped>
.message-form {
  padding: 10px;
  margin-bottom: 24px;
}

.message-form__input {
  box-sizing: border-box;
  width: 100%;
  padding: 12px;
  margin-bottom: 12px;
  font-size: 14px;
  color: inherit;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  outline: none;

  &:focus {
    border-color: #93c5fd;
    box-shadow: 0 0 0 3px rgb(147 197 253 / 40%);
  }
}

.message-form__textarea {
  resize: vertical;
}

.message-form__actions {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
}

.btn {
  padding: 8px 20px;
  font-size: 14px;
  color: #fff;
  cursor: pointer;
  border: 0;
  border-radius: 8px;
  transition: background-color 0.2s;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}

.btn--green {
  background-color: #22c55e;

  &:hover:not(:disabled) {
    background-color: #16a34a;
  }
}

.btn--blue {
  background-color: #3b82f6;

  &:hover:not(:disabled) {
    background-color: #2563eb;
  }
}
</style>
