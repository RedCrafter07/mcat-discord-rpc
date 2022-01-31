import * as RPC from "discord-rpc";
import fetchCurrentSong from "./mcat";
// import * as moment from "moment";

const client = new RPC.Client({
    transport: "ipc"
});

let currentRPC: RPC.Presence = {
    state: "Loading...",
    startTimestamp: new Date(),
    instance: false
}

let int: any;

async function rpcState(enabled: boolean) {
    if(enabled == true) {
        client.setActivity(currentRPC)
        if(int) clearInterval(int);
        handleCurrentSong(await fetchCurrentSong());
        int = setInterval(async () => {
            client.setActivity(currentRPC)
            handleCurrentSong(await fetchCurrentSong());
        }, 15 * 1000)
    }   else {
        if(int) clearInterval(int);
        client.clearActivity();
    }
}

client.login({ clientId:"937700767794610227" }).catch(console.error);

const utils = {
    setRPC(rpc: RPC.Presence) {
        currentRPC = rpc;
    },
    startRPC() {
        rpcState(true)
    },
    stopRPC() {
        rpcState(false)
    }
}

export default utils;

type CurrentlyPlaying = {
    CurrentlyPlaying: {
      ReleaseId: string,  
      TrackId: string,
      UserId: string,
      PlayTime: Date,
      CurrentPlayLocation: number,
      Duration: number,
      TrackTitle: string,
      TrackVersion: string,
      ReleaseTitle: string,
      ArtistsTitle: string,
      CatalogId: string
    }
  }

async function handleCurrentSong(input: CurrentlyPlaying) {
    const current = input.CurrentlyPlaying;
    if(!current) utils.stopRPC();
    utils.setRPC({
        details: `${current.ArtistsTitle} - ${current.TrackTitle}${current.TrackVersion != "" ? ` (${current.TrackVersion})` : ""}`,
        state: `from ${current.ReleaseTitle}`,
        largeImageKey: "mcat",
        largeImageText: "Listening to the Monstercat Library",
        buttons: [
            {
                label: "Play",
                url: `https://www.monstercat.com/release/${current.ReleaseId}`
            }
        ]
    })
}