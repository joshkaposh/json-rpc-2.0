import { log } from "@repo/logger";
import type { RPC } from "./types";

export function createID(): () => RPC.Id {
    const gen = (function* _() {
        let id = 0;
        while (true) {
            id++;
            yield id;
        }
    })();

    return () => gen.next().value;
}

export function reject(message?: string, options?: ErrorOptions) {
    return Promise.reject(new Error(message, options))
}


export function construct_rpc<M extends string, P extends RPC.ParamsRecord>(method: M, params: P, id: RPC.Id): RPC.Request<M, P> {
    return {
        jsonrpc: '2.0',
        method,
        params,
        id
    };
}

export async function rpc(url: string, request: ReturnType<typeof construct_rpc>) {
    log(`Outgoing Request: ${JSON.stringify(request)}`);
    return await fetch(url, {
        method: "POST",
        body: JSON.stringify(request),
        headers: {
            'content-type': "application/json"
        }
    }).then(res => res.json() as RPC.ResponsePromise).catch(err => {
        console.error(err);
        return null;
    });
}