import axios from 'axios';
import router from '../router/index';
import { ElMessage } from 'element-plus';
import config from './config';

const instance = axios.create(config);

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('pm_token');

  if (token) {
    config.headers.Authorization = token;
  } else {
    // 跳转到登录界面
    // 取消访问必须登录 - 2024年8月7日22:23:00
    // router.push('/login');
    // return Promise.reject(new Error('未授权的访问'));
  }

  return config;
});

instance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let errorMessage = '发生了未知错误';

    if (error.response) {
      switch (error.response.status) {
        case 400:
          errorMessage = '请求错误';
          break;
        case 401:
          errorMessage = '登录已过期或未登录，请重新登录';
          break;
        case 403:
          errorMessage = '请检查用户名和密码';
          break;
        case 404:
          errorMessage = '请求地址出错';
          break;
        case 500:
          errorMessage = '服务器错误，请稍后再试';
          break;
      }
      // 优先使用后端返回的具体信息
      const serverMessage = error.response.data && error.response.data.message;
      if (serverMessage && error.response.status !== 401) {
        errorMessage = serverMessage;
      }
    } else if (error.code === 'ERR_NETWORK') {
      errorMessage = '网络连接失败，请检查网络';
    }

    console.error('errorMessage', errorMessage);

    // 静默模式：请求方自行处理错误提示（如解锁密码错误）
    const silent = !!(error.config && error.config.silent);

    // 401 未授权：清除失效的 token 并跳转登录页
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('pm_token');
      if (!silent) {
        ElMessage({
          message: errorMessage,
          type: 'error',
          showClose: true,
          duration: 3000,
        });
      }
      if (router.currentRoute.value.path !== '/login') {
        router.push('/login');
      }
      return Promise.reject(error);
    }

    if (silent) {
      return Promise.reject(error);
    }

    ElMessage({
      message: errorMessage,
      type: 'error',
      showClose: true,
      duration: 3000,
    });

    return Promise.reject(error);
  }
);

export default function request(options) {
  const silent = !!(options && options.silent);
  return instance(options)
    .then((res) => {
      if (res.status === 200) {
        if (!silent) {
          ElMessage({
            message: res.message,
            type: 'success',
            showClose: true,
          });
        }
        return res;
      } else if (res.status === 401) {
        ElMessage({
          message: 'Token过期或者无效，请重新登录！',
          type: 'error',
          showClose: false,
        });
        router.push('/login');
        localStorage.removeItem('pm_token');
        return Promise.reject(res);
      } else {
        if (!silent) {
          ElMessage({
            message: res.message || '操作失败',
            type: 'error',
            showClose: true,
          });
        }
        return Promise.reject(res);
      }
    })
    .catch((error) => {
      return Promise.reject(error);
    });
}
