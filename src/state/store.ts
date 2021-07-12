import Vue from "vue";
import Vuex from "vuex";

import staff from "./staff"
import sheets from "./sheets"

Vue.use(Vuex);

export default new Vuex.Store({
  state: {},
  mutations: {},
  actions: {},
  getters: {},
  modules: {
    staff,
    sheets
  },
});
