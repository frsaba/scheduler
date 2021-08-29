import Vue from "vue";
import Vuex from "vuex";

import staff from "./staff"
import sheets, { SheetState } from "./sheets"
import { Staff } from "@/model/staff";

Vue.use(Vuex);

export interface RootState {
	sheets: SheetState,
	staff: Staff
}

export default new Vuex.Store({
	state: {} as RootState,
	mutations: {},
	actions: {
		load({ dispatch, state }) {
			console.log(state)
			dispatch("staff/load")
			const recents = JSON.parse(window.localStorage.getItem("recentSheets") ?? "[]") 
            Vue.set(state.sheets, "recentSheets", recents)
		}
	},
	getters: {},
	modules: {
		staff,
		sheets
	},
});
