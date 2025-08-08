import type { Json, RPC } from "./types";
import { construct_rpc, rpc } from "./helpers";

export type SearchOptions = {
    fields: string[];
    limit?: number;
    offset?: number;
} | string[] | Record<string, any>;

export type DomainFilter = [ident: string, op: string, equals: Json.Primitive][] | [[]];

export type AuthenticatedCall<T extends string = string> = [db: string, uid: number | string, key: string, model_name: string, method: T];

export type FilterAndOptions = [domain_filter: DomainFilter, options: SearchOptions];

export type CreateArgs = [...AuthenticatedCall<'create'>, Record<string, Json.Primitive>];
export type ReadArgs = [...AuthenticatedCall<'read'>, ...FilterAndOptions];
export type SearchArgs = [...AuthenticatedCall<'search'>, DomainFilter];
export type SearchReadArgs = [...AuthenticatedCall<'search_read'>, ...FilterAndOptions];
export type UpdateArgs = [...AuthenticatedCall<'write'>, any[], Record<string, Json.Value>];
export type DeleteArgs = [...AuthenticatedCall<'unlink'>, any[]];
export type FieldsGetArgs = [...AuthenticatedCall<'fields_get'>, domain_filter: DomainFilter, options: { attributes: string[] }];

export type Args = FieldsGetArgs | CreateArgs | ReadArgs | SearchArgs | SearchReadArgs | UpdateArgs | DeleteArgs;
export type AuthArgs = [database: string, username: string, password: string, search_options?: SearchOptions];

export interface JSONRPCParams<Service extends string, Method extends string, Args extends any[]> {
    service: Service;
    method: Method;
    args: Args;
}

export interface Request<Params extends JSONRPCParams<string, string, any[]>> extends RPC.Request<'call', Params> { }

export type AuthenticatedParams<A extends Args = Args> = JSONRPCParams<'object', 'execute', A>;
export type LoginParams = JSONRPCParams<'common', 'authenticate', AuthArgs>;

export type AuthenticatedRequest = Request<AuthenticatedParams>;
export type LoginRequest = Request<AuthenticatedParams>;

export type Methods = {};

export type MethodFn<M extends string = string, P extends RPC.ParamsRecord = RPC.ParamsRecord> = (request: RPC.Request<M, P>) => PromiseLike<Response>;

export type AdvancedMethods = {
    authenticate: RPC.AdvancedMethodFn;
    create: RPC.AdvancedMethodFn;
    read: RPC.AdvancedMethodFn;
    search: RPC.AdvancedMethodFn;
    search_read: RPC.AdvancedMethodFn;
    update: RPC.AdvancedMethodFn;
    delete: RPC.AdvancedMethodFn;
    fields_get: RPC.AdvancedMethodFn;
};

export type Params = AuthenticatedParams | LoginParams;

export type Context = {
    url: `https://${string}/jsonrpc`;
    db: string;
};

export type OdooRequest = keyof typeof CLIENT_REQUESTS;


const client = <T extends RPC.ParamsRecord, Name extends string = string>(name: Name) => (args: T, id: RPC.Id) => construct_rpc(name, args, id);

export const CLIENT_REQUESTS = {
    authenticate: client<LoginParams>('authenticate'),
    create: client<AuthenticatedParams<CreateArgs>>('create'),
    read: client<AuthenticatedParams<ReadArgs>>('read'),
    search: client<AuthenticatedParams<SearchArgs>>('search'),
    search_read: client<AuthenticatedParams<SearchReadArgs>>('search_read'),
    update: client<AuthenticatedParams<UpdateArgs>>('update'),
    delete: client<AuthenticatedParams<DeleteArgs>>('delete'),
    fields_get: client<AuthenticatedParams<FieldsGetArgs>>('fields_get'),
} as const;

type ServerRequests = { [K in keyof typeof CLIENT_REQUESTS]: (url: string, request: ReturnType<typeof CLIENT_REQUESTS[K]> extends RPC.Request ? ReturnType<typeof CLIENT_REQUESTS[K]>['params']['args'] : never, id: RPC.Id) => RPC.ResponsePromise };

const server = <T extends Args>(url: string, args: T, id: RPC.Id) => {
    return rpc(url, construct_odoo_rpc(args, id));
}

export const SERVER_REQUESTS: ServerRequests = {
    authenticate: (url: string, args: AuthArgs, id: RPC.Id) => rpc(url, construct_odoo_authenticated_rpc(args, id)),
    create: server<CreateArgs>,
    read: server<ReadArgs>,
    // read: (url: string, args: ReadArgs, id: RPC.Id) => rpc(url, construct_odoo_rpc(args, id, 'object', 'execute')),
    search: server<SearchArgs>,
    search_read: server<SearchReadArgs>,
    update: server<UpdateArgs>,
    delete: server<DeleteArgs>,
    fields_get: server<FieldsGetArgs>,
} as const;

export function construct_odoo_authenticated_rpc(args: AuthArgs, id: RPC.Id) {
    return construct_odoo_rpc(args, id, 'common', 'authenticate');
}

export function construct_odoo_rpc<A extends Args | AuthArgs>(args: A, id: RPC.Id, service = 'object', method = 'execute_kw') {
    return construct_rpc('call', {
        service,
        method,
        args
    }, id);
}

