import { Module } from "vuex";

class StaffState{
    employees :  Array<string> = new Array()
}

const staff : Module<StaffState, {}> = {
    namespaced: true,
    state: new StaffState,
    mutations: {
        add_employee(state, payload){
            state.employees.push(payload)
        }
    },
    actions: {
        add({commit,dispatch}, payload) : void{
            commit('add_employee', payload)
            dispatch('add', payload ,{root: true})

        }
    },
}
export default staff