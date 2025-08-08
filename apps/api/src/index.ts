import { OdooServer } from "./odoo-rpc-server";
import { log } from "@repo/logger";

const HOST = "localhost"
// const PORT = process.env.PORT ?? 6969;
const PORT = 6969;
// const DB = "https://silverflowca-risen-risen-stage-21944072.dev.odoo.com/jsonrpc"
const DB = 'silverflowca-risen-risen-stage-21944072';

const odoo = new OdooServer({
    host: HOST,
    port: PORT,
    db: DB
});


odoo.listen(() => log(`api running at http://${HOST}:${PORT}`));