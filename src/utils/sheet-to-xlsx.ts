import Excel from 'exceljs';
import { Sheet } from "@/model/schedule-sheet";
import _ from "lodash"
import { accumulators, CountStartingTimes } from "@/model/aggregates"
import { DayType, DayTypeDescriptions } from '@/model/day-types';
import { Position, copyRange, jsonify } from "@/utils/xlsx-helpers"

type BindingMap = Map<string, (...args: any[]) => Excel.CellValue>

export default function replaceTemplate(template: Excel.Worksheet, sheet: Sheet) {
	let firstEmployeePos: Position
	let employeeDistance: Position
	let currentScheduleRow: number

	let bindings: BindingMap = new Map<string, (...args: any[]) => Excel.CellValue>([
		["year", () => sheet.year],
		["month", () => sheet.month],
		["startDate", () => {
			return new Date(sheet.year, sheet.month, 1)
		}],
		["startsAt", (cell: Excel.Cell, hour: number) => {
			let day = Number(cell.col) - 1; // Assuming days start at column B
			return CountStartingTimes(sheet).get(hour)?.[day - 1] ?? 0
		}],
		["employeeName", (cell: Excel.Cell) => {
			let current = new Position(cell.row, cell.col)
			if (!firstEmployeePos) firstEmployeePos = current

			currentScheduleRow = 0
			return sheet.GetRow(currentScheduleRow)?.employee?.name
		}],
		["nextEmployee", (cell: Excel.Cell) => {
			let current = new Position(cell.row, cell.col)
			if (!employeeDistance) {
				employeeDistance = current.subtract(firstEmployeePos)
				template.addConditionalFormatting({
					ref: `B$${firstEmployeePos.row - 1}:AF${employeeDistance.row * sheet.schedule.length + firstEmployeePos.row - 1}`,
					rules: [
						{
							priority: 1,
							type: "expression",
							formulae: [`WEEKDAY(DATE(${sheet.year},${sheet.month},B$${firstEmployeePos.row - 1}),2)>5`],
							style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: "FFFFFF00" } } },
						}
					]
				})
			}

			currentScheduleRow = (current.row - firstEmployeePos.row) / employeeDistance.row;
			// Only copy to next row if there is a next employee
			if (currentScheduleRow < sheet.schedule.length - 1) {
				let next = new Position(current.row + employeeDistance.row, current.col + employeeDistance.col)
				copyRange(template, current, new Position(current.row + employeeDistance.row - 1, 50), next)
			} 
			return sheet.GetRow(currentScheduleRow)?.employee?.name
		}],
		["shiftStart", (cell: Excel.Cell) => {
			let current = new Position(cell.row, cell.col)

			let day = current.col - 1; // Assuming days start at column B
			if (day > sheet.month_length) return ""

			let scheduleDay = sheet.GetRow(currentScheduleRow)?.GetDay(day)
			if (!scheduleDay) return undefined

			if (scheduleDay.type == DayType.shift)
				return scheduleDay.start
			else
				return DayTypeDescriptions[scheduleDay.type].label
		}],
		["shiftEnd", (cell: Excel.Cell) => {
			let day = Number(cell.col) - 1; // Assuming days start at column B
			if (day > sheet.month_length) return ""
			let scheduleDay = sheet.GetRow(currentScheduleRow)?.GetDay(day)
			if (scheduleDay?.type == DayType.shift) {
				let resultEnd = (scheduleDay.start + scheduleDay.duration) % 24
				return resultEnd ? resultEnd : 24
			}
			else
				return ""
		}],
		...accumulators.map(x =>
			[x.name, () => {
				let days = sheet.GetRow(currentScheduleRow)?.days

				return days ? x.evaluate(days) : undefined
			}]
		) as [string, (...args: any[]) => Excel.CellValue][],
	])

	template.eachRow((row, i) => {
		row.eachCell((current, j) => {
			current.value = replaceTemplateCell(current, bindings);
			// In the template the fomula's result is an error so the output file will be broken without this
			if (current.formula)
				current.value = ({ formula: current.formula, result: 0 } as Excel.CellFormulaValue)

		});
	})
}

function replaceTemplateCell(cell: Excel.Cell, bindings: BindingMap) {
	if (!cell.value || typeof cell.value !== "string") return cell.value;

	let matches = Array.from(cell.value.matchAll(/\$\{.*?\}/g)).flat();
	let result: Excel.CellValue = cell.value;

	for (const match of matches) {
		let obj: { [key: string]: any[] } = JSON.parse(jsonify(match));
		if (!obj) {
			console.error(`Couldn't parse ${match}`);
			continue;
		}
		for (const key in obj) {
			let func = bindings.get(key);
			if (func) {
				let retVal = func(cell, ...obj[key]);
				if (retVal == null || retVal == undefined) retVal = ""
				if (typeof retVal === "boolean")
					retVal = retVal ? 'OK' : '!'

				// If the template is the only thing in the string keep the return type
				if (cell.value.length === match.length)
					result = retVal;
				// If there are other things convert it to a string
				else
					result = result!.toString().replace(`${match}`, retVal.toString())
			}
		}
	}

	return result
}
