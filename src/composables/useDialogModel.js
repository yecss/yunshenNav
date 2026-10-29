/**
 * 弹窗 v-model 的标准写法
 *
 * 项目里 5 个弹窗都在重复同一段样板：
 *   :model-value="modelValue" + @update:model-value="close" + watch 打开时重置表单
 * 这里统一成 `v-model="visible"`，打开时的重置逻辑通过 onOpen 回调传入。
 */
import { computed, watch } from 'vue'

/**
 * @param {object} props 组件 props，需含 modelValue
 * @param {(event: string, payload?: unknown) => void} emit 组件 emit
 * @param {{ onOpen?: () => void, onClose?: () => void }} [hooks]
 * @returns {{ visible: import('vue').WritableComputedRef<boolean>, open: () => void, close: () => void }}
 */
export function useDialogModel(props, emit, hooks = {}) {
  const visible = computed({
    get: () => Boolean(props.modelValue),
    set: (value) => emit('update:modelValue', value),
  })

  const { onOpen, onClose } = hooks

  if (onOpen || onClose) {
    watch(
      () => Boolean(props.modelValue),
      (opened) => {
        if (opened) onOpen?.()
        else onClose?.()
      }
    )
  }

  return {
    visible,
    open: () => {
      visible.value = true
    },
    close: () => {
      visible.value = false
    },
  }
}
