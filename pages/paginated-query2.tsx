import { useInfiniteQuery, useQuery } from "react-query";
import axios from "axios";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";

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

const PaginatedQuery2 = () => {
  const observerElem = useRef(null);

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteQuery(
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

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage]
  );

  useEffect(() => {
    const element = observerElem.current;

    let options = {
      root: null,
      rootMargin: "0px",
      threshold: 1,
    };

    const observer = new IntersectionObserver(handleObserver, options);
    if (element) observer.observe(element);
    return () => {
      if (element) observer.unobserve(element);
    };
  }, [fetchNextPage, hasNextPage, handleObserver]);

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
      <div className="loader" ref={observerElem}>
        {isFetchingNextPage && hasNextPage ? "Loading..." : "No search left"}
      </div>
    </>
  );
};

export default PaginatedQuery2;
