import axios from "axios";
import Link from "next/link";
import dayjs from "dayjs";

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
  const requestTime = dayjs().format("YYYY-MM-DD HH:mm:ss");
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
      revalidate: 20,
      // 마지막 build/generate 시간과 누가 요청을 하든지간에 화면 요청이 들어온 시간을 비교하여 20초가 넘었다면 서버캐시를
      // 업데이트한다.
    };
  } catch (err) {
    return {
      notFound: true,
    };
  }
}
