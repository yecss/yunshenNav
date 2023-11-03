<template>
  <el-dialog :title="title" v-model="visible" :lock-scroll="false">
      <slot>
          <!-- 渲染纯js窗体 -->
          <div v-html="contentBody" v-if="contentBody"></div>
      </slot>
      <template #footer>
          <span class="dialog-footer">
              <el-button @click="handleCancel" :disabled="confirmLoading">
              {{cancelText}}</el-button>
              <el-button
              type="primary"
              :loading="confirmLoading"
              @click="$emit('confirm')"
              >{{ confirmText }}</el-button>
          </span>
      </template>
  </el-dialog>
</template>

<script setup>
import { computed, defineProps, defineEmits, ref } from "vue";
// 纯js调用时必须，不然解析不出<el-dialog></el-dialog>、<el-button />
import { ElDialog, ElButton } from "element-plus";
const props = defineProps({
  modelValue: false,
  title: "",
  cancelText: {
      type: String,
      default: "取消"
  },
  confirmText: {
      type: String,
      default: "确定"
  },
  loading: false,
  contentBody: null
});

const emits = defineEmits(["update:modelValue", "cancel", "close"]);
// 纯js实例调用改变loading属性
const _loading = ref(false);
const confirmLoading = computed(() => {
  return props.loading || _loading.value;
});

const visible = computed({
  get () {
      return props.modelValue;
  },
  set (val) {
      emits("update:modelValue", val);
  }
});

// methods
const handleCancel = () => {
  emits("cancel");
  visible.value = false;
};

const showLoading = () => {
  _loading.value = true;
};

const hideLoading = () => {
  _loading.value = false;
};
// 暴露给纯js实例调用，可在实例中使用instance._instance.exposed查询到
defineExpose({ showLoading, hideLoading });
</script>
