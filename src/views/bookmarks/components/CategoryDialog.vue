<template>
  <el-dialog v-model="visible" :title="title" width="460px" append-to-body>
    <el-form label-width="80px" class="category-dialog" @submit.prevent>
      <el-form-item label="名称">
        <el-input v-model="name" placeholder="请输入分类名称" @keyup.enter="save" />
      </el-form-item>

      <el-form-item v-if="isFirstLevel" label="排序">
        <div class="category-dialog__sort">
          <el-tag effect="plain">{{ currentOrder }}</el-tag>
          <el-button-group>
            <el-button plain :disabled="index <= 0 || moving" @click="move('up')">前进</el-button>
            <el-button plain :disabled="index >= total - 1 || moving" @click="move('down')">
              后退
            </el-button>
          </el-button-group>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="category-dialog__footer">
        <el-button type="danger" plain :loading="removing" @click="remove">删除</el-button>
        <div>
          <el-button @click="close">取消</el-button>
          <el-button type="primary" :loading="saving" @click="save">保存</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useDialogModel } from '@/composables/useDialogModel'
import { LEVEL } from '@/constants'
import { deleteCategory, renameCategory, moveFirstCategory } from '@/services/bookmark'
import { firstCategories } from '@/stores/bookmark'
import { confirmAction } from '@/utils/confirm'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  level: { type: Number, default: LEVEL.FIRST },
  /** 被编辑的分类对象（一级分类是分类本体，二级分类是 category 字段） */
  category: { type: Object, default: null },
  /** 一级分类在列表中的索引，用于排序 */
  index: { type: Number, default: 0 },
})

const emit = defineEmits(['update:modelValue', 'changed'])

const name = ref('')
const saving = ref(false)
const removing = ref(false)
const moving = ref(false)

const { visible, close } = useDialogModel(props, emit, {
  onOpen() {
    name.value = props.category?.name || ''
  },
})

const isFirstLevel = computed(() => props.level === LEVEL.FIRST)
const title = computed(() => (isFirstLevel.value ? '编辑一级分类' : '编辑二级分类'))
const total = computed(() => firstCategories.value.length)
const currentOrder = computed(() => props.category?.sort_order ?? '')

async function save() {
  const value = name.value.trim()
  if (!value) {
    ElMessage.warning('请输入分类名称')
    return
  }
  if (!props.category) return

  saving.value = true
  try {
    await renameCategory({ level: props.level, category: props.category, name: value })
    emit('changed')
    close()
  } catch {
    // 提示已由请求层处理
  } finally {
    saving.value = false
  }
}

async function remove() {
  if (!props.category) return

  const confirmed = await confirmAction({
    message: isFirstLevel.value
      ? `删除「${props.category.name}」会同时删除其下所有二级分类与书签，是否继续？`
      : `删除「${props.category.name}」会同时删除其下的书签，是否继续？`,
    confirmText: '删除',
    type: 'warning',
  })
  if (!confirmed) return

  removing.value = true
  try {
    await deleteCategory({ level: props.level, category: props.category })
    emit('changed')
    close()
  } catch {
    // 提示已由请求层处理
  } finally {
    removing.value = false
  }
}

/** 一级分类排序：与相邻分类交换 sort_order 并同步后端 */
async function move(direction) {
  const from = props.index
  const to = direction === 'up' ? from - 1 : from + 1

  moving.value = true
  try {
    const swapped = await moveFirstCategory(from, to)
    if (swapped) emit('changed', { from, to })
  } finally {
    moving.value = false
  }
}
</script>

<style lang="scss" scoped>
.category-dialog__sort {
  display: flex;
  align-items: center;
  gap: 12px;
}

.category-dialog__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
