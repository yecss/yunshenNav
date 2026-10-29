<template>
  <el-dialog v-model="visible" :title="title" width="440px" append-to-body>
    <div class="password-dialog">
      <div class="password-dialog__status">
        <el-tag :type="locked ? 'danger' : 'success'" effect="plain" size="small">
          {{ locked ? '已加密' : '未加密' }}
        </el-tag>
        <span class="password-dialog__target">{{ categoryName }}</span>
      </div>

      <p class="password-dialog__tip">
        设置访问密码后，访客需要输入正确密码才能查看该分类下的书签内容。密码由服务端加密保存，遗忘后无法找回。
      </p>

      <el-form label-width="90px" @submit.prevent>
        <el-form-item v-if="locked" label="原密码">
          <el-input
            v-model="oldPassword"
            type="password"
            show-password
            placeholder="修改或取消加密时需要验证原密码"
          />
        </el-form-item>

        <el-form-item v-if="!removePassword" label="新密码">
          <el-input v-model="newPassword" type="password" show-password placeholder="至少 4 位" />
        </el-form-item>

        <el-form-item v-if="!removePassword" label="确认密码">
          <el-input
            v-model="confirmPassword"
            type="password"
            show-password
            placeholder="再次输入新密码"
          />
        </el-form-item>

        <el-form-item v-if="locked" label="取消加密">
          <el-switch v-model="removePassword" />
          <span class="password-dialog__switch-tip">开启后将移除密码，内容恢复公开</span>
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" :loading="loading" @click="submit">
        {{ submitText }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { setCategoryPassword } from '@/api'
import { useDialogModel } from '@/composables/useDialogModel'
import { LEVEL } from '@/constants'
import { clearCategoryToken, getTokenList, removeUnlocked } from '@/stores/categoryLock'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  level: { type: Number, default: LEVEL.FIRST },
  categoryId: { type: [Number, String], default: null },
  categoryName: { type: String, default: '' },
  /** 目标分类当前是否已加密 */
  locked: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const removePassword = ref(false)
const loading = ref(false)

const { visible, close } = useDialogModel(props, emit, {
  onOpen() {
    oldPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    removePassword.value = false
  },
})

const title = computed(() => `${props.level === LEVEL.FIRST ? '一级分类' : '二级分类'}访问密码`)

const submitText = computed(() => {
  if (removePassword.value) return '取消加密'
  return props.locked ? '更新密码' : '设置密码'
})

/** 校验表单，返回错误文案；通过时返回空字符串 */
function validate() {
  if (removePassword.value) {
    return oldPassword.value ? '' : '请输入原密码'
  }
  if (!newPassword.value) return '请输入新密码'
  if (newPassword.value.length < 4) return '密码至少 4 位'
  if (newPassword.value !== confirmPassword.value) return '两次输入的密码不一致'
  return ''
}

async function submit() {
  const error = validate()
  if (error) {
    ElMessage.warning(error)
    return
  }

  loading.value = true
  try {
    const res = await setCategoryPassword({
      categoryId: props.categoryId,
      level: props.level,
      password: removePassword.value ? '' : newPassword.value,
      oldPassword: oldPassword.value,
      tokens: getTokenList(),
    })

    if (removePassword.value) {
      // 取消加密后令牌失效，清理本地状态
      clearCategoryToken(props.level, props.categoryId)
      removeUnlocked(props.level, props.categoryId)
    }

    ElMessage.success(removePassword.value ? '已取消加密' : '密码设置成功')
    emit('saved', { level: props.level, categoryId: props.categoryId, data: res.data })
    close()
  } catch {
    // 错误提示已由请求层统一处理
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.password-dialog__status {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.password-dialog__target {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.password-dialog__tip {
  padding: 10px 12px;
  margin: 0 0 18px;
  font-size: 12px;
  line-height: 1.7;
  color: #909399;
  background: #f4f4f5;
  border-radius: 6px;
}

.password-dialog__switch-tip {
  margin-left: 12px;
  font-size: 12px;
  color: #909399;
}
</style>
