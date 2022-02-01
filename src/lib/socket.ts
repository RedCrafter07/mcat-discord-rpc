import { Server } from "ws";
import db from "./db";
import rpc from "./rpc";

export default async function() {
    const WebSocketServer = new Server({ port: 8080, host: "127.0.0.1" });
    WebSocketServer.on("connection", socket => {
        socket.on("message", async (message) => {
            socket.send(JSON.stringify({msg: "Hello World"}));

            const msg: string = message.toString();

            if(msg.startsWith("req_")) {
                switch (msg.slice("req_".length)) {
                    case "data": 
                        {
                            socket.send(JSON.stringify({
                                type: "data",
                                data: db.getData("/")
                            }))
                        }
                        break;
                    case "rpc_start": 
                        {
                            rpc.startRPC();
                            socket.send(JSON.stringify({
                                type: "confirm", data: "rpc_start"
                            }))
                        }
                        break;
                    case "rpc_stop": 
                        {
                            rpc.stopRPC();
                            socket.send(JSON.stringify({
                                type: "confirm", data: "rpc_stop"
                            }))
                        }
                        break;
                }
            } else if (msg.startsWith("save_")) {
                const data = JSON.parse(msg.slice("save_".length));
                const path = data.path;
                const data2 = data.data;
                await db.push(path, data2);
                socket.send(JSON.stringify({
                    type: "confirm",
                    data: "save"
                }))
            }
        });
    });

    return WebSocketServer;
}