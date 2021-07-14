import { Module } from "vuex";
import { Sheet } from "@/model/schedule-sheet"

class State{
    sheet : Sheet = new Sheet(2021, 2);
}

const staff : Module<State, {}> = {
    state: new State,
    mutations: {
        add_row(state, payload){
            state.sheet.AddRow(payload)
        },
        set_shift(context, {name, day, start, duration}){
            context.sheet.GetRow(name).SetShift(day, start, duration);
        },
        delete_shift(context, {name, day}){
            context.sheet.GetRow(name).DeleteShift(day);
        },
        set_type(context, {name, day, type}){
            context.sheet.GetRow(name).GetDay(day).SetType(type);
        },
    },
    actions: {
        add(context, payload) : void{
          context.commit('add_row', payload)
        },

    },
}
export default staff