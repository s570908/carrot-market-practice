import type { NextPage } from "next";
import FloatingButton from "@components/FloatingButton";
import Item from "@components/Item";
import Layout from "@components/Layout";
import useUser from "@libs/client/useUser";
import useSWR, { SWRConfig } from "swr";
import { Fav, Product, Status } from "@prisma/client";
import { useRouter } from "next/router";
import { Suspense, useEffect, useState } from "react";
import PaginationButton from "@components/PaginationButton";
import client from "@libs/client/client";
import { ReserveResponse } from "./api/apiTypes";
import { useInfiniteQuery, useQuery } from "react-query";
import axios from "axios";

export interface ProductWithCount extends Product {
  favs: Fav[];
  _count: {
    favs: number;
  };
}

interface User {
  userId: number;
}

interface ProductsResponse {
  ok: boolean;
  products: ProductWithCount[];
  nextProducts: ProductWithCount[];
}

const Home: NextPage = () => {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10); // limit을 상태로 설정
  // const { data } = useSWR<ProductsResponse>(`/api/products?page=${page}`);
  // ProductsResponse 타입에 맞는 데이터 요청 함수
  const fetchProducts = async (page: number, limit: number) => {
    const response = await axios.get(
      `/api/products?page=${page}&limit=${limit}`
    );
    return response.data;
  };

  // const { data } = useQuery<ProductsResponse>(
  //   ["products", page, limit], // 쿼리 키, 페이지 번호에 따라 쿼리가 다름
  //   () => fetchProducts(page, limit), // 데이터를 가져오는 함수
  //   {
  //     keepPreviousData: true, // 페이지 이동 시 이전 데이터 유지 (선택 사항)
  //   }
  // );

  const {
    data,
    isLoading: isProductLoading,
    isFetching,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery(
    ["products", limit], // 쿼리 키에 limit을 포함
    ({ pageParam = 1 }) => fetchProducts(pageParam, limit),
    {
      getNextPageParam: (lastPage, allPages) => {
        // 다음 페이지가 존재하면 다음 페이지 번호를 반환
        if (lastPage?.products?.length === limit) {
          return allPages.length + 1;
        }
        return undefined;
      },
      keepPreviousData: true, // 이전 데이터 유지
    }
  );

  useEffect(() => {
    let fetching = false;
    const handleScroll = async (e: Event) => {
      const { scrollHeight, scrollTop, clientHeight } =
        (e.target as Document).scrollingElement || document.documentElement;
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

  // const {
  //   data: reserveData,
  //   isLoading: reserveLoading,
  //   mutate: reserveMutate,
  // } = useSWR<ReserveResponse>(
  //   router.query.id ? `/api/products/${router.query.id}/reservation` : null
  // );
  const onPrevBtn = () => {
    router.push(`${router.pathname}?page=${page - 1}`);
    setPage((prev) => prev - 1);
  };
  const onNextBtn = () => {
    router.push(`${router.pathname}?page=${page + 1}`);
    setPage((prev) => prev + 1);
  };

  //console.log("===data: ", data);
  return (
    <Layout seoTitle="Home" title="홈" hasTabBar notice>
      <div className="flex flex-col space-y-5 divide-y px-4">
        {/* {data?.products?.map((product) => {
          const reserved = product?.status === Status.Reserved ? true : false;
          const sold = product?.status === Status.Sold ? true : false;
          // const selling = !reserved && !sold;
          let status: Status = Status.Registered;
          if (reserved) {
            status = Status.Reserved;
          } else if (sold) {
            status = Status.Sold;
          }

          return (
            <Item
              id={product.id}
              key={product.id}
              title={product.name}
              price={product.price}
              hearts={product._count?.favs}
              photo={product.image}
              isLike={product.favs
                .map((uid) => {
                  if (uid.userId === user?.id) return true;
                })
                .includes(true)}
              status={status}
            />
          );
        })} */}
        {data?.pages.map((page) =>
          page.products.map((product: ProductWithCount) => {
            const reserved = product?.status === Status.Reserved;
            const sold = product?.status === Status.Sold;
            let status: Status = Status.Registered;

            if (reserved) {
              status = Status.Reserved;
            } else if (sold) {
              status = Status.Sold;
            }

            return (
              <Item
                id={product.id}
                key={product.id}
                title={product.name}
                price={product.price}
                hearts={product._count?.favs}
                photo={product.image}
                isLike={product.favs
                  .map((uid: User) => (uid.userId === user?.id ? true : false))
                  .includes(true)}
                status={status}
              />
            );
          })
        )}
        {/* <button
          onClick={() => fetchNextPage()}
          disabled={!hasNextPage || isFetchingNextPage}
        >
          {isFetchingNextPage
            ? "Loading more..."
            : hasNextPage
            ? "Load More"
            : "No more products"}
        </button> */}
        {isLoading && <p>Loading...</p>}
      </div>
      {/* 사용자에게 limit을 조정할 수 있는 인터페이스 추가 */}
      <div className="my-4">
        <label htmlFor="limit" className="mr-2">
          페이지 당 항목 수:
        </label>
        <input
          id="limit"
          type="number"
          min="1"
          value={limit === 0 ? "" : limit} // limit이 0일 때 빈 문자열로 설정
          onChange={(e) => setLimit(Number(e.target.value) || 0)} // 빈 문자열 처리
          className="rounded border px-2 py-1"
        />
      </div>
      {data ? (
        <div className="group relative w-full">
          {/* <PaginationButton
            onClick={onPrevBtn}
            direction="prev"
            page={page}
            isLoading={isLoading}
            isGroup={true}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z"
              />
            </svg>
          </PaginationButton>
          <PaginationButton
            onClick={onNextBtn}
            direction="next"
            page={page}
            itemLength={data?.nextProducts?.length}
            isLoading={isLoading}
            isGroup={true}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </PaginationButton> */}
          <FloatingButton href="/products/upload" isGroup={true}>
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </FloatingButton>
        </div>
      ) : null}
    </Layout>
  );
};

const Page: NextPage<{ products: ProductWithCount[] }> = ({ products }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/products?page=1": {
            ok: true,
            products,
          },
        },
      }}
    >
      <Home />
    </SWRConfig>
  );
};

export async function getServerSideProps() {
  const products = await client.product.findMany({
    include: {
      _count: {
        select: {
          favs: true,
        },
      },
      favs: {
        select: {
          userId: true,
        },
      },
      user: {
        select: {
          id: true,
        },
      },
    },
    take: 10,
    skip: 0,
    orderBy: { createdAt: "desc" },
  });
  return {
    props: {
      products: JSON.parse(JSON.stringify(products)),
    },
  };
}

export default Page;
