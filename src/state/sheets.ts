import { Module } from "vuex";
import { Sheet, ScheduleDay } from "@/model/schedule-sheet"
import { DayType } from "@/model/day-types"
import { isNight } from "@/utils/date-helpers"

class State {
    sheet: Sheet = new Sheet(2021, 2);
    undoStack = new Array<Operation>();
    redoStack = new Array<Operation>()
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
            if (!undo) context.dispatch('register_undo', { index: index, day, redo })
            context.commit('set_shift', { index, day, start, duration })
            let currentShift: ScheduleDay = context.getters.get_shift(index, day);
            let nextShift: ScheduleDay = context.getters.get_shift(index, day + 1);

            if (nextShift) {
                if (isNight(currentShift) && !isNight(nextShift))
                    context.commit('set_type', { index: index, day: day + 1, type: DayType.rest })
                else if (!isNight(currentShift) && nextShift.type == DayType.rest)
                    context.commit('set_type', { index: index, day: day + 1, type: DayType.empty })
            }
        },
        set_type(context, { index, day, type, undo = false, redo = false }) {
            if (!undo) context.dispatch('register_undo', { index: index, day, redo })
            let previousShift: ScheduleDay = context.getters.get_shift(index, day - 1);
            let currentShift: ScheduleDay = context.getters.get_shift(index, day);
            let nextShift: ScheduleDay = context.getters.get_shift(index, day + 1);

            if (nextShift && isNight(currentShift) && nextShift.type === DayType.rest)
                context.commit('set_type', { index, day: day + 1, type: DayType.empty })

            if (previousShift && type === DayType.empty && isNight(previousShift))
                context.commit('set_type', { index, day, type: DayType.rest })
            else
                context.commit('set_type', { index, day, type });
        },
        undo({ state, dispatch, getters }) {
            let op = state.undoStack.pop()
            if (op) {
                state.redoStack.push(getters['revert_action'](op.payload.index, op.payload.day))
                dispatch(op.action, { ...op.payload, undo: true })
            }
        },
        redo({ state, dispatch }) {
            let op = state.redoStack.pop()
            if (op) {
                dispatch(op.action, { ...op.payload, redo: true })
            }
        },
        register_undo({ state, getters }, { index, day, redo }) {
            if (!redo) state.redoStack = []
            state.undoStack.push(getters['revert_action'](index, day))
        },
    },
    getters: {
        get_shift: (context: State) => (index: number, day: number): ScheduleDay | undefined => {
            try {
                return context.sheet.GetRow(index).GetDay(day)
            } catch {
                return undefined
            }
        },
        revert_action: (context: State) => (index: number, day: number): Operation => {
            let old = context.sheet.GetRow(index).GetDay(day)
            if (old.type == DayType.shift) {
                return { action: "set_shift", payload: { index, day, start: old.start, duration: old.duration } }
            } else {
                return { action: "set_type", payload: { index, day, type: old.type } }
            }
        }
    }
}
export default staff