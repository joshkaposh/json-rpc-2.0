import type { Express } from 'express';
import { JSONRPCServer, type TypedJSONRPCServer, type JSONRPCRequest, type JSONRPCServerMiddleware, type JSONRPCResponse, type JSONRPCResponsePromise } from 'json-rpc-2.0';
import { createServer } from './server';

/**
 * A lookup map for RPC methods. this object MUST contain ONLY key/value pairs for method names and their handlers.
 */
export type RPCMethodRecord = Record<string, (params?: any) => any>;
export type RPCAdvancedMethodRecord = Record<string, (request: JSONRPCRequest) => PromiseLike<JSONRPCResponse>>;

export type RPCMiddleware<ServerParams = void> = (request: JSONRPCRequest, serverParams: ServerParams) => JSONRPCResponsePromise

export interface ServerConfig<
    M extends RPCMethodRecord = RPCMethodRecord,
    A extends RPCAdvancedMethodRecord = RPCAdvancedMethodRecord,
    P extends any = void
> extends RPC.HttpServerConfig {
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
    rpcMiddleware?: JSONRPCServerMiddleware<P>[];
}

export function reject(message?: string, options?: ErrorOptions) {
    return Promise.reject(new Error(message, options))
}

export class Server<
    RpcMethods extends RPCMethodRecord = RPCMethodRecord,
    RpcAdvancedMethods extends RPCAdvancedMethodRecord = RPCAdvancedMethodRecord,
    RpcParams = void
> {
    #rpc: TypedJSONRPCServer<RpcMethods & RpcAdvancedMethods, RpcParams>;
    #app: Express;
    #meta: {
        host: string;
        port: NonNullable<ServerConfig['port']>;
        url: `https://${string}:${string}/`;
        context: Record<PropertyKey, unknown>;
    }

    constructor(config: ServerConfig<RpcMethods, RpcAdvancedMethods, RpcParams> = {}) {
        const app = createServer();
        app.post('/json-rpc', (req, res) => {
            const jsonRpcRequest = req.body;
            server.receive(jsonRpcRequest).then(jsonRpcResponse => {
                if (jsonRpcResponse) {
                    res.json(jsonRpcResponse);
                } else {
                    // If the response is absent, it was JSON-RPC notification.
                    // Return a "no content status" (204).
                    res.sendStatus(204);
                }
            });
        });

        const server: TypedJSONRPCServer<RpcMethods, RpcParams> = new JSONRPCServer();

        this.#addConfigListeners(server, config.rpcMethods, config.rpcAdvancedMethods, config.rpcMiddleware)

        const HOST = config.host ?? 'localhost',
            PORT = config.port ?? 3000,
            url = `https://${HOST}:${PORT}/` as const;

        const meta = {
            host: HOST,
            port: PORT,
            url,
            context: {}
        }

        this.#rpc = server;
        this.#app = app;
        this.#meta = meta as any;
    }

    get context() {
        return this.#meta.context;
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
    addMiddleware(...middleware: JSONRPCServerMiddleware<RpcParams>[] | readonly JSONRPCServerMiddleware<RpcParams>[]) {
        this.#rpc.applyMiddleware(...middleware);
    }

    /**
     * Calls `JSONRPCServer.receive`.
     * 
     * `server.receive` takes a JSON-RPC request and returns a promise of a JSON-RPC response.
     * It can also receive an array of requests, in which case it may return an array of responses.
     * Alternatively, you can use `server.receiveJSON`, which takes JSON string as is (in this case req.body).
     */
    rpc(method: string, params: RpcParams, id: number | string = crypto.randomUUID()) {
        return this.#rpc.receive({
            "jsonrpc": "2.0",
            "method": method,
            "params": params,
            "id": id,
        });
    }

    rpcFromJson(json: string) {
        return this.#rpc.receiveJSON(json);
    }

    /**
     * Adds the json rpc methods, advanced methods, and middleware
     */
    #addConfigListeners(server: RPC.Server<RpcMethods, RpcAdvancedMethods, RpcParams>, methods: RpcMethods | undefined, advanced_methods: RpcAdvancedMethods | undefined, middleware: JSONRPCServerMiddleware<RpcParams>[] | undefined) {
        // add rpc methods
        type Keys = Extract<keyof RpcMethods, string>;
        for (const [methodName, method] of Object.entries(methods ?? []) as [Keys, RpcMethods[Keys]][]) {
            server.addMethod(methodName, method);
        }

        for (const [methodName, method] of Object.entries(advanced_methods ?? []) as [Keys, RpcMethods[Keys]][]) {
            server.addMethodAdvanced(methodName, method);
        }

    }
}