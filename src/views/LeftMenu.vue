<template>
  <div class="wrapper">
    <h1>Hello,Yecss!</h1>
    <div class="link-list">
      <div
        class="first-title"
        v-for="(i, index) in firstCategroy"
        :key="index"
        @click="changeDataIndex(index)"
      >
        {{ i }}
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'LeftNav',
  data() {
    return {}
  },
  methods: {
    changeDataIndex(index) {
      this.$emit('changeIndex', index);
    },
  },
  props: {
    firstCategroy: {
      type: Array,
      default: '---',
    },
  },
}
</script>
<style lang="scss" scoped>
.wrapper {
  background-color: #eef;
  // height: 100%;
  width: 240px;
}
.first-title {
  color: #000;
  line-height: 40px;
  background-color: #8c8c8c21;
  margin-top: 10px;
  transition: all 0.1s;
}
.first-title:hover {
  background-color: #8c8c8cf1;
  cursor: pointer;
  color: #fff;
}
</style>
