import { dialog, BrowserWindow, ipcMain } from "electron"
import _ from "lodash"
import Path from "path"
import { readFileSync, writeFileSync } from "fs";

let templatePath = Path.join(__dirname, "../src/assets/template.xlsx");
let exportPath = Path.join(__dirname, "../src/assets/out.xlsx");

// export function ImportSheet() {
// 	const path = GetPathFromUser();
// 	if (path) {
// 		ReadFile(path);
// 	}
// }

export function ExportSheet() {
	let window = BrowserWindow.getFocusedWindow()!;
	let template = readFileSync(templatePath)
	window.webContents.send("export-query", template);
}

ipcMain.on("export-reply", (_, outBuffer: Buffer) => {
	writeFileSync(exportPath, outBuffer)
})

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
	return undefined;
}