import { BrowserWindow } from "electron";
let [min, max] = [-2, 3];

export default function init(win: BrowserWindow)
{
    win.webContents.on("zoom-changed", (event, zoomDirection) => {
        let currZoom = win.webContents.getZoomLevel();
        
        if (zoomDirection === "in")
            win.webContents.setZoomLevel(Math.min(currZoom + 0.2, max));
        else
            win.webContents.setZoomLevel(Math.max(currZoom - 0.2, min));
    })
}