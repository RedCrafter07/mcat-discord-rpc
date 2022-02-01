import { app, BrowserWindow, Tray, Menu, NativeImage, nativeImage, Notification } from 'electron';
import * as path from 'path';
import rpc from "./lib/rpc";

import socket from "./lib/socket";

const WebSocket = socket();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  // eslint-disable-line global-require
  app.quit();
}

let stopped = false;

let tray: Tray | null;

let mainWindow: BrowserWindow | null = null;

const createWindow = (): void => {
  // Create the browser window.
  if(mainWindow) {
    mainWindow.show();
    return
  }
  mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    darkTheme: true,
  });

  mainWindow.on("close", () => {
    mainWindow = null;
    if(stopped == true) return;
    new Notification({
      title: "Mcat-Dc",
      body: "Mcat-Dc is still running in the background! Check your system tray to open it again or quit the app.",
      silent: true,
      timeoutType: "default",
      subtitle: "Info"
    }).show()
  })

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, '../src/index.html'));
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

app.whenReady().then(() => {
  createWindow();
  runTray();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', (e: any) => {
	e.preventDefault();
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

function runTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, "../src/mcat.png")).resize({ width: 32, height: 32 });
	tray = new Tray(icon);
	const contextMenu = Menu.buildFromTemplate([
		{ label: 'Mcat-Dc', type: 'normal', enabled: false },
		{
			label: 'Quit',
			type: 'normal',
			click: () => {
        stopped = true;
				app.quit();
			}
		}
	]);

  tray.on("click", () => {
    createWindow();
  })

  tray.setContextMenu(contextMenu);
}