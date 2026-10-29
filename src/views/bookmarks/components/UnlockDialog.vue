<template>
  <el-dialog v-model="visible" :title="title" width="420px" append-to-body>
    <div class="unlock-dialog">
      <Icon :icon="ICONS.lock" class="unlock-dialog__icon" />
      <p class="unlock-dialog__desc">该分类内容已加密，请输入访问密码以查看。</p>

      <el-input
        ref="inputRef"
        v-model="password"
        type="password"
        show-password
        size="large"
        placeholder="请输入访问密码"
        @keyup.enter="submit"
      />

      <p v-if="errorMessage" class="unlock-dialog__error">{{ errorMessage }}</p>
    </div>

    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" :loading="loading" @click="submit">解锁</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { ElMessage } from 'element-plus'
import { verifyCategoryPassword } from '@/api'
import { useDialogModel } from '@/composables/useDialogModel'
import { LEVEL, ICONS } from '@/constants'
import { getTokenList, markUnlocked, saveToken } from '@/stores/categoryLock'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /** 1 = 一级分类，2 = 二级分类 */
  level: { type: Number, default: LEVEL.FIRST },
  categoryId: { type: [Number, String], default: null },
  categoryName: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'unlocked'])

const password = ref('')
const loading = ref(false)
const errorMessage = ref('')
const inputRef = ref(null)

const { visible, close } = useDialogModel(props, emit, {
  onOpen() {
    password.value = ''
    errorMessage.value = ''
    nextTick(() => inputRef.value?.focus())
  },
})

const title = computed(() => {
  const levelText = props.level === LEVEL.FIRST ? '一级分类' : '二级分类'
  const suffix = props.categoryName ? `：${props.categoryName}` : ''
  return `解锁${levelText}${suffix}`
})

async function submit() {
  if (!password.value) {
    errorMessage.value = '请输入访问密码'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const res = await verifyCategoryPassword({
      categoryId: props.categoryId,
      level: props.level,
      password: password.value,
      // 上级分类被加密时，需要携带上级解锁令牌
      tokens: getTokenList(),
    })

    if (res.token) saveToken(props.level, props.categoryId, res.token)
    markUnlocked(props.level, props.categoryId)

    emit('unlocked', {
      level: props.level,
      categoryId: props.categoryId,
      data: res.data,
    })
    ElMessage.success('已解锁')
    close()
  } catch (error) {
    errorMessage.value =
      error?.response?.data?.message || error?.message || '解锁失败，请检查密码是否正确'
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.unlock-dialog {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.unlock-dialog__icon {
  margin-bottom: 12px;
  font-size: 32px;
  color: #909399;
}

.unlock-dialog__desc {
  width: 100%;
  margin: 0 0 16px;
  font-size: 14px;
  line-height: 1.6;
  color: #606266;
}

.unlock-dialog__error {
  width: 100%;
  margin: 10px 0 0;
  font-size: 13px;
  color: #f56c6c;
}
</style>
