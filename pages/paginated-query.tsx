import { useInfiniteQuery, useQuery } from "react-query";
import axios from "axios";
import { Fragment, useEffect, useState } from "react";

interface Product {
  userId: number;
  id: number;
  title: string;
  body: string;
}

const fetchProducts = (page: number) => {
  return axios.get(
    `https://jsonplaceholder.typicode.com/posts?_limit=20&_page=${page}`
  );
};

const PaginatedQuery = () => {
  const { data, isLoading, hasNextPage, fetchNextPage } = useInfiniteQuery(
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

  useEffect(() => {
    let fetching = false;
    const handleScroll = async (e: any) => {
      const { scrollHeight, scrollTop, clientHeight } =
        e.target.scrollingElement;
      if (!fetching && scrollHeight - scrollTop <= clientHeight * 1.2) {
        fetching = true;
        if (hasNextPage) await fetchNextPage();
        fetching = false;
      }
    };
    document.addEventListener("scroll", handleScroll);
    return () => {
      document.removeEventListener("scroll", handleScroll);
    };
  }, [fetchNextPage, hasNextPage]);

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
    </>
  );
};

export default PaginatedQuery;
