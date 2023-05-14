<template>
  <div id="app">
    <div id="container">
      <TheAside @changeIndex="handleChange" :firstCategroy="urlList.firstCategroy" :isAuth.sync="isAuth"></TheAside>
      <!-- <LeftMenu @changeIndex="handleChange" :firstCategroy="urlList.firstCategroy"></LeftMenu> -->
      <MainLink ref="mychild" :initLink="urlList.secondLink" :isAuth="isAuth" ></MainLink>
      <el-button class="addBtn" @click="addLinks">添加链接</el-button>
    </div>
    
  </div>
</template>
<script>
import axios from 'axios'
import LeftMenu from '@/views/LeftMenu.vue'
import MainLink from '@/views/MainLink.vue'
import TheAside from "@/views/TheAside.vue"

export default {
  name: 'App',
  data() {
    return {
      /* 初始数据 */
      urlList:{
        firstCategroy:[],
        secondLink:[]
      },
      dataIndex:0,
      sourceData:[],
      isAuth:false,//秘钥验证是否成功
    }
  },
  components: {
    LeftMenu,
    MainLink,
    TheAside
  },
  methods:{
    handleChange(index){
      // console.log('APP',index)
      this.dataIndex = index
    },
    addLinks(){
      this.$refs.mychild.drawer = true
    },
    handlerchangeAuth(value){
      console.log(value)
    }
  },
  watch:{
    dataIndex(newvalue,oldValue){
      // console.log('index发生了变化')
      // console.log(newvalue,oldValue)
      this.urlList.secondLink = this.sourceData[newvalue]
    }
  },
  mounted() {
    // axios.get('../db/data.json').then((res) => {  
    // axios.get('http://localhost:3000/api/getdata').then((res) => { 
    axios.get('https://api.yecss.com/api/getdata').then((res) => { 
      let data = res.data
      this.sourceData = data
      data.forEach((element) => {
        this.urlList.firstCategroy.push(element.name)
      })
      this.urlList.secondLink = eval(this.sourceData[0])
    })

    /* 读取key */
    let theKey = localStorage.getItem('bookmarks-key')
    if(theKey==='yssq'){
        this.isAuth = true
    }
  },
}
</script>

<style lang="scss">
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
html,
body {
  height: 100%;
  overflow: hidden;
  background-color: #f3f4f6;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  width: 1320px;
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
  background-color: #fff;
  padding-left: 10px;
  border-radius: 6px;
}
.addBtn{
  position: absolute;
  top: 80px;
  right: -120px;
}
</style>
