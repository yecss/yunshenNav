<template>
  <aside
    class="flex flex-col w-56 h-auto px-5 py-8 overflow-y-auto bg-white border-r rtl:border-r-0 rtl:border-l dark:bg-gray-900 dark:border-gray-700"
  >
    <a href="#">
      <img
        class="w-auto h-7"
        src="https://merakiui.com/images/logo.svg"
        alt=""
      />
    </a>

    <div class="flex flex-col justify-between flex-1 mt-6">
      <nav class="-mx-3 space-y-6">
        <div class="space-y-3">
          <label
            class="px-3 text-sm text-gray-500 uppercase dark:text-gray-400"
          >
            分类
          </label>
          <a
            v-for="(i, index) in firstCategroy"
            :key="index"
            @click="changeDataIndex(index)"
            :class="{ 'bg-gray-100': activeIndex == index }"
            class="flex items-center px-3 py-2 text-gray-600 transition-colors duration-300 transform rounded-lg dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-200 hover:text-gray-700"
            href="#"
          >
            <Icon
              :icon="'heroicons:' + iconlist[index]"
              style="font-size: 22px"
            />
            <span class="mx-2 text-base font-medium">{{ i }}</span>
          </a>
        </div>

        <div class="space-y-3">
          <label
            class="px-3 text-sm text-gray-500 uppercase dark:text-gray-400"
          >
            配置
          </label>

          <a
            @click="authAlert"
            class="flex items-center px-3 py-2 text-gray-600 transition-colors duration-300 transform rounded-lg dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-200 hover:text-gray-700"
            href="#"
          >
            <Icon
              v-if="!isAuth"
              :icon="'heroicons:' + iconlist[iconlist.length - 3]"
              style="color: #dd6f6f; font-size: 22px"
            />
            <Icon
              v-else
              :icon="'heroicons:' + iconlist[iconlist.length - 2]"
              style="color: #009688; font-size: 22px"
            />

            <span class="mx-2 text-base font-medium">Auth</span>
          </a>

          <a
            class="flex items-center px-3 py-2 text-gray-600 transition-colors duration-300 transform rounded-lg dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-200 hover:text-gray-700"
            href="#"
          >
            <Icon
              :icon="'heroicons:' + iconlist[iconlist.length - 1]"
              style="font-size: 22px"
            />

            <span class="mx-2 text-base font-medium">Setting</span>
          </a>
        </div>
      </nav>
    </div>
  </aside>
</template>

<script>
import { Icon } from '@iconify/vue2'
export default {
  name: 'TheAside',
  components: {
    Icon,
  },
  data() {
    return {
      activeIndex: 0,
      iconlist: [
        'home',
        'presentation-chart-line',
        'users',
        'code-bracket-square',
        'beaker',
        'document-text',
        'wrench',
        'pencil',
        'heart',
        'no-symbol',
        'check-circle',
        'cog-8-tooth',
      ],
    }
  },
  methods: {
    changeDataIndex(index) {
      this.activeIndex = index
      // 快速修改
      this.$emit('update:dataIndex', index)
    },
    authAlert() {
      if (!this.isAuth) {
        this.$prompt('请输入秘钥(秘钥将存储在本地)', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputType: 'password',
        })
          .then(({ value }) => {
            if (value === 'yssq') {
              this.$message({
                type: 'success',
                message: '秘钥正确',
              })

              this.$emit('update:isAuth', true)
              localStorage.setItem('bookmarks-key', value)
            } else {
              this.$message({
                type: 'error',
                message: '秘钥错误',
              })
            }
          })
          .catch(() => {
            this.$message({
              type: 'info',
              message: '取消输入',
            })
          })
      } else {
        this.$message({
          type: 'info',
          message: '秘钥已成功验证',
        })
      }
    },
  },
  props: {
    firstCategroy: {
      type: Array,
      default: '---',
    },
    isAuth: {
      type: Boolean,
      default: false,
    },
  },
}
</script>

<style lang="scss" scoped>
/* 隐藏默认滚动条 */
::-webkit-scrollbar {
  width: 3px;
  background-color: #f5f5f5;
}

/* 滚动条轨道 */
::-webkit-scrollbar-track {
  background-color: #f5f5f5;
}

/* 滚动条滑块 */
::-webkit-scrollbar-thumb {
  background-color: #dadada;
  border-radius: 4px;
}

/* 鼠标悬停时滚动条滑块 */
::-webkit-scrollbar-thumb:hover {
  background-color: #555;
}
</style>
