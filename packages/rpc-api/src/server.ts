import { type Express } from 'express';
import { JSONRPCServer, TypedJSONRPCServer, type CreateID } from "json-rpc-2.0";
import { log } from '@repo/logger';
import type { RPC } from "./types";
import { createID } from './helpers';
import { createServer } from './http-server';

export * from './helpers';

// export function rpc(url: string | URL | globalThis.Request, request: RPC.Request, ...args: Parameters<typeof construct_rpc>) {
//     return !isJSONRPCRequest(request) ? reject('Parse error') : fetch(url, construct_rpc(...args)).then(res => res.json()) as RPC.ResponsePromise;
// }

export interface ServerConfig<
    M extends RPC.MethodRecord = RPC.MethodRecord,
    A extends RPC.AdvancedMethodRecord = RPC.AdvancedMethodRecord,
    P extends any = void
> {
    host: string;
    port: number;

    nextId?: CreateID;
    /**
     * A lookup map for RPC methods. this object MUST contain ONLY key/value pairs for method names and their handlers.
     */
    rpcMethods?: M;
    /**
     * A lookup map for advanced RPC methods.
     * 
     * These methods receive raw JSONRPCRequest objects and MUST return a JSONRPCResponse object.
     * 
     * Similarly to `config.rpcMethods`, `rpcAdvancedMethods` must ONLY contain key/value pairs for method names and their handlers.
     */

    rpcAdvancedMethods?: A

    /**
     * An optional array of middleware to apply to rpc calls.
     * 
     * If provided, middleware in this config will be added BEFORE any middleware added via the `addMiddleware` method.
     * 
     * **Middleware will be called in the order provided.**
     */
    rpcMiddleware?: RPC.Middleware<P>[];
}

export class Server<
    Context extends Record<PropertyKey, unknown>,
    Methods extends RPC.MethodRecord = RPC.MethodRecord,
    AdvancedMethods extends RPC.AdvancedMethodRecord = RPC.AdvancedMethodRecord,
    Params = void,
> {
    #rpc: TypedJSONRPCServer<Methods & AdvancedMethods, Params>;
    #app: Express;
    #meta: {
        host: string;
        port: NonNullable<ServerConfig['port']>;
        url: `https://${string}:${string}/`;
        context: Context;
    }
    #nextId: CreateID;

    constructor(config: ServerConfig<Methods, AdvancedMethods, Params>) {
        const app = createServer();
        const server: TypedJSONRPCServer<Methods & AdvancedMethods, Params> = new JSONRPCServer();

        this.#addConfigListeners(server, config)

        app.post('/jsonrpc', (req, res) => {
            const jsonRpcRequest = req.body;
            log(`Incoming Request: ${JSON.stringify(req.body)}`);

            server.receive(jsonRpcRequest).then(jsonRpcResponse => {
                if (jsonRpcResponse) {
                    log(`Response: ${JSON.stringify(jsonRpcResponse)}`)
                    res.json(jsonRpcResponse);
                } else {
                    // If the response is absent, it was JSON-RPC notification.
                    // Return a "no content status" (204).
                    res.sendStatus(204);
                }
            });
        });

        const HOST = config.host ?? 'localhost',
            PORT = config.port ?? 3000,
            url = `http://${HOST}:${PORT}/` as const;

        const meta = {
            host: HOST,
            port: PORT,
            url,
            context: {}
        }

        this.#rpc = server;
        this.#app = app;
        this.#meta = meta as any;
        this.#nextId = config.nextId ?? createID();
    }

    setContext(context: Context) {
        const ctx = this.#meta.context;
        for (const key in context) {
            if (Object.prototype.hasOwnProperty.call(context, key)) {
                ctx[key] = context[key];
            }
        }
        return ctx;
    }

    get context() {
        return this.#meta.context;
    }

    nextId(): RPC.Id {
        return this.#nextId();
    }

    get url() {
        return this.#meta.url;
    }

    get host() {
        return this.#meta.host;
    }

    get port() {
        return this.#meta.port;
    }

    listen(callback?: () => void) {
        // update meta port to port if this 

        this.#app.listen(this.#meta.port, callback);
    }

    /**
     * Adds middleware(s) to the internal JSON-RPC 2.0 server.
     * Any middleware(s) added by this method are applied AFTER middleware in the `ServerConfig`.
     * 
     * **Middleware(s) are applied in the order they are provided**.
     */
    addMiddleware(...middleware: RPC.Middleware<Params>[]) {
        this.#rpc.applyMiddleware(...middleware);
    }

    /**
     * Calls `JSONRPCServer.receive`.
     * 
     * `server.receive` takes a JSON-RPC request and returns a promise of a JSON-RPC response.
     * It can also receive an array of requests, in which case it may return an array of responses.
     * Alternatively, you can use `server.receiveJSON`, which takes JSON string as is (in this case req.body).
     */
    receive(rpcMethod: string, { service, method, args, id = this.#nextId() }: {
        service: string;
        method: string;
        args: any[];
        id: RPC.Id;
    }) {
        return this.#rpc.receive({
            "jsonrpc": "2.0",
            "method": rpcMethod,
            "params": {
                service,
                method,
                args
            },
            "id": id,
        });
    }

    receiveJson(json: string) {
        return this.#rpc.receiveJSON(json);
    }

    /**
     * Adds the json rpc methods, advanced methods, and middleware
     */
    #addConfigListeners(server: any, config: ServerConfig<Methods, AdvancedMethods, Params>) {
        // add rpc methods
        const { rpcMethods, rpcAdvancedMethods, rpcMiddleware } = config;

        for (const [methodName, method] of Object.entries(rpcMethods ?? [])) {
            server.addMethod(methodName, method);
        }

        for (const [methodName, method] of Object.entries(rpcAdvancedMethods ?? [])) {
            server.addMethodAdvanced(methodName, method);
        }

        if (rpcMiddleware) {
            server.applyMiddleware(...rpcMiddleware);
        }
    }
}