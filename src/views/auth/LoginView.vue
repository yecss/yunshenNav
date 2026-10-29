<template>
  <div class="login-page">
    <section class="login-card" aria-labelledby="login-title">
      <header class="login-card__header">
        <h1 id="login-title" class="login-card__title">登录</h1>
      </header>

      <el-form :model="form" label-position="top" @submit.prevent="submit">
        <el-form-item label="账号" for="login-username">
          <el-input
            id="login-username"
            v-model="form.username"
            placeholder="请输入用户名"
            autocomplete="username"
            :prefix-icon="User"
          />
        </el-form-item>

        <el-form-item label="密码" for="login-password">
          <el-input
            id="login-password"
            v-model="form.password"
            type="password"
            show-password
            placeholder="请输入密码"
            autocomplete="current-password"
            :prefix-icon="Lock"
          />
        </el-form-item>
        <el-button
          class="login-card__submit"
          type="primary"
          native-type="submit"
          :loading="loading"
        >
          管理员登录
        </el-button>
      </el-form>

      <div class="login-card__actions">
        <el-button text :icon="ArrowLeft" @click="goHome">返回主页</el-button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Lock, User } from '@element-plus/icons-vue'
import { login } from '@/api'
import { setToken } from '@/stores/session'

const router = useRouter()

const form = reactive({ username: '', password: '' })
const loading = ref(false)

function validate() {
  if (!form.username.trim()) return '请输入用户名'
  if (!form.password) return '请输入密码'
  return ''
}

async function submit() {
  if (loading.value) return
  const error = validate()
  if (error) {
    ElMessage.warning(error)
    return
  }

  loading.value = true
  try {
    const res = await login({
      username: form.username.trim(),
      password: form.password,
    })
    setToken(res.token)
    router.push('/app')
  } catch {
    // 错误提示已由请求层统一处理
  } finally {
    loading.value = false
  }
}

function goHome() {
  router.push('/app')
}
</script>

<style lang="scss" scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  height: 100%;
  padding: 32px 20px;
  overflow-y: auto;
}

.login-card {
  box-sizing: border-box;
  flex-shrink: 0;
  width: 400px;
  max-width: 100%;
  padding: 36px 36px 24px;
  margin: auto;
  background-color: #fff;
  border: 1px solid rgb(255 255 255 / 80%);
  border-radius: 16px;
  box-shadow: 0 16px 48px rgb(27 44 60 / 18%);
  --el-color-primary: #2563eb;
  --el-color-primary-light-3: #4b7dee;
  --el-color-primary-dark-2: #1d4ed8;
}

.login-card__header {
  margin-bottom: 30px;
  text-align: center;
}

.login-card__title {
  margin: 0;
  font-size: 26px;
  font-weight: 600;
  line-height: 1.4;
  color: #243449;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-form-item__label) {
  padding-bottom: 8px;
  font-size: 13px;
  font-weight: 500;
  line-height: 20px;
  color: #334155;
}

:deep(.el-input__inner) {
  height: 44px;
  padding-right: 38px;
  padding-left: 38px;
  font-size: 14px;
  color: #243449;
  background: #f8fafc;
  border-color: #d5dde7;
  border-radius: 8px;
  caret-color: #2563eb;

  &::placeholder {
    color: #6b7789;
  }

  &:hover {
    border-color: #94a3b8;
  }

  &:focus {
    background: #fff;
    border-color: #2563eb;
    outline: 2px solid #dbeafe;
    outline-offset: 1px;
  }
}

:deep(.el-input__prefix) {
  left: 12px;
  color: #64748b;
}

:deep(.el-input__suffix) {
  right: 12px;
  color: #64748b;
}

.login-card__submit {
  width: 100%;
  height: 44px;
  margin-top: 6px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
}

.login-card__actions {
  display: flex;
  justify-content: center;
  margin-top: 16px;

  .el-button {
    min-height: 36px;
    margin: 0;
    color: #64748b;
    background: transparent;
    border: 0;
  }

  .el-button:hover {
    color: #1d4ed8;
    background: #eff6ff;
  }
}

:deep(.el-button:focus-visible) {
  outline: 2px solid #2563eb;
  outline-offset: 3px;
}

@media (max-width: 599px) {
  .login-page {
    padding: 24px 20px;
    background: #f1f5f9;
  }

  .login-card {
    padding: 32px 24px 20px;
    box-shadow: 0 8px 28px rgb(27 44 60 / 8%);
  }
}
</style>
