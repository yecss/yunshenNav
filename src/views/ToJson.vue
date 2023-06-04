<template>
  <div>
    <div class="container">
      <div v-if="!isSubmited" class="app">
        <h1 class="text-2xl text-purple-500">浏览器书签转JSON</h1>
        <input type="file" id="file" />
        <button class="btn" id="btn" @click="submit()">确定</button>
      </div>

      <div v-else class="code-wrapper">
        <pre v-highlight><code v-text="jsonString"></code></pre>
      </div>

      <button v-if="isSubmited" class="bg-purple-300 w-20 h-10 mt-6 rounded-md" @click="isSubmited=false">返回</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ToJson',
  data() {
    return {
      jsonString: '',
      isSubmited: false,
    }
  },
  methods: {
    //点击确认按钮
    submit() {
      this.isSubmited = true
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

<style scoped>
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
  height: 100vh;
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-items: center;
}
.app {
  height: 400px;
  width: 600px;
  background-color: rgb(232 232 232 / 58%);
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
</style>
