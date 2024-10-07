import axios from "axios";
import { useQuery } from "react-query";

const fetchProductDetails = (productId: string) => {
  return axios.get(`http://localhost:4000/data/${productId}`);
};

export const useProductId = (productId: string) => {
  return useQuery(["product-id", productId], () =>
    fetchProductDetails(productId)
  );
};
