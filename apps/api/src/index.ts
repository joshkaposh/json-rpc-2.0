// import { createServer } from "./server";
import { Server } from './rpc-server';
import { log } from "@repo/logger";

const port = process.env.PORT ?? 3001;
const server = new Server({ port: Number(port) });

server.listen(() => log(`api running on ${port}`));

// server.listen(port, () => {
//   log(`api running on ${port}`);
// });
