<template>
  <div class="lock-panel" :class="{ 'lock-panel--compact': compact }">
    <div class="lock-panel__inner">
      <Icon
        :icon="ICONS.lock"
        class="lock-panel__icon"
        :style="{ fontSize: compact ? '28px' : '40px' }"
      />
      <h2 v-if="title" class="lock-panel__title">{{ title }}</h2>
      <p class="lock-panel__desc">{{ description }}</p>
      <el-button type="primary" :size="compact ? 'small' : 'default'" @click="emit('unlock')">
        输入密码解锁
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { ICONS } from '@/constants'

defineProps({
  title: { type: String, default: '' },
  description: { type: String, default: '该分类内容已加密，输入密码后可查看。' },
  /** 紧凑模式：用于二级分类内嵌的小面板 */
  compact: { type: Boolean, default: false },
})

const emit = defineEmits(['unlock'])
</script>

<style lang="scss" scoped>
.lock-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 260px;
  padding: 40px 20px;
  margin-top: 16px;
  border: 1px dashed #e6a23c;
  border-radius: 12px;
  background-color: #fdf6ec;
}

.lock-panel--compact {
  min-height: auto;
  padding: 22px 16px;
  margin: 10px 0 18px;
  border-radius: 10px;
}

.lock-panel__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.lock-panel__icon {
  color: #e6a23c;
  margin-bottom: 10px;
}

.lock-panel__title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.lock-panel__desc {
  max-width: 420px;
  margin: 0 0 16px;
  font-size: 13px;
  line-height: 1.7;
  color: #909399;
}
</style>
