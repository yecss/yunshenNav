<template>
  <li class="message-card">
    <img class="message-card__avatar" :src="avatarUrl" alt="QQ 头像" />
    <div class="message-card__body">
      <p class="message-card__name">{{ message.username }}</p>
      <p class="message-card__text">{{ message.text }}</p>
      <p class="message-card__time">
        {{ formatDateTime(message.timestamp, { withSeconds: true }) }}
      </p>
    </div>
    <button type="button" class="message-card__delete" @click="emit('delete', message)">
      删除
    </button>
  </li>
</template>

<script setup>
import { computed } from 'vue'
import { formatDateTime } from '@/utils/date'

const props = defineProps({
  message: { type: Object, required: true },
})

const emit = defineEmits(['delete'])

/** QQ 头像走官方接口，号码异常时回落到占位图 */
const avatarUrl = computed(() =>
  props.message.qqNumber
    ? `https://q1.qlogo.cn/g?b=qq&nk=${props.message.qqNumber}&s=100`
    : 'https://via.placeholder.com/100'
)
</script>

<style lang="scss" scoped>
.message-card {
  display: flex;
  align-items: center;
  padding: 20px;
  margin-bottom: 24px;
  background: #f3f4f6;
  border-radius: 8px;

  &:hover .message-card__delete {
    opacity: 1;
  }
}

.message-card__avatar {
  width: 56px;
  height: 56px;
  margin-right: 20px;
  border-radius: 50%;
}

.message-card__body {
  flex: 1;
  min-width: 0;
  word-break: break-all;
}

.message-card__name {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 700;
}

.message-card__text {
  margin: 0 0 6px;
  color: #374151;
}

.message-card__time {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
}

.message-card__delete {
  font-size: 13px;
  color: #ef4444;
  cursor: pointer;
  background: transparent;
  border: 0;
  opacity: 0;
  transition: opacity 0.2s;

  &:hover {
    color: #b91c1c;
  }
}
</style>
