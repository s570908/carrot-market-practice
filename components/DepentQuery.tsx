import { useQuery } from "react-query";
import axios from "axios";

interface DepentQueryProps {
  userId: string; // userId가 문자열 타입임을 명시합니다.
}

interface Product {
  id: string;
  name: string;
  price: number;
}

const DepentQuery = ({ userId }: DepentQueryProps) => {
  const fetchUserById = (userId: string) => {
    return axios.get(`http://localhost:4000/users/?filter=(id='${userId}')`);
  };

  const fetchProductsByUsername = (username: string) => {
    return axios.get(
      `http://localhost:4000/data/?filter=(username='${username}')`
    );
  };

  const { data: user } = useQuery(["get-user", userId], () =>
    fetchUserById(userId)
  );

  const userName = user?.data[0]?.username;

  const { data: userProducts } = useQuery(
    ["get-product-by-username", userName],
    () => fetchProductsByUsername(userName),
    {
      enabled: !!userName,
    }
  );

  return (
    <div>
      {userProducts &&
        userProducts.data?.items.map((p: Product) => (
          <div key={p?.id}>{p?.name}</div>
        ))}
    </div>
  );
};

export default DepentQuery;
