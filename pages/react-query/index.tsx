import { useQuery } from "react-query";
import axios, { AxiosError } from "axios";
import { TestHeader } from "@components/TestHeader";
import { useAddProduct, useProductName } from "@libs/client/useProductName";
import Link from "next/link";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid"; // uuid 라이브러리 import

interface Product {
  id: string;
  name: string;
  price: number;
}

const ReactQuery = () => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);

  const onSuccess = (data: any) => {
    console.log("데이터 가져오기 후 사이드 이펙트 수행", data);
  };

  const onError = (error: unknown) => {
    console.log("오류 발생 후 사이드 이펙트 수행", error);
  };

  const { isLoading, data, isError, error } = useProductName(
    onSuccess,
    onError
  );

  const { mutate: addProduct } = useAddProduct();

  const handleCreate = () => {
    console.log({ name, price });
    const data: Product = { id: uuidv4(), name, price };
    addProduct(data);
  };

  if (isLoading) return <>Loading...</>;
  if (isError) {
    const err = error as AxiosError; // 명시적으로 AxiosError로 캐스팅
    return <>{err.message}</>;
  }

  return (
    <>
      <TestHeader />
      <div className="text-4xl">ReactQuery</div>
      <div className="space-x-2">
        <input
          className="border"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="border"
          type="number"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
        />
        <button className="border" onClick={handleCreate}>
          Create
        </button>
      </div>
      <ul className="list-disc p-4">
        {data &&
          data?.data?.map((product: Product) => (
            <li key={product.id}>
              <Link href={`/react-query/${product?.id}`}>
                <a>{product?.name}</a>
              </Link>
            </li>
          ))}
        {/* {data &&
          data.map((productName: string) => (
            <li key={productName}>{productName}</li>
          ))} */}
      </ul>
    </>
  );
};

export default ReactQuery;
