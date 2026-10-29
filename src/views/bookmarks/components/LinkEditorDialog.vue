<template>
  <el-dialog v-model="visible" title="编辑链接" width="480px" append-to-body>
    <el-form label-width="96px" class="link-editor" @submit.prevent>
      <el-form-item label="名称">
        <el-input v-model="form.name" placeholder="请输入链接名称" />
      </el-form-item>
      <el-form-item label="地址">
        <el-input v-model="form.url" placeholder="https://example.com" />
      </el-form-item>
      <el-form-item label="排序">
        <div class="link-editor__sort">
          <el-tag effect="plain">{{ form.sort_order }}</el-tag>
          <el-button-group>
            <el-button plain :disabled="isFirst || moving" @click="move('up')">前进</el-button>
            <el-button plain :disabled="isLast || moving" @click="move('down')">后退</el-button>
          </el-button-group>
        </div>
      </el-form-item>
      <el-form-item label="推荐">
        <el-switch v-model="form.is_recommend" :active-value="1" :inactive-value="0" />
      </el-form-item>
      <el-form-item label="标记新">
        <el-switch v-model="form.is_blocked" :active-value="1" :inactive-value="0" />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="link-editor__footer">
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
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useDialogModel } from '@/composables/useDialogModel'
import { deleteLink, getLinkPosition, moveLink, updateLink } from '@/services/bookmark'
import { findLink } from '@/utils/category'
import { bookmarkState } from '@/stores/bookmark'
import { confirmAction } from '@/utils/confirm'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  linkId: { type: [Number, String], default: null },
})

const emit = defineEmits(['update:modelValue'])

const saving = ref(false)
const removing = ref(false)
const moving = ref(false)

const form = reactive({
  id: null,
  name: '',
  url: '',
  sort_order: 0,
  is_blocked: 0,
  is_recommend: 0,
})

const { visible, close } = useDialogModel(props, emit, {
  onOpen() {
    const found = findLink(bookmarkState.categoryTree, props.linkId)
    if (!found) return
    Object.assign(form, {
      id: found.link.id,
      name: found.link.name,
      url: found.link.url,
      sort_order: found.link.sort_order ?? 0,
      is_blocked: found.link.is_blocked ?? 0,
      is_recommend: found.link.is_recommend ?? 0,
    })
  },
})

/** 当前链接在所属分组中的位置，用于禁用首/末项的前进后退 */
const position = computed(() => getLinkPosition(props.linkId))
const isFirst = computed(() => position.value.index <= 0)
const isLast = computed(
  () => position.value.index < 0 || position.value.index >= position.value.total - 1
)

async function move(direction) {
  moving.value = true
  try {
    const swapped = await moveLink(props.linkId, direction)
    if (swapped) form.sort_order = swapped.current.sort_order
  } finally {
    moving.value = false
  }
}

async function save() {
  if (!form.name.trim()) {
    ElMessage.warning('请输入链接名称')
    return
  }

  saving.value = true
  try {
    await updateLink({
      id: form.id,
      title: form.name.trim(),
      url: form.url,
      order: form.sort_order,
      isBlocked: form.is_blocked,
      isRecommend: form.is_recommend,
    })
    close()
  } catch {
    // 提示已由请求层处理
  } finally {
    saving.value = false
  }
}

async function remove() {
  const confirmed = await confirmAction({
    message: '本次操作将永久删除这个链接，是否继续？',
    confirmText: '删除',
    type: 'warning',
  })
  if (!confirmed) return

  removing.value = true
  try {
    await deleteLink(form.id)
    close()
  } catch {
    // 提示已由请求层处理
  } finally {
    removing.value = false
  }
}
</script>

<style lang="scss" scoped>
.link-editor__sort {
  display: flex;
  align-items: center;
  gap: 12px;
}

.link-editor__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
