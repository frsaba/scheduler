import { dialog, BrowserWindow, ipcMain } from "electron"
import * as Excel from 'exceljs';
import { Sheet } from "@/model/schedule-sheet";
import _, { bind } from "lodash";
import strftime from "strftime"
import Path from "path"

let sheet: Sheet;
let bindings: Map<string, Function>

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
    bindings = new Map<string, () => string>([
        ["year", () => sheet.year.toString()],
        ["month", () => sheet.month.toString()],
        ["startDate", () => strftime("%F", new Date(sheet.year, sheet.month, 1))]
    ])
    let templatePath = Path.join(__dirname, "../src/assets/template.xlsx");
    let exportPath = Path.join(__dirname, "../src/assets/out.xlsx");
    await writeFile(templatePath, exportPath);
})

export async function writeFile(templatePath: string, exportPath: string) {
    let workbook = new Excel.Workbook();
    let template = (await workbook.xlsx.readFile(templatePath)).worksheets[0];

    template.eachRow({ includeEmpty: true }, (row, i) => {      
        row.eachCell({ includeEmpty: true }, (current, j) => {
            current.value = replaceTemplate(current.value);
        });
    })

    // let copyTo = template.getCell("");
    // copyTo.value = template.getCell("A12").value;
    
    await workbook.xlsx.writeFile(exportPath);
}

let reg = /(?<=\$\{).*?(?=\})/g;

function replaceTemplate(str: Excel.CellValue) {
    if (!str || typeof str !== "string") return str;

    let matches = Array.from(str.matchAll(reg));

    for (let value of matches.flat()) {
        let fn = bindings.get(value)
        if (fn)
            str = str.replace(`\${${value}}`, fn());
    }

    return str
}

function containsBindings(cell: string, ...bindings: string[]) {
    if (!cell) return false;
    
    let matches = Array.from(cell.matchAll(reg));

    return matches.flat().some(x => bindings.includes(x))   
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
