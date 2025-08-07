import type { JSONRPCRequest, JSONRPCResponse, JSONRPCResponsePromise, JSONRPCServerMiddleware, TypedJSONRPCClient } from 'json-rpc-2.0';
import { RPCAdvancedMethodRecord, RPCMethodRecord } from './rpc-server';

// export declare namespace RPC {

//     type RpcRequest = JSONRPCRequest;
//     type RpcResponse = JSONRPCResponse;


//     export interface HttpsServerConfig {
//         host: string;
//         secure: {
//             key: URL;
//             cert: URL;
//         };
//         /** 
//          * Port number.
//          * Defaults to [`6969`].
//          */
//         port?: number | `${number}`;
//     }

//     /**
//  * A lookup map for RPC methods. this object MUST contain ONLY key/value pairs for method names and their handlers.
//  */
//     export type MethodRecord = Record<string, (params?: any) => any>;
//     export type AdvancedMethodRecord = Record<string, (request: RpcRequest) => PromiseLike<RpcResponse>>;

//     export type Middleware<ServerParams = void> = (request: RpcRequest, serverParams: ServerParams) => JSONRPCResponsePromise

//     export interface RpcServerConfig<
//         M extends MethodRecord = MethodRecord,
//         A extends AdvancedMethodRecord = AdvancedMethodRecord,
//         P extends any = void
//     > extends RPC.HttpsServerConfig {
//         /**
//          * A lookup map for RPC methods. This object MUST contain ONLY key/value pairs for method names and their handlers.
//          */
//         rpcMethods?: M;

//         /**
//          * A lookup map for RPC methods. Handlers receive a raw `JSONRPCRequest` and return a raw `JSONRPCResponse` This object MUST contain ONLY key/value pairs for method names and their handlers.
//          */

//         rpcAdvancedMethods?: A

//         /**
//          * An optional array of middleware to apply to rpc calls.
//          * 
//          * Middleware will be called in the order provided.
//          */
//         rpcMiddleware?: readonly JSONRPCServerMiddleware<P>[] | JSONRPCServerMiddleware<P>[];
//     }

//     export type RpcClient<
//         M extends MethodRecord = MethodRecord,
//         A extends AdvancedMethodRecord = AdvancedMethodRecord,
//         P extends any = void
//     > = TypedJSONRPCClient<M & A, P>
// }


declare global {

    declare namespace Json {
        export type Primitive = JsonPrimitive;
        export type Value = JsonPrimitive | JsonObject | (JsonPrimitive | JsonObject)[];
        export type Object = JsonObject;

        type JsonPrimitive = string | number | boolean | null;
        type JsonValue = JsonPrimitive | JsonObject | (JsonPrimitive | JsonObject)[];
        interface JsonObject {
            [key: string]: JsonValue;
        }

    }

    declare namespace Decorator {
        type OptionalFunction = Function | void;

        export type Method = (value: Function, context: {
            kind: 'method',
            name: string | symbol;
            access: { get(): unknown };
            static: boolean;
            addInitializer(initializer: () => void): void;
        }) => OptionalFunction;

        export type Getter = (value: Function, context: {
            kind: 'getter';
            name: string | symbol;
            access: { get(): unknown };
            static: boolean;
            private: boolean;
            addInitializer(initializer: () => void): void;
        }) => OptionalFunction;

        export type Setter = (value: Function, context: {
            kind: 'setter';
            name: string | symbol;
            access: { set(): unknown };
            static: boolean;
            private: boolean;
            addInitializer(initializer: () => void): void;
        }) => OptionalFunction;

        export type Class = (value: Function, context: {
            kind: 'class';
            name: string | undefined;
            addInitializer(initializer: () => void): void;
        }) => OptionalFunction;

        export type AutoAccessor = (
            value: {
                get(): unknown;
                set(value: unknown): void;
            },
            context: {
                kind: "accessor";
                name: string | symbol;
                access: { get(): unknown, set(value: unknown): void };
                static: boolean;
                private: boolean;
                addInitializer(initializer: () => void): void;
            }
        ) => {
            get?: () => unknown;
            set?: (value: unknown) => void;
            init?: (initialValue: unknown) => unknown;
        } | void;
    }

    declare namespace RPC {
        export type MethodRecord = Record<string, (params?: any) => any>;
        export type AdvancedMethodRecord = Record<string, (request: RpcRequest) => PromiseLike<RpcResponse>>;
        export type Middleware<ServerParams = void> = (request: RpcRequest, serverParams: ServerParams) => JSONRPCResponsePromise;

        export interface Request<Params extends Record<string, any> = Record<string, any>> extends Required<JSONRPCRequest> {
            params: Params;
        }

        export interface Response<Params extends Record<string, any> = Record<string, any>> extends Required<JSONRPCResponse> {
            params: Params;
        }

        export interface HttpServerConfig {
            /** 
             * Port number.
             * Defaults to [`6969`].
             */
            port?: number;
            host?: string;
        }

        export interface HttpsServerConfig extends Required<HttpServerConfig> {
            secure: {
                key: URL;
                cert: URL;
            };
        }

        export interface RpcServerConfig<M extends MethodRecord = MethodRecord,> extends HttpServerConfig {
            methods?: MethodRecord;
            advancedMethods?: AdvancedMethodRecord;
            middleware?: Middleware

        }

        export type Server<Methods extends RPCMethodRecord, AdvancedMethods extends RPCAdvancedMethodRecord, Params = void> = TypedJSONRPCServer<Methods & AdvancedMethods, Params>;
    }
}

// type Fuzzy<T> = T | (string & {});

// interface DecoratorContext {
//     kind: Fuzzy<'class' | 'method' | 'getter' | 'setter' | 'field' | 'accessor'>;
//     name: string;
//     metadata: object;
//     static: boolean;
//     private: false;
//     access: {
//         has: Function;
//         get: Function;
//     }
// }