/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import {
	app,
	BrowserWindow,
	shell,
	ipcMain as ipc,
	Tray,
	Menu,
} from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { resolveHtmlPath } from './util';
import db from '../lib/db';
import rpc from '../lib/rpc';
import fetchCurrentSong from '../lib/mcat';

export default class AppUpdater {
	constructor() {
		log.transports.file.level = 'info';
		autoUpdater.logger = log;
		autoUpdater.checkForUpdatesAndNotify();
	}
}

let tray: Tray;

let mainWindow: BrowserWindow | null = null;
let mcatWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
	const sourceMapSupport = require('source-map-support');
	sourceMapSupport.install();
}

const isDebug =
	process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
	require('electron-debug')();
}

const installExtensions = async () => {
	const installer = require('electron-devtools-installer');
	const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
	const extensions = ['REACT_DEVELOPER_TOOLS'];

	return installer
		.default(
			extensions.map((name) => installer[name]),
			forceDownload
		)
		.catch(console.log);
};

const RESOURCES_PATH = app.isPackaged
	? path.join(process.resourcesPath, 'assets')
	: path.join(__dirname, '../../assets');

const getAssetPath = (...paths: string[]): string => {
	return path.join(RESOURCES_PATH, ...paths);
};

const createWindow = async () => {
	if (mainWindow) return mainWindow.show();
	if (isDebug) {
		await installExtensions();
	}
	mainWindow = new BrowserWindow({
		show: false,
		width: 1024,
		height: 750,
		minWidth: 540,
		minHeight: 750,
		icon: getAssetPath('icon.png'),
		title: 'Monstercat Discord RPC',
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
		},
	});

	mainWindow.loadURL(resolveHtmlPath('index.html'));

	mainWindow.on('ready-to-show', () => {
		if (!mainWindow) {
			throw new Error('"mainWindow" is not defined');
		}
		if (process.env.START_MINIMIZED) {
			mainWindow.minimize();
		} else {
			mainWindow.show();
		}
	});

	mainWindow.setMenu(null);

	mainWindow.on('closed', () => {
		mainWindow = null;
	});

	// Open urls in the user's browser
	mainWindow.webContents.setWindowOpenHandler((edata) => {
		shell.openExternal(edata.url);
		return { action: 'deny' };
	});

	// Remove this if your app does not use auto updates
	// eslint-disable-next-line
	new AppUpdater();
};

const createMcat = async (url?: string) => {
	if (mcatWindow) return mainWindow.show();
	if (isDebug) {
		await installExtensions();
	}
	mcatWindow = new BrowserWindow({
		show: false,
		width: 1024,
		height: 750,
		minWidth: 540,
		minHeight: 750,
		icon: getAssetPath('icon.png'),
		title: 'Monstercat Discord RPC',
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
		},
	});

	mcatWindow.loadURL(url || 'https://player.monstercat.app');

	mcatWindow.on('ready-to-show', () => {
		if (!mcatWindow) {
			throw new Error('"mcatWindow" is not defined');
		}
		if (process.env.START_MINIMIZED) {
			mcatWindow.minimize();
		} else {
			mcatWindow.show();
		}
	});

	mcatWindow.setMenu(null);

	mcatWindow.on('closed', () => {
		mcatWindow = null;
	});

	// Open urls in the user's browser
	mcatWindow.webContents.setWindowOpenHandler((edata) => {
		shell.openExternal(edata.url);
		return { action: 'deny' };
	});
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', (e: any) => {
	e.preventDefault();
});

app.whenReady()
	.then(() => {
		createWindow();

		tray = new Tray(getAssetPath('icon.png'));

		tray.setToolTip('Monstercat Discord RPC');

		const contextMenu = Menu.buildFromTemplate([
			{ label: 'Mcat-Dc', type: 'normal', enabled: false },
			{
				label: 'Main Window',
				type: 'normal',
				click() {
					createWindow();
				},
			},
			{
				label: 'Player',
				type: 'normal',
				click: () => {
					createMcat();
				},
			},
			{
				label: 'Quit',
				type: 'normal',
				click: () => {
					app.quit();
				},
			},
		]);

		tray.setContextMenu(contextMenu);

		tray.on('click', () => {
			createWindow();
		});

		app.on('activate', () => {
			// On macOS it's common to re-create a window in the app when the
			// dock icon is clicked and there are no other windows open.
			if (mainWindow === null) createWindow();
		});
	})
	.catch(console.log);

ipc.on('data', async (e) => {
	const data = await db.getData();

	e.reply('data', data);
});

ipc.on('start', (e) => {
	rpc.startRPC();
	e.reply('start');
});

ipc.on('stop', (e) => {
	rpc.killRPC();
	e.reply('stop');
});

ipc.on('kill', (e) => {
	rpc.killRPC();
	e.reply('kill');
});

ipc.on('reconnect', (e) => {
	rpc.reconnect();
	e.reply('reconnect');
});

ipc.on('logout', async (e) => {
	rpc.stopRPC();

	await db.delete('/secret');

	e.reply('logout');
});

ipc.on('save', async (e, path, data) => {
	await db.push(path, data);
	e.reply('save');
});

ipc.on('currentSong', async (e) => {
	e.reply('currentSong', await fetchCurrentSong());
});

ipc.on('open-player', async (e, url: string | undefined) => {
	createMcat(url);
	e.reply('open-player');
});
