import { JsonDB } from 'node-json-db';
import { Config } from 'node-json-db/dist/lib/JsonDBConfig'

// The first argument is the database filename. If no extension, '.json' is assumed and automatically added.
// The second argument is used to tell the DB to save after each push
// If you put false, you'll have to call the save() method.
// The third argument is to ask JsonDB to save the database in an human readable format. (default false)
// The last argument is the separator. By default it's slash (/)
const db = new JsonDB(new Config("data", true, false, '/'));

(async () => {
    const data = await db.getData("/");
    if(!data.timeType) data.timeType = "remaining";
    if(!data.show) data.show = {
        "time": true,
        "trackName": true,
        "artistName": true,
        "albumName": true,
        "playButton": true
    }

    await db.push("/", data);
})()

export default db;