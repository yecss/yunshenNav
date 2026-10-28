import request from "@/request/index"

export const getGuestData = ()=>{
  return request({
    url:'/data/getGuestData',
    method:'get'
  })
}

export const getData = ()=>{
  return request({
    url:'/data/getData',
    method:'post'
  })
}

export const updateLink = (data)=>{
  return request({
    url:'/data/updateLink',
    method:'post',
    data
  })
}
export const addLink = (data)=>{
  return request({
    url:'/data/addLink',
    method:'post',
    data
  })
}

export const deleteLink = (data)=>{
  return request({
    url:'/data/deleteLink',
    method:'post',
    data
  })
}
export const addCategory = (data)=>{
  return request({
    url:'/data/addCategory',
    method:'post',
    data
  })
}

export const deleteCategroy = (data)=>{
  return request({
    url:'/data/deleteCategroy',
    method:'post',
    data
  })
}

export const updateCategroy = (data)=>{
  return request({
    url:'/data/updateCategroy',
    method:'post',
    data
  })
}

export const updateLinkOrder = (data)=>{
  return request({
    url:'/data/updateLinkOrder',
    method:'post',
    data
  })
}

export const updateCategoryOrder = (data)=>{
  return request({
    url:'/data/updateCategoryOrder',
    method:'post',
    data
  })
}

/* ===== 分类加密 ===== */

// 设置 / 修改 / 取消分类访问密码
export const setCategoryPassword = (data)=>{
  return request({
    url:'/data/setCategoryPassword',
    method:'post',
    data
  })
}

// 校验分类密码，返回解锁令牌 + 已解密内容
export const verifyCategoryPassword = (data)=>{
  return request({
    url:'/data/verifyCategoryPassword',
    method:'post',
    data,
    silent: true
  })
}

// 凭解锁令牌获取已解密内容（刷新页面后恢复用）
export const getCategoryContent = (data)=>{
  return request({
    url:'/data/getCategoryContent',
    method:'post',
    data,
    silent: true
  })
}

// 获取服务端数据版本号（用于校验本地缓存是否过期）
export const getDataVersion = ()=>{
  return request({
    url:'/data/version',
    method:'get',
    silent: true
  })
}

// 获取留言
export const fetchMessages = () => {
  return request({
    url: '/data/getMessages',
    method: 'get',
  });
};

// 添加留言
export const addMessage = (data) => {
  return request({
    url: '/data/createMessage',
    method: 'post',
    data
  });
};

// 删除留言
export const deleteMessage = (data) => {
  return request({
    url: '/data/deleteMessage',
    method: 'post',
    data
  });
};

//日志记录
export function logClick(data) {
  return request({
    url: '/data/logClick', // 对应后端接口路径
    method: 'post',
    data
  })
}