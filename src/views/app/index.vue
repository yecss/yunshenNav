<template>
  <div id="container">
    <TheAside
      id="the-aside"
      :iconList="urlList.iconList"
      :firstCategroy="urlList.firstCategroy"
      v-model:dataIndex="dataIndex"
      @manageLinks="manageLinks"
    ></TheAside>
    <MainLink
      ref="mychild"
      :sourceData="sourceData"
      :firstCategroy="urlList.firstCategroy"
      :initLink="urlList.secondLink"
      v-model:dataIndex="dataIndex"
      @changeFirstTitle="handleDB"
      @addFisrtTitle="addFisrtTitle"
      @sortFirstCategory="handleSortFirstCategory"
      @unlockContent="handleUnlockContent"
      @reloadData="reloadData"
    ></MainLink>
  </div>
</template>

<script setup>
import store from '@/store'
import { ref, reactive, watch, onMounted, computed } from 'vue'
import {
  getData,
  getGuestData,
  deleteCategroy,
  updateCategroy,
  addCategory,
  getCategoryContent,
  getDataVersion,
} from '@/api/data/index'
import MainLink from './MainLink.vue'
import TheAside from './TheAside.vue'
import { ElMessage } from 'element-plus';
import {
  loadTokens,
  getTokenEntries,
  markUnlocked,
  clearToken,
  removeUnlocked,
} from '@/utils/lock'
// 初始数据
const urlList = reactive({
  firstCategroy: [],
  secondLink: [],
  iconList: [],
})

const isLogin = computed(() => store.getters['user/isLogin'])
const dataIndex = ref(0)
const sourceData = ref([])
const isLocal = ref(true) // 数据是否存储在本地

// 引用组件
const mychild = ref(null)

// 缓存配置
const CACHE_KEY = 'yunshenNav_data_cache'
const CACHE_DURATION = 5 * 60 * 1000 // 5分钟

// 读取缓存
const readCache = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null
    const { data, timestamp, version, mode } = JSON.parse(cached)
    if (Date.now() - timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY)
      return null
    }
    return { data, version, mode }
  } catch {
    return null
  }
}

// 写入缓存（mode 用于区分管理员 / 访客数据，避免越权复用）
const writeCache = (data, version, mode) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      version,
      mode,
      timestamp: Date.now()
    }))
  } catch (e) {
    console.warn('缓存写入失败', e)
  }
}

// 清除缓存
const clearCache = () => {
  localStorage.removeItem(CACHE_KEY)
}

// 检测缓存数据是否缺少创建时间（后端升级后自动失效）
const hasCreatedAt = (data) => {
  if (!data || !data.length) return true
  for (const item of data) {
    for (const l2 of item.level2_with_links || []) {
      for (const link of l2.links || []) {
        if (!link.created_at) return false
      }
    }
  }
  return true
}

// 方法定义
const handleDB = (obj) => {
  const { del, update, selectIndex, newValue } = obj
  const id = sourceData.value[selectIndex].category_level_1.id
  console.log(id);

  if (del) {
    deleteCategroy({ categoryId:id, newName:newValue, level:1 })
    clearCache()
  }
  if (update) {
    updateCategroy({ categoryId:id, newName:newValue, level:1 })
    clearCache()
  }
}

const addFisrtTitle = (newfirstCategroy) => {

  addCategory({ categoryName: newfirstCategroy.name, level: 1,icon: newfirstCategroy.icon,sort_order: newfirstCategroy.sort_order})
    .then((res) => {

      const { categoryId } = res;
      // 确保新对象被创建，以避免修改原始对象
      const newCategory = { ...newfirstCategroy, id: categoryId }

      // 更新数据
      urlList.firstCategroy.push(newCategory);
      urlList.iconList.push(newCategory.icon);

      sourceData.value.push({
        category_level_1: newCategory,
        level2_with_links: [],
      });

      newfirstCategroy.name = '';
      clearCache()
    })
}

const manageLinks = () => {
  // 未登录时不允许进入管理区，避免后续操作触发 401
  if (!isLogin.value) {
    ElMessage({
      message: '请先登录管理员账号后再进行管理操作',
      type: 'warning',
      showClose: true,
    });
    return;
  }
  if (mychild.value) {
    mychild.value.drawer = true
  }
}

// 一级分类排序后同步 iconList 和 dataIndex
const handleSortFirstCategory = ({ fromIndex, toIndex }) => {
  // 同步 iconList
  const icon = urlList.iconList[fromIndex]
  urlList.iconList.splice(fromIndex, 1)
  urlList.iconList.splice(toIndex, 0, icon)

  // 同步 dataIndex，保持当前选中分类不变
  if (dataIndex.value === fromIndex) {
    dataIndex.value = toIndex
  } else if (fromIndex < toIndex && dataIndex.value > fromIndex && dataIndex.value <= toIndex) {
    dataIndex.value--
  } else if (fromIndex > toIndex && dataIndex.value >= toIndex && dataIndex.value < fromIndex) {
    dataIndex.value++
  }
  clearCache()
}

