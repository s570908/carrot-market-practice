import { useQueries, useQuery } from "react-query";
import axios from "axios";

interface DynamicParallelQueriesProps {
  productIds: number[];
}

const fetchProducts = (id: number) => {
  return axios.get(`https://jsonplaceholder.typicode.com/posts/${id}`);
};

const DynamicParallelQueries: React.FC<DynamicParallelQueriesProps> = ({}) => {
  const productIds = [1, 2];
  console.log(productIds);
  const results = useQueries(
    productIds.map((id: number) => {
      return {
        queryKey: ["get-product", id],
        queryFn: () => fetchProducts(id),
      };
    })
  );

  console.log({ results });

  return <div>DynamicParallelQueries</div>;
};

export default DynamicParallelQueries;
