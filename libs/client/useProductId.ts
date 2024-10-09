import axios from "axios";
import { useQuery, useQueryClient } from "react-query";

interface Product {
    id: string;
    name: string;
    price: number;
  }

const fetchProductDetails = (productId: string) => {
  return axios.get(`https://jsonplaceholder.typicode.com/users/${productId}`);
};

export const useProductId = (productId: string) => {
  const queryClient = useQueryClient();
  return useQuery(
    ["product-id", productId],
    () => fetchProductDetails(productId),
    {
      initialData: () => {
        const products: any = queryClient.getQueryData("get-product");
        const product = products?.data?.find((p: Product) => p?.id === productId);

          if (product) {
            return {
              data: product,
            };
          } else return undefined;
      },
    }
  );
};
