import express from 'express';
import db from './db';
import rpc from './rpc';
import bodyParser from 'body-parser';
import cors from 'cors';
import fetchCurrentSong from './mcat';

export default async function () {
	const app = express();

	app.use(bodyParser.json());

	app.use(cors());

	app.post('/data', async (req, res) => {
		const data = await db.getData('/');
		res.json(data).status(200);
	});

	app.post('/start', (req, res) => {
		rpc.startRPC();
		res.status(200);
	});

	app.post('/stop', (req, res) => {
		rpc.stopRPC();
		res.status(200);
	});

	app.post('/kill', (req, res) => {
		rpc.killRPC();
		res.status(200);
	});

	app.post('/reconnect', (req, res) => {
		rpc.reconnect();
		res.status(200);
	});

	app.post('/logout', (req, res) => {
		db.delete('/secret');
		rpc.stopRPC();
		res.status(200);
	});

	app.post('/save', async (req, res) => {
		const path = req.headers.path;
		const data = req.headers.data;
		await db.push(Array.isArray(path) ? path[0] : path, data);
		res.status(200);
	});

	app.get('/currentSong', async (req, res) => {
		res.json(await fetchCurrentSong());
	});

	app.listen(8090, '127.0.0.1');
}
