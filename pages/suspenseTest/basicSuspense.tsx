import { Suspense, useEffect, useState } from "react";

export interface IUser {
  id: number;
  name: string;
  username: string;
  email: string;
  address: IAddress;
  phone: string;
  website: string;
  company: ICompany;
}

export interface IAddress {
  street: string;
  suite: string;
  city: string;
  zipcode: string;
  geo: IGeo;
}

export interface IGeo {
  lat: string;
  lng: string;
}

export interface ICompany {
  name: string;
  catchPhrase: string;
  bs: string;
}

async function fetchUser(uid: number) {
  console.log("Async - Start fetchUser");
  const url = `https://jsonplaceholder.typicode.com/users/${uid.toString()}`;
  const response = await fetch(url);
  console.log("Async - Resolved fetchUser");
  return await response.json();
}

async function fetchTodo(tid: number) {
  console.log("Async - Start fetchTodo");
  const url = `https://jsonplaceholder.typicode.com/todos/${tid.toString()}`;
  const response = await fetch(url);
  console.log("Async - Resolved fetchTodo");
  return await response.json();
}

function usePromise<I, T>(promise: (arg: I) => Promise<T>, arg: I) {
  const [_promise, _setPromise] = useState<Promise<void>>();
  const [_status, _setStatus] = useState<"pending" | "fulfilled" | "error">("pending");
  const [_result, _setResult] = useState<T>();
  const [_error, _setError] = useState<Error>();

  useEffect(() => {
    function resolvePromise(result: T) {
      _setStatus("fulfilled");
      _setResult(result);
    }
    function rejectPromise(error: Error) {
      _setStatus("error");
      _setError(error);
    }
    _setStatus("pending");
    _setPromise(promise(arg).then(resolvePromise, rejectPromise));
  }, [arg, promise]);

  if (_status === "pending" && _promise) {
    throw _promise;
  }
  if (_error) {
    throw _error;
  }
  return _result;
}

export function User({ uid }: { uid: number }) {
  const user = usePromise<number, IUser>(fetchUser, uid);
  console.log("Render - Rendering User");
  return (
    <>
      <h3>{user?.name}</h3>
      <br />
      <pre>{JSON.stringify(user?.company, null, 2)}</pre>
    </>
  );
}

export default function App() {
  return (
    <div className="App">
      <Suspense fallback={<h1>Loading...</h1>}>
        <User uid={1} />
      </Suspense>
    </div>
  );
}
