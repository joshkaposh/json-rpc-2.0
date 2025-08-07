import { Odoo } from "./odoo-rpc-server";
import { log } from "@repo/logger";


const HOST = "localhost"
// const PORT = process.env.PORT ?? 6969;
const PORT = 6969;
// const DB = "https://silverflowca-risen-risen-stage-21944072.dev.odoo.com/jsonrpc"
const DB = 'silverflowca-risen-risen-stage-21944072';
const USER = "Josh Dulisse"
const PASS = "MdniT&LJ1324!"

const odoo = new Odoo({
    host: HOST,
    port: PORT as number,
    db: DB,
    credentials: {
        login: USER,
        password: PASS,
    }
});


odoo.listen(() => log(`api running at http://${HOST}:${PORT}`));

// const server = new Server({ port: Number(port) });

// server.listen(() => log(`api running on ${port}`));


// server.listen(port, () => {
//   log(`api running on ${port}`);
// });
