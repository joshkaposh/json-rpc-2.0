import type { CreateID, JSONRPCResponse } from 'json-rpc-2.0';
import { construct_rpc, rpc, Server, type ServerConfig } from './rpc-server';

// /**
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
//  *
//  * this is an array with positional elements
//  * that MUST match the expected order that the Odoo JSON-RPC method expects.
//  * 
//  * 
//  * Most calls require `<domain filter>`, which at the minimum MUST be an empty array.
//  * 
//  * Use the last position of the array for options (e.g "limit", "offset" for pagination).
//  */
// type OdooArgs = (string | number)[] | [Json.Object] | [...(string | number)[], [string, string, string][], {
//     fields?: string[];
//     limit?: number;
//     offset?: number;
//     order?: string;
// }];

type OdooSearchOptions = {
    fields: string[];
    limit?: number;
    offset?: number;
} | string[];

type OdooDomainFilter = [ident: string, op: string, equals: Json.Primitive][] | [[]];

type OdooAuthenticatedCall<T extends string = string> = [db: string, uid: number, key: string, model_name: string, method: T];

// type Args<Method extends 'create' | 'search_read' | 'write' | 'unlink'> = [...Json.Primitive[], model: string, method: Method];

type OdooCreateArgs = [...OdooAuthenticatedCall<'create'>, Record<string, Json.Primitive>];
type OdooSearchArgs = [...OdooAuthenticatedCall<'search_read'>, domain_filter: OdooDomainFilter, options: OdooSearchOptions];
type OdooUpdateArgs = [...OdooAuthenticatedCall<'write'>, any[], Record<string, Json.Primitive>];
type OdooDeleteArgs = [...OdooAuthenticatedCall<'unlink'>, any[]];

type OdooRpcArgs = OdooCreateArgs | OdooSearchArgs | OdooUpdateArgs | OdooDeleteArgs;
type OdooRpcAuthArgs = [database: string, username: string, password: string];

type OdooRpcParams = {
    service: 'object';
    method: 'execute';
    args: OdooRpcArgs;
}

type OdooRpcAuthParams = {
    service: 'common';
    method: 'authenticate';
    args: OdooRpcAuthArgs;
}

// interface OdooRequest extends JSONRPCRequest {
//     id: number;
//     method: 'call';
//     params: OdooRpcParams;
// }

// interface OdooAuthRequest extends JSONRPCRequest {
//     id: number;
//     method: 'call';
//     params: OdooRpcAuthParams;
// }

interface OdooServerConfig<Methods extends RPC.MethodRecord = RPC.MethodRecord, AdvancedMethods extends RPC.AdvancedMethodRecord = RPC.AdvancedMethodRecord, Params = void> extends ServerConfig<Methods, AdvancedMethods, Params> {
    /**
     * the Odoo instance url (e.g https://your_odoo_instance_url/ **without** the protocol or trailing `/`).
     */
    db: string;
    nextId?: CreateID

    credentials?: {
        login: string;
        password: string;
    }
}

type OdooMethods<M extends RPC.MethodRecord> = M & {
    /**
     * create record(s) on a model.
     */
    create(params: { args: OdooCreateArgs }): PromiseLike<JSONRPCResponse | null>;

    /**
     * fetch record(s) from a model.
     */
    search_read(params: { args: OdooSearchArgs }): PromiseLike<JSONRPCResponse | null>;

    /**
     * update record(s) on a model.
     */
    update(params: { args: OdooUpdateArgs }): PromiseLike<JSONRPCResponse | null>;

    /**
     * delete a record on a model.
     */
    delete(params: { args: OdooDeleteArgs }): PromiseLike<JSONRPCResponse | null>;
}
type OdooParams = OdooRpcParams | OdooRpcAuthParams;

type OdooContext = Pick<OdooServerConfig, 'credentials' | 'db'> & {
    auth_uri: string;
};

export class Odoo<Methods extends RPC.MethodRecord, AdvancedMethods extends RPC.AdvancedMethodRecord & {
}> {
    #server: Server<OdooContext, OdooMethods<Methods>, AdvancedMethods, OdooParams>;
    constructor(config: OdooServerConfig<Methods, AdvancedMethods, OdooParams>) {
        const { host, rpcMethods: configMethods = {}, rpcAdvancedMethods: configAdvancedMethods = {}, rpcMiddleware: configMiddleware = [] } = config;

        this.#server = new Server<OdooContext, OdooMethods<Methods>, AdvancedMethods, OdooParams>({
            host: host,
            rpcMethods: {
                ...configMethods as OdooMethods<Methods>,
                create: ({ args }) => this.#rpc(args),
                search_read: ({ args }) => this.#rpc(args),
                update: ({ args }) => this.#rpc(args),
                delete: ({ args }) => this.#rpc(args),
            },
            rpcAdvancedMethods: {
                authenticate: (request: RPC.Request<{ args: OdooRpcAuthArgs }>) => this.#authenticate(request),
                ...configAdvancedMethods as OdooMethods<AdvancedMethods>
            },
            rpcMiddleware: [...configMiddleware]
        });

        const ctx = this.#server.context;
        ctx.credentials = config.credentials;
        ctx.db = config.db;
        ctx.auth_uri = `https://${config.db}/web/session/authenticate`;
    }

    listen(callback?: () => void) {
        // const credentials = this.#server.context.credentials as Record<string, string>;
        // if (credentials) {
        //     const { db, login, password } = credentials;
        //     await this.#authenticate([db, login, password]).then(console.log);
        // }

        this.#server.listen(callback);
    }

    #rpc(args: OdooRpcArgs) {
        return this.#server.rpc('call', {
            service: 'object',
            method: 'execute',
            args
        });
    }

    // "silverflowca-risen-risen-stage-21944072",       // DB name
    //   2,                                               // user ID (e.g. your user ID)
    //   "a753ee99287123cd1754058ae894f00a7094cee9",      // API key

    async #authenticate(request: RPC.Request<{ args: OdooRpcAuthArgs }>) {
        const ctx = this.#server.context;
        const args = request.params.args;
        return rpc(
            ctx.auth_uri,
            construct_rpc('call', { args }, this.#server.nextId()),
            'call', {
            args
        },
            this.#server.nextId()
        );
    }
}
