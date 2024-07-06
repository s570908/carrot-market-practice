import type { NextPage } from "next";
import FloatingButton from "@components/FloatingButton";
import Item from "@components/Item";
import Layout from "@components/Layout";
import useUser from "@libs/client/useUser";
import useSWR, { SWRConfig } from "swr";
import { Fav, Product } from "@prisma/client";
import { useRouter } from "next/router";
import { Suspense, useState } from "react";
import PaginationButton from "@components/PaginationButton";
import client from "@libs/client/client";
import { ReserveResponse } from "./api/apiTypes";
export interface ProductWithCount extends Product {
  favs: Fav[];
  _count: {
    favs: number;
  };
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
  const { data } = useSWR<ProductsResponse>(`/api/products?page=${page}`);
  const {
    data: reserveData,
    isLoading: reserveLoading,
    mutate: reserveMutate,
  } = useSWR<ReserveResponse>(
    router.query.id ? `/api/products/${router.query.id}/reservation` : null
  );
  const onPrevBtn = () => {
    router.push(`${router.pathname}?page=${page - 1}`);
    setPage((prev) => prev - 1);
  };
  const onNextBtn = () => {
    router.push(`${router.pathname}?page=${page + 1}`);
    setPage((prev) => prev + 1);
  };

  console.log("reserveData: ", reserveData);
  return (
    <Layout seoTitle="Home" title="홈" hasTabBar notice>
      <div className="flex flex-col space-y-5 divide-y px-4">
        {data?.products?.map((product) => (
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
            // isReserved={product.reservation
            //   .map((uid) => {
            //     if (uid.userId === user?.id) return true;
            //   })
            //   .includes(true)}
          />
        ))}
      </div>
      {data ? (
        <div className="group relative w-full">
          <PaginationButton
            onClick={onPrevBtn}
            direction="prev"
            page={page}
            isLoading={isLoading}
            isGroup={true}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
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
              className="h-6 w-6"
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
          </PaginationButton>
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
