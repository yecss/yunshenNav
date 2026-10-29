<template>
  <div class="message-pagination">
    <button type="button" class="btn" :disabled="page <= 1" @click="emit('prev')">上一页</button>
    <span class="message-pagination__page">{{ page }} / {{ totalPages }}</span>
    <button type="button" class="btn" :disabled="page >= totalPages" @click="emit('next')">
      下一页
    </button>
  </div>
</template>

<script setup>
defineProps({
  page: { type: Number, default: 1 },
  totalPages: { type: Number, default: 1 },
})

const emit = defineEmits(['prev', 'next'])
</script>

<style lang="scss" scoped>
.message-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 12px 0;
}

.message-pagination__page {
  padding: 4px 8px;
  font-size: 16px;
  color: #374151;
}

.btn {
  padding: 8px 20px;
  font-size: 14px;
  color: #000;
  cursor: pointer;
  background-color: #d1d5db;
  border: 0;
  border-radius: 8px;
  transition: background-color 0.2s;

  &:hover:not(:disabled) {
    background-color: #9ca3af;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}
</style>
