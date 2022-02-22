import { BrowserWindow } from "electron";

export async function getItem(key: string) {
	let window = BrowserWindow.getAllWindows()[0];
	return await window.webContents.executeJavaScript(`window.localStorage.getItem('${key}');`, true) as string;
}

export async function setItem(key: string, value: string) {
	let window = BrowserWindow.getAllWindows()[0];
	await window.webContents.executeJavaScript(`window.localStorage.setItem('${key}', '${value}');`, true);
}

export default { getItem, setItem }