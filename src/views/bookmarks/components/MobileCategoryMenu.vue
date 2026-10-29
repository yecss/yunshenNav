<template>
  <div class="mobile-menu">
    <button
      type="button"
      class="mobile-menu__trigger"
      aria-label="分类菜单"
      :aria-expanded="visible"
      @click="toggle"
    >
      <svg class="mobile-menu__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 6h16M4 12h16M4 18h7"
        />
      </svg>
    </button>

    <ul v-show="visible" class="mobile-menu__list">
      <li v-for="item in items" :key="item.key">
        <button
          type="button"
          class="mobile-menu__item"
          :class="{ 'is-active': item.index === activeIndex }"
          @click="select(item.index)"
        >
          {{ item.name }}
        </button>
      </li>
      <li v-if="showLogout">
        <button
          type="button"
          class="mobile-menu__item mobile-menu__item--danger"
          @click="emit('logout')"
        >
          退出登录
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup>
/**
 * 手机端分类菜单
 * 桌面端侧边栏是常驻的，小屏下改为顶部汉堡按钮 + 下拉列表。
 */
const props = defineProps({
  /** 菜单是否展开，v-model:visible */
  visible: { type: Boolean, default: false },
  /** `[{ key, name, index }]` */
  items: { type: Array, default: () => [] },
  /** 当前选中的分类索引 */
  activeIndex: { type: Number, default: 0 },
  showLogout: { type: Boolean, default: false },
})

const emit = defineEmits(['update:visible', 'select', 'logout'])

function toggle() {
  emit('update:visible', !props.visible)
}

function select(index) {
  emit('select', index)
}
</script>

<style lang="scss" scoped>
.mobile-menu {
  position: relative;
  display: none;
}

.mobile-menu__trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 35px;
  height: 35px;
  cursor: pointer;
  background: transparent;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.mobile-menu__icon {
  width: 20px;
  height: 20px;
}

.mobile-menu__list {
  position: absolute;
  top: 44px;
  left: 0;
  z-index: 20;
  width: 224px;
  padding: 8px 16px;
  margin: 0;
  list-style: none;
  background-color: #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgb(0 0 0 / 10%);
}

.mobile-menu__item {
  display: block;
  width: 100%;
  height: 32px;
  margin-top: 12px;
  font-size: 14px;
  line-height: 32px;
  color: #fff;
  text-align: center;
  cursor: pointer;
  background-color: #9ca3af;
  border: 0;
  border-radius: 6px;

  &.is-active {
    background-color: #4b5563;
  }
}

.mobile-menu__item--danger {
  background-color: #dc2626;
}

@media (max-width: 599px) {
  .mobile-menu {
    display: block;
  }
}
</style>
