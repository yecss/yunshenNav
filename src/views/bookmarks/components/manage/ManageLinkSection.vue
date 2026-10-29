<template>
  <ManageSection title="添加链接">
    <el-input v-model="form.name" class="field" placeholder="请输入链接的标题">
      <template #prepend>
        <el-select v-model="form.categoryId" placeholder="选择分类" class="field__select">
          <el-option
            v-for="item in subCategories"
            :key="item.category.id"
            :value="item.category.id"
            :label="item.category.name"
          />
        </el-select>
      </template>
    </el-input>

    <el-input v-model="form.url" class="field" placeholder="请输入链接的地址" @keyup.enter="submit">
      <template #append>
        <el-button :loading="submitting" @click="submit">提交</el-button>
      </template>
    </el-input>
  </ManageSection>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import ManageSection from './ManageSection.vue'
import { createLink } from '@/services/bookmark'

const props = defineProps({
  /** 当前一级分类下的二级分类列表 */
  subCategories: { type: Array, default: () => [] },
})

const form = reactive({ name: '', url: '', categoryId: null })
const submitting = ref(false)

/** 切换一级分类后，把失效的默认选项修正为第一个二级分类 */
watch(
  () => props.subCategories,
  (list) => {
    const stillValid = list.some((item) => item.category.id === form.categoryId)
    form.categoryId = stillValid ? form.categoryId : list[0]?.category.id ?? null
  },
  { immediate: true }
)

async function submit() {
  const name = form.name.trim()
  if (!name) {
    ElMessage.warning('请输入标题')
    return
  }
  if (!form.categoryId) {
    ElMessage.warning('请选择二级分类')
    return
  }
  if (!form.url.trim()) {
    ElMessage.warning('请输入链接地址')
    return
  }

  submitting.value = true
  try {
    await createLink({ subCategoryId: form.categoryId, name, url: form.url })
    form.name = ''
    form.url = ''
  } catch {
    // 提示已由请求层处理
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.field {
  margin-top: 12px;
}

/* el-select 内部是 el-input，scoped 样式需要 :deep 才能命中 */
:deep(.field__select .el-input) {
  width: 130px;
}
</style>
