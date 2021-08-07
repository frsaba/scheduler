import Excel from 'exceljs';
import { Sheet } from "@/model/schedule-sheet";
import _ from "lodash"
import { CountStartingTimes } from "@/model/aggregates"

type BindingMap = Map<string, (...args: any[]) => Excel.CellValue>

export async function bufferToWorkbook(buffer: Excel.Buffer) {
	return await new Excel.Workbook().xlsx.load(buffer)
}

export default async function replaceTemplate(template: Excel.Worksheet, sheet: Sheet) {
	let bindings: BindingMap = new Map<string, (...args: any[]) => Excel.CellValue>([
		["year", () => sheet.year],
		["month", () => sheet.month],
		["startDate", () => {
			return new Date(sheet.year, sheet.month, 1)
		}],
		["startsAt", (cell: Excel.Cell, hour: number) => {
			let day = Number(cell.col) - 2; // Assuming days start at column B
			return CountStartingTimes(sheet).get(hour)?.[day] ?? 0
		}]
	])

	template.eachRow({ includeEmpty: true }, (row, i) => {
		row.eachCell({ includeEmpty: true }, (current, j) => {
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
