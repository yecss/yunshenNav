<template>
  <div class="wrapper">
    <!-- 移动端顶部导航栏 -->
    <div class="top-nav">
      <button
        @click="showPopIf = !showPopIf"
        class="btn btn-ghost btn-circle"
        id="top-nav-btn"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 12h16M4 18h7"
          />
        </svg>
      </button>
      <ul
        v-if="showPopIf"
        id="pop-menu"
        class="mt-3 px-4 py-2 shadow rounded-md bg-gray-200 w-56"
      >
        <li
          v-for="(i, index) in firstCategroy"
          :key="index"
          @click="changeDataIndex(index)"
          class="text-sm mt-3 bg-gray-400 cursor-pointer rounded-md h-8 text-white leading-8"
          :class="{
            'bg-gray-600': dataIndex === index,
            'text-blue-600': dataIndex !== index,
          }"
        >
          <a>{{ i.name }}</a>
        </li>
        <li v-if="isLogin" @click="logout" class="text-sm mt-3 bg-red-200 cursor-pointer rounded-md h-8 text-white leading-8">退出登录</li>
      </ul>
      <Search ref="searchInp"></Search>
      <h1 class="text-gray-500 text-2xl font-bold top-title">云深书签</h1>
      <button class="btn btn-ghost btn-circle" id="top-nav-btn" @click="tempClick">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </button>
    </div>
    <!-- <h1 class="text-gray-500 text-2xl font-bold">云深书签</h1> -->

    <!-- 展示区 -->
    <div class="box">
      <!-- {{initLink2}} -->
      <div
        class="second-wrapper"
        v-for="(categoryItem, index) in initLink2"
        :key="index"
      >
        <h2 class="second-title text-blue-700 text-base">{{ categoryItem.category.name }}</h2>
        <div class="second-box">
          <a
            class="link-item"
            :class="{'link-item-blocked': linkItem.is_blocked === 1,
              'link-item-recommend': linkItem.is_recommend === 1
            }"
            
            v-for="(linkItem, index2) in categoryItem.links"
            :key="index2"
            :href="linkItem.url"
            target="_blank"
            @contextmenu.prevent.stop="handlerRight(linkItem.id)"
          >
          <!-- <el-badge is-dot class="badget-item"></el-badge> -->
          {{ linkItem.name }}
          </a>
        </div>
      </div>
    </div>
    <el-drawer
      title="功能区"
      :lockScroll="false"
      v-model="drawer"
      :with-header="true"
    >
      <div class="drawer-wrapper">
        <!-- 添加链接 -->
        <div class="pop-box bg-red-100 shadow-md">
          <h2>添加链接</h2>
          <div class="edit">
            <div style="margin-top: 15px">
              <el-input
                placeholder="请输入链接的标题"
                v-model="newLink.name"
                class="input-with-select"
              >
              <template #prepend>
                <el-select
                  v-model="selectIndex"
                  placeholder="请选择"
                  style="width: 110px"
                  size="default"
                >
                  <el-option
                    v-for="(item, index) in initLink2"
                    :key="index"
                    :value="index"
                    :label="item.category.name"
                  ></el-option>
                </el-select>
              </template>
                
              </el-input>
            </div>
            <div style="margin-top: 15px">
              <el-input placeholder="请输入链接的地址" v-model="newLink.url">
                <template #append>
                  <el-button @click="addLink">提交</el-button>
                </template>
                
              </el-input>
            </div>
          </div>
        </div>

        <!-- 添加二级分类 -->
        <div class="pop-box mt-10 bg-blue-100 shadow-md">
          <h2>二级分类管理</h2>
          <div class="edit">
            <div style="margin-top: 15px;">
              <el-input v-model="this.firstCategroy[this.dataIndex].name" disabled placeholder="Please input" />
            </div>

            <div style="margin-top: 15px; text-align: left">
              <!-- 选择框 -->
              <el-select
                v-model="secondTitleSelectId"
                placeholder="请选择"
                size="default"
              >
                <el-option
                  v-for="item in this.initLink2"
                  :key="item.category.id"
                  :value="item.category.id"
                  :label="item.category.name"
                ></el-option>
              </el-select>
            
              <el-button
                size="default"
                class="ml-1"
                icon="Edit"
                @click="handleEditCategroy((isFrist = false))"
              ></el-button>
            </div>

            <div style="margin-top: 15px">
              <el-input
                placeholder="请输入要添加的二级分类名称"
                v-model="newsecondCategroy.category.name"
              >
              <template #append>
                <el-button @click="addSecondCategroy">
                  提交
                </el-button>
              </template>
                
              </el-input>
            </div>
          </div>
        </div>

        <!-- 添加一级分类 -->
        <div class="mt-10 pop-box bg-green-100 shadow-md">
          <h2>一级分类管理</h2>
          <div class="edit">
            <div style="margin-top: 15px; text-align: left">
              <!-- 选择框 -->
              <el-select
                v-model="firstTitleSelectIndex"
                placeholder="请选择"
                size="default"
              >
                <el-option
                  v-for="(item, index) in firstCategroy"
                  :key="index"
                  :value="index"
                  :label="item.name"
                ></el-option>
              </el-select>
              <el-button
                size="default"
                class="ml-1"
                icon="Edit"
                @click="handleEditCategroy((isFrist = true))"
              ></el-button>
            </div>

            <div style="margin-top: 15px">
              <el-input
                placeholder="请输入要添加的一级分类名称"
                v-model="newfirstCategroy.name"
              >
              <template #append>
                <el-button @click="addFirstCategroy">
                  提交
                </el-button>
              </template>
                
              </el-input>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>

    <el-dialog
      title="链接修改"
      :lockScroll="false"
      v-model="dialogVisible"
      width="30%"
    >
      <div class="pop-box link-change">
        <p>
          名称:
          <el-input size="small" type="text" v-model="dialogNewLink.title" />
        </p>
        <p>
          链接:
          <el-input size="small" type="text" v-model="dialogNewLink.url" />
        </p>
        <p>
          序号:
          <el-tag
            effect="plain"
          >
            {{ dialogNewLink.order }}
          </el-tag>
        </p>
        <p>
          是否被推荐：
          <el-switch
            v-model="dialogNewLink.isRecommend"
            active-color="#13ce66"
            inactive-color="#dddddd"
            :active-value="1"
            :inactive-value="0"
            >
          </el-switch>
          
        </p>
        <p>
          是否被屏蔽：
          <el-switch
            v-model="dialogNewLink.isBlocked"
            active-color="#13ce66"
            inactive-color="#dddddd"
            :active-value="1"
            :inactive-value="0"
            >
          </el-switch>
        </p>
        <p>
          排序:
          <el-button-group>
            <el-button plain @click="decrease">前进</el-button>
            <el-button plain @click="increase">后退</el-button>
          </el-button-group>
        </p>
      </div>
      <template #footer>
        <span class="dialog-footer">

          <el-popover :visible="visible" placement="top" :width="160">
              <p>本次操作将永远删除这个链接
            <br />
            <br /></p>
              <div style="display: flex; justify-content: space-evenly;">
                <el-button size="small" @click="visible = false">
                  取消
                </el-button>
                <el-button size="small" type="primary" @click="dialogDelete">
                  确定
                </el-button>
              </div>
              <template #reference>
                <el-button type="danger" @click="visible = true">删 除</el-button>
              </template>
            </el-popover>

          <el-button type="primary" @click="dialogUpdate">更 新</el-button>
        </span>
      </template>
      
      
    </el-dialog>

    <!-- 第一层级 -->
    <CommonDialog
      v-model:dialogVisible="dialogFirstTitle"
      @confirm="dialogFirstTitle = false"
    >
      <el-row>
        <el-col>
          <el-input v-model="newFirstTitle" />
        </el-col>
      </el-row>
      <el-row class="mt-4">
        <el-col class="text-left">
          <el-button
            icon="Delete"
            type="danger"
            @click="deleteCategroy((isFrist = true))"
          >
            删除
          </el-button>
          <el-button
            icon="Check"
            type="primary"
            @click="updateCategroy((isFrist = true))"
          >
            更新
          </el-button>
        </el-col>
      </el-row>
    </CommonDialog>

    <!-- 二级标题 -->
    <CommonDialog
      v-model:dialogVisible="dialogVisTitle"
      @confirm="dialogVisTitle = false"
    >
      <el-row>
        <el-col>
          <el-input v-model="this.newSecondTitle" />
        </el-col>
      </el-row>
      <el-row class="mt-4">
        <el-col class="text-left">
          <el-button
            icon="Delete"
            type="danger"
            @click="deleteCategroy((isFrist = false))"
          >
            删除
          </el-button>
          <el-button
            icon="Check"
            type="primary"
            @click="updateCategroy((isFrist = false))"
          >
            更新
          </el-button>
        </el-col>
      </el-row>
    </CommonDialog>
  </div>
