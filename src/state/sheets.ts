import { Module } from "vuex";
import { Sheet, ScheduleDay } from "@/model/schedule-sheet"
import { DayType } from "@/model/day-types"
import { isNight } from "@/utils/date-helpers"
import _ from "lodash";

class State {
    sheet: Sheet = new Sheet(2021, 2);
    undoStack = new Array<Operation>();
    redoStack = new Array<Operation>();
}

interface Operation {
    action: string,
    payload: { index: number, day: number, [x: string]: any }
}

const staff: Module<State, {}> = {
    state: new State,
    mutations: {
        add_row(state, payload) {
            state.sheet.AddRow(payload)
        },
        set_shift(context, { index, day, start, duration }) {
            context.sheet.GetRow(index).SetShift(day, start, duration);
        },
        delete_shift(context, { index, day }) {
            context.sheet.GetRow(index).DeleteShift(day);
        },
        set_type(context, { index, day, type }) {
            context.sheet.GetRow(index).GetDay(day).SetType(type);
        },
    },
    actions: {
        add(context, payload): void {
            context.commit('add_row', payload)
        },

        set_shift(context, { index, day, start, duration, undo = false, redo = false }) {
            //Check if we're actually about to make a change
            let old: ScheduleDay = context.getters.day(index, day);
            if (old.type == DayType.shift && old.start == start && old.duration == duration) return;

            context.dispatch('register_undo', { action: "set_shift", payload: { index, day, start, duration, undo, redo } })

            context.commit('set_shift', { index, day, start, duration })

            let currentShift: ScheduleDay = context.getters.day(index, day);
            let nextShift: ScheduleDay = context.getters.day(index, day + 1);

            if (nextShift) {
                //Add rest day after night shift
                if (isNight(currentShift) && !isNight(nextShift))
                    context.commit('set_type', { index: index, day: day + 1, type: DayType.rest })
                //Remove rest day if we're removing a night shift
                else if (!isNight(currentShift) && nextShift.type == DayType.rest)
                    context.commit('set_type', { index: index, day: day + 1, type: DayType.empty })
            }
        },
        set_type(context, { index, day, type, undo = false, redo = false }) {
            let currentShift: ScheduleDay = context.getters.day(index, day);
            if (currentShift.type == type) return; //This is a duplicate call, we don't have to do anything

            context.dispatch('register_undo', { action: "set_type", payload: { index, day, type, undo, redo } })
            
            let previousShift: ScheduleDay = context.getters.day(index, day - 1);
            let nextShift: ScheduleDay = context.getters.day(index, day + 1);

            if (nextShift && isNight(currentShift) && nextShift.type === DayType.rest)
                context.commit('set_type', { index, day: day + 1, type: DayType.empty })

            if (previousShift && type === DayType.empty && isNight(previousShift))
                context.commit('set_type', { index, day, type: DayType.rest })
            else
                context.commit('set_type', { index, day, type });
        },
        undo({ state, dispatch, getters }) {
            let last = state.undoStack.pop()
            if (!last) return; //Empty history => No actions to revert
            state.redoStack.push(last)

            //Look for the last action in history that mutated the same day
            let revertTo = state.undoStack.filter(({ payload: { index, day } }) => (index == last?.payload.index && day == last?.payload.day)).pop()

            if (revertTo) {
                dispatch(revertTo.action, { ...revertTo.payload, undo: true }) //Do that action again
            } else {
                //If no such action is found, clear the cell (TODO: In case of imported sheet, revert to initial)
                dispatch('set_type', { index: last.payload.index, day: last.payload.day, type: DayType.empty, undo: true })
            }
        },
        redo({ state, dispatch }) {
            let op = state.redoStack.pop()
            if (op) {
                dispatch(op.action, { ...op.payload, redo: true })
            }
        },
        register_undo({ state }, op: Operation) {
            if (!op.payload.undo) { // If this action was a result of an undo, don't register it since it would lead to looping undos
                if (op.payload.redo == false)
                    state.redoStack = []
                if (_.isEqual([...state.undoStack].pop(), op) == false) //Don't register the same action 
                    state.undoStack.push(op)
            }
        },
    },
    getters: {
        day: (context: State) => (index: number, day: number): ScheduleDay | undefined => {
            try {
                return context.sheet.GetRow(index).GetDay(day)
            } catch {
                return undefined
            }
        },
        // revert_action: (context: State) => (index: number, day: number): Operation => {
        //     let old = context.sheet.GetRow(index).GetDay(day)
        //     if (old.type == DayType.shift) {
        //         return { action: "set_shift", payload: { index, day, start: old.start, duration: old.duration } }
        //     } else {
        //         return { action: "set_type", payload: { index, day, type: old.type } }
        //     }
        // }
    }
}
export default staff