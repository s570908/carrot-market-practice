import Button from "@components/Button";
import Layout from "@components/Layout";
import fetcher from "@libs/client/fetcher";
import { Product, User } from "@prisma/client";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import useSWR from "swr";
import { Backdrop, CircularProgress } from "@mui/material";

interface ProductWithUser extends Product {
  user: User;
}

interface ItemDetailResponse {
  ok: boolean;
  product: ProductWithUser;
  relatedProducts: ProductWithUser[];
}

const ItemDetail: NextPage = () => {
  const router = useRouter();
  console.log("router.query: ", router.query);
  const { data, error } = useSWR<ItemDetailResponse>(
    router.query.id ? `/api/products/${router.query.id}` : null,
    fetcher
  );
  console.log("ItemDetail data: ", data);
  return (
    <Layout canGoBack>
      <Backdrop
        sx={{
          color: "#fff",
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
        open={data === undefined}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      <div className="px-4 py-3">
        <div className="mb-8">
          <div className="h-96 bg-slate-300" />
          <div className="space-x-300 mt-1 flex items-center border-b border-t">
            <div className="h-12 w-12 rounded-full bg-slate-300" />
            <div>
              <p className="text-sm font-medium text-gray-700">{data?.product.user.name}</p>
              <p className="cursor-pointer text-xs font-medium text-gray-500">
                View profile &rarr;
              </p>
            </div>
          </div>
          <div className="mt-5">
            <h1 className="text-3xl font-bold text-gray-900">{data?.product.name}</h1>
            <span className="mt-3 block text-3xl text-gray-900">${data?.product.price}</span>
            <p className="my-6 text-base text-gray-700">{data?.product.description}</p>
            <div className="flex items-center justify-between space-x-2">
              <Button text="Talk to seller" large />
              <button className="flex items-center justify-center rounded-md p-3 text-gray-400 hover:bg-gray-100 hover:text-gray-500">
                <svg
                  className="h-6 w-6 "
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
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Similar items</h2>
          <div className="mt-6 grid grid-cols-2 gap-4">
            {data?.relatedProducts.map(({ id, name, price }) => (
              <div key={id}>
                <div className="mb-4 h-56 w-full bg-slate-300" />
                <h3 className="-mb-1 text-gray-700 ">{name}</h3>
                <span className="text-sm font-medium text-gray-900">${price}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ItemDetail;
