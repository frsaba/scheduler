"use strict";

import { app, protocol, BrowserWindow, ipcMain, shell } from "electron";
import { autoUpdater } from "electron-updater"
import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
import installExtension, { VUEJS_DEVTOOLS } from "electron-devtools-installer"
import initZoom from "@/config/zoom";
import "@/config/appmenu"

const isDevelopment = process.env.NODE_ENV !== "production"
if (isDevelopment) require("dotenv").config()

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
	{ scheme: "app", privileges: { secure: true, standard: true } },
]);

async function createWindow() {
	// Create the browser window.
	const win = new BrowserWindow({
		webPreferences: {
			// Use pluginOptions.nodeIntegration, leave this alone
			// See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
			nodeIntegration: process.env
				.ELECTRON_NODE_INTEGRATION as unknown as boolean,
			contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
		},
		show: false
	});
	win.removeMenu();

	if (process.env.WEBPACK_DEV_SERVER_URL) {
		// Load the url of the dev server if in development mode
		await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string);
		if (!process.env.IS_TEST) win.webContents.toggleDevTools();
	} else {
		createProtocol("app");
		// Load the index.html when not in development
		win.loadURL("app://./index.html");
	}

	return win
}

// Quit when all windows are closed.
app.on("window-all-closed", () => {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== "darwin") {
		app.quit();
	}

});

app.on("activate", () => {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
	if (isDevelopment && !process.env.IS_TEST) {
		// Install Vue Devtools
		try {
			await installExtension(VUEJS_DEVTOOLS);
		} catch (e : any) {
			console.error("Vue Devtools failed to install:", e.toString());
		}
	}
	ipcMain.handle("app_version", (event) => {
		return app.getVersion()
	});

	const mainWindow = await createWindow();

	initZoom(mainWindow);

	autoUpdater.checkForUpdatesAndNotify()
	autoUpdater.on('update-available', () => {
		mainWindow.webContents.send('update-available');
	});
	autoUpdater.on('update-downloaded', () => {
		mainWindow.webContents.send('update-downloaded');
	});

	ipcMain.on("reveal-in-explorer", (_, path: string) => {
		shell.showItemInFolder(path)
	})

	ipcMain.on("update-install", () => {
		autoUpdater.quitAndInstall()
	})

	ipcMain.on("toggle-devtools", () => {
		mainWindow.webContents.toggleDevTools();
	})

	mainWindow.maximize();
	mainWindow.show();
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
	if (process.platform === "win32") {
		process.on("message", (data) => {
			if (data === "graceful-exit") {
				app.quit();
			}
		});
	} else {
		process.on("SIGTERM", () => {
			app.quit();
		});
	}
}
