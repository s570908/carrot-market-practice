import FloatingButton from "@components/FloatingButton";
import Item from "@components/Item";
import Layout from "@components/Layout";
import fetcher from "@libs/client/fetcher";
import useUser from "@libs/client/useUser";
import { Fav, Product } from "@prisma/client";
import type { NextPage } from "next";
import useSWR from "swr";

interface ProductWithFavs extends Product {
  favs: Fav[];
}

interface ProductsResponse {
  ok: boolean;
  products: ProductWithFavs[];
}

const Home: NextPage = () => {
  const { user, isLoading } = useUser();
  const { data, error } = useSWR<ProductsResponse>("/api/products", fetcher);

  console.log("Home--user: ", user);
  console.log("Home--data: ", data);

  return (
    <Layout title="홈" hasTabBar>
      <div className="p flex flex-col space-y-5 py-2">
        {data?.products?.map(({ id, name, price, favs }, i) => (
          <Item key={i} id={id} title={name} price={price} comments={1} hearts={favs.length} />
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

export default Home;
