<template>
  <div>
    <el-dialog :visible.sync="childDialogVisible">
      <slot></slot>
      <span slot="footer" class="dialog-footer">
        <el-button @click="handleConfirm(false)">取 消</el-button>
        <el-button type="primary" @click="handleConfirm(true)">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'CommonDialog',
  props: {
    dialogVisible: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      /* 赋值时机不同于mounted */
      childDialogVisible: this.dialogVisible,
    }
  },
  watch: {
    dialogVisible(newV) {
      this.childDialogVisible = newV
    },
    childDialogVisible(newV) {
      this.$emit('update:dialogVisible', newV)
    },
  },
  methods: {
    handleConfirm(yes) {
      if (yes) {
        // 执行确定操作
        this.$emit('confirm')
      } else {
        this.$emit('update:dialogVisible', false)
      }
    },
  },
}
</script>
