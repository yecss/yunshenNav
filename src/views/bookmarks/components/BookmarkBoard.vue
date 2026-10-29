<template>
  <div class="board">
    <!-- 移动端顶部导航（桌面端只显示搜索框与品牌） -->
    <div class="board__top-nav">
      <MobileCategoryMenu
        v-model:visible="menuOpen"
        :items="menuItems"
        :active-index="currentIndex"
        :show-logout="isLoggedIn"
        @select="selectFromMenu"
        @logout="logout"
      />

      <SearchBar
        ref="searchRef"
        v-model:keyword="keywordModel"
        :engine="engine"
        @update:engine="emit('update:engine', $event)"
      />

      <button
        type="button"
        class="board__refresh"
        :class="{ 'board__refresh--spinning': refreshing }"
        aria-label="强制刷新数据"
        @click="refreshData"
      >
        <Icon icon="heroicons:arrow-path" class="board__refresh-icon" />
      </button>

      <h1 class="board__brand">云深书签</h1>
    </div>

    <div class="board__content">
      <LatestLinks v-if="isLatestView" :links="latestLinks" @open="handleLinkClick" />

      <template v-else>
        <!-- 一级分类整体加密（搜索时仍展示搜索结果，锁面板不遮挡） -->
        <LockPanel
          v-if="firstCategoryMasked && !isSearching"
          title="该分类已加密"
          :description="`「${
            activeFirstCategory?.name || ''
          }」的内容受密码保护，请输入访问密码查看。`"
          @unlock="openUnlock(LEVEL.FIRST, activeFirstCategory)"
        />

        <template v-else>
          <LinkGroup
            v-for="group in displayGroups"
            :key="group.category.id"
            :sub-category="group"
            @unlock="openUnlock(LEVEL.SECOND, group.category)"
            @open="handleLinkClick"
            @edit="openLinkEditor"
          />

          <p v-if="isSearching && !displayGroups.length" class="empty-tip">
            未找到匹配「{{ keyword }}」的书签
          </p>
        </template>
      </template>
    </div>

    <UnlockDialog
      v-model="unlockVisible"
      :level="unlockTarget.level"
      :category-id="unlockTarget.categoryId"
      :category-name="unlockTarget.categoryName"
      @unlocked="handleUnlocked"
    />

    <LinkEditorDialog v-if="isLoggedIn" v-model="linkEditorVisible" :link-id="editingLinkId" />
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import MobileCategoryMenu from './MobileCategoryMenu.vue'
import SearchBar from './SearchBar.vue'
import LatestLinks from './LatestLinks.vue'
import LinkGroup from './LinkGroup.vue'
import LockPanel from './LockPanel.vue'
import UnlockDialog from './UnlockDialog.vue'
import LinkEditorDialog from './LinkEditorDialog.vue'
import { LEVEL, LATEST_INDEX } from '@/constants'
import { reportLinkClick } from '@/api'
import { useUnlockDialog } from '@/composables/useUnlockDialog'
import { isCategoryMasked } from '@/stores/categoryLock'
import { clearToken, isLoggedIn } from '@/stores/session'
import {
  activeFirstCategory,
  activeSubCategories,
  applyUnlockedContent,
  bookmarkState,
  latestLinks,
  loadBookmarks,
  setActiveIndex,
} from '@/stores/bookmark'
import { searchLinks } from '@/utils/category'

const props = defineProps({
  /** 站内搜索关键词 */
  keyword: { type: String, default: '' },
  /** 是否处于站内搜索状态 */
  searchActive: { type: Boolean, default: false },
  /** 当前搜索引擎 key */
  engine: { type: String, default: 'bing' },
})

const emit = defineEmits(['update:keyword', 'update:engine'])

const router = useRouter()
const searchRef = ref(null)
const menuOpen = ref(false)

const keywordModel = computed({
  get: () => props.keyword,
  set: (value) => emit('update:keyword', value),
})

const currentIndex = computed(() => bookmarkState.activeIndex)
const isLatestView = computed(() => currentIndex.value === LATEST_INDEX)

const menuItems = computed(() => [
  { key: 'latest', name: '最新添加', index: LATEST_INDEX },
  ...bookmarkState.categoryTree.map((node, index) => ({
    key: `category-${node.category_level_1.id}`,
    name: node.category_level_1.name,
    index,
  })),
])

/** 一级分类已加密且当前不可见 */
const firstCategoryMasked = computed(() => isCategoryMasked(LEVEL.FIRST, activeFirstCategory.value))

/** 站内搜索是否正在进行（有关键词且选了站内引擎） */
const isSearching = computed(() => props.searchActive && Boolean(props.keyword.trim()))

/**
 * 当前要渲染的二级分类列表
 *
 * 搜索时跨全部分类查找，但跳过访客看不到的一级分类：
 * 加密分类的内容访客拿不到，若把它算进结果，会出现「搜索到了却点不开」的条目，
 * 也会顺带暴露加密分类下有匹配项。
 */
const displayGroups = computed(() => {
  if (isSearching.value) {
    return searchLinks(bookmarkState.categoryTree, props.keyword, {
      isFirstCategoryVisible: (node) => !isCategoryMasked(LEVEL.FIRST, node.category_level_1),
    })
  }
  return activeSubCategories.value
})

/* ---------------- 解锁 ---------------- */

const { visible: unlockVisible, target: unlockTarget, open: openUnlock } = useUnlockDialog()

function handleUnlocked({ level, categoryId, data }) {
  applyUnlockedContent(level, categoryId, data)
}

/* ---------------- 链接编辑 ---------------- */

const linkEditorVisible = ref(false)
const editingLinkId = ref(null)

function openLinkEditor(link) {
  if (!isLoggedIn.value) {
    // 登录态过期或未登录时静默返回会让右键看起来「坏了」，这里给出明确提示
    ElMessage.warning('登录已失效，请重新登录后再编辑链接')
    return
  }
  editingLinkId.value = link.id
  linkEditorVisible.value = true
}

function handleLinkClick(link) {
  reportLinkClick({ linkId: link.id, url: link.url }).catch(() => {
    // 埋点失败不打扰用户
  })
}

/* ---------------- 强制刷新 ---------------- */

const refreshing = ref(false)

/** 转圈动画的最短展示时长，避免请求太快动画一闪而过 */
const MIN_SPIN_MS = 600

/** 忽略本地缓存重新拉取全站数据（缓存 TTL 已放宽到 7 天，靠这里手动兜底） */
async function refreshData() {
  if (refreshing.value) return
  refreshing.value = true
  try {
    await Promise.all([
      loadBookmarks({ force: true }),
      new Promise((resolve) => setTimeout(resolve, MIN_SPIN_MS)),
    ])
    ElMessage.success({
      message: '刷新成功，已从服务器获取最新数据，未使用本地缓存',
      duration: 1000,
    })
  } catch {
    ElMessage.error({ message: '刷新失败，当前显示的数据未更新，请稍后重试', duration: 1000 })
  } finally {
    refreshing.value = false
  }
}

/* ---------------- 移动端菜单 ---------------- */

function selectFromMenu(index) {
  setActiveIndex(index)
  menuOpen.value = false
}

function logout() {
  clearToken()
  menuOpen.value = false
  router.push('/login')
}

onMounted(() => {
  nextTick(() => searchRef.value?.focus())
})
</script>

<style lang="scss" scoped>
.board {
  display: flex;
  flex-direction: column;
  width: calc(100% - 224px);
  padding: 30px 30px 60px;
  overflow-x: hidden;
  overflow-y: auto;
  background-color: #ffffff9c;
  backdrop-filter: blur(10px);
}

.board__top-nav {
  position: relative;
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.board__refresh {
  position: absolute;
  top: 50%;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: #6b7280;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 8px;
  transform: translateY(-50%);
  transition: background-color 0.2s, color 0.2s;
}

.board__refresh:hover {
  color: #374151;
  background-color: #f3f4f6;
}

.board__refresh-icon {
  font-size: 20px;
}

.board__refresh--spinning .board__refresh-icon {
  animation: board-refresh-spin 0.8s linear infinite;
}

@keyframes board-refresh-spin {
  to {
    transform: rotate(360deg);
  }
}

.board__brand {
  display: none;
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #6b7280;
}

.board__content {
  flex: 1;
}

@media (max-width: 599px) {
  .board {
    width: 100%;
    padding: 16px;
  }

  .board__top-nav {
    justify-content: space-between;
  }

  /* 手机端收起搜索框与刷新按钮，显示站点名（与旧版一致） */
  .board__top-nav .search-bar,
  .board__refresh {
    display: none;
  }

  .board__brand {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: block;
    font-size: 20px;
    line-height: 1;
  }
}
</style>
