import { dialog, BrowserWindow, ipcMain } from "electron"
import * as Excel from 'exceljs';
import { Sheet } from "@/model/schedule-sheet";

let sheet: Sheet;
let bindings: Map<string, any>

export function ImportSheet() {
    const path = GetPathFromUser();
    if (path) {
        ReadFile(path);
    }
}

export function ExportSheet() {
    let window = BrowserWindow.getFocusedWindow()!;
    window.webContents.send("export-query");
    // const path = GetPathFromUser();
    // if (path) {
    //     // writeFile(path);
    // }
}

ipcMain.on("export-reply", async (event: Event, s: Sheet) => {
    sheet = s;
    bindings = new Map<string, any>([
        ["year", sheet.year],
        ["month", sheet.month],
    ])
    let templatePath = "C:\\Users\\Guczi\\Desktop\\template.xlsx";
    let exportPath = "C:\\Users\\Guczi\\Desktop\\out.xlsx";
    await writeFile(templatePath, exportPath);
})

export async function writeFile(templatePath: string, exportPath: string) {
    let templateWb = new Excel.Workbook();
    let template = (await templateWb.xlsx.readFile(templatePath)).worksheets[0];

    let exportWb = new Excel.Workbook();
    let output = exportWb.addWorksheet("Sheet1");
    
    template.eachRow({includeEmpty: true}, (row, i) => {
        row.eachCell({includeEmpty: true}, (cell, j) => {
            let outCell = output.getCell(i, j);
            Object.assign(outCell, cell); // Copy all values from cell to outCell

            if (cell.value && typeof cell.value === "string") {
                outCell.value = replaceTemplate(cell.value);
            }
        });
    })

    await exportWb.xlsx.writeFile(exportPath);
}

function replaceTemplate(str: string)
{
    let reg = /(?<=\$\{).*?(?=\})/g;
    let matches = Array.from(str.matchAll(reg));
    let result = str;
    
    for(let match of matches) {
        for (let value of match)
            result = result.replace(`\${${value}}`, bindings.get(value));
    }
    return result
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
    return undefined;
}

async function ReadFile(path: string) {
    const workbook = new Excel.Workbook();
    return await workbook.xlsx.readFile(path);
    console.log(workbook.worksheets[0])
}

// function ParseSheet() : Sheet{

// }
