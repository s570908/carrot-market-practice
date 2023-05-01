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
  // User Component의 역할이 불명확함(user도 조회하고, todos도 조회)
  // 비동기 작업이 늘어날수록, User의 역할이 너무 커진다(결합도 증가)
  const [user, setUser] = useState<IUser>();
  const [todos, setTodos] = useState<ITodo[]>([]);

  // Fetch-then-render
  useEffect(() => {
    // 비동기 작업 동시적으로 실행
    // 비동기 작업들을 한곳에서 처리하고 그 결과를 각 컴포넌트에게 전달하는 방식은
    // 컴포넌트들 간의 역할분담이 불명확하게 하고 높은 결합도를 만들 수 있습니다.
    // 각각의 컴포넌트가 자기 자신의 데이터를 각자 책임질 수 있다면 더 깔끔하지 않을까요?
    Promise.all([fetchUser(uid), fetchTodoWithUid(uid)]).then(([user, todos]) => {
      setUser(user);
      setTodos(todos);
    });
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
      <Todos todos={todos} />
    </>
  );
}

function Todos({ todos }: { todos: ITodo[] }) {
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
