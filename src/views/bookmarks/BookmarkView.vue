<template>
  <div class="bookmark-page">
    <BookmarkSidebar
      v-model:active-index="activeIndex"
      :categories="firstCategories"
      :icons="firstCategoryIcons"
      @manage="openManageDrawer"
    />

    <BookmarkBoard
      v-model:keyword="keyword"
      v-model:engine="engine"
      :search-active="isSiteSearch"
    />

    <ManageDrawer
      ref="drawerRef"
      v-model="drawerVisible"
      :initial-index="activeIndex"
      @reload="reload"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import BookmarkSidebar from './components/BookmarkSidebar.vue'
import BookmarkBoard from './components/BookmarkBoard.vue'
import ManageDrawer from './components/ManageDrawer.vue'
import { DEFAULT_SEARCH_ENGINE, SITE_SEARCH_KEY } from '@/constants/searchEngines'
import { isLoggedIn } from '@/stores/session'
import {
  firstCategories,
  firstCategoryIcons,
  loadBookmarks,
  setActiveIndex,
  bookmarkState,
} from '@/stores/bookmark'

/** 侧边栏与抽屉共用的当前分类索引 */
const activeIndex = computed({
  get: () => bookmarkState.activeIndex,
  set: (value) => setActiveIndex(value),
})

/* 搜索框状态放在页面这一层：侧边栏切分类时不清空关键词 */
const keyword = ref('')
const engine = ref(DEFAULT_SEARCH_ENGINE)
const isSiteSearch = computed(() => engine.value === SITE_SEARCH_KEY)

/* ---------------- 管理抽屉 ---------------- */

const drawerVisible = ref(false)
const drawerRef = ref(null)

function openManageDrawer() {
  if (!isLoggedIn.value) {
    ElMessage.warning('请先登录管理员账号后再进行管理操作')
    return
  }
  drawerRef.value?.resetSelection(activeIndex.value)
  drawerVisible.value = true
}

async function reload() {
  await loadBookmarks({ force: true })
}

onMounted(async () => {
  try {
    const { source, updateCheckFailed } = await loadBookmarks()
    if (updateCheckFailed) {
      ElMessage.warning({ message: '暂时无法检查更新，已显示本地缓存', duration: 1000 })
    } else if (source === 'cache') {
      ElMessage.success({ message: '已加载本地缓存，与服务器版本一致', duration: 1000 })
    } else {
      ElMessage.success({ message: '已从服务器获取最新数据', duration: 1000 })
    }
  } catch {
    ElMessage.error({ message: '数据加载失败，请稍后刷新重试', duration: 1000 })
  }
})
</script>

<style lang="scss" scoped>
.bookmark-page {
  position: relative;
  display: flex;
  flex-direction: row;
  height: 100%;
  border-radius: 6px;
}
</style>
