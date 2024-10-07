import { useQuery } from "react-query";
import axios from "axios";

const fetchProducts = () => {
  return axios.get("http://localhost:4000/data");
};

const fetchUsers = () => {
  return axios.get("http://localhost:4000/users");
};

const ParallelQuery = () => {
  const {
    data: productsData,
    isLoading: productsLoading,
    isError: productsError,
  } = useQuery("parallel-get-product", fetchProducts);
  const usersData = useQuery("parallel-get-users", fetchUsers);
  return (
    <div>
      {JSON.stringify(productsData)}
      {JSON.stringify(usersData)}
    </div>
  );
};

export default ParallelQuery;
