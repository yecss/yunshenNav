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
import store from '@/store'
import { ref, reactive, watch, onMounted, computed } from 'vue'
import {
  getData,
  getGuestData,
  deleteCategroy,
  updateCategroy,
  addCategory,
} from '@/api/data/index'
import MainLink from './MainLink.vue'
import TheAside from './TheAside.vue'
import { ElMessage } from 'element-plus';
// 初始数据
const urlList = reactive({
  firstCategroy: [],
  secondLink: [],
  iconList: [],
})

const isLogin = computed(() => store.getters['user/isLogin'])
const dataIndex = ref(0)
const sourceData = ref([])
const isLocal = ref(true) // 数据是否存储在本地

// 引用组件
const mychild = ref(null)

// 方法定义
const handleDB = (obj) => {
  const { del, update, selectIndex, newValue } = obj
  const id = sourceData.value[selectIndex].category_level_1.id
  console.log(id);
  
  if (del) {
    deleteCategroy({ categoryId:id, newName:newValue, level:1 })
  }
  if (update) {
    updateCategroy({ categoryId:id, newName:newValue, level:1 })
  }
}

const addFisrtTitle = (newfirstCategroy) => {
  
  addCategory({ categoryName: newfirstCategroy.name, level: 1,icon: newfirstCategroy.icon,sort_order: newfirstCategroy.sort_order})
    .then((res) => {
      
      const { categoryId } = res;
      // 确保新对象被创建，以避免修改原始对象
      const newCategory = { ...newfirstCategroy, id: categoryId }

      // 更新数据
      urlList.firstCategroy.push(newCategory);
      urlList.iconList.push(newCategory.icon);
      
      sourceData.value.push({
        category_level_1: newCategory,
        level2_with_links: [],
      });

      newfirstCategroy.name = '';
    })
}

const manageLinks = () => {
  if (mychild.value) {
    mychild.value.drawer = true
  }
}

// 监听 dataIndex 的变化
watch(dataIndex, (newvalue, oldValue) => {
  urlList.secondLink = sourceData.value[newvalue].level2_with_links
  // console.log('watch', sourceData.value[newvalue].level2_with_links);
})

// 在组件挂载时执行
onMounted(() => {
  /* if (isLogin.value) {
    getData()
      .then((res) => {
        let data = res.data
        
        sourceData.value = data;
        
        sourceData.value.forEach((element) => {
          // console.log(element.category_level_1.icon);
          
          // 侧边栏层级标题数据
          urlList.firstCategroy.push(element.category_level_1)
          urlList.iconList.push(element.category_level_1.icon)
        })
        urlList.secondLink = sourceData.value[0].level2_with_links
        // 数据反序列化
        // sourceData.value.forEach((val) => {
        //   val.children = JSON.parse(val.children)
        // })
        // console.log(sourceData.value);
        
        // urlList.secondLink = eval(sourceData.value[0])
      }).catch((err) => {
        ElMessage({
          message: '数据获取失败',
          type: 'error',
          showClose: true,
          duration: 5 * 1000,
        });
      })
  }
  else{
    getGuestData()
    .then((res) => {
        let data = res.data
        sourceData.value = data;
        sourceData.value.forEach((element) => {
          urlList.firstCategroy.push(element.category_level_1)
          urlList.iconList.push(element.category_level_1.icon)
        })
        urlList.secondLink = sourceData.value[0].level2_with_links
      }).catch((err) => {
        ElMessage({
          message: '数据获取失败',
          type: 'error',
          showClose: true,
          duration: 5 * 1000,
        });
      })
  } */
    const loadData = async () => {
  try {
    const response = await fetch('https://nav-1253805353.cos-website.ap-guangzhou.myqcloud.com/getGuestData.json');
    const result = await response.json();

    // 按一级分类 sort_order 排序
    sourceData.value = result.data.sort(
      (a, b) =>
        a.category_level_1.sort_order - b.category_level_1.sort_order
    );

    // 清空旧数据（防止重复 push）
    urlList.firstCategroy = [];
    urlList.iconList = [];

    // 构建侧边栏一级分类
    sourceData.value.forEach(item => {
      urlList.firstCategroy.push(item.category_level_1);
      
      urlList.iconList.push(item.category_level_1.icon);
    });

    // 默认显示第一个一级分类下的二级数据
    urlList.secondLink = sourceData.value[0].level2_with_links;
    ElMessage({
          message: '数据获取成功',
          type: 'success',
          showClose: true,
          duration: 1 * 1000,
        });

  } catch (error) {
    console.error('Error fetching data:', error);
  }
};

loadData();

})
</script>
