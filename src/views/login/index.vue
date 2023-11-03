<template>
  <div class="form">
    <header>
      <h1>登录</h1>
    </header>
    <el-form @submit.native.prevent :rules="baseRules" :model="form">
      <el-row class="row">
        <el-col class="title" :span="4">账号：</el-col>
        <el-col :span="20">
          <el-form-item prop="username">
            <el-input
              prop="username"
              placeholder="请输入用户名"
              v-model="form.username"
            ></el-input>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row class="row">
        <el-col class="title" :span="4">密码：</el-col>
        <el-col :span="20">
          <el-form-item prop="password">
            <el-input
              placeholder="请输入密码"
              v-model="form.password"
              show-password
              @keyup.enter="doLogin"
            ></el-input>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <el-row class="row row-btn">
      <el-col class="btn-wrapper" :span="8">
        <el-button
          @click="doRegister"
          type="success"
          plain
          :loading="registerLoading"
        >
          注册
        </el-button>
      </el-col>
      <el-col class="btn-wrapper" :span="8">
        <el-button
          @click="doLogin"
          type="primary"
          plain
          :loading="loginLoading"
        >
          登录
        </el-button>
      </el-col>
      <el-col class="btn-wrapper" :span="8">
        <el-button
          @click="defaultLogin"
          type="info"
          plain
          :loading="defaultLoading"
        >
          游客
        </el-button>
      </el-col>
    </el-row>
  </div>
</template>
<script setup>
import { reactive, ref } from 'vue'
const loginLoading = ref(false)
const registerLoading = ref(false)
const defaultLoading = ref(false)
import { login, register } from '@/api/login'
import { useStore } from 'vuex'
import router from '@/router'
import { ElMessage } from 'element-plus'
const store = useStore()
const form = reactive({
  username: '',
  password: '',
})

const baseRules = {
  username: [
    {
      required: true,
      message: '请输入用户名',
      trigger: 'blur',
    },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    {
      min: 6,
      max: 32,
      message: '密码长度在6-32个字符之间',
      trigger: ['blur', 'change'],
    },
  ],
}
const validateForm = () => {
  console.log(form.username);
  if (!form.username) {
    ElMessage.error('请输入用户名')
    return false
  }
  if (!form.password||form.password.length<6) {
    ElMessage.error('请输入密码')
    return false
  }
  return true
}
const doLogin = () => {
  if (validateForm()) {
    loginLoading.value = true
    login(form)
      .then((res) => {
        store.commit('user/setToken', res.token)
        router.push('/app')
      })
      .finally(() => {
        loginLoading.value = false
      })
  }
}

const doRegister = () => {
  registerLoading.value = true
  register(form)
    .then((res) => {
      form.password = ''
      form.username = ''
    })
    .finally(() => {
      registerLoading.value = false
    })
}

const defaultLogin = () => {
  defaultLoading.value = true
  form.username = 'test'
  form.password = 'test1234'
  login(form)
    .then((res) => {
      store.commit('user/setToken', res.token)
      router.push('/app')
    })
    .finally(() => {
      defaultLoading.value = false
    })
}
</script>
<style lang="scss">
.form {
  header {
    text-align: center;
  }
  margin: 160px auto;
  border-radius: 8px;
  width: 430px;
  background-color: rgb(255, 255, 255);
  box-shadow: rgba(149, 157, 165, 0.512) 0px 8px 24px;
  padding: 50px;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', '微软雅黑', Arial, sans-serif;

  .title {
    line-height: 2em;
    font-size: 16px;
  }
  .row {
    margin-top: 20px;
  }
  .btn-wrapper {
    display: flex;
    justify-content: center;
  }
}
</style>
