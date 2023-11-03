export default {
  namespaced: true,//设置命名空间
  state:{
    token:''
  },
  getters:{
    isLogin(state){//派生变量
      return !!state.token || !!localStorage.getItem("pm_token")
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