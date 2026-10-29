<template>
  <transition name="greeting-fade">
    <div v-if="message" class="app-greeting">
      <p class="app-greeting__text">{{ message }}</p>
    </div>
  </transition>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { takeGreeting } from '@/utils/greeting'

const message = ref('')
let timer = null

onMounted(() => {
  message.value = takeGreeting()
  if (!message.value) return
  timer = setTimeout(() => {
    message.value = ''
  }, 5000)
})

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})
</script>

<style lang="scss" scoped>
.app-greeting {
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 50;
  padding: 12px;
  background-color: #16a34a;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 10%);
}

.app-greeting__text {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
}

.greeting-fade-leave-active {
  transition: opacity 0.5s ease;
}

.greeting-fade-leave-to {
  opacity: 0;
}

/* 小屏默认不展示问候语 */
@media (max-width: 599px) {
  .app-greeting {
    display: none;
  }
}
</style>
