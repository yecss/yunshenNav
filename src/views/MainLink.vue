<template>
  <div class="wrapper">
    <h1>浏览器书签转网页</h1>
    <div class="box">
      <!-- {{initLink2}} -->
      <div
        class="second-wrapper"
        v-for="(item, index) in initLink2.children"
        :key="index"
      >
        <h2 class="second-title">{{ item.name }}</h2>
        <div class="second-box">
          <a
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
            <!-- <p>
              数据项:
              <select name="" id="" v-model="selectIndex">
                <option
                  v-for="(item, index) in initLink2.children"
                  :key="index"
                  :value="index"
                >
                  {{ item.name }}
                </option>
              </select>
            </p>
            <p>
              名称:
              <input v-model="newLink.title" type="text" />
            </p>
            <p>
              链接:
              <input v-model="newLink.url" type="text" />
            </p>

            <p>
              操作:
              <el-button @click="uploadLink">提交</el-button>
            </p> -->
            
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
                <el-button slot="append" @click="uploadLink">提交</el-button>
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
  props: ['initLink'],
  data() {
    return {
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
    dialogDelete() {
      this.visible = false
      this.dialogVisible = false
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
    },
    dialogUpdate() {
      this.dialogVisible = false
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
        url: 'http://localhost:3000/api/updateLink',
        method: 'post',
        data: {
          id: this.initLink2._id,
          data: this.initLink2.children,
        },
      }).then(
        (response) => {
          console.log(response.data)
        },
        (error) => {
          console.log(error)
        }
      )
    },
    uploadLink() {
      //  console.log(this.initLink2.children[4].web)
      if (this.newLink.title == '') {
        alert('请输入标题')
        return
      }
      /* 当前page的ID */
      // console.log(this.initLink2._id)
      /* 当前page的第几项 */
      // console.log(this.initLink2.children[this.selectIndex])
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
  background-color: rgba(144, 147, 153, 0.5);
  background-clip: padding-box;
  min-height: 28px;
  -webkit-border-radius: 2em;
  -moz-border-radius: 2em;
  border-radius: 2em;
  transition: background-color 0.3s;
  cursor: pointer;
}

::-webkit-scrollbar-thumb:hover {
  background-color: rgba(144, 147, 153, 0.3);
}

.wrapper {
  width: 960px;
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
// .edit button {
//   padding: 2px 8px;
// }
.second-title {
  text-align: left;
  border-bottom: 2px rgb(231, 237, 232) solid;
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
  font-size: 18px;
  text-decoration: none;
  color: black;
  margin-right: 20px;
  padding: 15px;
  max-width: 160px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.second-box a:hover {
  color: rgb(73, 11, 106);
  text-decoration: underline;
}
.link-change {
  width: 100%;
}
.link-change .el-input {
  width: 80%;
}
</style>
>
