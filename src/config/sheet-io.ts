import { dialog } from "electron"
import * as Excel from 'exceljs';
import { Sheet } from "@/model/schedule-sheet";

export function ImportSheet() {
    const path = GetPathFromUser();
    if (path) {
        ReadFile(path);
    }
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
    await workbook.xlsx.readFile(path);
    console.log(workbook.worksheets[0])
}

// function ParseSheet() : Sheet{

// }
