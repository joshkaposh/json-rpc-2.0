import type { JSONRPCID, JSONRPCRequest, JSONRPCResponse, JSONRPCResponsePromise, JSONRPCServerMiddleware, TypedJSONRPCClient, TypedJSONRPCServer } from "json-rpc-2.0";

export declare namespace Json {
    export type Primitive = JsonPrimitive;
    export type Value = JsonPrimitive | JsonObject | (JsonPrimitive | JsonObject)[];
    export type Object = JsonObject;

    type JsonPrimitive = string | number | boolean | null;
    type JsonValue = JsonPrimitive | JsonObject | (JsonPrimitive | JsonObject)[];
    interface JsonObject {
        [key: string]: JsonValue;
    }

}

export declare namespace Decorator {
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

export declare namespace RPC {
    export type Id = JSONRPCID;
    export type ParamsRecord = Record<string, any>;
    export type MethodRecord = Record<string, (params?: any) => any>;
    export type AdvancedMethodFn<M extends string = string, P extends ParamsRecord = ParamsRecord> = (request: Request<M, P>) => PromiseLike<Response>;
    export type AdvancedMethodRecord = Record<string, AdvancedMethodFn>;
    export type Middleware<ServerParams = void> = JSONRPCServerMiddleware<ServerParams>;
    // export type Middleware<ServerParams = void> = (request: Request, serverParams: ServerParams) => JSONRPCResponsePromise;

    export interface Request<Method extends string = string, Params extends ParamsRecord = ParamsRecord> extends Required<JSONRPCRequest> {
        method: Method;
        params: Params;
    }

    export type Response = JSONRPCResponse;
    export type ResponsePromise = JSONRPCResponsePromise;

    export type Server<Methods extends MethodRecord, AdvancedMethods extends AdvancedMethodRecord, Params = void> = TypedJSONRPCServer<Methods & AdvancedMethods, Params>;

    export type Client<Methods extends MethodRecord, AdvancedMethods extends AdvancedMethodRecord, Params = void> = TypedJSONRPCClient<Methods & AdvancedMethods, Params>;

}

export interface HttpServerConfig {
    host: string;
    port: number;
}

export interface HttpsServerConfig extends HttpServerConfig {
    credentials: {
        key: URL;
        cert: URL;
    };
}