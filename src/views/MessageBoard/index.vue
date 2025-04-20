<template>
  <div class="container-scroll max-w-5xl mx-auto p-8 bg-white shadow-lg rounded-lg animate-fadeIn" style="z-index: 99;width: 1200px;">
    <h2 class="text-2xl font-bold mb-6 text-center">留言板</h2>
    <p>有什么需要加的网址，或者有好的功能建议都可以在此处留言哦。内容不限</p>
    <div class="mb-6 input-box">
      <input
        v-model="username"
        class="w-full p-3 border rounded-lg shadow-sm focus:ring focus:ring-blue-300 mb-3"
        placeholder="输入你的昵称..."
      />
      <input
        v-model="qqNumber"
        class="w-full p-3 border rounded-lg shadow-sm focus:ring focus:ring-blue-300 mb-3"
        placeholder="输入你的QQ（不填则默认为：10000）"
      />
      <textarea
        v-model="newMessage"
        class="w-full p-3 border rounded-lg shadow-sm focus:ring focus:ring-blue-300"
        rows="4"
        placeholder="输入你的留言..."
      ></textarea>
      
      <div class="flex justify-between mt-4">
        <button
          @click="backHome"
          class="px-5 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
        >返回主页</button>
        <button
          @click="addMessage"
          class="px-5 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        >提交留言</button>
      </div>
    </div>
    <ul class="space-y-6 max-h-96 overflow-y-auto">
  <li
    v-for="(message, index) in paginatedMessages"
    :key="index"
    class="group p-5 bg-gray-100 rounded-lg flex items-center animate-slideIn text-left message-card"
  >
    <img :src="getQQAvatar(message.qqNumber)" class="w-14 h-14 rounded-full mr-5" alt="QQ头像" />
    <div class="flex-1 text-left">
      <p class="font-bold text-lg">{{ message.username }}</p>
      <p class="text-gray-700">{{ message.text }}</p>
      <p class="text-gray-500 text-sm">{{ formatTime(message.timestamp) }}</p>
    </div>
    <button
      @click="deleteMessage(message)"
      class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-500 hover:text-red-700 text-sm"
    >
      删除
    </button>
  </li>
</ul>

    
    <!-- 分页 -->
    <div class="flex justify-center mt-4">
      <button
        @click="prevPage"
        class="px-2 py-1 bg-gray-300 text-black rounded-lg hover:bg-gray-400 transition disabled:opacity-50"
        :disabled="currentPage === 1"
      >
        上一页
      </button>
      <span class="px-2 py-1 text-lg text-gray-700">{{ currentPage }} / {{ totalPages }}</span>
      <button
        @click="nextPage"
        class="px-2 py-1 bg-gray-300 text-black rounded-lg hover:bg-gray-400 transition disabled:opacity-50"
        :disabled="currentPage === totalPages"
      >
        下一页
      </button>
    </div>
  </div>
</template>

<script>
import { fetchMessages, addMessage, deleteMessage } from '@/api/data'; // 导入封装好的请求函数
import { ElMessage, ElMessageBox } from 'element-plus';

export default {
  data() {
    return {
      username: "",
      qqNumber: "",
      newMessage: "",
      messages: [],
      currentPage: 1,
      messagesPerPage: 4,
    };
  },
  computed: {
    totalPages() {
      return Math.ceil(this.messages.length / this.messagesPerPage);
    },
    paginatedMessages() {
      const start = (this.currentPage - 1) * this.messagesPerPage;
      const end = start + this.messagesPerPage;
      return this.sortedMessages.slice(start, end);
    },
    sortedMessages() {
      return this.messages
        .slice()
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
  },
  mounted() {
    this.fetchMessages();
  },
  methods: {
    fetchMessages() {
      fetchMessages()
        .then((response) => {
          this.messages = response.data;
        })
        .catch((error) => {
          ElMessage({ type: 'error', message: '获取留言失败，请稍后再试！' });
          console.error(error);
        });
    },

    addMessage() {
      if (!this.username.trim() || !this.newMessage.trim()) {
        ElMessage.error('用户名和留言不能为空！');
        return;
      }
      if (!this.qqNumber.trim()) {
        this.qqNumber = "10000";
      }

      const newMessage = { username: this.username.trim(), qqNumber: this.qqNumber.trim(), text: this.newMessage.trim() };

      addMessage(newMessage).then(response => {
        this.messages.push({ ...newMessage, id: response.data.id, timestamp: new Date().toISOString() });
        this.newMessage = "";
        this.qqNumber = "";
      }).catch(error => {
        ElMessage.error('留言失败，请稍后再试！');
        console.error(error);
      });
    },

    deleteMessage(message) {
      const messageId = message.id;
      const token = localStorage.getItem('pm_token');

      ElMessageBox.confirm('确定删除这条留言吗？', '删除确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        let qqNumber = null;

        if (!token) {
          try {
            const { value } = await ElMessageBox.prompt('请输入您的QQ号以确认删除：', '删除确认', {
              confirmButtonText: '确认',
              cancelButtonText: '取消',
              inputPattern: /^[0-9]+$/,
              inputErrorMessage: 'QQ号格式不正确'
            });
            qqNumber = value;
          } catch {
            ElMessage({ type: 'info', message: '取消删除' });
            return;
          }
        }

        deleteMessage({ messageId, qqNumber, token })
          .then((response) => {
            if (response.status === 200) {
              const index = this.messages.findIndex(msg => msg.id === messageId);
              if (index !== -1) {
                this.messages.splice(index, 1);
              }
              ElMessage({ type: 'success', message: '留言已删除' });
            } else {
              ElMessage({ type: 'error', message: response.error || '删除留言失败' });
            }
          })
          .catch((error) => {
            ElMessage({ type: 'error', message: '删除留言失败，请稍后再试！' });
            console.error(error);
          });

      }).catch(() => {
        ElMessage({ type: 'info', message: '取消删除' });
      });
    },

    backHome() {
      this.$router.push({ name: 'App' });
    },

    getQQAvatar(qq) {
      return qq ? `https://q1.qlogo.cn/g?b=qq&nk=${qq}&s=100` : "https://via.placeholder.com/100";
    },

    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
      }
    },

    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
      }
    },

    formatTime(timestamp) {
      return new Date(timestamp).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(/\//g, '-');
    }
  }
};
</script>
<style scoped>
/* 大于1400px小于2000px */
@media (min-width: 1400px) and (max-width: 2000px) {
  .container-scroll{
    max-height: 1000px;
    overflow-y: auto;
  }
}
.message-card{
  word-break: break-all;
}
.input-box{
  padding: 10px;
}
ul{
  padding: 10px;
}
ul::-webkit-scrollbar {
  width: 6px; /* 设置滚动条宽度 */
}

ul::-webkit-scrollbar-thumb {
  background-color: rgba(100, 100, 100, 0.4); /* 滚动条的颜色 */
  border-radius: 3px; /* 圆角 */
}

ul::-webkit-scrollbar-track {
  background-color: transparent; /* 滚动条轨道背景 */
}

</style>