import { createStore } from "vuex";

// 引入子模块
import user from "./modules/user"
export default createStore({
  state: {},
  getters: {},
  mutations: {},
  actions: {},
  modules: {
    user
  },
});
