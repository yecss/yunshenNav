<template>
  <section class="manage-section" :class="`manage-section--${tone}`">
    <h2 class="manage-section__title">{{ title }}</h2>
    <slot />
  </section>
</template>

<script setup>
/**
 * 管理抽屉里的一张功能卡片
 * 只提供外框与配色，内容由各业务卡片通过插槽填入。
 */
defineProps({
  title: { type: String, required: true },
  /** 配色：link / sub / first */
  tone: {
    type: String,
    default: 'link',
    validator: (value) => ['link', 'sub', 'first'].includes(value),
  },
})
</script>

<style lang="scss" scoped>
.manage-section {
  box-sizing: border-box;
  width: 100%;
  padding: 20px;
  border-radius: 6px;
}

.manage-section--link {
  background-color: #fee2e2;
}

.manage-section--sub {
  background-color: #dbeafe;
}

.manage-section--first {
  background-color: #dcfce7;
}

.manage-section__title {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}
</style>
