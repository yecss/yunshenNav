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
          class="text-sm mt-3 bg-gray-100 cursor-pointer rounded-md h-8 text-white leading-8"
          :class="{
            'bg-gray-400': dataIndex === index,
            'text-blue-600': dataIndex !== index,
          }"
        >
          <a>{{ i }}</a>
        </li>
      </ul>
      <Search ref="searchInp"></Search>
      <h1 class="text-gray-500 text-2xl font-bold top-title">云深书签</h1>
      <button class="btn btn-ghost btn-circle" id="top-nav-btn">
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

    <div class="box">
      <!-- {{initLink2}} -->
      <div
        class="second-wrapper"
        v-for="(item, index) in initLink2.children"
        :key="index"
      >
        <h2 class="second-title text-blue-700 text-base">{{ item.name }}</h2>
        <div class="second-box">
          <a
            class=""
            v-for="(item, index2) in initLink.children[index].web"
            :key="index2"
            :href="item.url"
            target="_blank"
            @contextmenu.prevent.stop="handlerRight(index, index2)"
          >
            {{ item.title }}
          </a>
        </div>
      </div>
    </div>
    <el-drawer title="功能区" :visible.sync="drawer" :with-header="true">
      <div class="drawer-wrapper">
        <!-- 添加链接 -->
        <div class="pop-box bg-red-100 shadow-md">
          <h2>添加链接</h2>
          <div class="edit">
            <div style="margin-top: 15px">
              <el-input
                placeholder="请输入链接的标题"
                v-model="newLink.title"
                class="input-with-select"
              >
                <el-select
                  v-model="selectIndex"
                  slot="prepend"
                  placeholder="请选择"
                  style="width: 110px"
                >
                  <el-option
                    v-for="(item, index) in initLink2.children"
                    :key="index"
                    :value="index"
                    :label="item.name"
                  ></el-option>
                </el-select>
              </el-input>
            </div>
            <div style="margin-top: 15px">
              <el-input placeholder="请输入链接的地址" v-model="newLink.url">
                <el-button slot="append" @click="addLink">提交</el-button>
              </el-input>
            </div>
          </div>
        </div>

        <!-- 添加二级分类 -->
        <div class="pop-box mt-10 bg-blue-100 shadow-md">
          <h2>二级分类管理</h2>
          <div class="edit">
            <div style="margin-top: 15px">
              <el-input
                style="width: 100%"
                placeholder="请输入内容"
                :value="'当前位于一级分类: ' + initLink2.name"
                :disabled="true"
              ></el-input>
            </div>

            <div style="margin-top: 15px; text-align: left">
              <!-- 选择框 -->
              <el-select
                v-model="secondTitleSelectIndex"
                placeholder="请选择"
                size="medium"
              >
                <el-option
                  v-for="(item, index) in initLink2.children"
                  :key="index"
                  :value="index"
                  :label="item.name"
                ></el-option>
              </el-select>
              <el-button
                size="medium"
                class="ml-1"
                icon="el-icon-edit"
                @click="handleEditCategroy((isFrist = false))"
              ></el-button>
            </div>

            <div style="margin-top: 15px">
              <el-input
                placeholder="请输入要添加的二级分类名称"
                v-model="newsecondCategroy.name"
              >
                <el-button slot="append" @click="addSecondCategroy">
                  提交
                </el-button>
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
                size="medium"
              >
                <el-option
                  v-for="(item, index) in firstCategroy"
                  :key="index"
                  :value="index"
                  :label="item"
                ></el-option>
              </el-select>
              <el-button
                size="medium"
                class="ml-1"
                icon="el-icon-edit"
                @click="handleEditCategroy((isFrist = true))"
              ></el-button>
            </div>

            <div style="margin-top: 15px">
              <el-input
                placeholder="请输入要添加的一级分类名称"
                v-model="newfirstCategroy"
              >
                <el-button slot="append" @click="addFirstCategroy">
                  添加
                </el-button>
              </el-input>
            </div>
          </div>
        </div>
        
        

      </div>
    </el-drawer>

    <el-dialog title="链接修改" :visible.sync="dialogVisible" width="30%">
      <div class="pop-box link-change">
        <p>
          名称:
          <el-input size="mini" type="text" v-model="dialogNewLink.title" />
        </p>
        <p>
          链接:
          <el-input size="mini" type="text" v-model="dialogNewLink.url" />
        </p>
      </div>
      <span slot="footer" class="dialog-footer">
        <!-- <el-button >删 除</el-button> -->
        <el-popover placement="top" width="160" v-model="visible">
          <p>
            本次操作将永远删除这个链接
            <br />
            <br />
          </p>
          <div style="text-align: right; margin: 0">
            <el-button size="mini" type="text" @click="visible = false">
              取消
            </el-button>
            <el-button type="primary" size="mini" @click="dialogDelete">
              确定
            </el-button>
          </div>
          <el-button style="margin-right: 10px" type="danger" slot="reference">
            删 除
          </el-button>
        </el-popover>

        <el-button type="primary" @click="dialogUpdate">更 新</el-button>
      </span>
    </el-dialog>

    <!-- 第一层级 -->
    <CommonDialog
      :dialogVisible.sync="dialogFirstTitle"
      @confirm="dialogVisTitle = false"
    >
      <el-row>
        <el-col>
          <el-input v-model="cpt_first" />
        </el-col>
      </el-row>
      <el-row class="mt-4">
        <el-col class="text-left">
          <el-button
            icon="el-icon-delete"
            type="danger"
            @click="deleteCategroy((isFrist = true))"
          >
            删除
          </el-button>
          <el-button
            icon="el-icon-check"
            type="primary"
            @click="updateCategroy((isFrist = true))"
          >
            更新
          </el-button>
        </el-col>
      </el-row>
    </CommonDialog>

    <CommonDialog
      :dialogVisible.sync="dialogVisTitle"
      @confirm="dialogVisTitle = false"
    >
      <el-row>
        <el-col>
          <el-input v-model="cpt" />
        </el-col>
      </el-row>
      <el-row class="mt-4">
        <el-col class="text-left">
          <el-button
            icon="el-icon-delete"
            type="danger"
            @click="deleteCategroy((isFrist = false))"
          >
            删除
          </el-button>
          <el-button
            icon="el-icon-check"
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
import axios from 'axios'
import CommonDialog from '@/components/CommonDialog.vue'
import Search from "@/views/Search.vue"
export default {
  name: 'MainLink',
  props: ['initLink', 'isAuth', 'firstCategroy', 'dataIndex', 'sourceData'],
  components: {
    CommonDialog,Search,
  },
  data() {
    return {
      showPopIf: false, //移动端菜单弹窗状态
      initLink2: this.initLink,
      newLink: {
        title: '',
        url: 'http://',
      },
      newfirstCategroy: '', //新的一级分类
      newsecondCategroy: {
        children: [],
        name: '',
        web: [],
      }, //新的二级分类
      dialogNewLink: {
        title: '',
        url: 'http://',
      },
      newArr: [{ name: '技术栈', children: [], web: [] }],
      selectIndex: 0,
      secondTitleSelectIndex: 0, //二级标题选择索引
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
      dialogSelectIndex: {
        first: 0,
        second: 0,
      },
      /* 删除弹出框的状态 */
      visible: false,
      input1: '',
      cpt: '',
      cpt_first: '', //编辑框里面的第一级标题
    }
  },
  methods: {
    /* 新增一级分类 */
    addFirstCategroy() {
      // 拦截操作
      if(!this.isAuth){
        this.$message({
          type: 'error',
          message: '秘钥验证未成功!',
        })
        return
      }

      axios({
        url: 'https://api.yecss.com/api/addCategroy',
        method: 'post',
        data: {
          name: this.newfirstCategroy,
        },
      }).then(
        (res) => {
          // console.log(res.data)
          this.firstCategroy.push(this.newfirstCategroy)
          this.sourceData.push(res.data)
          this.newfirstCategroy = ''
        },
        (error) => {
          // console.log(error)
        }
      )
    },
    /* 删除一二级分类 */
    deleteCategroy(isFrist) {
      if (this.isAuth) {
        if (isFrist) {
          if (confirm('是否确定删除')) {
            this.$emit('changeFirstTitle', {
              selectIndex: this.firstTitleSelectIndex,
              del: true,
              update: false,
            })
            this.firstCategroy.splice(this.firstTitleSelectIndex, 1)
            this.dialogFirstTitle = false
            this.$message({
              type: 'success',
              message: '删除成功',
            })
            /* 防止从后面删除，索引会超过数组中的最后一个元素 */
            if (this.firstTitleSelectIndex > this.firstCategroy.length - 1) {
              this.firstTitleSelectIndex = this.firstTitleSelectIndex - 1
            }
          }
        } else {
          if (confirm('是否确定删除')) {
            this.initLink2.children.splice(this.secondTitleSelectIndex, 1)
            this.dialogVisTitle = false
            this.$message({
              type: 'success',
              message: '删除成功',
            })
            /* 防止从后面删除，索引会超过数组中的最后一个元素 */
            if (
              this.secondTitleSelectIndex >
              this.initLink2.children.length - 1
            ) {
              this.secondTitleSelectIndex = this.secondTitleSelectIndex - 1
            }
            /* 上传数据 */
            this.updateLink()
          }
        }
      } else {
        /* 增加提示弹窗 */
        this.$message({
          type: 'error',
          message: '秘钥验证未成功!',
        })
      }
    },
    /* 更新一二级分类 */
    updateCategroy(isFrist) {
      if (this.isAuth) {
        if (isFrist) {
          /* 先判断是否发生了变化 */
          let newName = this.cpt_first
          let oldName = this.firstCategroy[this.firstTitleSelectIndex]
          if (oldName != newName) {
            // this.firstCategroy[this.firstTitleSelectIndex] = newName //此处不能直接修改否则会丢失响应式，需要使用splice
            this.firstCategroy.splice(this.firstTitleSelectIndex, 1, newName)
            this.$emit('changeFirstTitle', {
              selectIndex: this.firstTitleSelectIndex,
              del: false,
              update: true,
              newValue: newName,
            })
          }
          // 隐藏弹窗
          this.dialogFirstTitle = false
        } else {
          /* 先判断是否发生了变化 */
          let newName = this.cpt
          let oldName =
            this.initLink2.children[this.secondTitleSelectIndex].name
          if (oldName != newName) {
            this.initLink2.children[this.secondTitleSelectIndex].name = newName
          }
          // 隐藏弹窗
          this.dialogVisTitle = false
        }
      } else {
        /* 增加提示弹窗 */
        this.$message({
          type: 'error',
          message: '秘钥验证未成功!',
        })
      }
    },
    // 显示修改层级标题的弹出
    handleEditCategroy(isFrist) {
      if (isFrist) {
        this.dialogFirstTitle = true
        this.cpt_first = this.firstCategroy[this.firstTitleSelectIndex]
      } else {
        this.dialogVisTitle = true
        this.cpt = this.initLink2.children[this.secondTitleSelectIndex].name
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
      /* auth */
      if (this.isAuth) {
        /* 删除选择的这条数据 */
        this.initLink2.children[this.dialogSelectIndex.first].web.splice(
          this.dialogSelectIndex.second,
          1
        )
        /* 更新所有数据 */
        this.updateLink()
        /* 增加提示弹窗 */
        this.$message({
          type: 'success',
          message: '删除成功!',
        })
      } else {
        /* 增加提示弹窗 */
        this.$message({
          type: 'error',
          message: '秘钥验证未成功!',
        })
      }
    },
    dialogUpdate() {
      /* 隐藏弹窗 */
      this.dialogVisible = false
      /* auth */
      if (this.isAuth) {
        this.initLink2.children[this.dialogSelectIndex.first].web[
          this.dialogSelectIndex.second
        ] = this.dialogNewLink
        /* 更新所有数据 */
        this.updateLink()
        /* 增加提示弹窗 */
        this.$message({
          type: 'success',
          message: '更新成功!',
        })
      } else {
        /* 增加提示弹窗 */
        this.$message({
          type: 'error',
          message: '秘钥验证未成功!',
        })
      }
    },
    /* 右键链接处理 */
    handlerRight(index, index2) {
      /* 第一级数组索引 */
      this.dialogSelectIndex.first = index
      /* 第二级数组索引 */
      this.dialogSelectIndex.second = index2
      this.dialogVisible = true
      // console.log(index,index2)
      this.dialogNewLink = JSON.parse(
        JSON.stringify(this.initLink2.children[index].web[index2])
      )
      // console.log(this.initLink2.children[index].web[index2])
    },
    /* 上传数据到数据库 */
    updateLink() {
      axios({
        url: 'https://api.yecss.com/api/updateLink',
        method: 'post',
        data: {
          id: this.initLink2._id,
          data: this.initLink2.children,
        },
      }).then(
        (response) => {
          console.log('status:', response.status)
        },
        (error) => {
          console.log(error)
        }
      )
    },
    /* 新增链接 */
    addLink() {
      // 拦截操作
      if(!this.isAuth){
        this.$message({
          type: 'error',
          message: '秘钥验证未成功!',
        })
        return
      }

      /* JavaScript验证字符串是否是以http://或者https://，如果不是就在开头加上http:// */
      function addHTTPIfNeeded(url) {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'http://' + url
        }
        return url
      }
      this.newLink.url = addHTTPIfNeeded(this.newLink.url)

      if (this.newLink.title == '') {
        alert('请输入标题')
        return
      }

      this.initLink2.children[this.selectIndex].web.push(
        JSON.parse(JSON.stringify(this.newLink))
      )

      this.newLink.url = ''
      this.newLink.title = ''
      /* 更新所有数据 */
      this.updateLink()
      this.$message({
        type: 'success',
        message: '添加成功!',
      })
    },
    /* 新增二级分类 */
    addSecondCategroy() {
      // 拦截操作
      if(!this.isAuth){
        this.$message({
          type: 'error',
          message: '秘钥验证未成功!',
        })
        return
      }

      this.initLink2.children.push(
        JSON.parse(JSON.stringify(this.newsecondCategroy))
      )
      this.newsecondCategroy.name = ''
      /* 更新所有数据 */
      this.updateLink()
      this.$message({
        type: 'success',
        message: '添加成功!',
      })
    },
  },
  /* 数据监视钩子函数 */
  watch: {
    initLink(newVal) {
      this.initLink2 = newVal
      this.cpt = this.initLink2.children[this.secondTitleSelectIndex].name
    },
  },
  mounted(){
    // 打开网站自动聚焦到搜索框
    this.$refs.searchInp.autoFocus();
  }
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
  width: calc(100% - 224px);;
  padding: 30px;
  overflow-x: hidden;
  overflow-y: auto;
  background-color: #fff;
  border-radius: 0 6px 6px 0;
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
.second-box a {
  font-size: 16px;
  text-decoration: none;
  color: black;
  margin-right: 20px;
  padding: 8px;
  max-width: 160px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  background-color: #f3f4f6;
  transition: background-color 0.2s, color 0.2s;
  border-radius: 2px;
  margin-top: 16px;
}
.second-box a:hover {
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
  left: 0;
  top: 20px;
}
</style>
