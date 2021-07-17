import { Module } from "vuex";
import { Sheet, ScheduleDay } from "@/model/schedule-sheet"
import { DayType } from "@/model/day-types"
import { isNight } from "@/utils/date-helpers"

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

        set_shift(context, {name, day, start, duration})
        {
            context.commit('set_shift', {name, day, start, duration})
            let currentShift: ScheduleDay = context.getters.get_shift(name, day);
            let nextShift: ScheduleDay = context.getters.get_shift(name, day + 1);

            if (nextShift)
            {
                if ( isNight(currentShift) && !isNight(nextShift) )
                    context.commit('set_type', { name: name, day: day + 1, type: DayType.rest })
                else if ( !isNight(currentShift) && nextShift.type == DayType.rest )
                    context.commit('set_type', { name: name, day: day + 1, type: DayType.empty })
            }
        },
        set_type(context, {name, day, type}){
            let previousShift: ScheduleDay = context.getters.get_shift(name, day - 1);
            let currentShift: ScheduleDay = context.getters.get_shift(name, day);
            let nextShift: ScheduleDay = context.getters.get_shift(name, day + 1);
            
            if ( nextShift && isNight(currentShift) && nextShift.type === DayType.rest)
                context.commit('set_type', {name, day: day + 1, type: DayType.empty})

            if (previousShift && type === DayType.empty && isNight(previousShift))
                context.commit('set_type', {name, day, type: DayType.rest})
            else
                context.commit('set_type', {name, day, type});
        }
    },
    getters: {
        get_shift: (context: State) => (name: string, day: number): ScheduleDay | undefined => {
            try {
                return context.sheet.GetRow(name).GetDay(day)
            } catch {
                return undefined
            }
        }
    }
}
export default staff