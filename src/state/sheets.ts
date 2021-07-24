import { Module } from "vuex";
import { Sheet, ScheduleDay } from "@/model/schedule-sheet"
import { DayType } from "@/model/day-types"
import { isNight } from "@/utils/date-helpers"
import _, { last } from "lodash";

class State {
    sheet: Sheet = new Sheet(2021, 2);
    undoStack = new Array<Array<Operation>>();
    redoStack = new Array<Array<Operation>>();
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
            let last_batch = state.undoStack.pop()
            if (!last_batch || !last_batch.length) last_batch = state.undoStack.pop() //new batch has been started => undo the previous one
            if (!last_batch) return; //Empty history => No actions to revert
            state.redoStack.push(last_batch)

            for (let last of last_batch) {
                //Look for the last action in history that mutated the same day
                let revertTo = state.undoStack.flat().filter(({ payload: { index, day } }) => (index == last?.payload.index && day == last?.payload.day)).pop()

                if (revertTo) {
                    dispatch(revertTo.action, { ...revertTo.payload, undo: true }) //Do that action again
                } else {
                    //If no such action is found, clear the cell (TODO: In case of imported sheet, revert to initial)
                    dispatch('set_type', { index: last.payload.index, day: last.payload.day, type: DayType.empty, undo: true })
                }

            }
            dispatch('new_batch') //If a new batch was already started before the undo, we need to restore it

        },
        redo({ state, dispatch }) {
            let batch = state.redoStack.pop()
            if (batch) {
                dispatch('new_batch')
                for (let op of batch) {
                    dispatch(op.action, { ...op.payload, redo: true })
                }
            }


        },
        register_undo({ state, dispatch }, op: Operation) {
            if (!op.payload.undo) { // If this action was a result of an undo, don't register it since it would lead to looping undos
                if (op.payload.redo == false) state.redoStack = []
                let last_batch = _.last(state.undoStack)
                // Start new batch if op action is different or stack is empty
                if (last_batch == undefined || (last_batch[0] && (last_batch[0].payload.type != op.payload.type))) {
                    dispatch('new_batch')
                    last_batch = _.last(state.undoStack)
                }
                if (_.isEqual([...state.undoStack].pop(), op) == false) //Don't register the same action 
                    last_batch!.push(op)
            }

        },
        new_batch({ state }) {
            let last_batch = state.undoStack[state.undoStack.length - 1]
            if (!last_batch || last_batch.length > 0) state.undoStack.push([]);
        }
    },
    getters: {
        day: (context: State) => (index: number, day: number): ScheduleDay | undefined => {
            try {
                return context.sheet.GetRow(index).GetDay(day)
            } catch {
                return undefined
            }
        },
    }
}
export default staff