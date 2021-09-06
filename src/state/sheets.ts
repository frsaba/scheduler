import { Module } from "vuex";
import { Sheet, ScheduleDay } from "@/model/schedule-sheet"
import { DayType } from "@/model/day-types"
import { isNight } from "@/utils/date-helpers"
import _ from "lodash";
import { Employee } from "@/model/staff";
import Vue from "vue";
import { RootState } from "./store";
import moment from "moment";


export interface RecentSheetInfo {
	year: number,
	month: number,
	employeeCount: number,
	modified?: Date,
	opened?: Date,
	path: string,
}

export class SheetState {
	sheet: Sheet = new Sheet(2021, 8);
	undoStack = new Array<Array<Operation>>();
	redoStack = new Array<Array<Operation>>();
	recentSheets = new Array<RecentSheetInfo>();
}

export interface Operation {
	action: string,
	payload: {
		index: number,
		day: number,
		type?: DayType,
		start?: number,
		duration?: number
		origin?: "undo" | "redo" | "import" | "user"
	}
}

const sheets: Module<SheetState, RootState> = {
	state: new SheetState,
	mutations: {
		add_row({ sheet }, payload) {
			sheet.AddRow(payload)
		},
		set_shift({ sheet }, { index, day, start, duration }) {
			sheet.GetRow(index).SetShift(day, start, duration);
		},
		delete_shift({ sheet }, { index, day }) {
			sheet.GetRow(index).DeleteShift(day);
		},
		set_type({ sheet }, { index, day, type }) {
			sheet.GetRow(index).GetDay(day).SetType(type);
		},
		remove_employee({ sheet }, index: number) {
			sheet.schedule.splice(index, 1)
		},
		delete_undos(state, index: number) {
			//Removes undo and redo entries belonging to the employee with the given index
			for (const [name, stack] of Object.entries({ undoStack: state.undoStack, redoStack: state.redoStack })) {
				Vue.set(state, name, stack //Set using Vue global as it's not reactive otherwise
					.filter(batch => batch.every(op => op.payload.index != index))) //Keep all other employees' batches
					.map(batch => batch.map(op => op.payload.index += op.payload.index > index ? -1 : 0)) //Shift down indexes that come after the removed row
			}
		},
		log_export(state, { sheet, path }: { sheet: Sheet, path: string }) {
			let entry: RecentSheetInfo = { year: sheet.year, month: sheet.month, employeeCount: sheet.schedule.length, path }
			let index = state.recentSheets.findIndex(s => s.path == path) // Overwrite existing entry
			if (index == -1) index = state.recentSheets.length // Otherwise just append it
			Vue.set(state.recentSheets, index, entry)

			entry.modified = new Date();
			//TODO: sort based on latest modified OR opened date
			window.localStorage.setItem("recentSheets", JSON.stringify(
				state.recentSheets.sort((a, b) => moment(b.modified).diff(a.modified)).slice(0, 5)))
		}
	},
	actions: {
		new_sheet(context, { year, month, employees }) {
			Vue.set(context.state, "sheet", new Sheet(year, month, employees));
			Vue.set(context.state, "undoStack", []);
			Vue.set(context.state, "redoStack", []);
		},
		add({ state, commit }, payload): void {
			if (state.sheet.schedule.some(row => row.employee.name == payload))
				return console.error(`'${payload} dolgozó már szerepel a beosztásban!`)
			commit('add_row', payload)
		},
		remove_employee({ commit, getters }, name: string) {
			const index = getters.index(name)
			if (index == -1) return; //throw `Törölni kívánt '${name}' dolgozó nincs a beosztásban!`
			commit("remove_employee", index)
			commit("delete_undos", index)
		},
		set_shift(context, payload: Operation["payload"]) {
			const { index, day, start, duration } = payload;
			//Check if we're actually about to make a change
			let old: ScheduleDay = context.getters.day(index, day);
			if (!old) return console.log("Nem létező nap:", payload)
			if (old.type == DayType.shift && old.start == start && old.duration == duration) return;

			context.dispatch('register_undo', { action: "set_shift", payload } as Operation)

			context.commit('set_shift', payload)

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
		set_type(context, payload: Operation["payload"]) {
			const { index, day, type } = payload;

			let currentShift: ScheduleDay = context.getters.day(index, day);
			if (!currentShift) return console.log("Nem létező nap:", payload)
			if (currentShift.type == type) return; //This is a duplicate call, we don't have to do anything

			context.dispatch('register_undo', { action: "set_type", payload })

			let previousShift: ScheduleDay = context.getters.day(index, day - 1);
			let nextShift: ScheduleDay = context.getters.day(index, day + 1);

			if (nextShift && isNight(currentShift) && nextShift.type === DayType.rest)
				context.commit('set_type', { index, day: day + 1, type: DayType.empty })

			if (previousShift && type === DayType.empty && isNight(previousShift))
				context.commit('set_type', { index, day, type: DayType.rest })
			else
				context.commit('set_type', { index, day, type });
		},
		undo({ state, dispatch }) {
			let last_batch = state.undoStack.pop();
			if (!last_batch || !last_batch.length) last_batch = state.undoStack.pop(); //A new batch has been started => undo the previous one
			if (!last_batch) return; //Empty history => No actions to revert
			if (last_batch.some(op => op.payload.origin === "import")) {
				// This is the result of an import action => don't undo it
				state.undoStack.push(last_batch); // restore it, since it was popped
				return;
			}

			state.redoStack.push(last_batch)

			for (let { payload } of last_batch) {
				//Look for the last action in history that mutated the same day
				let revertTo = _.last(state.undoStack.flat().filter(({ payload: { index, day } }) => (index == payload.index && day == payload.day)))
				if (revertTo) {
					dispatch(revertTo.action, { ...revertTo.payload, origin: "undo" } as Operation["payload"]) //Do that action again
				} else {
					//If no such action is found, clear the cell
					dispatch('set_type', { ...payload, type: DayType.empty, origin: "undo" } as Operation["payload"])
				}

			}

			dispatch('new_batch') //If a new batch was already started before the undo, we got rid of it with pop(). We'll restore it
			return last_batch

		},
		redo({ state, dispatch }) {
			let batch = state.redoStack.pop()
			if (batch) {
				dispatch('new_batch')
				for (let op of batch) {
					dispatch(op.action, { ...op.payload, origin: "redo" } as Operation["payload"])
				}
			}
			return batch
		},
		register_undo({ state, dispatch }, op: Operation) {
			if (op.payload.origin !== "undo") { // If this action was a result of an undo, don't register it since it would lead to looping undos
				if (op.payload.origin !== "redo") state.redoStack = []
				let last_batch = _.last(state.undoStack)
				// Start new batch if op action is different or stack is empty
				if (last_batch == undefined || (last_batch[0] && (last_batch[0].payload.type != op.payload.type))) {
					dispatch('new_batch')
					last_batch = _.last(state.undoStack)
				}
				if (_.isEqual(_.last(state.undoStack), op) == false) //Don't register the same action 
					last_batch!.push(op)
			}
		},
		new_batch({ state }) {
			let last_batch = state.undoStack[state.undoStack.length - 1]
			if (!last_batch || last_batch.length > 0) state.undoStack.push([]);
		}
	},
	getters: {
		day: (context: SheetState) => (index: number, day: number): ScheduleDay | undefined => {
			try {
				return context.sheet.GetRow(index).GetDay(day)
			} catch {
				return undefined
			}
		},
		employee: (context) => (name: string): Employee | undefined => {
			return context.sheet.schedule.find(row => row.employee.name == name)?.employee
		},
		index: (context) => (name: string): number => {
			return context.sheet.schedule.findIndex(row => row.employee.name == name)
		},
		can_undo: ({ undoStack }) => undoStack.some(batch => batch.length > 0 && batch.some(op => op.payload.origin !== "import")),
		can_redo: ({ redoStack }) => redoStack.some(batch => batch.length > 0),
		isInSheet: ({ sheet }) => (name: string) => sheet.schedule.some(row => row.employee.name == name)
	}
}
export default sheets