import Excel from 'exceljs';
import store from '@/state/store';
import _ from "lodash"
import { DayTypeDescriptions } from '@/model/day-types';
import { Position, copyRange, jsonify } from "@/utils/xlsx-helpers"
import router from "@/router/index"
import moment from 'moment';

interface Schedule {
	employee: string,
	starts: string[]
	ends: string[]
}

export default function parseWithTemplate(template: Excel.Worksheet, input: Excel.Worksheet) {
	let
		year: number = 0,
		month: number = 0,
		schedules: Schedule[] = [],
		currSchedule: Schedule,
		firstEmployeePos: Position,
		employeeDistance: Position;
	let bindings = new Map<string, (...args: any[]) => void>([
		["year", (inputYear: string) => {
			year = parseInt(inputYear)
		}],
		["month", (inputMonth: string) => {
			month = parseInt(inputMonth)
			if (isNaN(month)) 
				month = moment(inputMonth, "MMMM", "HU").month()
		}],
		["employeeName", (employee: string, cell: Excel.Cell) => {
			if (schedules.some(x => x.employee == employee)) return

			let current = new Position(cell.row, cell.col)
			if (!firstEmployeePos) firstEmployeePos = current

			currSchedule = { employee, starts: [], ends: [] }
			schedules.push(currSchedule)
		}],
		["nextEmployee", (employee: string, cell: Excel.Cell) => {
			if (schedules.some(x => x.employee == employee)) return

			let current = new Position(cell.row, cell.col)
			if (!employeeDistance)
				employeeDistance = current.subtract(firstEmployeePos)

			let next = new Position(current.row + employeeDistance.row, current.col + employeeDistance.col)
			copyRange(template, current, new Position(current.row + employeeDistance.row - 1, 50), next)

			currSchedule = { employee, starts: [], ends: [] }
			schedules.push(currSchedule)
		}],
		["shiftStart", (input: string, cell: Excel.Cell) => {
			let day = Number(cell.col) - 2 // Assuming days start at cell B and -1 for 0 indexing
			currSchedule.starts[day] = input
		}],
		["shiftEnd", (input: string, cell: Excel.Cell) => {
			let day = Number(cell.col) - 2
			currSchedule.ends[day] = input
		}]
	])
	template.eachRow((row, rowIndex) => {
		row.eachCell((templateCell, colIndex) => {
			let inputCell = input.getCell(rowIndex, colIndex)
			if (!templateCell.value || typeof templateCell.value !== "string") return;
			if (inputCell.value === undefined || inputCell.value === null || inputCell.value === "") return;

			let [templateValue, inputValue] = [templateCell.value, inputCell.value.toString()]
			let reg = /\$\{.*?\}/g;

			let matches = Array.from(templateValue.matchAll(reg));
			if (matches.length === 0) return

			let position = matches[0].index ?? 0
			for (let i = 0; i < matches.length; i++) {
				const currMatch = matches[i];
				const nextMatch = matches[i + 1];
				const match = currMatch[0]

				let currMatchEnd = (currMatch.index ?? 0) + match.length
				let nextMatchStart = (nextMatch?.index ?? templateValue.length)
				let separatorLength = nextMatchStart - currMatchEnd
				let separator = templateValue.substr(currMatchEnd, separatorLength)
				let outSeparatorIndex = inputValue.indexOf(separator, position)
				let result = inputValue.substr(position, separator ? outSeparatorIndex - position : inputValue.length)

				for (const key in JSON.parse(jsonify(match)))
					bindings.get(key)?.(result, templateCell)

				position = outSeparatorIndex + separator.length
			}
		})
	})

	let existingEmployees = store.state.staff.employees

	store.dispatch("new_sheet", {
		year, month,
		employees: schedules.map(row => {
			let employee = existingEmployees.find(x => x.name === row.employee)
			return employee ?? store.state.staff.Add(row.employee)
		})
	})

	for (const [index, row] of schedules.entries()) {
		for (const [dayIndex, upper] of row.starts.entries()) {
			let day = dayIndex + 1
			let dayType = DayTypeDescriptions.findIndex(x => x.label === upper)
			if (dayType !== -1) {
				store.dispatch("set_type", { index, day, type: dayType, undo: true })
			} else {
				let start = parseInt(upper)
				if (isNaN(start)) continue
				let end = parseInt(row.ends[dayIndex])
				if (isNaN(end)) throw "Hiba importálás közben: A műszak kezdetéhez nem társult befejező időpont"
				let duration = (start < end ? 0 : 24) + end - start

				store.dispatch("set_shift", { index, day, start, duration, undo: true })
			}
		}
	}

	router.push("/staff")
	router.back()
}