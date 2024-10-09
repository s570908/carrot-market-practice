import { useQuery } from "react-query";
import axios from "axios";
import { useState } from "react";

interface Product {
  userId: number;
  id: number;
  title: string;
  body: string;
}

const fetchProducts = (pageNum: number) => {
  return axios.get(
    `https://jsonplaceholder.typicode.com/posts?_limit=10&_page=${pageNum}`
  );
};

const PaginatedQuery = () => {
  const [pageNumber, setPageNumber] = useState(1);
  const { data, isLoading, isFetching } = useQuery(
    ["get-paginated", pageNumber],
    () => fetchProducts(pageNumber),
    {
      keepPreviousData: true,
    }
  );

  if (isLoading) return <div>Loading...</div>;

  return (
    <>
      <div className="text-4xl">ReactQuery</div>

      <h2>current Page number : {pageNumber}</h2>
      <ul className="list-disc p-4">
        {data &&
          data.data?.map((p: Product) => <div key={p?.id}>{p?.title}</div>)}
      </ul>
      <div className="space-x-4">
        <button
          onClick={() => setPageNumber((page) => page - 1)}
          disabled={pageNumber === 1}
        >
          Prev
        </button>
        <button
          onClick={() => setPageNumber((page) => page + 1)}
          disabled={pageNumber === 3}
        >
          Next
        </button>
      </div>
      <div>{isFetching && "Fetching..."}</div>
    </>
  );
};

export default PaginatedQuery;
