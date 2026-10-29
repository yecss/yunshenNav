<template>
  <aside class="app-sidebar">
    <div class="app-sidebar__brand">
      <router-link to="/app" class="app-sidebar__logo">
        <img class="app-sidebar__logo-img" :src="logoUrl" alt="云深书签" />
      </router-link>
      <span class="app-sidebar__title">云深书签</span>
    </div>

    <nav class="app-sidebar__nav">
      <section class="app-sidebar__group">
        <p class="app-sidebar__label">分类</p>
        <button
          v-for="(category, index) in categories"
          :key="category.id"
          type="button"
          class="app-sidebar__item"
          :class="{ 'is-active': activeIndex === index }"
          @click="selectCategory(index)"
        >
          <Icon :icon="icons[index] || ICONS.inbox" class="app-sidebar__icon" />
          <span class="app-sidebar__text">{{ category.name }}</span>
          <Icon v-if="category.is_locked === 1" :icon="ICONS.lock" class="app-sidebar__lock" />
        </button>
      </section>

      <section class="app-sidebar__group">
        <p class="app-sidebar__label">其他</p>
        <template v-for="action in SIDEBAR_ACTIONS" :key="action.key">
          <button
            type="button"
            class="app-sidebar__item"
            :class="{ 'is-active': action.key === 'latest' && activeIndex === LATEST_INDEX }"
            @click="handleAction(action.key)"
          >
            <Icon :icon="action.icon" class="app-sidebar__icon" />
            <span class="app-sidebar__text">{{ action.label }}</span>
          </button>

          <button
            v-if="action.key === 'manage'"
            type="button"
            class="app-sidebar__item"
            @click="toggleLogin"
          >
            <Icon :icon="ICONS.user" class="app-sidebar__icon" />
            <span class="app-sidebar__text">{{ isLoggedIn ? '退出登录' : '登录账号' }}</span>
          </button>
        </template>
      </section>
    </nav>
  </aside>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import logoUrl from '@/assets/ttlogo.png'
import { FEEDBACK_URL, ICONS, LATEST_INDEX, REPO_URL, SIDEBAR_ACTIONS } from '@/constants'
import { clearToken, isLoggedIn } from '@/stores/session'
import { confirmAction } from '@/utils/confirm'

defineProps({
  /** 一级分类列表 */
  categories: { type: Array, default: () => [] },
  /** 与 categories 一一对应的图标名 */
  icons: { type: Array, default: () => [] },
  /** 当前选中的分类索引，-1 表示「最新添加」 */
  activeIndex: { type: Number, default: 0 },
})

const emit = defineEmits(['update:activeIndex', 'manage'])

const router = useRouter()

/** 「其他」区每个入口的行为，key 与 SIDEBAR_ACTIONS 一一对应 */
const actionHandlers = {
  latest: () => emit('update:activeIndex', LATEST_INDEX),
  messageBoard: () => router.push('/messageboard'),
  manage: () => emit('manage'),
  about: () =>
    ElMessageBox.alert(`GitHub 地址：${REPO_URL}`, '关于', {
      confirmButtonText: '确定',
      lockScroll: false,
    }),
  feedback: () => window.open(FEEDBACK_URL, '_blank', 'noopener'),
}

function selectCategory(index) {
  emit('update:activeIndex', index)
}

function handleAction(key) {
  actionHandlers[key]?.()
}

async function toggleLogin() {
  if (!isLoggedIn.value) {
    const go = await confirmAction({ message: '是否前往登录页？' })
    if (go) router.push('/login')
    return
  }

  const confirmed = await confirmAction({ message: '是否确定退出登录？' })
  if (!confirmed) return

  clearToken()
  ElMessage.success('已退出登录')
  router.push('/login')
}
</script>

<style lang="scss" scoped>
.app-sidebar {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: 224px;
  height: auto;
  padding: 32px 20px;
  overflow-y: auto;
  background-color: #ffffff9c;
  border-right: 1px solid #e5e7eb;
  backdrop-filter: blur(10px);
}

.app-sidebar::-webkit-scrollbar {
  width: 3px;
}

.app-sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.app-sidebar::-webkit-scrollbar-thumb {
  background-color: rgb(100 116 139 / 25%);
  border-radius: 3px;
}

.app-sidebar:hover::-webkit-scrollbar-thumb {
  background-color: rgb(100 116 139 / 50%);
}

@supports not selector(::-webkit-scrollbar) {
  .app-sidebar {
    scrollbar-width: thin;
    scrollbar-color: rgb(100 116 139 / 35%) transparent;
  }
}

.app-sidebar__brand {
  display: flex;
  align-items: center;
}

.app-sidebar__logo-img {
  width: 36px;
  height: 36px;
}

.app-sidebar__title {
  margin-left: 8px;
  font-family: serif;
  font-size: clamp(1.1rem, 2.8vw, 1.7rem);
  font-weight: 700;
  line-height: 1.3;
  color: #00b592;
  letter-spacing: -0.03em;
  text-shadow: 1px 1px 2px rgb(0 0 0 / 10%);
}

.app-sidebar__nav {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: flex-start;
  margin-top: 24px;
}

.app-sidebar__group + .app-sidebar__group {
  margin-top: 24px;
}

.app-sidebar__label {
  padding: 0 12px;
  margin: 0 0 12px;
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
}

.app-sidebar__item {
  display: flex;
  align-items: center;
  width: 100%;
  /* 左内边距与 __label 的 12px 对齐，让图标和「分类/其他」标签落在同一竖线上 */
  padding: 8px 12px;
  font-size: 15px;
  font-weight: 500;
  color: #4b5563;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 8px;
  transition: background-color 0.3s, color 0.3s;

  &:hover {
    background-color: #f3f4f6;
    color: #374151;
  }

  &.is-active {
    background-color: #ffffff8a;
  }
}

.app-sidebar__item + .app-sidebar__item {
  margin-top: 10px;
}

.app-sidebar__icon {
  flex-shrink: 0;
  font-size: 22px;
}

.app-sidebar__text {
  margin: 0 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-sidebar__lock {
  flex-shrink: 0;
  margin-left: auto;
  font-size: 14px;
  color: #e6a23c;
}

/* 手机端隐藏侧边栏（写在这里而不是全局样式，避免被组件自身样式覆盖） */
@media (max-width: 599px) {
  .app-sidebar {
    display: none;
  }
}
</style>
