import axios from "axios";
import Link from "next/link";
import dayjs from "dayjs";
import { useEffect, useState } from "react";

export interface Book {
  id: string;
  title: string;
  description: string;
}

export interface BooksProps {
  data: Book[];
  time: string;
}

export default function Books({ data, time }: BooksProps) {
  // 아래의 statement는 에러를 발생시킨다. 이유는 서버에서 만들어서 보낸 html과 클라언트가 만든 html이 서로 다르기 때문에
  // hydration을 할 수가 없다. 그래서 코메트아웃하고 useEffect와 useState를 이용하여 처리하였다. 이 훅들은 서버에서 수행되지 않는다.
  // 그래서 서버에서 만들어낸 html과 클라이언트가 초기에 만들어낸 html이 정확히 같게 된다.
  // ref: https://stackoverflow.com/questions/72673362/error-text-content-does-not-match-server-rendered-html

  //const currentTime = dayjs().format("YYYY-MM-DD HH:mm:ss");

  const [requestTime, setRequestTime] = useState("");
  useEffect(() => {
    const currentTime = dayjs().format("YYYY-MM-DD HH:mm:ss");
    setRequestTime(currentTime);
  }, [time]);

  return (
    <>
      {data?.map(({ id, title, description }) => (
        <Link href={`/books/${id}`} key={id}>
          <div style={{ padding: "10px", cursor: "pointer", borderBottom: "1px solid black" }}>
            <span style={{ marginRight: "10px" }}>{title}</span>
            <span>{description}</span>
          </div>
        </Link>
      ))}
      <h1>Next-Caching Time: {time}</h1>
      <h1>Page-request Time: {requestTime}</h1>
    </>
  );
}

export async function getStaticProps() {
  try {
    const time = dayjs().format("YYYY-MM-DD HH:mm:ss");
    const { data } = await axios.get("http://localhost:4000/books");
    return {
      props: { data, time },
      revalidate: 6000,
      // 마지막 build/generate 시간과 누가 요청을 하든지간에 화면 요청이 들어온 시간을 비교하여 20초가 넘었다면 서버캐시를
      // 업데이트한다.
    };
  } catch (err) {
    return {
      notFound: true,
    };
  }
}
