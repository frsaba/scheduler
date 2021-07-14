import { Menu } from "electron"
import { ImportSheet } from "./sheet-io"

const template: Electron.MenuItemConstructorOptions[] = [
    {
        label: "File",
        submenu: [{
            label: "Import",
            click: ImportSheet
        }]
    },
    {
        label: "Developer",
        submenu: [{
            label: "Toggle Developer Tools",
            accelerator: "CmdOrCtrl+Shift+I",
            role: "toggleDevTools"
        }]
    }
]

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)