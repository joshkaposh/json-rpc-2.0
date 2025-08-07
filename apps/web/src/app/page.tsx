"use client";

import { useState, FormEvent } from "react";
// import { RpcClientContext } from "./context";
import { isJSONRPCRequest, JSONRPCID, JSONRPCRequest, JSONRPCResponse, JSONRPCResponsePromise } from "json-rpc-2.0";
// import { log } from '@repo/logger'

// const API_HOST = process.env.NEXT_PUBLIC_API_HOST || "http://localhost:6969";
// const API_RPC = `${API_HOST}/jsonrpc`;


function createID() {
  const gen = (function* _() {
    let id = 0;
    while (true) {
      id++;
      yield id;
    }
  })();

  return () => gen.next().value;
}

const nextId = createID();

function reject(message?: string, options?: ErrorOptions) {
  return Promise.reject(new Error(message, options))
}

function construct_rpc<M extends string, Params extends Record<string, any>>(method: M, params: Params, id: JSONRPCID) {
  return {
    "jsonrpc": "2.0",
    "method": method,
    "params": params,
    "id": id,
  } as Required<JSONRPCRequest>;
}

function rpc(
  url: string | URL | globalThis.Request,
  request: JSONRPCRequest,
) {
  return !isJSONRPCRequest(request) ? reject('Parse error') : fetch(url, construct_rpc('call', request.params, nextId())).then(res => res.json()) as JSONRPCResponsePromise;
}


function OdooLogin() {
  // const [loggedIn, setLoggedIn] = useState(false);
  const [response, setResponse] = useState<JSONRPCResponse | null>(null);
  const [error, setError] = useState<string | undefined>();

  // const client = useContext(RpcClientContext);


  // const result = await rpc('http://localhost:6969/jsonrpc', construct_rpc('call', {
  //   args: [username!, password!]
  // }, nextId()));

  // useEffect(() => {



  //   setResponse(null);
  //   setError(undefined);
  // }, [loggedIn]);


  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // 
    const fields = new FormData(e.currentTarget);
    const username = fields.get('username');
    const password = fields.get('password');

    try {

      const result = await rpc("/jsonrpc", construct_rpc('call', {
        args: [username, password]
      }, nextId()));

      if (result) {
        setResponse(result);
      }
      //   const result = await rpc('http://localhost:6969/jsonrpc', construct_rpc('call', {
      //     args: [username!, password!]
      //   }, nextId()));
      //   // const response = await result?.json();
    } catch (err) {
      setError(`${err}`);
    }
  };

  return <>
    <form action='post' onSubmit={onSubmit}>
      <label htmlFor="username">username:</label>
      <input required type="text" name="username" id="username" />
      <br />
      <label htmlFor="password">password:</label>
      <input type="password" name="password" id="passowrd" />
      <br />

      <input type="submit" value="Submit" />
    </form>

    {error && <p>{error}</p>}

    {response && <p>{response.result}</p>}

  </>
}

export default function Web() {
  // const [name, setName] = useState<string>("");
  // const [response, setResponse] = useState<{ message: string } | null>(null);
  // const [error, setError] = useState<string | undefined>();

  // useEffect(() => {
  //   setResponse(null);
  //   setError(undefined);
  // }, [name]);

  // const onChange = (e: ChangeEvent<HTMLInputElement>) =>
  //   setName(e.target.value);

  // const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
  //   e.preventDefault();

  //   try {
  //     const result = await fetch(`${API_HOST}/message/${name}`);
  //     const response = await result.json();
  //     setResponse(response);
  //   } catch (err) {
  //     console.error(err);
  //     setError("Unable to fetch response");
  //   }
  // };

  // const onReset = () => {
  //   setName("");
  // };

  return (
    <div>
      <h1>Web</h1>
      <OdooLogin />
      {/* <form onSubmit={onSubmit}>
        <label htmlFor="name">Name </label>
        <input
          type="text"
          name="name"
          id="name"
          value={name}
          onChange={onChange}
        ></input>
        <Button type="submit">Submit</Button>
      </form> */}
      {/* {error && (
        <div>
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      )}
      {response && (
        <div>
          <h3>Greeting</h3>
          <p>{response.message}</p>
          <Button onClick={onReset}>Reset</Button>
        </div>
      )} */}
    </div>
  );
}
