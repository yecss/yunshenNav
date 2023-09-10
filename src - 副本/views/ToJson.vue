<template>
  <div>
    <div class="container">
      <div v-if="!isSubmited" class="app">
        <h1 class="text-2xl text-purple-500">浏览器书签转JSON</h1>

        <input type="file" id="file" />
        <button
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          @click="goBack"
          style="align-self: flex-start"
        >
          返回
        </button>

        <button class="btn" id="btn" @click="submit()">确定</button>
        <p class="intro">
          自动将导出的浏览器书签文件转换成JSON格式的代码，支持Chrome或者Edge等主流浏览器。有了JSON代码就可以将我们自己的数据快速迁移到其他的平台，例如(云深书签，闪击工作台)
        </p>
      </div>

      <div v-else class="code-wrapper">
        <JsonViewer
          :value="jsonString"
          :expand-depth="2"
          theme="my-awesome-json-theme"
          copyable
        />
      </div>
      

      <button
        v-if="isSubmited"
        class="bg-purple-300 w-20 h-10 mt-6 rounded-md"
        @click="isSubmited = false"
      >
        返回
      </button>
      
    </div>
  </div>
</template>

<script>
import JsonViewer from 'vue-json-viewer'

export default {
  name: 'ToJson',
  components: {
    JsonViewer,
  },
  data() {
    return {
      jsonString: '',
      isSubmited: false,
    
    }
  },
  methods: {
    goBack() {
      this.$router.back()
    },
    //点击确认按钮
    submit() {
      // 获取文件对象
      var file = document.getElementById('file').files[0]

      if (file === undefined) {
        alert('请选择文件')
        return
      }
      if (file.name.indexOf('.html') < 0) {
        // 不处理非html的文件类型
        alertErr()
        return
      }
      // 获取文件里面的文本信息
      file.text().then((res) => {
        // 内容转成dom对象
        let doms = this.parseToDOM(res)
        for (const dom of doms) {
          // 从dom对象中获取DL标签
          if (dom.tagName == 'DL') {
            // 修改前
            /* let result = textHandle(dom, null); */
            // 修改后
            let result = this.textHandle(dom, {
              name: 'data',
              children: [],
              web: [],
            })
            /* 导出数据 */
            this.jsonString = result.children
            // console.log(result.children)
          }
        }
      })

      this.isSubmited = true
    },
    //错误信息弹窗
    alertErr() {
      alert('请不要上传非谷歌浏览器书签文件')
    },
    textHandle(dl, temp) {
      // 先获取DL 下面的DT
      let dts = this.getDts(dl)
      if (dts.length > 0) {
        // 判断DT下面是否有DL标签
        for (var i in dts) {
          let dt = dts[i],
            hdl = this.getTag(dt, 'DL')

          if (hdl != null) {
            let h = this.getTag(dt, 'H3')
            let returns = this.textHandle(hdl, {
              name: h.textContent,
              children: [],
              web: [],
            })

            temp.children.push(returns)
          } else {
            var a = this.getTag(dt, 'A')
            temp.web.push({
              url: a.href,
              title: a.textContent,
            })
          }
        }
      }
      return temp
    },
    //获取dt下面的标签
    getTag(dt, tagname) {
      let dtcs = dt.children,
        obj = null
      if (dtcs.length < 1) {
        return obj
      }
      for (let dtc of dtcs) {
        if (dtc.tagName.toUpperCase() == tagname) {
          obj = dtc
          break
        }
      }
      return obj
    },
    //获取DL下面的DT标签
    getDts(dl) {
      let dlcs = dl.children,
        arr = []
      if (dlcs.length < 1) {
        return arr
      }
      for (let dlc of dlcs) {
        if (dlc.tagName.toUpperCase() == 'DT') {
          arr.push(dlc)
        }
      }
      return arr
    },
    // 把String转为DOM对象
    parseToDOM(str) {
      let div = document.createElement('div')
      if (typeof str == 'string') {
        div.innerHTML = str
      }
      return div.childNodes
    },
  },
  
}
</script>

<style scoped lang="scss">
.code-wrapper {
  max-height: 800px;
  width: 100%;
  overflow: auto;
  text-align: left;
}
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
.container {
  height: auto;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  justify-content: flex-start;
  align-items: center;
  margin: 0 auto;
}
.app {
  height: 464px;
  width: 600px;
  background-color: rgb(255 255 255 / 50%);
  backdrop-filter: blur(4px);
  border-radius: 2px;
  margin: 0 auto;
  display: flex;
  flex-wrap: wrap;
  padding: 30px;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  margin-bottom: 30px;
}
.btn {
  width: 100px;
  height: 60px;
  border-radius: 6px;
  background: #cccfff;
  border: 0px;
}

input {
  width: 100%;
  border: 1px #cccfff solid;
  border-radius: 6px;
  font-size: 29px;
}
.intro {
  color: #2f2c2c;
}
.my-awesome-json-theme {
  overflow-x: hidden;
  background: #282b2e;
  white-space: nowrap;
  color: #01fef4;
  font-size: 14px;
  font-family: Consolas, Menlo, Courier, monospace;

  .jv-ellipsis {
    color: rgb(237, 13, 13);
    background-color: rgb(241, 11, 11);
    display: inline-block;
    line-height: 0.9;
    font-size: 0.9em;
    padding: 0px 4px 2px 4px;
    border-radius: 3px;
    vertical-align: 2px;
    cursor: pointer;
    user-select: none;
  }
  .jv-button {
    color: #49b3ff;
  }
  ::v-deep .jv-key {
    color: #01fef4 !important;
  }
  ::v-deep .jv-push {
    color: #fff;
  }
  .jv-item {
    &.jv-array {
      color: #111111;
    }
    &.jv-boolean {
      color: #fc1e70;
    }
    &.jv-function {
      color: #067bca;
    }
    &.jv-number {
      color: #fc1e70;
    }
    &.jv-number-float {
      color: #fc1e70;
    }
    &.jv-number-integer {
      color: #fc1e70;
    }
    &.jv-object {
      color: #111111;
    }
    &.jv-undefined {
      color: #e08331;
    }
    &.jv-string {
      color: #42b983;
      word-break: break-word;
      white-space: normal;
    }
  }
  .jv-code {
    ::v-deep .jv-toggle {
      color: #067bca !important;
      &:before {
        padding: 0px 2px;
        border-radius: 2px;
      }
      &:hover {
        &:before {
          background: rgb(242, 5, 5);
        }
      }
    }
  }
}
</style>
