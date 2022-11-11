import { app } from 'electron';
import path from 'path';
import { readFile, writeFile } from 'fs/promises';

const dataPath = path.join(app.getPath('userData'), 'data.json');

async function getData() {
	try {
		const data = await readFile(dataPath, 'utf-8');
		const parsedData = JSON.parse(data);

		return parsedData;
	} catch (e) {
		initDatabase();
		return {};
	}
}

async function writeData(data: any) {
	await writeFile(dataPath, JSON.stringify(data));
}

async function push(path: string, data: any) {
	const currentData = await getData();

	const pathParts = path.split('/').filter((part) => part !== '');
	let currentPath = currentData;

	pathParts.forEach((d, i, a) => {
		if (i === a.length - 1) {
			currentPath[d] = data;
		} else {
			if (!currentPath[d]) currentPath[d] = {};
			currentPath = currentPath[d];
		}
	});

	await writeData(currentData);
}

async function initDatabase() {
	console.log(dataPath);
	const data = await getData();
	if (!data.timeType) data.timeType = 'remaining';
	if (!data.show)
		data.show = {
			time: true,
			trackName: true,
			artistName: true,
			albumName: true,
			playButton: true,
		};
	if (!data.openPlayerExternally) data.openPlayerExternally = true;
	await push('/', data);
}

initDatabase();

async function deleteData(path: string) {
	const currentData = await getData();

	const pathParts = path.split('/').filter((part) => part !== '');
	let currentPath = currentData;

	pathParts.forEach((d, i, a) => {
		if (i === a.length - 1) {
			delete currentPath[d];
		} else {
			if (!currentPath[d]) currentPath[d] = {};
			currentPath = currentPath[d];
		}
	});

	await writeData(currentData);
}

export default {
	getData,
	push,
	delete: deleteData,
};
