import Vue from "vue";
import Vuex from "vuex";

import staff from "./staff"
import sheets, {SheetState} from "./sheets"
import { Staff } from "@/model/staff";

Vue.use(Vuex);

export interface RootState {
	sheets: SheetState,
	staff: Staff
}

export default new Vuex.Store({
  state: {} as RootState,
  mutations: {},
  actions: {},
  getters: {},
  modules: {
    staff,
    sheets
  },
});
