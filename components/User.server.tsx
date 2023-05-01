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

export interface ITodo {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
}

async function delay(ms: number | undefined) {
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      console.log("Delay", ms);
      resolve();
    }, ms);
  });
}

async function fetchUser(uid: number) {
  console.log("Async - Start fetchUser");
  const url = `https://jsonplaceholder.typicode.com/users/${uid.toString()}`;
  await delay(Math.round(Math.random() * 10555));
  const response = await fetch(url);
  console.log("Async - Resolved fetchUser");
  return await response.json();
}

async function fetchTodo(tid: number) {
  console.log("Async - Start fetchTodo");
  const url = `https://jsonplaceholder.typicode.com/todos/${tid.toString()}`;
  await delay(Math.round(Math.random() * 10555));
  const response = await fetch(url);
  console.log("Async - Resolved fetchTodo");
  return await response.json();
}

async function fetchTodoWithUid(uid: number) {
  console.log("Async - Start fetchTodo");
  const url = `https://jsonplaceholder.typicode.com/todos?${uid.toString()}`;
  await delay(Math.round(Math.random() * 10555));
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
      <br />
      <ListTodos n={15} />
    </>
  );
}

function ListTodos({ n }: { n: number }) {
  return (
    <ul>
      {Array.from({ length: n }, (_, index) => index + 1).map((i) => {
        return (
          <li key={i}>
            <Suspense fallback={<p className="text-red-700">{`${i}. Todo id= ${i} is loading`}</p>}>
              <Todo tid={i} />
            </Suspense>
          </li>
        );
      })}
    </ul>
  );
}

function Todo({ tid }: { tid: number }) {
  const todo = usePromise<number, ITodo>(fetchTodo, tid);
  if (!todo) return null;
  return <div>{`${tid}. ${todo?.title} : completed-${todo?.completed}`}</div>;
}

function Todos({ puid }: { puid: number }) {
  const todos = usePromise<number, ITodo[]>(fetchTodoWithUid, puid);
  console.log("Render - Rendering Todos");
  //console.log("Render - Rendering Todos, todos: ", JSON.stringify(todos, null, 2));
  return (
    <>
      {todos?.map((todo: ITodo) => (
        <li key={todo.id}>{`${todo.title} : completed-${todo.completed}`}</li>
      ))}
    </>
  );
}
