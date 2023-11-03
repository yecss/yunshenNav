<template>
  <div id="container">
    <TheAside
      id="the-aside"
      :firstCategroy="urlList.firstCategroy"
      v-model:dataIndex="dataIndex"
      @manageLinks="manageLinks"
    ></TheAside>
    <MainLink
      ref="mychild"
      :sourceData="sourceData"
      :firstCategroy="urlList.firstCategroy"
      :initLink="urlList.secondLink"
      v-model:dataIndex="dataIndex"
      @changeFirstTitle="handleDB"
      @addFisrtTitle="addFisrtTitle"
    ></MainLink>
  </div>
</template>

<script>

import { getData,deleteCategroy, updateCategroy,addCategory } from '@/api/data/index'
import MainLink from './MainLink.vue'
import TheAside from './TheAside.vue'
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
      let id = this.sourceData[selectIndex].id
      if (del) {
        deleteCategroy({ id: id })
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
        updateCategroy({ id: id, name: newValue })
          .then(() => {
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
    addFisrtTitle(name){
      addCategory({
        name:name
      }).then((res) => {
        let data = res.data
        
        this.sourceData.push(data)
      })
    },
    manageLinks() {
      this.$refs.mychild.drawer = true
    },
  },
  watch: {
    dataIndex(newvalue, oldValue) {
      this.urlList.secondLink = this.sourceData[newvalue]
    },
  },
  created() {
    getData()
      .then((res) => {
        // 解析数据
        let data = res.data
        this.sourceData = data
        this.sourceData.forEach((element) => {
          // 侧边栏层级标题数据
          this.urlList.firstCategroy.push(element.name)
        })
        // 数据反序列化
        this.sourceData.forEach((val) => {
          val.children = JSON.parse(val.children)
        })
        // 排序
        // orderArr.sort((a,b)=>a.index_num-b.index_num)

        this.urlList.secondLink = eval(this.sourceData[0])
      })
  },
}
</script>
