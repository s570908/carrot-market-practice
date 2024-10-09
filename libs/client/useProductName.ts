import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "react-query";

interface Product {
  id: string;
  name: string;
  price: number;
}

const fetchProducts = () => {
  return axios.get("http://localhost:4000/items");
};

const addProduct = (product: Product) => {
  return axios.post("http://localhost:4000/items", product);
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

export const useAddProduct = () => {
  const queryClient = useQueryClient();
  return useMutation(addProduct, {
    onMutate: async (newProduct) => {
      await queryClient.cancelQueries("get-product");
      const previousProductData = queryClient.getQueryData("get-product");
      queryClient.setQueryData("get-product", (oldProductData: any) => {
        return {
          ...oldProductData,
          data: [...oldProductData?.data, { ...newProduct }],
        };
      });
      return {
        previousProductData,
      };
    },
    onError: (_error, _product, context) => {
      queryClient.setQueryData("get-product", context?.previousProductData);
    },
    onSettled: () => {
      queryClient.invalidateQueries("get-product");
    },
  });
};
