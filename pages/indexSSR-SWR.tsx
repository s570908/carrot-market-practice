import type { NextPage } from "next";
import FloatingButton from "@components/FloatingButton";
import useUser from "@libs/client/useUser";
import Head from "next/head";
import useSWR, { SWRConfig } from "swr";
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

const Home = ({ products }: { products: ProductWithCount[] }) => {
  const { user, isLoading } = useUser();
  const { data } = useSWR<ProductsResponse>("/api/products", {
    fallbackData: {
      ok: true,
      products,
    },
  });

  return (
    <Layout title="홈" hasTabBar>
      <Head>
        <title>Home</title>
      </Head>
      <div className="p flex flex-col space-y-5 py-2">
        {data
          ? data.products?.map((products) => (
              <Item
                key={products.id}
                id={products.id}
                title={products.name}
                price={products.price}
                comments={1}
                hearts={products?._count?.favs || 0}
              />
            ))
          : "Loading..."}

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
  console.log("SSR");
  const products = await client.product.findMany({});
  console.log("getServerSideProps, products without favs: ", products);

  return {
    props: {
      // products를 deep copy한다.
      // products를 shallow copy하는 방법: Object.assign({}, products)
      products: JSON.parse(JSON.stringify(products)),
      //products: products,
    },
  };
}

export default Home;
