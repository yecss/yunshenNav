// 解析 token 载荷，校验是否过期
const parseToken = (token) => {
  try {
    const body = token.split('.')[0]
    const padded = body.replace(/-/g, '+').replace(/_/g, '/')
    const pad = '='.repeat((4 - (padded.length % 4)) % 4)
    const json = decodeURIComponent(
      escape(atob(padded + pad))
    )
    return JSON.parse(json)
  } catch {
    return null
  }
}

export default {
  namespaced: true,//设置命名空间
  state:{
    token:''
  },
  getters:{
    isLogin(state){//派生变量
      const token = state.token || localStorage.getItem('pm_token')
      if (!token) return false
      // 校验过期时间，过期的 token 视为未登录
      const payload = parseToken(token)
      if (payload && payload.exp && payload.exp < Date.now()) {
        return false
      }
      return true
    }
  },
  mutations:{
    setToken(state,token){
      localStorage.setItem('pm_token',token)
      state.token = token
    },
    clearToken(state){
      state.token = ''
      localStorage.removeItem('pm_token')
    }
  }
}