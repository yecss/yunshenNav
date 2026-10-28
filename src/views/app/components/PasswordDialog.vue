<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    width="440px"
    append-to-body
    @close="handleClose"
  >
    <div class="pwd-dialog">
      <div class="pwd-status">
        <el-tag :type="isLocked ? 'danger' : 'success'" effect="plain" size="small">
          {{ isLocked ? '已加密' : '未加密' }}
        </el-tag>
        <span class="pwd-target">{{ categoryName }}</span>
      </div>

      <p class="pwd-tip">
        设置访问密码后，访客需要输入正确密码才能查看该分类下的书签内容。
        密码由服务端加密保存，遗忘后无法找回。
      </p>

      <el-form label-width="90px" @submit.prevent>
        <el-form-item v-if="isLocked" label="原密码">
          <el-input
            v-model="oldPassword"
            type="password"
            show-password
            placeholder="修改或取消加密时需要验证原密码"
          />
        </el-form-item>

        <el-form-item v-if="!removePassword" label="新密码">
          <el-input
            v-model="newPassword"
            type="password"
            show-password
            placeholder="至少 4 位"
          />
        </el-form-item>

        <el-form-item v-if="!removePassword" label="确认密码">
          <el-input
            v-model="confirmPassword"
            type="password"
            show-password
            placeholder="再次输入新密码"
          />
        </el-form-item>

        <el-form-item v-if="isLocked" label="取消加密">
          <el-switch v-model="removePassword" />
          <span class="pwd-switch-tip">开启后将移除密码，内容恢复公开</span>
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        {{ removePassword ? '取消加密' : isLocked ? '更新密码' : '设置密码' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { setCategoryPassword } from '@/api/data/index'
import { getTokenList, clearToken, removeUnlocked } from '@/utils/lock'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  level: { type: Number, default: 1 },
  categoryId: { type: [Number, String], default: null },
  categoryName: { type: String, default: '' },
  // 目标当前是否已加密
  locked: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const removePassword = ref(false)
const loading = ref(false)

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const isLocked = computed(() => props.locked)

const title = computed(() => {
  const levelText = props.level === 1 ? '一级分类' : '二级分类'
  return `${levelText}访问密码`
})

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      oldPassword.value = ''
      newPassword.value = ''
      confirmPassword.value = ''
      removePassword.value = false
    }
  }
)

const handleClose = () => {
  dialogVisible.value = false
}

const handleSubmit = async () => {
  if (removePassword.value) {
    if (!oldPassword.value) {
      ElMessage.warning('请输入原密码')
      return
    }
  } else {
    if (!newPassword.value) {
      ElMessage.warning('请输入新密码')
      return
    }
    if (newPassword.value.length < 4) {
      ElMessage.warning('密码至少 4 位')
      return
    }
    if (newPassword.value !== confirmPassword.value) {
      ElMessage.warning('两次输入的密码不一致')
      return
    }
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
      clearToken(props.level, props.categoryId)
      removeUnlocked(props.level, props.categoryId)
    }

    ElMessage.success(removePassword.value ? '已取消加密' : '密码设置成功')
    emit('saved', { level: props.level, categoryId: props.categoryId, data: res.data })
    dialogVisible.value = false
  } catch (error) {
    // 错误提示由 axios 拦截器统一处理
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.pwd-dialog {
  text-align: left;
}
.pwd-status {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.pwd-target {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}
.pwd-tip {
  margin: 0 0 18px 0;
  padding: 10px 12px;
  font-size: 12px;
  line-height: 1.7;
  color: #909399;
  background: #f4f4f5;
  border-radius: 6px;
}
.pwd-switch-tip {
  margin-left: 12px;
  font-size: 12px;
  color: #909399;
}
</style>
