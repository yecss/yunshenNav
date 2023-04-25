<template>
  <div class="wrapper">
    <h1>当前索引 -- {{activeIndex}}</h1>
    <div class="link-list">
      <div
        class="first-title hover:bg-gray-400 cursor-pointer hover:text-white text-black"
        v-for="(i, index) in firstCategroy"
        :key="index"
        @click="changeDataIndex(index)"
        :class="{'bg-gray-400':activeIndex==index,'text-white':activeIndex==index}"

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
    return {
      activeIndex:0
    }
  },
  methods: {
    changeDataIndex(index) {
      this.activeIndex = index
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
  line-height: 40px;
  margin-top: 10px;
}
</style>