// 监听 dataIndex 的变化
watch(dataIndex, (newvalue, oldValue) => {
  // -1 表示"最新添加"模式，不需要切换二级分类数据
  if (newvalue >= 0 && sourceData.value[newvalue]) {
    urlList.secondLink = sourceData.value[newvalue].level2_with_links
  }
})

// 当前一级分类的 id
const currentFirstCategoryId = computed(() => {
  if (dataIndex.value < 0 || dataIndex.value >= sourceData.value.length) return null
  const cur = sourceData.value[dataIndex.value]
  return cur ? cur.category_level_1.id : null
})

// 将已解密的内容写回本地数据结构
const applyUnlockedData = (level, categoryId, data) => {
  if (!Array.isArray(data)) return
  if (level === 1) {
    const target = sourceData.value.find(
      (item) => item.category_level_1.id === categoryId
    )
    if (target) {
      target.level2_with_links = data
      // 当前正处于该一级分类时，同步刷新展示区
      if (dataIndex.value >= 0 && currentFirstCategoryId.value === categoryId) {
        urlList.secondLink = data
      }
    }
  } else {
    for (const cat of sourceData.value) {
      const l2 = (cat.level2_with_links || []).find(
        (item) => item.category.id === categoryId
      )
      if (l2) {
        l2.links = data
        break
      }
    }
  }
}

// 子组件解锁成功后回调：把明文内容注入本地数据
const handleUnlockContent = ({ level, categoryId, data }) => {
  applyUnlockedData(level, categoryId, data)
}

// 子组件密码设置完成后：清缓存并强制重新拉取
const reloadData = () => {
  clearCache()
  loadData(true)
}

// 页面加载 / 重新拉取数据
const loadData = async (force = false) => {
  try {
    const mode = isLogin.value ? 'admin' : 'guest'
    let data = null
    let version = null

    const cached = readCache()
    if (!force && cached) {
      // 缓存数据缺少创建时间时，直接重新拉取
      if (!hasCreatedAt(cached.data)) {
        clearCache()
      } else if (cached.mode === mode) {
        // 与服务端版本比对，版本一致才复用缓存
        try {
          const vres = await getDataVersion()
          if (vres.version === cached.version) {
            data = cached.data
          } else {
            clearCache()
          }
        } catch (e) {
          // 版本接口异常时降级使用缓存
          data = cached.data
        }
      } else {
        // 身份变了（登录 / 退出），不复用旧缓存
        clearCache()
      }
    }

    if (data) {
      console.log('使用缓存数据')
    } else {
      const fetcher = isLogin.value ? getData : getGuestData
      const res = await fetcher()
      data = res.data || []
      version = res.version
      writeCache(data, version, mode)
    }

    // 按一级分类 sort_order 排序
    sourceData.value = data.sort(
      (a, b) =>
        a.category_level_1.sort_order - b.category_level_1.sort_order
    );

    // 对每个一级分类下的二级分类和链接排序
    sourceData.value.forEach((item) => {
      if (item.level2_with_links) {
        // 二级分类排序
        item.level2_with_links.sort(
          (a, b) => (a.category.sort_order || 0) - (b.category.sort_order || 0)
        );
        // 链接排序
        item.level2_with_links.forEach((l2) => {
          if (l2.links) {
            l2.links.sort(
              (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
            );
          }
        });
      }
    });

    // 清空旧数据（防止重复 push）
    urlList.firstCategroy = [];
    urlList.iconList = [];

    // 构建侧边栏一级分类
    sourceData.value.forEach(item => {
      urlList.firstCategroy.push(item.category_level_1);
      urlList.iconList.push(item.category_level_1.icon);
    });

    // 默认显示第一个一级分类下的二级数据
    if (sourceData.value.length > 0) {
      // 保持当前选中项（若越界则回落到第一个）
      const idx = dataIndex.value >= 0 && dataIndex.value < sourceData.value.length
        ? dataIndex.value
        : 0
      urlList.secondLink = sourceData.value[idx].level2_with_links;
    }

    // 恢复此前已解锁的分类（令牌仍在有效期内则免重复输入密码）
    await restoreUnlockedContent()
  } catch (error) {
    console.error('Error fetching data:', error);
    ElMessage({
      message: '数据获取失败',
      type: 'error',
      showClose: true,
      duration: 5 * 1000,
    });
  }
}

// 用已保存的解锁令牌恢复已解锁内容
const restoreUnlockedContent = async () => {
  // 管理员始终拥有完整访问权限，无需恢复
  if (isLogin.value) return

  loadTokens()
  const entries = getTokenEntries()
  if (!entries.length) return

  // 先恢复一级分类，再恢复二级分类
  // （一级解锁会整体替换其下的二级分类列表，必须先执行）
  const ordered = [...entries].sort((a, b) => a.level - b.level)

  for (const { level, categoryId, token } of ordered) {
    try {
      const res = await getCategoryContent({ categoryId, level, token })
      if (res.status === 200 && res.data) {
        markUnlocked(level, categoryId)
        applyUnlockedData(level, categoryId, res.data)
      }
    } catch (e) {
      // 令牌失效或已过期，清除本地记录
      clearToken(level, categoryId)
      removeUnlocked(level, categoryId)
    }
  }
}

// 在组件挂载时执行
onMounted(() => {
  loadData()
})
</script>
