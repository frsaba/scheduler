import { dialog, BrowserWindow, ipcMain } from "electron"
import Excel from 'exceljs';
import { Sheet } from "@/model/schedule-sheet";
import Path from "path"

let sheet: Sheet;
let bindings: Map<string, (...args: any[]) => Excel.CellValue>;

export function ImportSheet() {
	const path = GetPathFromUser();
	if (path) {
		ReadFile(path);
	}
}

export function ExportSheet() {
	let window = BrowserWindow.getFocusedWindow()!;
	window.webContents.send("export-query");
}

ipcMain.on("export-reply", async (event: Event, s: Sheet) => {
	sheet = s;
	bindings = new Map<string, (...args: any[]) => Excel.CellValue>([
		["year", () => sheet.year],
		["month", () => sheet.month],
		["startDate", () => {
			return new Date(sheet.year, sheet.month, 1)
		}],
		["startsAt", (hour: number) => {
			return hour
		}]
	])
	let templatePath = Path.join(__dirname, "../src/assets/template.xlsx");
	let exportPath = Path.join(__dirname, "../src/assets/out.xlsx");
	await writeFile(templatePath, exportPath);
})

export async function writeFile(templatePath: string, exportPath: string) {
	let workbook = new Excel.Workbook();
	await workbook.xlsx.readFile(templatePath)
	let template = workbook.getWorksheet("Main");

	template.eachRow({ includeEmpty: true }, (row, i) => {
		row.eachCell({ includeEmpty: true }, (current, j) => {
			current.value = replaceTemplate(current);
		});
	})

	await workbook.xlsx.writeFile(exportPath)
}

let reg = /(?<=\$)\{.*?\}/g;

function replaceTemplate(cell: Excel.Cell) {
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
				let retVal = func(...obj[key]);
				if (!retVal) retVal = ""

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

	let [key, value] = str.split(":", 2);
	if (!key) return "{}";
	// Trim leading and trailing quotation marks
	key = key.replace(/^[\"\']?|[\"\']?$/g, "");

	if (value) return `{"${key}": ${value}}`;
	else return `{"${key}": []}`;
}

function GetPathFromUser(): string | undefined {
	var result = dialog.showOpenDialogSync({
		properties: ['openFile'],
		filters: [
			{ name: 'Excel files', extensions: ['xlsx', 'xls'] },
		]
	});
	if (result) {
		var path = result[0];

		return path
	}
	// @ts-ignore
	const a = CountStartingTimes(undefined);
	return undefined;
}

async function ReadFile(path: string) {
	const workbook = new Excel.Workbook();
	return await workbook.xlsx.readFile(path);
	console.log(workbook.worksheets[0])
}
