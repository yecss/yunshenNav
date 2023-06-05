<template>
  <div id="container">
    <TheAside
      id="the-aside"
      :firstCategroy="urlList.firstCategroy"
      :isAuth.sync="isAuth"
      :dataIndex.sync="dataIndex"
      @manageLinks="manageLinks"
    ></TheAside>
    <MainLink
      ref="mychild"
      :sourceData="sourceData"
      :firstCategroy="urlList.firstCategroy"
      :initLink="urlList.secondLink"
      :isAuth="isAuth"
      :dataIndex.sync="dataIndex"
      @changeFirstTitle="handleDB"
    ></MainLink>
  </div>
</template>

<script>
import axios from 'axios'

import MainLink from '@/views/MainLink.vue'
import TheAside from '@/views/TheAside.vue'

export default {
  name: 'Home',
  data() {
    return {
      /* 初始数据 */
      urlList: {
        firstCategroy: [],
        secondLink: [],
      },
      dataIndex: 0,
      sourceData: [],
      isAuth: false, //秘钥验证是否成功
      isLocal: true, //数据是否存储在本地
    }
  },
  components: {
    MainLink,
    TheAside,
  },
  methods: {
    handleDB(obj) {
      let { del, update, selectIndex, newValue } = obj
      let id = this.sourceData[selectIndex]._id

      if (del) {
        axios({
          url: 'https://api.yecss.com/api/deleteCategroy',
          method: 'post',
          data: {
            id: id,
          },
        })
          .then((res) => {
            console.log(res)
            this.$message({
              type: 'success',
              message: '删除成功',
            })
          })
          .catch((err) => {
            console.log(err)
          })
      }
      if (update) {
        axios({
          url: 'https://api.yecss.com/api/updateCategroy',
          method: 'post',
          data: {
            id: id,
            name: newValue,
          },
        })
          .then((res) => {
            console.log(res)
            this.$message({
              type: 'success',
              message: '更新成功',
            })
          })
          .catch((err) => {
            console.log(err)
          })
      }
    },
    manageLinks() {
      this.$refs.mychild.drawer = true
    },
    handlerchangeAuth(value) {
      console.log(value)
    },
  },
  watch: {
    dataIndex(newvalue, oldValue) {
      // console.log('index发生了变化')
      // console.log(newvalue,oldValue)
      this.urlList.secondLink = this.sourceData[newvalue]
    },
  },
  created() {
    //数据库存储
    axios.get('https://api.yecss.com/api/getdata').then((res) => {
      let data = res.data
      this.sourceData = data
      // console.log('data',data)
      data.forEach((element) => {
        this.urlList.firstCategroy.push(element.name)
      })
      this.urlList.secondLink = eval(this.sourceData[0])
    })
  },

  mounted() {
    /* 读取key */
    let theKey = localStorage.getItem('bookmarks-key')
    if (theKey === 'yssq') {
      this.isAuth = true
    }
  },
}
</script>

<style></style>
