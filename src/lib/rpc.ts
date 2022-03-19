import * as RPC from 'discord-rpc';
import fetchCurrentSong from './mcat';
import * as moment from 'moment';
import db from './db';

let client = new RPC.Client({
	transport: 'ipc',
});

let currentRPC: RPC.Presence = {
	state: 'Loading...',
	startTimestamp: new Date(),
	instance: false,
};

const totalTime = new Date();

let int: NodeJS.Timer;

(async () => {
	handleCurrentSong(await await fetchCurrentSong());
})();

setInterval(async () => {
	handleCurrentSong(await await fetchCurrentSong());
}, 5000);

async function rpcState(enabled: boolean) {
	if (enabled == true) {
		client.setActivity(currentRPC);
		if (int) clearInterval(int);
		int = setInterval(async () => {
			client.setActivity(currentRPC);
		}, 15 * 1000);
	} else {
		if (int) clearInterval(int);
		client.clearActivity();
	}
}

client.login({ clientId: '937700767794610227' }).catch(console.error);

const utils = {
	setRPC(rpc: RPC.Presence) {
		currentRPC = rpc;
	},
	startRPC() {
		rpcState(true);
	},
	stopRPC() {
		rpcState(false);
	},
	killRPC() {
		rpcState(false);
		client.clearActivity();
		client.destroy();
		client = new RPC.Client({
			transport: 'ipc',
		});
	},
	reconnect() {
		client.login({ clientId: '937700767794610227' });
		client.connect('937700767794610227').catch(console.error);
		rpcState(true);
	},
};

export default utils;

type CurrentlyPlaying = {
	CurrentlyPlaying?: {
		ReleaseId: string;
		TrackId: string;
		UserId: string;
		PlayTime: Date;
		CurrentPlayLocation: number;
		Duration: number;
		TrackTitle: string;
		TrackVersion: string;
		ReleaseTitle: string;
		ArtistsTitle: string;
		CatalogId: string;
	};
	playing: boolean;
};

async function handleCurrentSong(input: CurrentlyPlaying) {
	const data = await db.getData('/timeType');
	if (!input.playing) {
		utils.setRPC({
			state: 'Paused',
		});
		utils.stopRPC();
	} else {
		const current = input.CurrentlyPlaying;
		const times: any = {
			remaining: moment()
				.add(current.Duration, 'seconds')
				.subtract(current.CurrentPlayLocation, 'seconds')
				.toDate(),
			elapsed: moment()
				.subtract(current.CurrentPlayLocation, 'seconds')
				.toDate(),
			total: totalTime,
		};

		const time: any = times[data];

		utils.startRPC();

		const presObj: RPC.Presence = {
			details: `${current.ArtistsTitle} - ${current.TrackTitle}${current.TrackVersion !=
			''
				? ` (${current.TrackVersion})`
				: ''}`,
			state: `from ${current.ReleaseTitle}`,
			largeImageKey: 'mcat',
			largeImageText: 'Listening to the Monstercat Library',
			buttons: [
				{
					label: 'Play',
					url: `https://www.monstercat.com/release/${current.ReleaseId}`,
				},
			],
		};

		if (data == 'remaining') {
			presObj.endTimestamp = time;
		} else {
			presObj.startTimestamp = time;
		}

		utils.setRPC(presObj);
	}
}
