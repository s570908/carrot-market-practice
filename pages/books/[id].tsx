import axios from "axios";
import { GetStaticPaths, GetStaticProps } from "next";
import { ParsedUrlQuery } from "querystring";
import { Book } from ".";
import dayjs from "dayjs";

type GetSpecificBookResponse = {
  data: Book;
};

interface IdParams extends ParsedUrlQuery {
  id: string;
}

export interface BookProps {
  data: Book;
  time: string;
}

export default function SpecificBook({ data: { id, title, description }, time }: BookProps) {
  const requestTime = dayjs().format("YYYY-MM-DD HH:mm:ss");
  if (!id) {
    return <div>Loading.....</div>;
  }
  return (
    <>
      <div key={id}>
        <span style={{ marginRight: "10px" }}>{title}</span>
        <span>{description}</span>
        <h1>Next-Caching Time: {time}</h1>
        <h1>Page-request Time: {requestTime}</h1>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const { data } = await axios.get("http://localhost:4000/books");
  const paths = (data as Book[]).map(({ id }) => ({ params: { id: String(id) } }));
  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps = async (context) => {
  try {
    const time = dayjs().format("YYYY-MM-DD HH:mm:ss");
    const { id } = context.params as IdParams;
    const { data } = await axios.get<GetSpecificBookResponse>(`http://localhost:4000/books/${id}`);
    return {
      props: { data, time },
      revalidate: 6000,
    };
  } catch (err) {
    return {
      notFound: true,
    };
  }
};
