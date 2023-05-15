<template>
  <div class="wrapper">
    <!-- 移动端顶部导航栏 -->
    <div class="top-nav">
      <button @click="showPopIf=!showPopIf" class="btn btn-ghost btn-circle" id="top-nav-btn">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
      </button>
      <ul v-if="showPopIf" id="pop-menu" class="mt-3 px-4 py-2 shadow rounded-md bg-gray-200 w-56">
        <li v-for="(i, index) in firstCategroy" :key="index" @click="changeDataIndex(index)" class="text-sm mt-3 bg-gray-100 cursor-pointer rounded-md h-8 text-white leading-8" :class="{'bg-gray-400':dataIndex===index,'text-blue-600':dataIndex!==index}"><a>{{i}}</a></li>
        
      </ul>
      <span class="text-gray-500 text-2xl font-bold">
        云深书签
      </span>
      
      <button class="btn btn-ghost btn-circle" id="top-nav-btn">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
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
        <div class="pop-box">
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
                  class="add-link-input"
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
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'MainLink',
  props: ['initLink','isAuth','firstCategroy','dataIndex'],
  data() {
    return {
      showPopIf:false,//移动端菜单弹窗状态
      initLink2: this.initLink,
      newLink: {
        title: '',
        url: 'http://',
      },
      dialogNewLink: {
        title: '',
        url: 'http://',
      },
      newArr: [{ name: '技术栈', children: [], web: [] }],
      selectIndex: 0,
      /* 右侧抽屉状态 */
      drawer: false,
      /* 鼠标右键状态 */
      dialogVisible: false,
      /* dialog数据索引 */
      dialogSelectIndex: {
        first: 0,
        second: 0,
      },
      /* 删除弹出框的状态 */
      visible: false,
      input1: '',
    }
  },
  methods: {
    /* 修改数据索引 */
    changeDataIndex(index){
      // 快速修改
      this.$emit('update:dataIndex', index);
      this.showPopIf = false
    },
    dialogDelete() {

      this.visible = false
      this.dialogVisible = false
      /* auth */
      if(this.isAuth){
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
      }
      else{
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
      if(this.isAuth){
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
      }
      else{
        /* 增加提示弹窗 */
        this.$message({
          type: 'error',
          message: '秘钥验证未成功!',
        })
      }
      
      
    },
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
          console.log('status:',response.status)
        },
        (error) => {
          console.log(error)
        }
      )
    },
    addLink() {
      /* JavaScript验证字符串是否是以http://或者https://，如果不是就在开头加上http:// */
      function addHTTPIfNeeded(url) {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'http://' + url;
        }
        return url;
      }
      this.newLink.url = addHTTPIfNeeded(this.newLink.url)

      if (this.newLink.title == '') {
        alert('请输入标题')
        return
      }
      
      this.initLink2.children[this.selectIndex].web.push(
        JSON.parse(JSON.stringify(this.newLink))
      )
      
      /* 更新所有数据 */
      this.updateLink()
       this.$message({
        type: 'success',
        message: '添加成功!',
      })
    },
  },
  components: {},
  watch: {
    initLink(newVal) {
      this.initLink2 = newVal
      /* 使用eval将字符串数组转换为真正的数组 */
      this.initLink2.children = eval(this.initLink2.children)
    },
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
.add-link-input {
  width: 104px;
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
  width: 1000px;
  padding: 30px;
  overflow-x: hidden;
  overflow-y: auto;
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
  background-color: #b1b1af26;
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
  margin-top: 14px;
  
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
  transition: background-color .2s, color .2s;
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
.top-nav{
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  position: relative;
}
#top-nav-btn{
  display: none;
}
#pop-menu{
  position: absolute;
  left: 0;
  top: 20px;
}
/* 在宽度大于等于600px并且小于1400px时应用的样式 */
@media (min-width: 600px) and (max-width: 1399px) {
  /* 隐藏默认滚动条 */
  ::-webkit-scrollbar {
    width: 0px;
    
  }
}
</style>