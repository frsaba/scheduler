import { Menu } from "electron"
import { ImportSheet } from "./sheet-io"

const template = [
    {
        label: "File",
        submenu: [{
            label: "Import",
            click: ImportSheet
        }]
    }
]


const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)
