<template>
  <ManageSection title="二级分类管理" tone="sub">
    <p class="hint">当前一级分类：{{ firstCategory?.name || '未选择' }}</p>

    <div class="row">
      <el-select v-model="selectedId" placeholder="选择二级分类" class="row__select">
        <el-option
          v-for="item in subCategories"
          :key="item.category.id"
          :value="item.category.id"
          :label="item.category.name"
        />
      </el-select>
      <el-button :icon="Edit" :disabled="!selected" @click="categoryVisible = true" />
      <el-button :icon="Lock" :disabled="!selected" @click="passwordVisible = true">密码</el-button>
    </div>

    <el-input
      v-model="newName"
      class="field"
      placeholder="请输入要添加的二级分类名称"
      @keyup.enter="submit"
    >
      <template #append>
        <el-button :loading="submitting" @click="submit">提交</el-button>
      </template>
    </el-input>

    <PasswordDialog
      v-model="passwordVisible"
      :level="LEVEL.SECOND"
      :category-id="selected?.id"
      :category-name="selected?.name || ''"
      :locked="Number(selected?.is_locked) === 1"
      @saved="emit('reload')"
    />

    <CategoryDialog
      v-model="categoryVisible"
      :level="LEVEL.SECOND"
      :category="selected"
      @changed="ensureSelection"
    />
  </ManageSection>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Edit, Lock } from '@element-plus/icons-vue'
import ManageSection from './ManageSection.vue'
import PasswordDialog from '../PasswordDialog.vue'
import CategoryDialog from '../CategoryDialog.vue'
import { LEVEL } from '@/constants'
import { createSubCategory } from '@/services/bookmark'

const props = defineProps({
  /** 当前一级分类对象，未选中时为 null */
  firstCategory: { type: Object, default: null },
  /** 该一级分类下的二级分类列表 */
  subCategories: { type: Array, default: () => [] },
})

const emit = defineEmits(['reload'])

const selectedId = ref(null)
const newName = ref('')
const submitting = ref(false)
const passwordVisible = ref(false)
const categoryVisible = ref(false)

const selected = computed(
  () => props.subCategories.find((item) => item.category.id === selectedId.value)?.category || null
)

/** 选中项失效（切了一级分类 / 删掉了当前项）时回落到第一个 */
function ensureSelection() {
  const stillValid = props.subCategories.some((item) => item.category.id === selectedId.value)
  if (!stillValid) selectedId.value = props.subCategories[0]?.category.id ?? null
}

watch(() => [props.firstCategory?.id, props.subCategories.length], ensureSelection, {
  immediate: true,
})

async function submit() {
  const name = newName.value.trim()
  if (!name) {
    ElMessage.warning('请输入二级分类名称')
    return
  }
  if (!props.firstCategory) {
    ElMessage.warning('请先选择一级分类')
    return
  }

  submitting.value = true
  try {
    await createSubCategory({ firstCategoryId: props.firstCategory.id, name })
    newName.value = ''
  } catch {
    // 提示已由请求层处理
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.hint {
  margin: 0 0 10px;
  font-size: 12px;
  color: #606266;
}

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
</style>
