<template>
  <aside
    class="flex flex-col w-56 h-auto px-5 py-8 overflow-y-auto bg-white border-r rtl:border-r-0 rtl:border-l dark:bg-gray-900 dark:border-gray-700 aside"
  >
    <div class="flex center">
      <a href="#">
        <img
          class="w-auto h-8"
          src="../../assets/ttlogo.png"
          alt=""
        />
      </a>
      <span class="text-gray-500 text-2xl font-bold">云深书签</span>
    </div>

    <div class="flex flex-col justify-between flex-1 mt-6 md:mt-0">
      <nav class="-mx-3 space-y-6">
        <div class="space-y-3">
          <label
            class="px-3 text-sm text-gray-500 uppercase"
          >
            分类
          </label>
          <a
            v-for="(i, index) in firstCategroy"
            :key="index"
            @click="changeDataIndex(index)"
            :class="{ 'bg-gray-100': activeIndex == index }"
            class="flex items-center px-3 py-2 text-gray-600 transition-colors duration-300 transform rounded-lg hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
          >
            <Icon
              :icon="'heroicons:' + normalIcon[index]"
              style="font-size: 22px"
            />
            <span class="mx-2 text-base md:text-sm font-medium">{{ i }}</span>
          </a>
        </div>

        <div class="space-y-3">
          <label
            class="px-3 text-sm text-gray-500 uppercase"
          >
            其他
          </label>

          <a
            @click="handleManage"
            class="flex items-center px-3 py-2 text-gray-600 transition-colors duration-300 transform rounded-lg hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
            
          >
            <Icon
              :icon="'heroicons:' + configIcon[2]"
              style="font-size: 22px"
            />

            <span  class="mx-2 text-base font-medium md:text-sm">数据管理</span>
          </a>
          
          <a
            @click="openInfo"
            class="flex items-center px-3 py-2 text-gray-600 transition-colors duration-300 transform rounded-lg hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
            
          >
            <Icon
              :icon="'heroicons:' + configIcon[4]"
              style="font-size: 22px"
            />

            <span  class="mx-2 text-base font-medium md:text-sm">项目介绍</span>
          </a>
          
          <a
            @click="isLogin ? handleLogout() : handleLogin()"
            class="flex items-center px-3 py-2 text-gray-600 transition-colors duration-300 transform rounded-lg hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
          >
            <Icon
              :icon="'heroicons:' + 'heart'"
              style="font-size: 22px"
            />

            <span v-if="isLogin" class="mx-2 text-base font-medium md:text-sm">退出登录</span>
            <span v-else class="mx-2 text-base font-medium md:text-sm">登录账号</span>
          </a>
          

          <!-- <a
            @click="handleLogout"
            class="flex items-center px-3 py-2 text-gray-600 transition-colors duration-300 transform rounded-lg hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
            
          >
            <Icon
              :icon="'heroicons:' + configIcon[3]"
              style="font-size: 22px"
            />

            <span  class="mx-2 text-base font-medium md:text-sm">退出登录</span>
          </a> -->
        </div>
      </nav>
    </div>
  </aside>
</template>

<script setup>
import { ref,computed } from 'vue';
import { ElMessage, ElAlert } from 'element-plus';
import { Icon } from '@iconify/vue';
import DialogHandle from "@/components/dialog.js";
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';

const router = useRouter();
const store = useStore();

const activeIndex = ref(0);
const isLogin = computed(()=>store.getters['user/isLogin'])

const normalIcon = [
  'home',
  'academic-cap',
  'users',
  'code-bracket-square',
  'beaker',
  'document-text',
  'wrench',
  'sparkles',
  'heart',
  'rocket-launch',
  'gift',
];

const configIcon = [
  'no-symbol',
  'check-circle',
  'bookmark',
  'arrow-left-on-rectangle',
  'information-circle'
];

// Props
const props = defineProps({
  firstCategroy: {
    type: Array,
    default: '---',
  },
  dataIndex: {
    type: Number,
    required: true,
  },
});

// Emits
const emit = defineEmits(['update:dataIndex', 'manageLinks']);
const handleLogin = () => {
   DialogHandle({
    title: "操作确认",
    content: "<div>是否去登录？</div>",
    onConfirm: () => {
      return new Promise(async (resolve) => {
        router.push('/login');
        store.commit('user/clearToken');
        resolve();
      });
    },
  });
};
const handleLogout = () => {
  const dialog = DialogHandle({
    title: "操作确认",
    content: "<div>是否确定退出登录？</div>",
    onConfirm: () => {
      return new Promise(async (resolve) => {
        router.push('/login');
        store.commit('user/clearToken');
        ElMessage({
          message: "退出成功",
          type: 'success',
          showClose: false,
        });
        resolve();
      });
    },
  });
};

const openInfo = () => {
  ElAlert('Github地址：https://github.com/yecss/yunshenNav', '关于', {
    confirmButtonText: '确定',
    lockScroll: false, // 防止抖动
  });
};

const changeDataIndex = (index) => {
  activeIndex.value = index;
  emit('update:dataIndex', index);
};

const handleManage = () => {
  emit('manageLinks');
};

const handleToJson = () => {
  router.push('/tojson');
};
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
/* .aside{
   border-radius: 6px 0 0 6px;
   background-color: rgba(255,255,255,.9);
} */
</style>
