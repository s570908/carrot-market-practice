import { useQuery } from "react-query";
import axios, { AxiosError } from "axios";
import { TestHeader } from "@components/TestHeader";

interface Product {
  id: string;
  name: string;
  price: number;
}

interface ProductResponse {
  data: {
    items: Product[];
  };
}

const fetchProducts = () => {
  return axios.get("http://localhost:4000/data");
};

const ReactQuery = () => {
  const { isLoading, isFetching, data, isError, error } =
    useQuery<ProductResponse>("get-product", fetchProducts, {
      staleTime: 60000,
    });

  console.log({ isLoading, isFetching });

  if (isLoading) return <>Loading...</>;
  if (isError) {
    const err = error as AxiosError; // 명시적으로 AxiosError로 캐스팅
    return <>{err.message}</>;
  }

  return (
    <>
      <TestHeader />
      <div className="text-4xl">ReactQuery</div>
      <ul className="list-disc p-4">
        {data &&
          data.data?.items?.map((product: Product) => (
            <li key={product.id}>
              {product.name} / {product.price}
            </li>
          ))}
      </ul>
    </>
  );
};

export default ReactQuery;
