<template>
  <ManageSection title="一级分类管理" tone="first">
    <div class="row">
      <el-select
        :model-value="modelValue"
        placeholder="选择一级分类"
        class="row__select"
        @update:model-value="emit('update:modelValue', $event)"
      >
        <el-option
          v-for="(item, index) in categories"
          :key="item.id"
          :value="index"
          :label="item.name"
        />
      </el-select>
      <el-button :icon="Edit" :disabled="!current" @click="categoryVisible = true" />
      <el-button :icon="Lock" :disabled="!current" @click="passwordVisible = true">密码</el-button>
    </div>

    <div class="visibility-row">
      <div>
        <label id="guest-visibility-label" class="visibility-row__label">访客可见</label>
        <p class="visibility-row__hint">默认显示，关闭后仅管理员可见</p>
      </div>
      <el-switch
        :model-value="Boolean(current) && current.guest_visible !== false"
        :disabled="!current || savingVisibility"
        :loading="savingVisibility"
        aria-labelledby="guest-visibility-label"
        @change="changeVisibility"
      />
    </div>

    <el-input
      v-model="newName"
      class="field"
      placeholder="请输入要添加的一级分类名称"
      @keyup.enter="submit"
    >
      <template #append>
        <el-button :loading="submitting" @click="submit">提交</el-button>
      </template>
    </el-input>

    <PasswordDialog
      v-model="passwordVisible"
      :level="LEVEL.FIRST"
      :category-id="current?.id"
      :category-name="current?.name || ''"
      :locked="Number(current?.is_locked) === 1"
      @saved="emit('reload')"
    />

    <CategoryDialog
      v-model="categoryVisible"
      :level="LEVEL.FIRST"
      :category="current"
      :index="modelValue"
      @changed="afterChanged"
    />
  </ManageSection>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Edit, Lock } from '@element-plus/icons-vue'
import ManageSection from './ManageSection.vue'
import PasswordDialog from '../PasswordDialog.vue'
import CategoryDialog from '../CategoryDialog.vue'
import { LEVEL } from '@/constants'
import { createFirstCategory, setCategoryGuestVisibility } from '@/services/bookmark'

const props = defineProps({
  /** 一级分类列表，v-model 绑定的索引指向其中一项 */
  categories: { type: Array, default: () => [] },
  modelValue: { type: Number, default: 0 },
})

const emit = defineEmits(['update:modelValue', 'reload'])

const newName = ref('')
const submitting = ref(false)
const passwordVisible = ref(false)
const categoryVisible = ref(false)
const savingVisibility = ref(false)

const current = computed(() => props.categories[props.modelValue] || null)

async function changeVisibility(visible) {
  if (!current.value || savingVisibility.value) return
  const categoryId = current.value.id
  savingVisibility.value = true
  try {
    await setCategoryGuestVisibility(categoryId, visible)
    ElMessage.success(visible ? '已对访客显示' : '已对访客隐藏')
  } catch {
    // 保持原状态，错误由请求层提示。
  } finally {
    savingVisibility.value = false
  }
}

/** 删除末尾分类后索引可能越界，回落到最后一项 */
function afterChanged() {
  if (!props.categories.length) {
    emit('update:modelValue', 0)
    return
  }
  if (props.modelValue >= props.categories.length) {
    emit('update:modelValue', props.categories.length - 1)
  }
}

async function submit() {
  const name = newName.value.trim()
  if (!name) {
    ElMessage.warning('请输入一级分类名称')
    return
  }

  submitting.value = true
  try {
    await createFirstCategory(name)
    newName.value = ''
  } catch {
    // 提示已由请求层处理
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.row__select {
  flex: 1;
  min-width: 0;
}

/* el-select 内部是 el-input，scoped 样式需要 :deep 才能命中 */
:deep(.row__select .el-input) {
  width: 100%;
}

.field {
  margin-top: 12px;
}

.visibility-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 16px;
}

.visibility-row__label {
  font-size: 14px;
  color: #303133;
}

.visibility-row__hint {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: #475569;
}
</style>
