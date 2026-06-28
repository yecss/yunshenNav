<template>
  <div class="search-box">
    <form @submit.prevent>
      <div class="current-search" @click.stop="showSearchSelect">
        <img class="current-img" :src="getIcon(currentIocn[INDEX])" alt="" />
        <svg
          t="1662299197361"
          class="arrow-svg"
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          p-id="7155"
          width="64"
          height="64"
        >
          <path
            d="M500.8 604.779L267.307 371.392l-45.227 45.27 278.741 278.613L779.307 416.66l-45.248-45.248z"
            p-id="7156"
          ></path>
        </svg>
      </div>
      <input
        class="input-search"
        :class="{'input-search-rounded': isSiteSearch}"
        type="text"
        ref="Input"
        :placeholder="isSiteSearch ? '输入关键词筛选站内书签' : ''"
        @keyup.enter="getBaidu"
        v-model="inpValue"
      />
      <button v-if="!isSiteSearch" class="btn-search" @click="getBaidu">
        <svg
          t="1662298423092"
          class="search-svg"
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          p-id="6251"
          width="64"
          height="64"
        >
          <path
            d="M430.829268 124.878049c156.097561 0 280.97561 124.878049 280.97561 280.97561s-124.878049 280.97561-280.97561 280.97561-280.97561-124.878049-280.97561-280.97561S280.97561 124.878049 430.829268 124.878049M430.829268 0c-224.780488 0-405.853659 181.073171-405.853659 405.853659s181.073171 405.853659 405.853659 405.853659 405.853659-181.073171 405.853659-405.853659S655.609756 0 430.829268 0L430.829268 0z"
            p-id="6252"
          ></path>
          <path
            d="M674.341463 661.853659c-12.487805 0-24.97561 6.243902-31.219512 12.487805L624.390244 699.317073c-18.731707 18.731707-18.731707 49.95122 0 68.682927l243.512195 243.512195c6.243902 6.243902 18.731707 12.487805 31.219512 12.487805 12.487805 0 24.97561-6.243902 31.219512-12.487805l18.731707-18.731707c18.731707-18.731707 18.731707-49.95122 0-68.682927l-243.512195-243.512195C699.317073 668.097561 686.829268 661.853659 674.341463 661.853659L674.341463 661.853659z"
            p-id="6253"
          ></path>
        </svg>
      </button>
      <ul class="select-search" :class="{'is-hidden':hiddenBlock}">
        <li class="item-select" v-for="(icon, idx) in currentIocn" :key="idx" :data-index="idx" @click="getIndex($event)">
          <img class="icon-select" :src="getIcon(icon)" />
          <span>{{ searchNames[idx] }}</span>
        </li>
      </ul>
    </form>
  </div>
</template>

