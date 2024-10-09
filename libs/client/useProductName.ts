import axios from "axios";
import { useQuery } from "react-query";

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
  return axios.get("http://jsonplaceholder.typicode.com/users");
};

export const useProductName = (
  onSuccess: (data: any) => void,
  onError: (error: unknown) => void
) => {
  return useQuery("get-product", fetchProducts, {
    onSuccess: onSuccess,
    onError: onError,
    // select: (data: ProductResponse): any => {
    //   const productName = data?.data?.items
    //     ?.filter((p: Product) => p.price <= 9)
    //     .map((p: Product) => p?.name);
    //   return productName;
    // },
  });
};
