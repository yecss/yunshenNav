<template>
  <el-drawer v-model="visible" title="功能区" :lock-scroll="false" append-to-body size="420px">
    <div class="manage">
      <ManageLinkSection :sub-categories="subCategories" />
      <ManageSubCategorySection
        :first-category="currentFirstCategory"
        :sub-categories="subCategories"
        @reload="emit('reload')"
      />
      <ManageFirstCategorySection
        v-model="firstCategoryIndex"
        :categories="firstCategories"
        @reload="emit('reload')"
      />
    </div>
  </el-drawer>
</template>

<script setup>
/**
 * 数据管理抽屉
 *
 * 只负责三件事：抽屉开关、当前选中的一级分类、把「需要重新拉取数据」的信号往上传。
 * 三个功能卡片各自管理自己的表单与弹窗，互不依赖。
 */
import { computed, ref } from 'vue'
import ManageLinkSection from './manage/ManageLinkSection.vue'
import ManageSubCategorySection from './manage/ManageSubCategorySection.vue'
import ManageFirstCategorySection from './manage/ManageFirstCategorySection.vue'
import { useDialogModel } from '@/composables/useDialogModel'
import { firstCategories, bookmarkState } from '@/stores/bookmark'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /** 打开抽屉时的默认一级分类索引 */
  initialIndex: { type: Number, default: 0 },
})

const emit = defineEmits(['update:modelValue', 'reload'])

const { visible } = useDialogModel(props, emit)

/** 抽屉内的一级分类选择，二级分类卡片与一级分类卡片共用 */
const firstCategoryIndex = ref(0)

const currentFirstCategory = computed(() => firstCategories.value[firstCategoryIndex.value] || null)

const subCategories = computed(() => {
  const node = bookmarkState.categoryTree[firstCategoryIndex.value]
  return node ? node.level2_with_links || [] : []
})

/** 打开抽屉时同步一次默认选项，供父组件调用 */
function resetSelection(index) {
  firstCategoryIndex.value = Math.max(0, Number(index) || 0)
}

resetSelection(props.initialIndex)
defineExpose({ resetSelection })
</script>

<style lang="scss" scoped>
.manage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}
</style>