</template>

<script>
import {updateLink,addLink,updateCategroy,deleteCategroy,addCategory,deleteLink,updateLinkOrder} from "@/api/data/index"
import CommonDialog from '@/layout/components/CommonDialog.vue'
import Search from './Search.vue'
import router from "@/router/index"
import store from "@/store/index";
import { computed } from 'vue';
import { useStore } from 'vuex';
import { ElMessage } from 'element-plus';
export default {
  name: 'MainLink',
  props: ['initLink', 'firstCategroy', 'dataIndex', 'sourceData'],
  components: {
    CommonDialog,
    Search,
  },
  setup() {
    const store = useStore();
    const isLogin = computed(() => store.getters['user/isLogin']);
    return {
      isLogin,
    };
  },
  data() {
    return {
      showPopIf: false, //移动端菜单弹窗状态
      initLink2: this.initLink,
      newLink: {
        name: '',
        url: 'http://',
        sort_order: 0,
        id:0,
      },
      newFirstTitle:'', //新的一级标题名称
      newfirstCategroy: { //新的一级分类
        name: '',
        level: 1,
        icon:'heroicons:inbox',
        sort_order:0,
        id:0
      },
      newSecondTitle:'',//新的二级标题名称
      newsecondCategroy: { //新增二级分类
        category:{
          parentId: 0,
          name: '',
          level: 2,
          sort_order:0,
          id:0
        },
        links: [],
      }, 

      dialogNewLink: {//右键弹窗中的链接数据
        id: 0,
        title: '',
        url: 'http://',
        order:0,
        isBlocked: 0,
        isRecommend: 0,
      },
      newArr: [{ name: '技术栈', children: [], web: [] }],
      selectIndex: 0,

      // 右侧管理区
      secondTitleSelectId: null, //选中的二级分类的ID
      firstCategroySelectId: null, //选中的一级分类的ID
      firstTitleSelectIndex: 0, //一级标题选择索引
      /* 右侧抽屉状态 */
      drawer: false,
      /* 鼠标右键状态 */
      dialogVisible: false,
      /* 第二层级标题修改弹窗状态 */
      dialogVisTitle: false,
      /* 第一层级标题修改弹窗状态 */
      dialogFirstTitle: false,
      /* dialog数据索引 */
      dialogSelectLinkId:0,
      /* 删除弹出框的状态 */
      visible: false,
      input1: ''
    }
  },
  methods: {
    //临时弹窗
    tempClick() {
      ElMessage({
        message: '功能开发中',
        type: 'warning',
        // 可关闭
        showClose: true,
        // 小尺寸
        size: 'mini',
        // 持续时间
        duration: 500,
      })
    },
    // 移动端退出登录
    logout(){
      router.push('/login')
      // 这块写 / 是因为在模块里面设置了命名空间
      store.commit('user/clearToken')
    },
    /* 新增一级分类 */
    addFirstCategroy() {
      // console.log(this.firstCategroy);
      this.newfirstCategroy.sort_order = this.firstCategroy.length + 1
      this.$emit('addFisrtTitle',this.newfirstCategroy)
      // this.newfirstCategroy.name = '';
      },
    /* 新增二级分类 */
    addSecondCategroy() {
      //当前选中的一级分类ID
      this.firstCategroySelectId = this.firstCategroy[this.dataIndex].id
      this.newsecondCategroy.category.parentId = this.firstCategroySelectId
      this.newsecondCategroy.category.sort_order = this.initLink2.length + 1
      
      addCategory({
        categoryName:this.newsecondCategroy.category.name,
        level: this.newsecondCategroy.category.level,
        parentId: this.newsecondCategroy.category.parentId,
        sort_order: this.newsecondCategroy.category.sort_order
      }).then((res) => {
        const data = res
        // 设置新增的二级分类ID
        this.newsecondCategroy.category.id = data.categoryId;

        // 将新增的分类添加到 initLink2 中
        // this.initLink2.push(this.newsecondCategroy);
        this.initLink2.push(JSON.parse(JSON.stringify(this.newsecondCategroy)));

        // 清空输入框中的内容
        this.newsecondCategroy.category.name = '';
      }).catch((err) => {
        console.error('新增二级分类失败', err);
      });
    },
    /* 删除一二级分类 ok */
    deleteCategroy(isFrist) {
      if (isFrist) {
        if (confirm('是否确定删除')) {
          this.$emit('changeFirstTitle', {
            selectIndex: this.firstTitleSelectIndex,
            del: true,
            update: false,
          })
          this.firstCategroy.splice(this.firstTitleSelectIndex, 1)
          this.dialogFirstTitle = false
          // 防止索引超过数组的最后一个元素
          if (this.firstTitleSelectIndex >= this.firstCategroy.length) {
            this.firstTitleSelectIndex = this.firstCategroy.length - 1;
          }

          // 同步 dataIndex，确保它不会超出范围
          if (this.dataIndex >= this.firstCategroy.length) {
            this.dataIndex = this.firstCategroy.length - 1;
          }

        }
      } else {
  if (confirm('是否确定删除')) {
    const index = this.initLink2.findIndex(item => item.category.id == this.secondTitleSelectId);

    // 调用异步删除函数
    deleteCategroy({
      categoryId: this.secondTitleSelectId,
      level: 2
    }).then(() => {
      // 在删除成功后处理删除逻辑
      if (index !== -1) {
        // 删除该二级分类
        this.initLink2.splice(index, 1);

        // 关闭对话框
        this.dialogVisTitle = false;

        // 清空选择框
        this.secondTitleSelectId = null;
      }
    }).catch(error => {
      console.error('删除失败', error);
      // 处理删除失败的逻辑
      alert('删除失败，请稍后再试');
    });
  }
}

    },
    /* 更新一二级分类 ok */
    updateCategroy(isFrist) {
      if (isFrist) {
        /* 先判断是否发生了变化 */
        let newName = this.newFirstTitle
        let oldName = this.firstCategroy[this.firstTitleSelectIndex]
        if (oldName != newName) {
          // this.firstCategroy[this.firstTitleSelectIndex] = newName //此处不能直接修改否则会丢失响应式，需要使用splice
          // this.firstCategroy.splice(this.firstTitleSelectIndex, 1, newName)
          this.firstCategroy[this.firstTitleSelectIndex].name = newName
          this.$emit('changeFirstTitle', {
            selectIndex: this.firstTitleSelectIndex,
            del: false,
            update: true,
            newValue: newName,
          })
        }
        // 隐藏弹窗
        this.dialogFirstTitle = false
        
      } 
      else {
        /* 先判断是否发生了变化 */
        let newName = this.newSecondTitle
        const category = this.initLink2.find(item => item.category.id == this.secondTitleSelectId);
        let oldName = category.name
        if (oldName != newName) {
          // 确保更新后的数据反映在 initLink2 中
          const index = this.initLink2.findIndex(item => item.category.id == this.secondTitleSelectId);
          if (index !== -1) {
            // 更新 initLink2 中的内容
            this.initLink2[index].category.name = newName
          }
        }
        // 隐藏弹窗
        this.dialogVisTitle = false
        /* 上传数据 */
        updateCategroy({
          categoryId: this.secondTitleSelectId,
          newName: newName,
          level: 2
        })
      }
    },
    // 显示修改层级标题的弹出
    handleEditCategroy(isFrist) {
      
      if (isFrist) {
        this.dialogFirstTitle = true

        // console.log(this.firstCategroy[this.firstTitleSelectIndex].name);
        this.newFirstTitle = this.firstCategroy[this.firstTitleSelectIndex].name
        
        
      } else {
        this.dialogVisTitle = true
        // this.newSecondTitle = this.initLink2.children[this.secondTitleSelectId].name
      }
    },
    /* 修改数据索引 */
    changeDataIndex(index) {
      // 快速修改
      this.$emit('update:dataIndex', index)
      this.showPopIf = false
    },
    dialogDelete() {
      this.visible = false
      this.dialogVisible = false
      /* 删除选择的这条数据 */
      // console.log(this.initLink2);
      // console.log(this.dialogSelectLinkId);
      
      //找到对应的链接并删除
      const selectedLinkIndex = this.initLink2
        .map(item => item.links.findIndex(link => link.id === this.dialogSelectLinkId))
        .findIndex(index => index !== -1);
      if (selectedLinkIndex !== -1) {
        // 找到对应的链接并删除
        this.initLink2[selectedLinkIndex].links = this.initLink2[selectedLinkIndex].links.filter(
          link => link.id !== this.dialogSelectLinkId
        );
        // console.log('链接已删除', this.dialogSelectLinkId);
        // 调用后端接口进行删除
        deleteLink({id:this.dialogSelectLinkId});
      } else {
        console.error('找不到匹配的链接进行删除');
      }
      
    },
    dialogUpdate() {
      const selectedLinkIndex = this.initLink2
        .map(item => item.links.findIndex(link => link.id === this.dialogNewLink.id))
        .findIndex(index => index !== -1);

    if (selectedLinkIndex !== -1) {
      // 找到对应的链接并更新
      const linkToUpdate = this.initLink2[selectedLinkIndex].links.find(
        link => link.id === this.dialogNewLink.id
      );
      
      if (linkToUpdate) {
        linkToUpdate.name = this.dialogNewLink.title;
        linkToUpdate.url = this.dialogNewLink.url;
        linkToUpdate.sort_order = this.dialogNewLink.order;
        linkToUpdate.is_blocked = this.dialogNewLink.isBlocked;
        linkToUpdate.is_recommend = this.dialogNewLink.isRecommend;

        // 关闭弹窗
        this.dialogVisible = false;
        // console.log("链接已更新:", this.dialogNewLink);
        // 调用后端接口进行更新
        updateLink(this.dialogNewLink);
      }
    } else {
      console.error("找不到匹配的链接进行更新");
    }
    },
    /* 右键链接处理 ok */
    handlerRight(link_id) {
      
      /* 链接的ID */
      this.dialogSelectLinkId = link_id
      
      this.dialogVisible = true
      // console.log(this.initLink2);
      /* 查找与 dialogSelectLinkId 匹配的链接 */
      const selectedLink = this.initLink2.map(item => {
      return item.links.find(link => link.id === link_id)
    }).filter(link => link !== undefined)[0];
      // console.log(selectedLink);
      
      if (selectedLink) {
        // 将找到的链接数据赋值给 dialogNewLink
        this.dialogNewLink = {
          id: selectedLink.id,
          title: selectedLink.name,
          url: selectedLink.url,
          order: selectedLink.sort_order,
          isBlocked: selectedLink.is_blocked,
          isRecommend: selectedLink.is_recommend,
        };
      }
    },
    /* 新增链接 ok */
    addLink() {
      /* JavaScript验证字符串是否是以http://或者https://，如果不是就在开头加上http:// */
      function addHTTPIfNeeded(url) {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'http://' + url
        }
        return url
      }
      this.newLink.url = addHTTPIfNeeded(this.newLink.url)

      if (this.newLink.name == '') {
        alert('请输入标题')
        return
      }
      //获取排序号码
      this.newLink.sort_order = this.initLink2[this.selectIndex].links.length + 1
      
      // 定义数据
      const newLinkData = {
        name: this.newLink.name,
        url: this.newLink.url,
        is_blocked: this.newLink.is_blocked || false,
        sort_order: this.newLink.sort_order,
        icon: this.newLink.icon || '', // 如果有图标
        category_level_2: this.initLink2[this.selectIndex].category.id, // 二级分类ID
      };
      
      addLink(newLinkData).then(response => {
      if (response.status == 200) {
        // 后端成功响应，获取新链接的ID
        this.newLink.id = response.linkId;
        // 后端成功响应，更新本地数据
        this.initLink2[this.selectIndex].links.push(
          JSON.parse(JSON.stringify(this.newLink))
        )

        // 清空表单
        this.newLink.url = ''
        this.newLink.name = ''
        this.newLink.sort_order = 0

        // console.log('新增链接成功！', response.data);
      }
    })
    .catch(error => {
      console.error('添加链接失败', error);
    });
    },
    decrease() {
      const selectedLinkIndex = this.initLink2
        .map(item => item.links.findIndex(link => link.id === this.dialogNewLink.id))
        .findIndex(index => index !== -1);

      if (selectedLinkIndex !== -1) {
        const linkToMove = this.initLink2[selectedLinkIndex].links.find(
          link => link.id === this.dialogNewLink.id
        );

        if (linkToMove && linkToMove.sort_order > 1) {
          const targetOrder = linkToMove.sort_order - 1;
          const targetLink = this.initLink2[selectedLinkIndex].links.find(
            link => link.sort_order === targetOrder
          );

          if (targetLink) {
            targetLink.sort_order += 1;
            linkToMove.sort_order -= 1;
            this.dialogNewLink.order = linkToMove.sort_order;
            this.initLink2[selectedLinkIndex].links.sort((a, b) => a.sort_order - b.sort_order);
            updateLinkOrder({
              linkId: targetLink.id,
              newSortOrder: targetLink.sort_order
            });
            updateLinkOrder({
              linkId: linkToMove.id,
              newSortOrder: linkToMove.sort_order
            });
          }
        }
      }
    },
    increase() {
      const selectedLinkIndex = this.initLink2
        .map(item => item.links.findIndex(link => link.id === this.dialogNewLink.id))
        .findIndex(index => index !== -1);

      if (selectedLinkIndex !== -1) {
        const linkToMove = this.initLink2[selectedLinkIndex].links.find(
          link => link.id === this.dialogNewLink.id
        );

        if (linkToMove && linkToMove.sort_order < this.initLink2[selectedLinkIndex].links.length) {
          const targetOrder = linkToMove.sort_order + 1;
          const targetLink = this.initLink2[selectedLinkIndex].links.find(
            link => link.sort_order === targetOrder
          );

          if (targetLink) {
            targetLink.sort_order -= 1;
            linkToMove.sort_order += 1;
            this.dialogNewLink.order = linkToMove.sort_order;
            this.initLink2[selectedLinkIndex].links.sort((a, b) => a.sort_order - b.sort_order);
            console.log('targetLink',targetLink);
            
            updateLinkOrder({
              linkId: targetLink.id,
              newSortOrder: targetLink.sort_order
            });
            updateLinkOrder({
              linkId: linkToMove.id,
              newSortOrder: linkToMove.sort_order
            });
          }
        }
      }
    },
  },
  watch: {
    initLink(newVal) {
      this.initLink2 = newVal
      if(newVal.length > 0){
        //菜单二级分类ID
        this.secondTitleSelectId = newVal[0].category.id;
      }
      
    },
    // 监听 secondTitleSelectId 的变化
    secondTitleSelectId(newId) {
    // 根据 newId 查找对应的名称
    const category = this.initLink2.find(item => item.category.id === newId);
    
    if (category) {
      this.newSecondTitle = category.category.name;
    } else {
      this.newSecondTitle = ''; // 如果没找到，清空名称
    }
  },
  },
  mounted() {
    // 打开网站自动聚焦到搜索框
    this.$refs.searchInp.autoFocus()
  },
}
</script>

