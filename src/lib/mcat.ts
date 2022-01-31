import {default as axios} from "axios";
import db from "./db";

async function fetchCurrentSong() {
    let secret = await db.getData("/secret");
    if(!secret) return;
    secret = secret.split("=")[1];

    let res;
    try {
        res = await axios.get(`https://player.monstercat.app/api/currently-playing?code=${secret}`)
    }   catch(e) {
        console.log();
    }
    if(!res.data) return;
    return res.data;
}

export default fetchCurrentSong;