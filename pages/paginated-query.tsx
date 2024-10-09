import { useInfiniteQuery, useQuery } from "react-query";
import axios from "axios";
import { Fragment, useState } from "react";

interface Product {
  userId: number;
  id: number;
  title: string;
  body: string;
}

const fetchProducts = (page: number) => {
  return axios.get(
    `https://jsonplaceholder.typicode.com/posts?_limit=10&_page=${page}`
  );
};

const PaginatedQuery = () => {
  const {
    data,
    isLoading,
    isFetching,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery(
    ["get-paginated"],
    ({ pageParam = 1 }) => fetchProducts(pageParam),
    {
      getNextPageParam: (_lastPage, pages) => {
        if (pages.length < 3) {
          return pages.length + 1;
        } else return undefined;
      },
    }
  );

  if (isLoading) return <div>Loading...</div>;

  return (
    <>
      <div className="text-4xl">ReactQuery</div>

      {data &&
        data.pages?.map((group, i) => (
          <Fragment key={i}>
            {group &&
              group?.data?.map((p: Product) => (
                <div key={p?.id}>{p?.title}</div>
              ))}
          </Fragment>
        ))}
      <div className="space-x-4">
        <button
          className="border"
          onClick={() => fetchNextPage()}
          disabled={!hasNextPage}
        >
          Load More
        </button>
      </div>
      <div>{isFetching && !isFetchingNextPage ? "Fetching..." : null}</div>
    </>
  );
};

export default PaginatedQuery;
