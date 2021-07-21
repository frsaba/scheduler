import { Module } from "vuex";

class StaffState {
    employees: Array<string> = new Array()
}

const staff: Module<StaffState, {}> = {
    namespaced: true,
    state: new StaffState,
    mutations: {
        add_employee(state, payload) {
            state.employees.push(payload)
        }
    },
    actions: {
        add({ commit, dispatch }, payload): void {
            commit('add_employee', payload)
            dispatch('add', payload, { root: true })

        }
    },
    getters: {
        count: state => {
            return state.employees.length
        },
        name: (context) => (id: number): string | undefined => {
            try {
                return context.employees[id]
            } catch {
                return undefined
            }
        },
        id: (context) => (name: string): number | undefined => {
            try {
                return context.employees.findIndex(e => e == name)
            } catch {
                return undefined
            }
        }
    }
}
export default staff