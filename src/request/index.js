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
    router.push('/login');
    //return Promise.reject(new Error('未授权的访问'));
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
        case 403:
          errorMessage = '请检查用户名和密码';
          break;
        case 404:
          errorMessage = '请求地址出错';
          break;
      }
    }

    console.error('errorMessage', errorMessage);

    return Promise.reject(error);
  }
);

export default function request(options) {
  return instance(options)
    .then((res) => {
      if (res.status === 200) {
        ElMessage({
          message: res.message,
          type: 'success',
          showClose: true,
        });
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
        ElMessage({
          message: res.msg || '操作失败',
          type: 'error',
          showClose: true,
        });
        return Promise.reject(res);
      }
    })
    .catch((error) => {
      return Promise.reject(error);
    });
}
