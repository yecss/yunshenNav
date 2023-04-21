<template>
  <div class="wrapper">
    <h1>浏览器书签展示</h1>
    <div class="box">
      <div
        class="second-wrapper"
        v-for="(item, index) in initLink.children"
        :key="index"
      >
        <h2 class="second-title">{{ item.name }}</h2>
        <div class="second-box">
          <a
            v-for="(item, index) in initLink.children[index].web"
            :key="index"
            :href="item.url"
            target="_blank"
          >
            {{ item.title }}
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MainLink',
  data() {
    return {}
  },
  props: ['initLink'],
}
</script>

<style lang="scss" scoped>
// 美化滚动条
::-webkit-scrollbar {
  width: 6px;
  height: 10px;
}

::-webkit-scrollbar-track {
  width: 6px;
  background: rgba(#101f1c, 0.1);
  -webkit-border-radius: 2em;
  -moz-border-radius: 2em;
  border-radius: 2em;
}

::-webkit-scrollbar-thumb {
  background-color: rgba(144, 147, 153, 0.5);
  background-clip: padding-box;
  min-height: 28px;
  -webkit-border-radius: 2em;
  -moz-border-radius: 2em;
  border-radius: 2em;
  transition: background-color 0.3s;
  cursor: pointer;
}

::-webkit-scrollbar-thumb:hover {
  background-color: rgba(144, 147, 153, 0.3);
}

.wrapper {
  width: 960px;
  padding: 30px;
  overflow-x: hidden;
  overflow-y: auto;
}
.second-title {
  text-align: left;
  border-bottom: 2px rgb(231, 237, 232) solid;
  // margin-top: 18px;
}
.second-wrapper {
  margin-top: 30px;
}
.second-wrapper:nth-of-type(1) {
  margin-top: 0;
}
.second-box {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: baseline;
}
.second-box a {
  font-size: 18px;
  text-decoration: none;
  color: black;
  margin-right: 20px;
  padding: 15px;
  max-width: 160px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.second-box a:hover {
  color: rgb(73, 11, 106);
  text-decoration: underline;
}
</style>
>
