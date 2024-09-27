<template>
  <div id="container">
    <TheAside
      id="the-aside"
      :iconList="urlList.iconList"
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

<script setup>
import store from "@/store";
import { ref, reactive, watch, onMounted,computed } from 'vue'
import { getData, getGuestData, deleteCategroy, updateCategroy, addCategory } from '@/api/data/index'
import MainLink from './MainLink.vue'
import TheAside from './TheAside.vue'

// 初始数据
const urlList = reactive({
  firstCategroy: [],
  secondLink: [],
  iconList:[]
})

const isLogin = computed(()=>store.getters['user/isLogin'])
const dataIndex = ref(0)
const sourceData = ref([])
const isLocal = ref(true) // 数据是否存储在本地

// 引用组件
const mychild = ref(null)

// 方法定义
const handleDB = (obj) => {
  const { del, update, selectIndex, newValue } = obj
  const id = sourceData.value[selectIndex].id
  if (del) {
    deleteCategroy({ id })
  }
  if (update) {
    updateCategroy({ id, name: newValue })
  }
}

const addFisrtTitle = (name) => {
  addCategory({
    name: name
  }).then((res) => {
    const data = res.data
    sourceData.value.push(data)
  })
}

const manageLinks = () => {
  if (mychild.value) {
    mychild.value.drawer = true
  }
}

// 监听 dataIndex 的变化
watch(dataIndex, (newvalue, oldValue) => {
  urlList.secondLink = sourceData.value[newvalue]
})

// 在组件挂载时执行
onMounted(() => {
  if (isLogin.value) {
    getData()
      .then((res) => {
        let data = res.data
        // 对数据按照order字段进行升序排序
        sourceData.value = data.sort((a, b) => a.order - b.order);
        
        
        sourceData.value.forEach((element) => {
          // 侧边栏层级标题数据
          urlList.firstCategroy.push(element.name)
          urlList.iconList.push(element.icon)
        })
        // 数据反序列化
        sourceData.value.forEach((val) => {
          val.children = JSON.parse(val.children)
        })

        urlList.secondLink = eval(sourceData.value[0])
      })
  }
  else{
    getGuestData()
    .then((res) => {
      let data = res.data
      // 对数据按照order字段进行升序排序
      sourceData.value = data.sort((a, b) => a.order - b.order);
      sourceData.value.forEach((element) => {
        // 侧边栏层级标题数据
        urlList.firstCategroy.push(element.name)
        urlList.iconList.push(element.icon)
      })
      // 数据反序列化
      sourceData.value.forEach((val) => {
        val.children = JSON.parse(val.children)
      })

      urlList.secondLink = eval(sourceData.value[0])
    })
  }
  
})
</script>
