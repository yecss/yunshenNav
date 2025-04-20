<template>
  <router-view></router-view>
  <div v-if="showMessage" class="greeting fixed top-4 left-4 p-3 bg-green-600 text-white rounded-xl shadow-md z-50">
    <p class="text-sm font-medium">{{ greetingMessage }}</p>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue';

const greetingMessage = ref('');
const showMessage = ref(false);

// 问候语函数
// 使其每天某个时段打开网站只会首次进行提醒。例如，上午提醒了一次之后就不再提醒了，到中午才提醒。
const getGreetingMessage = () => {
  const currentHour = new Date().getHours();
  const lastGreetedPeriod = localStorage.getItem('lastGreetedPeriod');
  const todayDate = new Date().toLocaleDateString();

  let currentPeriod;
  if (currentHour >= 5 && currentHour < 11) {
    currentPeriod = `${todayDate}-morning`;
  } else if (currentHour >= 11 && currentHour < 13) {
    currentPeriod = `${todayDate}-noon`;
  } else if (currentHour >= 13 && currentHour < 18) {
    currentPeriod = `${todayDate}-afternoon`;
  } else if (currentHour >= 18 && currentHour < 22) {
    currentPeriod = `${todayDate}-evening`;
  } else {
    currentPeriod = `${todayDate}-night`;
  }

  if (lastGreetedPeriod === currentPeriod) {
    return '';
  }

  localStorage.setItem('lastGreetedPeriod', currentPeriod);

  if (currentHour >= 5 && currentHour < 11) {
    return "早上好！新的一天，满是希望！🌞";
  } else if (currentHour >= 11 && currentHour < 13) {
    return "中午好！小憩一下，继续前行！☕";
  } else if (currentHour >= 13 && currentHour < 18) {
    return "下午好，愿你一切顺利！🌿";
  } else if (currentHour >= 18 && currentHour < 22) {
    return "晚上好，放松心情，享受宁静时光！🌙";
  } else {
    return "深夜了，愿你安然入睡，梦中见到美好的明天！🌙💤";
  }
};

onMounted(() => {
  const message = getGreetingMessage();
  if (message) {
    greetingMessage.value = message;
    showMessage.value = true;

    // 自动隐藏提醒，5s后消失
    setTimeout(() => {
      showMessage.value = false;
    }, 5000); // 5s后隐藏
  }
});
</script>
<style lang="scss">
html,body{
  height: 100%;
}
#app{
  height: 100%;
  overflow: hidden;
}

/* 公共样式 */
.flex-center{
  display: flex;
  align-items: center;
  justify-content: center;
}

.cursor{
  cursor: pointer;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
html,
body {
  height: 100%;
  overflow: hidden;
}
body{
    background-image: url(./assets/bg1.jpg);
    background-size: auto;
    background-repeat: repeat;
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center top;
}
body::before {
    content: "";
    position: fixed; /* 或 absolute，如果你只想让遮罩覆盖 body 而不是整个视口 */
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgb(0 0 0 / 10%); /* 这里是灰白色半透明遮罩 */
    pointer-events: none; /* 确保遮罩不影响鼠标事件 */
    z-index: 0; /* 确保遮罩在内容下方，如果你页面里没有定位元素的话也可以设成 -1 */
}
/* .bg-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  display: block;
  background-color: #0e4166;
  background-image: linear-gradient(to bottom, rgba(14, 65, 102, 0.86), #0e4166);
} */
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  // width: 1280px; -- 让其更加协调，2025年1月16日20:36:16
  width: 1120px;
  height: 100%;
  margin: 0 auto;
  padding-top: 60px;
  padding-bottom: 60px;
  
}
#container {
  display: flex;
  flex-direction: row;
  height: 100%;
  position: relative;
  border-radius: 6px;
}

.greeting{
  display: none;
  transition: opacity 0.5s ease;
}
// 大于1400px小于2000px时
@media screen and (min-width: 1400px) and (max-width: 2000px) {
  #app{
    width: 1120px;
    height: 100%;
    margin: 0 auto;
    padding-top: 34px;
    padding-bottom: 34px;
  }
  
}

/* 在宽度小于600px时应用的样式 */
@media (max-width: 599px) {
  body{
    background: #3f66b4;
  }
  .wrapper{
    width: 100% !important;
  }
  #the-aside {
    display: none;
  }
  #app {
    width: 100%;
    padding-top: 0;
    padding-bottom: 0;
  }

  #top-nav-btn {
    // display: block !important;
    display: flex !important;
    justify-content: center;
    align-items: center;
    width: 35px;
    height: 35px;
    border: 1px solid #ccc;
    border-radius: 4px
  }
  .top-nav {
    justify-content: space-between !important;
  }
  .search-box{
    display: none;
  }
  .page-container{
    border-radius: 0!important;
  }
  .form{
    max-width: 360px;
    .title{
      font-size: 12px!important;
    }
  }
}


/* 在宽度大于等于600px并且小于1400px时应用的样式 */
@media (min-width: 600px) and (max-width: 1399px) {
  body{
    /* background: #f3f4f6; */
    padding: 30px 90px;
  }
  #app {
    width: 100%;
    padding: 0;
  }
  .second-box .link-item {
    font-size: 14px;
    padding: 6px;
  }
  .second-wrapper {
    margin-top: 20px !important;
  }
  /* 隐藏默认滚动条 */
  ::-webkit-scrollbar {
    width: 0px !important;
  }
  .top-title{
    display:none;
  }
  .greeting{
    display: block;
  }
}

/* 在宽度大于等于1400px时应用的样式 */
@media (min-width: 1400px) {
  .second-box{
    margin-top: 14px;
  }
  .top-title{
    display:none;
  }
  .greeting{
    display: block;
  }
}
</style>
