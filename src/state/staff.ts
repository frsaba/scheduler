import { Module } from "vuex";
import staff, {Staff, Employee} from "@/model/staff"

const module: Module<Staff, {}> = {
    namespaced: true,
    state: staff,
    mutations: {
        add_employee(state, payload) {
            state.Add(payload)
        },
        remove_employee(state, payload) {
            let i = state.employees.findIndex(e => e.name == payload)
            state.employees.splice(i,1)
        },
        rename(state, {oldName, newName} : {oldName : string, newName: string}): void {
            let i = state.employees.findIndex(e => e.name == oldName)
            console.log(oldName)
            state.employees[i].name = newName
        },
    },
    actions: {
        add({ commit, dispatch }, payload): void {
            commit('add_employee', payload)
            dispatch('add', payload, { root: true })
        },
        remove({ commit, dispatch }, payload): void {
            commit('remove_employee', payload)
            dispatch('remove_employee', payload, { root: true })
            //Remove from sheet, remove all relevant operations from undo/redostack
        },
        
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