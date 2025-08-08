import { log } from '@repo/logger';
import type { RPC } from '@repo/rpc-api/types';
import type { AdvancedMethods, AuthenticatedParams, Context, CreateArgs, DeleteArgs, FieldsGetArgs, LoginParams, Methods, Params, ReadArgs, SearchArgs, SearchReadArgs, UpdateArgs } from '@repo/rpc-api/odoo';
import { SERVER_REQUESTS } from '@repo/rpc-api/odoo';
import { Server, type ServerConfig } from '@repo/rpc-api';

//  * Odoo JSON-RPC requests each have a "params" Object
//  * with the following properties:
//  *
//  * "service" - the Odoo service (e.g "object", "common").
//  *
//  * "method" - the Odoo method to invoke (e.g "execute_kw").
//  *
//  * "args" - The structure of `args` is as follows:
//  * [
//  * `<positional>`,
//  *  `<domain filters>`,
//  * `{
//  * fields?: string[],
//  * limit?: number,
//  * offset?: number,
//  * order?: string
//  * }`
//  * ]

interface OdooServerConfig<Methods extends RPC.MethodRecord = RPC.MethodRecord, AdvancedMethods extends RPC.AdvancedMethodRecord = RPC.AdvancedMethodRecord, Params = void> extends ServerConfig<Methods, AdvancedMethods, Params> {
    db: string;
}


type RpcServer = Server<Context, Methods, AdvancedMethods, Params>;

export class OdooServer {
    #server: RpcServer;
    #context: Context;
    constructor(config: OdooServerConfig<Methods, AdvancedMethods, Params>) {
        const { host, port, rpcMiddleware: configMiddleware = [] } = config;

        this.#server = new Server({
            host: host,
            port: port,
            rpcAdvancedMethods: {
                authenticate: (request: RPC.Request<'authenticate', LoginParams>) => SERVER_REQUESTS.authenticate(this.#context.url, request.params, request.id),
                create: (request: RPC.Request<'create', AuthenticatedParams<CreateArgs>>) => SERVER_REQUESTS.create(this.#context.url, request.params, request.id),
                read: (request: RPC.Request<'read', AuthenticatedParams<ReadArgs>>) => SERVER_REQUESTS.read(this.#context.url, request.params, request.id),
                search: (request: RPC.Request<'search', AuthenticatedParams<SearchArgs>>) => SERVER_REQUESTS.search(this.#context.url, request.params, request.id),
                search_read: (request: RPC.Request<'search_read', AuthenticatedParams<SearchReadArgs>>) => SERVER_REQUESTS.search_read(this.#context.url, request.params, request.id),
                update: (request: RPC.Request<'update', AuthenticatedParams<UpdateArgs>>) => SERVER_REQUESTS.update(this.#context.url, request.params, request.id),
                delete: (request: RPC.Request<'delete', AuthenticatedParams<DeleteArgs>>) => SERVER_REQUESTS.delete(this.#context.url, request.params, request.id),
                fields_get: (request: RPC.Request<'fields_get', AuthenticatedParams<FieldsGetArgs>>) => SERVER_REQUESTS.fields_get(this.#context.url, request.params, request.id),

            },
            rpcMiddleware: [...configMiddleware]
        });

        this.#context = this.#server.setContext({
            db: config.db,
            url: `https://${config.db}.dev.odoo.com/jsonrpc`
        });

        log(`Odoo endpoint = ${this.#context.url}`)
    }

    listen(callback?: () => void) {
        this.#server.listen(callback);
    }
}