<template>
  <div class="latest-stream">
    <div class="latest-stream__header">
      <h2 class="latest-stream__heading">最新添加</h2>
      <span class="latest-stream__count">共 {{ links.length }} 条</span>
    </div>

    <div class="latest-stream__list">
      <a
        v-for="link in links"
        :key="link.id"
        class="stream-item"
        :class="{
          'stream-item--blocked': link.is_blocked === 1,
          'stream-item--recommend': link.is_recommend === 1,
        }"
        :href="link.url"
        target="_blank"
        rel="noopener noreferrer"
        @click="emit('open', link)"
      >
        <span class="stream-item__node"></span>
        <div class="stream-item__body">
          <div class="stream-item__title">{{ link.name }}</div>
          <div class="stream-item__meta">
            <span class="stream-item__category">
              {{ link.firstCategoryName }} / {{ link.subCategoryName }}
            </span>
            <span class="stream-item__url">{{ link.url }}</span>
          </div>
        </div>
        <span class="stream-item__time">{{ formatDateTime(link.created_at) }}</span>
      </a>
    </div>

    <div v-if="!links.length" class="empty-tip">暂无书签</div>
  </div>
</template>

<script setup>
import { formatDateTime } from '@/utils/date'

defineProps({
  links: { type: Array, default: () => [] },
})

const emit = defineEmits(['open'])
</script>

<style lang="scss" scoped>
.latest-stream {
  padding: 4px 0;
}

.latest-stream__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px solid rgb(231 234 237);
}

.latest-stream__heading {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1d4ed8;
}

.latest-stream__count {
  font-size: 13px;
  color: #999;
}

.latest-stream__list {
  position: relative;
  padding-left: 22px;
  margin-top: 20px;

  /* 时间轴竖线 */
  &::before {
    content: '';
    position: absolute;
    top: 24px;
    bottom: 24px;
    left: 5px;
    width: 2px;
    background: #e4e7ed;
  }
}

.stream-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  margin-bottom: 10px;
  text-decoration: none;
  background: #ffffffb3;
  border: 1px solid #eef0f3;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgb(0 0 0 / 3%);
  transition: background-color 0.2s, box-shadow 0.2s, transform 0.2s;

  &:hover {
    background: #fff;
    box-shadow: 0 4px 12px rgb(0 0 0 / 8%);
    transform: translateX(2px);

    .stream-item__node {
      background: #00b592;
    }

    .stream-item__title {
      color: #00b592;
    }
  }
}

.stream-item__node {
  position: absolute;
  top: 50%;
  left: -22px;
  width: 12px;
  height: 12px;
  margin-top: -6px;
  background: #fff;
  border: 2px solid #00b592;
  border-radius: 50%;
  transition: background 0.2s;
}

.stream-item__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.stream-item__title {
  font-size: 15px;
  font-weight: 500;
  color: #2f373c;
  transition: color 0.2s;
}

.stream-item__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
  font-size: 12px;
  color: #999;
}

.stream-item__category {
  padding: 1px 7px;
  color: #7a7e85;
  background: #f0f2f5;
  border-radius: 3px;
}

.stream-item__url {
  max-width: 320px;
  overflow: hidden;
  color: #b4b7bd;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stream-item__time {
  flex-shrink: 0;
  font-size: 12px;
  color: #b4b7bd;
  font-variant-numeric: tabular-nums;
}

.stream-item--recommend .stream-item__node {
  border-color: #0684e5;
}

.stream-item--blocked .stream-item__node {
  border-color: #238551;
}
</style>