<script>
// import pubsub from "pubsub-js";
export default {
  name: "Search-Input",
  emits: ['site-search'],
  props: {
    allLinks: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      inpValue:'',
      searchEngine: [
        "", // 站内搜索
        "https://www.google.com/search?q=",
        "https://cn.bing.com/search?q=",
        "https://www.baidu.com/s?wd=",
        "https://www.zhihu.com/search?q=",
        "https://github.com/search?q=",
      ],
      currentIocn:[
        'search-icon/home.svg',
        'search-icon/google.svg',
        'search-icon/bing.svg',
        'search-icon/baidu.svg',
        'search-icon/zhihu.svg',
        'search-icon/github.svg',
      ],
      searchNames:['站内','谷歌','必应','百度','知乎','Github'],
      INDEX: 0,//默认搜索引擎
      hiddenBlock: true,
    };
  },
  computed: {
    // 站内搜索是否激活
    isSiteSearch() {
      return this.INDEX === 0;
    },
  },
  methods: {
    getIcon(name) {
      return new URL(`../../assets/${name}`, import.meta.url).href
    },
    autoFocus() {
      this.$refs.Input.focus();
    },
    // 向父组件通知站内搜索状态与关键词
    emitSiteSearch() {
      this.$emit('site-search', {
        keyword: this.inpValue.trim(),
        active: this.isSiteSearch
      });
    },
    // 按下回车搜索函数
    getBaidu() {
      if(!this.inpValue) return;
      // 站内搜索：回车不再跳转，实时筛选已由父组件处理
      if (this.isSiteSearch) {
        return;
      }
      window.open(
        `${this.searchEngine[this.INDEX]}${this.inpValue}`,
        "_blank"
      );
    },
    showSearchSelect(){
      this.hiddenBlock = !this.hiddenBlock;
    },
    getIndex(e){
      this.INDEX = Number(e.currentTarget.getAttribute("data-index"));
      // 切换搜索引擎时通知父组件
      this.emitSiteSearch();
      // 切换到站内搜索时聚焦输入框
      this.$nextTick(() => {
        this.$refs.Input.focus();
      });
    }
  },
  watch:{
    inpValue() {
      // 输入变化时通知父组件实时筛选
      this.emitSiteSearch();
    },
    hiddenBlock(val){
      if(!val){
        document.documentElement.addEventListener('click',()=>{
          this.hiddenBlock = true
        })
      }
      else {
        document.documentElement.removeEventListener('click',()=>{
        })
      }
    }
  },
  // mounted() {
  //   // 订阅消息
  //   // 该方法能接收到两个参数，第一个是消息的名称，第二个是传递过来的信息
  //   this.pubId = pubsub.subscribe("resolveIndex", (_msgName, Value) => {
  //     // 此处不能用普通函数，因为普通函数的this指向window
  //     this.INDEX = Value;
  //   });
  // },
  // beforeDestroy() {
  //   // 解除订阅
  //   pubsub.unsubscribe(this.pubId);
  // },
};
</script>

<style scoped>

form {
  position: relative;
  width: 74%;
  max-width: 468px;
  display: flex;
  margin: 0 auto;
  border-radius: 4px;
}
.current-search {
  cursor: pointer;
  height: 48px;
  width: 64px;
  background-color: var(--light-color);
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  border-radius: 6px 0px 0px 6px;
}
.current-search .current-img {
  width: 28px;
  height: 28px;
  opacity: .64;
  transition: all .2s ease;
}
.current-search .current-img:hover{
  opacity: 1;
}
.current-search .arrow-svg {
  width: 18px;
  height: 18px;
  margin-left: 2px;
  transition: all .2s ease;
  opacity: .64;
}
.current-search .arrow-svg:hover{
  opacity: 1;
}
.input-search-rounded {
  border-radius: 0px 6px 6px 0px;
}
.input-search {
  width: 344px;
  line-height: 48px;
  font-size: 14px;
  text-indent: 4px;
  outline: none;
  box-sizing: border-box;
  border: 0;
  color: var(--primary-color);
  background-color: var(--light-color);
}
.clear-input {
  display: none;
}
.btn-search {
  height: 48px;
  width: 60px;
  border: 0;
  background-color: var(--light-color);
  /* background-color:#ececec; */
  border-radius: 0px 6px 6px 0px;
  transition: background-color .1s;
}
.btn-search:hover {
  background-color:#000000;
  cursor: pointer;
}
.btn-search:hover .search-svg {
  fill: #fff;
}
.search-svg {
  vertical-align: middle;
  width: 60px;
  height: 18px;
  fill: #191616;
  transition: background-color .1s;
}
.is-hidden{
  display: none;
}
.select-search {
  position: absolute;
  width: 110px;
  background-color: #ddd;
  left: 0;
  top: 48px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  z-index: 100;
}
.select-search .item-select {
  height: 36px;
  width: 100%;
  padding-left: 4px;
}
.item-select {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  background-color: #fff;
  cursor: pointer;
  border-bottom: dotted 1px #ddd;
  opacity: 0.64;
  transition: all 0.1s ease;
}
.item-select:hover {
  background-color: #fff;
  opacity: 1;
}
.item-select span {
  margin-left: 10px;
  font-size: 14px;
}
.icon-select {
  height: 22px;
  width: 22px;
  margin-left: 6px;
}
li {
  list-style-type: none;
}
/* @media screen and (max-width:480px) {
  form {
    width: 86%;
  }
} */
.search-box{
  width: 100%;
}
form{
  /* background: #f4f4f4; */
  background-color: #f4f4f48f;  /* 搜索框 */
}
</style>