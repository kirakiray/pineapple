const electron = require('electron');
const { app } = electron;
const { BrowserWindow } = electron;
let win, appIcon;
let aboutWin;

var iconPath = __dirname + '/icon.png';

function createWindow() {
    win = new BrowserWindow({
        icon: iconPath
    });

    win.loadURL('file://' + __dirname + '/index.html');

    win.setMenu(null);

    win.webContents.openDevTools();

    win.on('closed', () => {
        win = null;
        app.quit();
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

//兼容macosx操作
app.on('activate', () => {
    if (win === null) {
        createWindow();
    }
});
