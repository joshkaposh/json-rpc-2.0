import { JSONRPCClient } from "json-rpc-2.0";
import { createContext } from "react";


const rpc_client = new JSONRPCClient((jsonRPCRequest) => {
    console.log('rpc client received request')

    return fetch("http://localhost:6969/json-rpc", {
        method: "POST",
        headers: {
            "content-type": "application/json",
        },
        body: JSON.stringify(jsonRPCRequest),
    }).then(function (response): any {
        if (response.status === 200) {
            // Use client.receive when you received a JSON-RPC response.
            return response.json()
                .then((jsonRPCResponse) => rpc_client.receive(jsonRPCResponse));
        } else if (jsonRPCRequest.id !== undefined) {
            return Promise.reject(new Error(response.statusText)) as Promise<any>;
        }

    })
}
);

export const RpcClientContext = createContext(rpc_client);
