<template>
  <div id="app">
    <div id="container">
      <LeftMenu @changeIndex="handleChange" :firstCategroy="urlList.firstCategroy"></LeftMenu>
      <MainLink :initLink="urlList.secondLink"></MainLink>
    </div>
  </div>
</template>
<script>
import axios from 'axios'
import LeftMenu from '@/views/LeftMenu.vue'
import MainLink from '@/views/MainLink.vue'
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
      sourceData:[]
    }
  },
  components: {
    LeftMenu,
    MainLink,
  },
  methods:{
    handleChange(index){
      // console.log('APP',index)
      this.dataIndex = index
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
    axios.get('http://localhost:3000/api/getdata').then((res) => {
      let data = res.data
      this.sourceData = data
      data.forEach((element) => {
        this.urlList.firstCategroy.push(element.name)
      })
      this.urlList.secondLink = eval(this.sourceData[0])
    })
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
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  // background-color: aquamarine;
  width: 1200px;
  height: 100%;
  margin: 0 auto;
}
#container {
  display: flex;
  flex-direction: row;
  height: 100%;
}
</style>
