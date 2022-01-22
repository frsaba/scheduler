import { Module } from "vuex";
import staff, { Staff, Employee } from "@/model/staff"
import Vue from "vue";
import { RootState } from "./store";

const module: Module<Staff, RootState> = {
    namespaced: true,
    state: staff,
    mutations: {
        add_employee(state, payload) {
            state.Add(payload)
        },
		add_tag(state, {name, tag}: {name: string, tag: string}) {
			state.AddTag(name, tag)
		},
		remove_tag(state, {name, tag}: {name: string, tag: string}) {
			state.RemoveTag(name, tag)
		},
        remove_employee(state, payload) {
            state.Remove(payload)
        },
        rename(state, { oldName, newName }: { oldName: string, newName: string }): void {
            state.Rename(newName, oldName)
        },
    },
    actions: {
        add({ commit, dispatch }, payload): void {
            commit('add_employee', payload);
            dispatch('add', payload, { root: true });
            dispatch('save');
        },
        remove({ commit, dispatch }, payload): void {
            commit('remove_employee', payload);
            //Remove from sheet, remove all relevant operations from undo/redostack
            dispatch('remove_employee', payload, { root: true });
            dispatch('save');
        },
		add_tag({commit, dispatch}, payload) {
			commit('add_tag', payload);
			dispatch('save');
		},
		remove_tag({commit, dispatch}, payload) {
			commit('remove_tag', payload);
			dispatch('save');
		},
        save({ state }): void {
            window.localStorage.setItem("employees", JSON.stringify(state.employees))
        },
        load({ state, dispatch }): void {
            const loaded = JSON.parse(window.localStorage.getItem("employees") ?? "[]") as Employee[]
            Vue.set(state, "employees", loaded)
			
            for (let e of state.employees) {
                dispatch('add', e, { root: true });
				for (let tag of e.tags)
					if (!state.tags.includes(tag)) state.tags.push(tag)
            }
        }

    },
    getters: {
        count: state => {
            return state.employees.length
        },
        name: (context) => (id: number): string | undefined => {
            try {
                return context.employees[id].name
            } catch {
                return undefined
            }
        },
        id: (context) => (name: string): number | undefined => {
            return context.GetEmployee(name).id
        }
    }
}
export default module