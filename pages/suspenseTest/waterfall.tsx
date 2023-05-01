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

async function fetchTodoWithUid(uid: number) {
  console.log("Async - Start fetchTodo");
  const url = `https://jsonplaceholder.typicode.com/todos?${uid.toString()}`;
  await delay(10000);
  const response = await fetch(url);
  console.log("Async - Resolved fetchTodo");
  return await response.json();
}

function User({ uid }: { uid: number }) {
  const [user, setUser] = useState<IUser>();

  // Fetch-on-render
  useEffect(() => {
    fetchUser(uid).then(setUser);
  }, [uid]);

  // Synchronizing
  if (!user) {
    return <p>Loading...</p>;
  }
  // Synchronizing이 없으면
  // Race-condition 문제 발생
  console.log("Render - Rendering User");
  return (
    <>
      <h3>{user?.name}</h3>
      <br />
      <pre>{JSON.stringify(user?.company, null, 2)}</pre>
      <br />
      <Todos puid={uid} />
    </>
  );
}

function Todos({ puid }: { puid: number }) {
  const [todos, setTodos] = useState<ITodo[]>([]);

  useEffect(() => {
    fetchTodoWithUid(puid).then(setTodos);
  }, [puid]);

  // Synchronizing
  if (!todos || todos.length === 0) {
    return <p>Loading...</p>;
  }

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
      <User uid={1} />
    </div>
  );
}
