import Excel from 'exceljs';
import { Sheet } from "@/model/schedule-sheet";
import _ from "lodash"
import { accumulators, CountStartingTimes } from "@/model/aggregates"
import { DayType, DayTypeDescriptions } from '@/model/day-types';

type BindingMap = Map<string, (...args: any[]) => Excel.CellValue>
class Position {
	row: number
	col: number
	constructor(row: number | string, col: number | string) {
		this.row = Number(row)
		this.col = Number(col)
	}

	subtract(other: Position) {
		return new Position(this.row - other.row, this.col - other.col)
	}
}

function copyRange(worksheet: Excel.Worksheet, start: Position, end: Position, target: Position) {
	let offset = target.subtract(start)
	for (let row = start.row; row <= end.row; row++) {
		for (let col = start.col; col <= end.col; col++) {
			let sourceCell = worksheet.getCell(row, col)
			let targetCell = worksheet.getCell(row + offset.row, col + offset.col)
			targetCell.value = sourceCell.value
		}
	}
}

export async function bufferToWorkbook(buffer: Excel.Buffer) {
	return await new Excel.Workbook().xlsx.load(buffer)
}

export default async function replaceTemplate(template: Excel.Worksheet, sheet: Sheet) {
	let employeeIndex: Position
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
			if (!employeeIndex) employeeIndex = current

			currentScheduleRow = 0
			return sheet.GetRow(currentScheduleRow).employee.name
		}],
		["nextEmployee", (cell: Excel.Cell) => {
			let current = new Position(cell.row, cell.col)
			if (!employeeDistance)
				employeeDistance = current.subtract(employeeIndex)

			currentScheduleRow = (current.row - employeeIndex.row) / employeeDistance.row;
			// Only copy to next row if there is a next employee
			if (currentScheduleRow < sheet.schedule.length - 1) {
				let next = new Position(current.row + employeeDistance.row, current.col + employeeDistance.col)
				copyRange(template, current, new Position(current.row + employeeDistance.row - 1, 50), next)
			} else {
				// Add conditional formatting for weekends on the last employee
				template.addConditionalFormatting({
					ref: `B$${employeeIndex.row - 1}:AF${current.row + employeeDistance.row - 1}`,
					rules: [
						{
							priority: 1,
							type: "expression",
							formulae: [`WEEKDAY(DATE(${sheet.year},${sheet.month},B$${employeeIndex.row - 1}),2)>5`],
							style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: "FFFFFF00" } } },
						}
					]
				})
			}
			return sheet.GetRow(currentScheduleRow).employee.name
		}],
		["shiftStart", (cell: Excel.Cell) => {
			let current = new Position(cell.row, cell.col)

			let day = current.col - 1; // Assuming days start at column B
			if (day > sheet.month_length) return ""

			let scheduleDay = sheet.GetRow(currentScheduleRow).GetDay(day)
			if (scheduleDay.type == DayType.shift)
				return scheduleDay.start
			else
				return DayTypeDescriptions[scheduleDay.type].label
		}],
		["shiftEnd", (cell: Excel.Cell) => {
			let day = Number(cell.col) - 1; // Assuming days start at column B
			if (day > sheet.month_length) return ""
			let scheduleDay = sheet.GetRow(currentScheduleRow).GetDay(day)
			if (scheduleDay.type == DayType.shift) {
				let resultEnd = (scheduleDay.start + scheduleDay.duration) % 24
				return resultEnd ? resultEnd : 24
			}
			else
				return ""
		}],
		...accumulators.map(x =>
			[x.name, () => x.evaluate(sheet.GetRow(currentScheduleRow).days)]
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

let reg = /(?<=\$)\{.*?\}/g;

function replaceTemplateCell(cell: Excel.Cell, bindings: BindingMap) {
	if (!cell.value || typeof cell.value !== "string") return cell.value;

	let matches = Array.from(cell.value.matchAll(reg)).flat();
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
				if (retVal == null) retVal = ""
				if (typeof retVal === "boolean")
					retVal = retVal ? 'OK' : '!'

				// If the template is the only thing in the string keep the return type
				if (cell.value.length === match.length + 1)
					result = retVal;
				// If there are other things convert it to a string
				else
					result = result!.toString().replace(`$${match}`, retVal.toString())
			}
		}
	}

	return result
}

// Corrects the incoming string so that it can be parsed by JSON
function jsonify(str: string) {
	if (!str) return "{}";

	// Trim leading and trailing curly braces
	str = str.replace(/^\{?|\}?$/g, "");

	let [key, value] = str.split(/\:(.+)/gs).map(x => x.trim());
	if (!key) return "{}";
	// Trim leading and trailing quotation marks
	key = key.replace(/^[\"\']?|[\"\']?$/gm, "");
	// Trim leading and trailing square brackets
	value = value?.replace(/^\[?|\]?$/gm, "")

	if (value) return `{"${key}": [${value}]}`;
	else return `{"${key}": []}`;
}
