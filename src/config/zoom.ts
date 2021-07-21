import { BrowserWindow } from "electron";
import { clamp } from "lodash";
let [min, max] = [0.5, 2]; // 50% - 200%
let changeFactor = 0.1;

export default function init(win: BrowserWindow)
{
    win.webContents.setZoomFactor(1);
    win.webContents.on("zoom-changed", (event, zoomDirection) => {
        let zoom = win.webContents.getZoomFactor();
        
        zoom += (zoomDirection === "in" ? changeFactor : -changeFactor);
        zoom = clamp(zoom, min, max)
        win.webContents.setZoomFactor(zoom);

        win.webContents.send("zoom", {zoom});
    })
}