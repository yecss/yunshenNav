import request from "@/request/index"

export const login = (data)=>{
  return request({
    url:'user/login',
    method:'post',
    data
  })
}

export const register = (data)=>{
  return request({
    url:'user/register',
    method:'post',
    data
  })
}
