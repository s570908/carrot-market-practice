import { Key, Suspense, useEffect, useState } from "react";

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
  await delay(10000);
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

async function fetchTodoWithUid(uid: number) {
  console.log("Async - Start fetchTodo");
  const url = `https://jsonplaceholder.typicode.com/todos?${uid.toString()}`;
  await delay(10000);
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

function User({ uid }: { uid: number }) {
  const user = usePromise<number, IUser>(fetchUser, uid);
  console.log("Render - Rendering User");

  return (
    <>
      <h3>{user?.name}</h3>
      <br />
      <pre>{JSON.stringify(user?.company, null, 2)}</pre>
      <br />
      <Suspense fallback={<p>Loading...</p>}>
        <Todos puid={uid} />
      </Suspense>
    </>
  );
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

export default function App() {
  return (
    <div className="App">
      <Suspense fallback={<p>Loading...</p>}>
        <User uid={1} />
      </Suspense>
    </div>
  );
}

/******************************************
이전의 비동기 처리와 비교하면 어떤가요?

컴포넌트들이 각자 데이터 fetching을 동시에 시작하게 되어 waterfall 문제가 발생하지 않습니다.
Suspense의 계층구조와 fallback 렌더링으로 컴포넌트들은 더 이상 경쟁 상태를 신경 쓰지 않아도 됩니다.
컴포넌트들의 역할이 아주 명확하게 분리되고 결합도가 낮아집니다.(이제 컴포넌트들은 각자의 데이터를 가져와서 보여주는 것에만 신경 쓰면 됩니다!)
동기화 코드가 사라지고 데이터 fetching과 렌더링에만 신경 쓰면 되기 때문에 컴포넌트들의 복잡도가 낮아졌습니다.(코드가 깔끔해졌습니다!)
Suspense를 사용함으로써 컴포넌트들을 훨씬 더 선언적이고 깔끔하게 작성할 수 있는 것을 볼 수 있습니다.
******************************************/
