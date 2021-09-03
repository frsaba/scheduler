import { dialog, BrowserWindow, ipcMain } from "electron"
import _ from "lodash"
import Path from "path"
import { readFileSync, writeFileSync } from "fs";

let templatePath = Path.join(__dirname, "../src/assets/template.xlsx");
let exportPath = Path.join(__dirname, "../src/assets/out.xlsx");

export function ImportSheet(path: string | undefined = undefined) {
	let window = BrowserWindow.getFocusedWindow()!;
	let template = readFileSync(templatePath)
	path ??= GetImportPathFromUser()
	if (!path) return
	let target = readFileSync(path)
	window.webContents.send("import-query", template, target);
}

export function ExportSheet() {
	let path = GetExportPathFromUser()
	if (!path) return
	let window = BrowserWindow.getFocusedWindow()!;

	let template = readFileSync(templatePath)
	window.webContents.send("export-query", template, path);
}

ipcMain.on("export-reply", (event, outBuffer: Buffer, path: string) => {
	try {
		writeFileSync(path, outBuffer)
	} catch (e) {
		event.reply("export-done", path, e)
	}
	event.reply("export-done", path)
})

ipcMain.on("import-path", (_, path: string) => {
	ImportSheet(path)
})

function GetExportPathFromUser() {
	return dialog.showSaveDialogSync({
		filters: [
			{ name: 'Excel fájlok', extensions: ['xlsx'] },
		]
	});
}

function GetImportPathFromUser() {
	var result = dialog.showOpenDialogSync({
		properties: ['openFile'],
		filters: [
			{ name: 'Excel fájlok', extensions: ['xlsx'] },
		]
	});
	return result?.[0];
}