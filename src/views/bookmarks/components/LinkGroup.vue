<template>
  <div class="link-group">
    <h2 class="link-group__title">
      {{ subCategory.category.name }}
      <span v-if="masked" class="link-group__badge">
        <Icon :icon="ICONS.lock" class="link-group__badge-icon" />
        已加密
      </span>
    </h2>

    <LockPanel v-if="masked" compact @unlock="emit('unlock')" />

    <div v-else class="link-group__links">
      <a
        v-for="link in subCategory.links"
        :key="link.id"
        class="link-item"
        :class="{
          'link-item--blocked': link.is_blocked === 1,
          'link-item--recommend': link.is_recommend === 1,
        }"
        :href="link.url"
        target="_blank"
        rel="noopener noreferrer"
        @click="emit('open', link)"
        @contextmenu.prevent.stop="emit('edit', link)"
      >
        {{ link.name }}
      </a>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import LockPanel from './LockPanel.vue'
import { ICONS, LEVEL } from '@/constants'
import { isCategoryMasked } from '@/stores/categoryLock'

const props = defineProps({
  /** { category, links } */
  subCategory: { type: Object, required: true },
})

const emit = defineEmits(['unlock', 'open', 'edit'])

/** 已加密且当前拿不到明文：此时不渲染链接 */
const masked = computed(() => isCategoryMasked(LEVEL.SECOND, props.subCategory.category))
</script>

<style lang="scss" scoped>
.link-group {
  margin-top: 30px;

  &:first-of-type {
    margin-top: 0;
  }
}

.link-group__title {
  --tw-text-opacity: 1;
  color: rgb(29 78 216 / var(--tw-text-opacity));
  border-bottom: 1px solid rgb(231 234 237);
}

.link-group__badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-left: 6px;
  padding: 1px 6px;
  font-size: 11px;
  font-weight: 400;
  color: #e6a23c;
  vertical-align: middle;
  border: 1px solid #e6a23c;
  border-radius: 4px;
}

.link-group__badge-icon {
  font-size: 12px;
}

.link-group__links {
  display: flex;
  flex-flow: row wrap;
  align-items: baseline;
}

.link-item {
  position: relative;
  z-index: 10;
  max-width: 160px;
  padding: 8px;
  margin-top: 16px;
  margin-right: 20px;
  overflow: hidden;
  font-size: 16px;
  color: #2f373c;
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;
  border-radius: 2px;
  backdrop-filter: blur(4px);
  transition: background-color 0.2s, color 0.2s;

  &:hover {
    color: #fff;
    background-color: #515151;
  }
}

.link-item--blocked::after,
.link-item--recommend::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 0;
  height: 0;
  border-top: 10px solid transparent;
  border-left: 10px solid transparent;
}

.link-item--blocked::after {
  border-top-color: #238551;
}

.link-item--recommend::after {
  border-top-color: #0684e5;
}

/* 手机端面板变全宽白底，链接项需要自己的底色才与背景区分（原全局样式，重构时收进组件） */
@media (max-width: 599px) {
  .link-item {
    background-color: #f2f2f2;
  }
}
</style>