<style lang="scss" scoped>
.el-select .el-input {
  width: 130px;
}
.input-with-select .el-input-group__prepend {
  background-color: #fff;
}

.drawer {
  width: 100px;
}
// 美化滚动条
::-webkit-scrollbar {
  width: 6px;
  height: 10px;
}

::-webkit-scrollbar-track {
  width: 6px;
  background: rgba(#101f1c, 0.1);
  -webkit-border-radius: 2em;
  -moz-border-radius: 2em;
  border-radius: 2em;
}

::-webkit-scrollbar-thumb {
  background-color: rgba(175, 177, 182, 0.9);
  background-clip: padding-box;
  min-height: 28px;
  -webkit-border-radius: 2em;
  -moz-border-radius: 2em;
  border-radius: 2em;
  transition: background-color 0.3s;
  cursor: pointer;
}

::-webkit-scrollbar-thumb:hover {
  background-color: rgba(122, 122, 123, 0.3);
}

.wrapper {
  // width: 1000px;
  width: calc(100% - 224px);
  padding: 30px;
  padding-bottom: 60px;
  overflow-x: hidden;
  overflow-y: auto;
  background-color: #fff;
  // border-radius: 0 6px 6px 0;
  // background-color: rgba(255,255,255,.84);
}
.drawer-wrapper {
  // position: relative;
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: flex-start;
  flex-wrap: wrap;
}
.pop-box {
  width: 88%;
  padding: 20px;
  // background-color: #b1b1af26;
  border-radius: 6px;
}
.pop-box p {
  margin-top: 10px;
  text-align: left;
}
.edit {
  width: 100%;
}
.edit input {
  width: 80%;
  height: 22px;
}
.second-title {
  text-align: left;
  border-bottom: 1px rgb(231 234 237) solid;
}
.second-wrapper {
  margin-top: 30px;
}
.second-wrapper:nth-of-type(1) {
  margin-top: 0;
}
.second-box {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: baseline;
}
.second-box .link-item {
  position: relative;
  z-index: 10;
  font-size: 16px;
  text-decoration: none;
  color: black;
  margin-right: 20px;
  padding: 8px;
  max-width: 160px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  background-color: #f3f3f3;
  // background-color: #ededed;
  transition: background-color 0.2s, color 0.2s;
  border-radius: 2px;
  margin-top: 16px;
}
.second-box .link-item-blocked::after {
  content: ''; /* 伪元素需要有内容，即使是空字符串 */
  position: absolute; /* 绝对定位相对于 a 标签 */
  top: 0;
  right: 0;
  width: 0;
  height: 0;
  border-left: 9px solid transparent; /* 透明边框 */
  border-top: 9px solid #EF498B; /* 红色的底部边框，形成斜三角 */
}
.second-box .link-item-recommend::after {
  content: ''; /* 伪元素需要有内容，即使是空字符串 */
  position: absolute; /* 绝对定位相对于 a 标签 */
  top: 0;
  right: 0;
  width: 0;
  height: 0;
  border-left: 9px solid transparent; /* 透明边框 */
  border-top: 9px solid #087dc1; /* 红色的底部边框，形成斜三角 */
}
.second-box .link-item:hover {
  color: #fff;
  background-color: #515151;
}
.link-change {
  width: 100%;
}
.link-change .el-input {
  width: 80%;
}
.top-nav {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  position: relative;
}
#top-nav-btn {
  display: none;
}
#pop-menu {
  position: absolute;
  z-index: 20; //高于其他元素
  left: 0;
  top: 20px;
}
</style>
