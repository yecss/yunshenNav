<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    width="420px"
    append-to-body
    @close="handleClose"
  >
    <div class="unlock-dialog">
      <div class="unlock-icon">
        <Icon :icon="'heroicons:lock-closed'" style="font-size: 32px" />
      </div>

      <p class="unlock-desc">
        该分类内容已加密，请输入访问密码以查看。
      </p>

      <el-input
        v-model="password"
        type="password"
        show-password
        placeholder="请输入访问密码"
        size="large"
        :prefix-icon="lockIcon"
        @keyup.enter="handleSubmit"
      />

      <p v-if="errorMessage" class="unlock-error">
        {{ errorMessage }}
      </p>
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        解锁
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { ElMessage } from 'element-plus'
import { verifyCategoryPassword } from '@/api/data/index'
import { saveToken, markUnlocked, getTokenList } from '@/utils/lock'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // 1 = 一级分类，2 = 二级分类
  level: { type: Number, default: 1 },
  categoryId: { type: [Number, String], default: null },
  categoryName: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'unlocked'])

const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

const lockIcon = 'heroicons:lock-closed'

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const title = computed(() => {
  const levelText = props.level === 1 ? '一级分类' : '二级分类'
  return `解锁${levelText}${props.categoryName ? '：' + props.categoryName : ''}`
})

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      password.value = ''
      errorMessage.value = ''
    }
  }
)

const handleClose = () => {
  dialogVisible.value = false
}

const handleSubmit = async () => {
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

    if (res.token) {
      saveToken(props.level, props.categoryId, res.token)
    }
    markUnlocked(props.level, props.categoryId)

    emit('unlocked', {
      level: props.level,
      categoryId: props.categoryId,
      data: res.data,
      token: res.token,
    })

    ElMessage.success('已解锁')
    dialogVisible.value = false
  } catch (error) {
    errorMessage.value =
      error?.response?.data?.message || '解锁失败，请检查密码是否正确'
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
  text-align: left;
}
.unlock-icon {
  color: #909399;
  margin-bottom: 12px;
}
.unlock-desc {
  width: 100%;
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
}
.unlock-error {
  width: 100%;
  margin: 10px 0 0 0;
  font-size: 13px;
  color: #f56c6c;
}
</style>
