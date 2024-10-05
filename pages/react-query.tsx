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
  const onSuccess = (data: ProductResponse) => {
    console.log("데이터 가져오기 후 사이드 이펙트 수행", data);
  };

  const onError = (error: unknown) => {
    console.log("오류 발생 후 사이드 이펙트 수행", error);
  };

  const { isLoading, isFetching, data, isError, error, refetch } =
    useQuery<ProductResponse>("get-product", fetchProducts, {
      onSuccess,
      onError,
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
      <button
        onClick={() => refetch}
        className="rounded-md border bg-slate-100 px-4 py-2"
      >
        fetch data
      </button>
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
