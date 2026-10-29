<template>
  <div ref="rootRef" class="search-bar">
    <form class="search-bar__form" @submit.prevent="submit">
      <button
        type="button"
        class="search-bar__engine"
        :aria-label="`当前搜索引擎：${currentEngine.name}`"
        @click.stop="toggleMenu"
      >
        <img class="search-bar__engine-icon" :src="currentEngine.icon" alt="" />
        <svg class="search-bar__caret" viewBox="0 0 1024 1024" aria-hidden="true">
          <path
            d="M500.8 604.779L267.307 371.392l-45.227 45.27 278.741 278.613L779.307 416.66l-45.248-45.248z"
          />
        </svg>
      </button>

      <input
        ref="inputRef"
        v-model="keywordModel"
        class="search-bar__input"
        :class="{ 'search-bar__input--site': isSiteSearch }"
        type="text"
        :placeholder="isSiteSearch ? '输入关键词筛选站内书签' : ''"
        @keyup.enter="submit"
      />

      <button v-if="!isSiteSearch" type="submit" class="search-bar__submit" aria-label="搜索">
        <svg class="search-bar__submit-icon" viewBox="0 0 1024 1024" aria-hidden="true">
          <path
            d="M430.829268 124.878049c156.097561 0 280.97561 124.878049 280.97561 280.97561s-124.878049 280.97561-280.97561 280.97561-280.97561-124.878049-280.97561-280.97561S280.97561 124.878049 430.829268 124.878049M430.829268 0c-224.780488 0-405.853659 181.073171-405.853659 405.853659s181.073171 405.853659 405.853659 405.853659 405.853659-181.073171 405.853659-405.853659S655.609756 0 430.829268 0L430.829268 0z"
          />
          <path
            d="M674.341463 661.853659c-12.487805 0-24.97561 6.243902-31.219512 12.487805L624.390244 699.317073c-18.731707 18.731707-18.731707 49.95122 0 68.682927l243.512195 243.512195c6.243902 6.243902 18.731707 12.487805 31.219512 12.487805 12.487805 0 24.97561-6.243902 31.219512-12.487805l18.731707-18.731707c18.731707-18.731707 18.731707-49.95122 0-68.682927l-243.512195-243.512195C699.317073 668.097561 686.829268 661.853659 674.341463 661.853659L674.341463 661.853659z"
          />
        </svg>
      </button>

      <ul v-show="menuOpen" class="search-bar__menu">
        <li v-for="engine in SEARCH_ENGINES" :key="engine.key">
          <button type="button" class="search-bar__menu-item" @click="selectEngine(engine.key)">
            <img class="search-bar__menu-icon" :src="engine.icon" alt="" />
            <span>{{ engine.name }}</span>
          </button>
        </li>
      </ul>
    </form>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  DEFAULT_SEARCH_ENGINE,
  SEARCH_ENGINES,
  SITE_SEARCH_KEY,
  getSearchEngine,
} from '@/constants/searchEngines'

const props = defineProps({
  /** 搜索关键词，v-model:keyword */
  keyword: { type: String, default: '' },
  /** 当前搜索引擎 key，v-model:engine */
  engine: { type: String, default: DEFAULT_SEARCH_ENGINE },
})

const emit = defineEmits(['update:keyword', 'update:engine'])

const rootRef = ref(null)
const inputRef = ref(null)
const menuOpen = ref(false)

const keywordModel = computed({
  get: () => props.keyword,
  set: (value) => emit('update:keyword', value),
})

const isSiteSearch = computed(() => props.engine === SITE_SEARCH_KEY)
const currentEngine = computed(() => getSearchEngine(props.engine))

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function selectEngine(key) {
  emit('update:engine', key)
  menuOpen.value = false
  // 切到站内搜索时把焦点交还输入框，方便直接输入关键词
  if (key === SITE_SEARCH_KEY) inputRef.value?.focus()
}

function submit() {
  const value = props.keyword.trim()
  if (!value || isSiteSearch.value) return
  window.open(`${currentEngine.value.url}${encodeURIComponent(value)}`, '_blank')
}

/** 点击组件外部时收起下拉，注意监听函数必须是同一个引用才能正确移除 */
function handleDocumentClick(event) {
  if (!rootRef.value?.contains(event.target)) menuOpen.value = false
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})

defineExpose({
  focus: () => inputRef.value?.focus(),
})
</script>

<style scoped>
.search-bar {
  width: 100%;
}

.search-bar__form {
  position: relative;
  display: flex;
  width: 74%;
  max-width: 468px;
  margin: 0 auto;
  background-color: var(--light-color);
  border-radius: 6px;
}

.search-bar__engine {
  display: flex;
  flex-shrink: 0;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 48px;
  cursor: pointer;
  background-color: var(--light-color);
  border: 0;
  border-radius: 6px 0 0 6px;
}

.search-bar__engine-icon {
  width: 28px;
  height: 28px;
  opacity: 0.64;
  transition: opacity 0.2s ease;
}

.search-bar__engine:hover .search-bar__engine-icon {
  opacity: 1;
}

.search-bar__caret {
  width: 18px;
  height: 18px;
  margin-left: 2px;
  opacity: 0.64;
  transition: opacity 0.2s ease;
}

.search-bar__input {
  box-sizing: border-box;
  flex: 1;
  min-width: 0;
  width: 0;
  font-size: 14px;
  line-height: 48px;
  color: var(--primary-color);
  text-indent: 4px;
  background-color: var(--light-color);
  border: 0;
  outline: none;
}

.search-bar__input--site {
  border-radius: 0 6px 6px 0;
}

.search-bar__submit {
  flex-shrink: 0;
  width: 60px;
  height: 48px;
  cursor: pointer;
  background-color: var(--light-color);
  border: 0;
  border-radius: 0 6px 6px 0;
  transition: background-color 0.1s;
}

.search-bar__submit:hover {
  background-color: #000;
}

.search-bar__submit-icon {
  width: 60px;
  height: 18px;
  vertical-align: middle;
  fill: #191616;
}

.search-bar__submit:hover .search-bar__submit-icon {
  fill: #fff;
}

.search-bar__menu {
  position: absolute;
  top: 48px;
  left: 0;
  z-index: 100;
  width: 110px;
  padding: 0;
  margin: 0;
  list-style: none;
  background-color: #ddd;
  border: 1px solid var(--border-color);
  border-radius: 6px;
}

.search-bar__menu-item {
  display: flex;
  align-items: center;
  width: 100%;
  height: 36px;
  padding-left: 4px;
  font-size: 14px;
  color: inherit;
  cursor: pointer;
  background-color: #fff;
  border: 0;
  border-bottom: 1px dotted #ddd;
  opacity: 0.64;
  transition: opacity 0.1s ease;
}

.search-bar__menu-item:hover {
  opacity: 1;
}

.search-bar__menu-icon {
  width: 22px;
  height: 22px;
  margin-left: 6px;
}

.search-bar__menu-item span {
  margin-left: 10px;
}
</style>
