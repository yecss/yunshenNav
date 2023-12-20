<template>
  <div class="header-cont">
    <div class="left">
      <h1>
        <router-link to="/">{{ t("sitename") }}</router-link>
      </h1>
    </div>
    <div class="right flex-center">
      <div class="lang gap">
        <span class="item" @click="changeLang('zh-cn')" :class="{active:locale==='zh-cn'}">简体中文</span> / 
        <span @click="changeLang('en')" class="item" :class="{active:locale==='en'}">EN</span>
      </div>
      <template v-if="isLogin">
        <div class="gap cursor">
        <router-link to="/personal/message">
          <el-badge :is-dot="!!unReadCount">
            <el-icon><message></message></el-icon>
          </el-badge>
        </router-link>
      </div>
      <el-dropdown trigger="click" @command="handleCommand">
        <div class="flex-center cursor">
          {{ username }}
          <el-icon><caret-bottom></caret-bottom></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="toPersonal">{{ t("personalCenter") }}</el-dropdown-item>
            <el-dropdown-item divided command="toLogout">{{ t("logout") }}</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      </template>

      <template v-else-if="$route.name !== 'Login'">
        <router-link to="/login">{{ t('login') }}</router-link>
      </template>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router"
const router = useRouter();
import store from "@/store";
const {t,locale} = useI18n()
import {ref,computed} from "vue"

/* 语言切换 */
const changeLang = (type)=>{
  locale.value = type
  localStorage.setItem('locale', type)//持久化存储
}

const isLogin = computed(()=>store.getters['user/isLogin'])
const username = ref('admin')//用户名称
const unReadCount = ref(0)//未读的消息

/* 下拉菜单回调 */

const handleCommand = (command) => {
  if(command == 'toPersonal'){
    router.push('/personal')
  }
  else{
    router.push('/login')
    // 这块写 / 是因为在模块里面设置了命名空间
    store.commit('user/clearToken')
  }
}
</script>

<style lang="scss">
.header-cont {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 46px;
  a {
    color: inherit;
    text-decoration: none;
  }
  h1 {
    margin: 0;
    font-size: 20px;
  }
  .gap {
    margin-right: 20px;
  }
  .right {
    .lang {
      font-size: 14px;
      .item {
        cursor: pointer;
        transition: all .2s;
        /* 点击时的状态 */
        &:active {
          font-size: 14px;
          font-weight: bold;
        }
      }
    }
    .active{
      color: #515054;
    }
  }
  .el-dropdown {
    color: inherit;
  }
}
</style>
