import { useState, useEffect } from "react";
import axios from "axios";
import { TestHeader } from "@components/TestHeader";

// Product 타입 정의
interface Product {
  id: string;
  name: string;
  price: number;
}

// API 응답 데이터 타입 정의
interface ProductResponse {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  items: Product[];
}

const AxiosQuery = () => {
  const [data, setData] = useState<ProductResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    axios
      .get<ProductResponse>("http://localhost:4000/data")
      .then((res) => {
        setData(res?.data);
        setIsLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) return <>Loading...</>;

  if (error) return <h2>{error}</h2>;

  return (
    <>
      <TestHeader />
      <div className="text-4xl">AxiosQuery</div>
      <ul className="list-disc p-4">
        {data &&
          data?.items?.map((product) => (
            <li key={product.id}>
              {product.name} / {product.price}
            </li>
          ))}
      </ul>
    </>
  );
};

export default AxiosQuery;
