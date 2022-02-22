import { dialog, BrowserWindow, ipcMain, app } from "electron"
import _ from "lodash"
import Path from "path"
import { existsSync, readFileSync, writeFileSync } from "fs";
import { Deferred } from "@/utils/promise-helpers";
import localStorage from "@/utils/local-storage";

let templatePath: string | undefined;

export async function ImportSheet(path: string | undefined = undefined) {
	path ??= dialog.showOpenDialogSync({
		filters: [
			{ name: 'Excel fájlok', extensions: ['xlsx'] },
		]
	})?.[0];
	if (!path) return

	let target = readFileSync(path)

	let template = await GetTemplate();
	if (!template) return;

	let window = BrowserWindow.getAllWindows()[0];
	window.webContents.send("import-query", template, target);
}

export async function ExportSheet() {
	let path = dialog.showSaveDialogSync({
		filters: [
			{ name: 'Excel fájlok', extensions: ['xlsx'] },
		]
	});
	if (!path) return;

	let template = await GetTemplate();
	if (!template) return;
	
	let window = BrowserWindow.getAllWindows()[0];
	window.webContents.send("export-query", template, path);
}

async function GetTemplate() {
	let electronWindow = BrowserWindow.getAllWindows()[0];
	templatePath = await localStorage.getItem("templatePath");
	templatePath ??= Path.join(__dirname, "../src/assets/template.xlsx")
	
	if (!existsSync(templatePath)) {
		electronWindow.webContents.send("template-not-found");

		let open = new Deferred<boolean>();
		ipcMain.once("template-browse", (_, browse: boolean) => open.resolve(browse));
		
		if (!(await open.promise)) return;
		
		templatePath = dialog.showOpenDialogSync({
			properties: ['openFile'],
			title: "Sablon",

			filters: [
				{ name: 'Excel fájlok', extensions: ['xlsx'] },
			]
		})?.[0];
		if (!templatePath) return;

		templatePath = templatePath.replaceAll("\\", "\\\\");
		await localStorage.setItem('templatePath', templatePath);
	}

	return readFileSync(templatePath);
}

ipcMain.on("export-reply", (event, outBuffer: Buffer, path: string) => {
	try {
		writeFileSync(path, outBuffer)
	} catch (e) {
		event.reply("export-done", path, e)
	}
	event.reply("export-done", path)
})

ipcMain.on("import", (_, path: string) => {
	ImportSheet(path)
})

ipcMain.on("export", (_, path: string) => {
	ExportSheet()
})