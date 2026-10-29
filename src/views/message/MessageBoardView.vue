<template>
  <div class="message-board">
    <h2 class="message-board__title">留言板</h2>
    <p class="message-board__intro">
      有什么需要加的网址，或者有好的功能建议都可以在此处留言哦。内容不限。
    </p>

    <MessageForm @created="handleCreated" />

    <ul class="message-board__list">
      <MessageItem
        v-for="message in pagedMessages"
        :key="message.id"
        :message="message"
        @delete="remove"
      />
    </ul>

    <MessagePagination :page="page" :total-pages="totalPages" @prev="prevPage" @next="nextPage" />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import MessageForm from './components/MessageForm.vue'
import MessageItem from './components/MessageItem.vue'
import MessagePagination from './components/MessagePagination.vue'
import { useMessageBoard } from '@/composables/useMessageBoard'

const { page, totalPages, pagedMessages, load, prepend, remove, prevPage, nextPage } =
  useMessageBoard()

function handleCreated(message) {
  prepend(message)
}

onMounted(load)
</script>

<style lang="scss" scoped>
.message-board {
  box-sizing: border-box;
  width: 100%;
  max-width: 900px;
  padding: 32px;
  margin: 0 auto;
  overflow-y: auto;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 10%);
}

.message-board__title {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 700;
  text-align: center;
}

.message-board__intro {
  margin: 0 0 24px;
  font-size: 14px;
  color: #4b5563;
}

.message-board__list {
  max-height: 340px;
  padding: 10px;
  margin: 0;
  overflow-y: auto;
  list-style: none;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgb(100 100 100 / 40%);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-track {
    background-color: transparent;
  }
}
</style>
