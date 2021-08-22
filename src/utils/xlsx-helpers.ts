import Excel from 'exceljs';
import { Sheet } from "@/model/schedule-sheet";
import _ from "lodash"
import { accumulators, CountStartingTimes } from "@/model/aggregates"
import { DayType, DayTypeDescriptions } from '@/model/day-types';

export class Position {
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

export function copyRange(worksheet: Excel.Worksheet, start: Position, end: Position, target: Position) {
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

// Corrects the incoming string so that it can be parsed by JSON
export function jsonify(str: string) {
	if (!str) return "{}";

	// Trim leading dollar sign
	str = str.replace(/^\$/, "")
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
