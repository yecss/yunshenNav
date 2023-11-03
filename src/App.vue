<template>
  <router-view></router-view>
</template>
<script setup>
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
    background-image: url(./assets/bg2.jpg);
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center top;
  }
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  width: 1280px;
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
    display: block !important;
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
  .second-box a {
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
}

/* 在宽度大于等于1400px时应用的样式 */
@media (min-width: 1400px) {
  .second-box{
    margin-top: 14px;
  }
  .top-title{
    display:none;
  }
}
</style>
