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
	clipboard = new Array<Operation>();
	recentSheets = new Array<RecentSheetInfo>();
}

export interface Operation {
	action: "set_shift" | "set_type",
	payload: {
		index: number,
		day: number,
		type?: DayType,
		start?: number,
		duration?: number
		origin?: "undo" | "redo" | "import" | "user" | "clipboard"
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
		set_shift({ getters, dispatch, commit }, payload: Operation["payload"]) {
			const { index, day, start, duration, origin } = payload;

			let currentShift: ScheduleDay = getters.day(index, day);
			if (!currentShift) return console.log("Nem létező nap:", payload)
			if (currentShift.type == DayType.shift && currentShift.start == start && currentShift.duration == duration) return;

			dispatch('register_undo', { action: "set_shift", payload } as Operation)
			commit('set_shift', payload)

			let nextShift: ScheduleDay = getters.day(index, day + 1);

			// Only manipulate surrounding cells if the action doesn't originate from an undo or a redo
			if (!nextShift || origin === "undo" || origin === "redo") return

			//Add rest day after night shift
			if (isNight(currentShift) && !isNight(nextShift))
				dispatch('set_type', { index, day: day + 1, type: DayType.rest })
			//Revert rest day to previous value
			else if (!isNight(currentShift) && nextShift.type == DayType.rest)
				dispatch('revert', { index, day: day + 1 })
		},
		set_type({ getters, dispatch, commit }, payload: Operation["payload"]) {
			const { index, day, type, origin } = payload;

			let currentShift: ScheduleDay = getters.day(index, day);
			if (!currentShift) return console.log("Nem létező nap:", payload)
			if (currentShift.type == type) return;

			dispatch('register_undo', { action: "set_type", payload })

			let previousShift: ScheduleDay = getters.day(index, day - 1);
			let nextShift: ScheduleDay = getters.day(index, day + 1);

			// Only manipulate surrounding cells if the action doesn't originate from an undo or a redo
			if (origin === "undo" || origin === "redo") {
				commit("set_type", { index, day, type })
				return
			}

			// Revert rest day
			if (nextShift && isNight(currentShift) && nextShift.type === DayType.rest)
				dispatch("revert", { index, day: day + 1 })
			// Replace empty cell with rest day
			if (previousShift && type === DayType.empty && isNight(previousShift))
				dispatch('set_type', { index, day, type: DayType.rest })
			// Otherwise just set the given type to the cell
			else
				commit("set_type", { index, day, type })
		},

		revert({ state, dispatch }, { index, day, origin }: Operation["payload"]) {
			let isCurrentCell = ({ payload }: Operation) => payload.index === index && payload.day === day
			// Every batch that contains the given cell
			let actionsOnCell = state.undoStack.filter(x => x.some(isCurrentCell))

			// The batch before the last batch containing only the operations on the given cell
			// The undo stack contains the last performed action batch that's why we need to revert to
			// the one before the last
			let reverts = actionsOnCell[actionsOnCell.length - 2]?.filter(isCurrentCell)
			if (reverts) {
				// Execute every action in the batch
				for (let op of reverts)
					dispatch(op.action, { ...op.payload, origin })
			} else {
				//If no such action is found, clear the cell
				dispatch('set_type', { index, day, type: DayType.empty, origin })
			}
		},
		undo({ state: { undoStack, redoStack }, dispatch }) {
			// Find the last element in the undo stack that isn't empty
			let last_batch_index = _.findLastIndex(undoStack, x => !_.isEmpty(x))
			let last_batch = undoStack[last_batch_index]
			if (!last_batch) return

			if (last_batch.some(op => op.payload.origin === "import")) // This is the result of an import action => don't undo it
				return;

			redoStack.push(last_batch)

			for (let { payload } of last_batch)
				dispatch("revert", { ...payload, origin: "undo" })

			undoStack.splice(last_batch_index, 1); // Remove the undone batch from the stack
			return last_batch
		},
		redo({ state, dispatch }) {
			let batch = state.redoStack.pop()
			if (batch) {
				dispatch('new_batch')
				for (let op of batch) {
					dispatch(op.action, { ...op.payload, origin: "redo" })
				}
			}
			return batch
		},
		register_undo({ state, dispatch }, op: Operation) {
			if (op.payload.origin === "undo") return // If this action was a result of an undo, don't register it since it would lead to looping undos
			if (op.payload.origin !== "redo") state.redoStack = []

			let last_batch = _.last(state.undoStack)
			// Start new batch if stack is empty
			if (last_batch == undefined || !last_batch[0]) {
				dispatch('new_batch')
				last_batch = _.last(state.undoStack)
			}

			if (_.isEqual(_.last(state.undoStack), op) == false) // Don't register the same action 
				last_batch!.push(op)
		},
		new_batch({ state }) {
			let last_batch = _.last(state.undoStack)
			if (!last_batch || last_batch.length > 0) state.undoStack.push([]);
		},
		copy({ state }, { employee_index, days }: { employee_index: number, days: number[] }) {
			state.clipboard = days.map(dayNumber => {
				let day = state.sheet.GetRow(employee_index).GetDay(dayNumber)
				let op: Operation = {
					action: day.type === DayType.shift ? "set_shift" : "set_type",
					payload: {
						index: employee_index,
						day: dayNumber,
						type: day.type,
						start: day.start,
						duration: day.duration,
					}
				}
				return op
			})
		},
		cut({ state, dispatch }, { employee_index, days }: { employee_index: number, days: number[] }) {
			dispatch("copy", { employee_index, days })
			for (let i = 0; i < state.clipboard.length; i++) {
				dispatch("set_type", { origin: "clipboard", index: employee_index, day: days[i], type: DayType.empty })
			}
		},
		paste({ state, dispatch }, { employee_index, day }: { employee_index: number, day: number }) {
			for (let i = 0; i < state.clipboard.length; i++) {
				let op = state.clipboard[i]
				dispatch(op.action, { ...op.payload, origin: "clipboard", index: employee_index, day: day + i })
			}

			return state.clipboard.length
		},
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