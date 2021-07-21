import { Module } from "vuex";
import m_staff, {Employee} from "@/model/staff"

class StaffState {
    staff = m_staff
}

const staff: Module<StaffState, {}> = {
    namespaced: true,
    state: new StaffState,
    mutations: {
        add_employee(state, payload) {
            state.staff.Add(payload)
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
            return state.staff.employees.length
        },
        name: (context) => (id: number): string | undefined => {
            try {
                return context.staff.employees[id].name
            } catch {
                return undefined
            }
        },
        id: (context) => (name: string): number | undefined => {
            return context.staff.GetEmployee(name).id
        }
    }
}
export default staff