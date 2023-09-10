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
        const todo = this.AV.Object.createWithoutData('links', id)
        todo
          .destroy()
          .then(() => {
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
        const todo = this.AV.Object.createWithoutData('links', id)
        todo.set('name', newValue)
        todo
          .save()
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
      this.urlList.secondLink = this.sourceData[newvalue]
    },
  },
  created() {
    const query = new this.AV.Query('links')
    const linksArr = []
    query.find().then((item) => {
      // todo 是第一个满足条件的 Todo 对象
      console.log(item)
      item.forEach((data) => {
        /* 将id键添加到对象上 */
        data._serverData._id = data.id
        // console.log(data._serverData)
        this.sourceData.push(data._serverData)
        linksArr.push(data._serverData)
        this.urlList.firstCategroy.push(data._serverData.name)
      })

      this.urlList.secondLink = eval(linksArr[0])
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
