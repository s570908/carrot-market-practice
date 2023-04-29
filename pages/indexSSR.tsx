import type { NextPage } from "next";

import FloatingButton from "@components/FloatingButton";
import useUser from "@libs/client/useUser";
import Head from "next/head";
import useSWR from "swr";
import { Fav, Product } from "@prisma/client";
import picture from "../public/local-image.jpg";
import Image from "next/image";
import client from "@libs/client/client";
import Layout from "@components/Layout";
import Item from "@components/Item";

interface ProductWithCount extends Product {
  _count: {
    favs: number;
  };
}
interface ProductsResponse {
  ok: boolean;
  products: ProductWithCount[];
}

const Home: NextPage<{ products: ProductWithCount[] }> = ({ products }) => {
  const { user, isLoading } = useUser();
  // const { data } = useSWR<ProductsResponse>("/api/products");

  return (
    <Layout title="홈" hasTabBar>
      <Head>
        <title>Home</title>
      </Head>
      <div className="p flex flex-col space-y-5 py-2">
        {products?.map((products) => (
          <Item
            key={products.id}
            id={products.id}
            title={products.name}
            price={products.price}
            comments={1}
            hearts={products?._count?.favs}
          />
        ))}

        <FloatingButton href="/products/upload">
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
    </Layout>
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
    },
  });

  console.log("getServerSideProps, products: ", products);
  return {
    props: {
      products: JSON.parse(JSON.stringify(products)),
    },
  };
}

export default Home;
