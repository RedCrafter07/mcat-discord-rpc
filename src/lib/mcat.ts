import { default as axios } from 'axios';
import db from './db';

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

async function fetchCurrentSong(): Promise<CurrentlyPlaying> {
	let secret = (await db.getData()).secret;
	if (!secret || typeof secret != 'string') return;
	secret = secret.split('=')[1];

	let res;
	try {
		res = await axios.get(
			`https://player.monstercat.app/api/currently-playing?code=${secret}`
		);
	} catch (e) {
		// console.log(e);
	}

	if (!res || !res.data) return { playing: false };
	else res.data.playing = true;
	return res.data;
}

export default fetchCurrentSong;
