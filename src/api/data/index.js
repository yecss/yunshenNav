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