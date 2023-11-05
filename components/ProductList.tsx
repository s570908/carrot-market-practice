import { Product } from "prisma/prisma-client";
import useSWR from "swr";
import Item from "./Item";

interface ProductListProps {
  kind: "favs" | "sales" | "purchases";
}

// interface ProductWithCount extends Product {
//   _count: {
//     favs: number;
//   };
// }

// interface Record {
//   id: number;
//   product: ProductWithCount;
// }

interface Record {
  id: number;
  product: Product & {
    _count: {
      favs: number;
    };
  };
}

interface IProductListResponse {
  [key: string]: Record[];
}

export default function ProductList({ kind }: ProductListProps) {
  console.log("ProductList: begins");
  const { data } = useSWR<IProductListResponse>(`/api/users/me/${kind}`);
  console.log("ProductList: data---", JSON.stringify(data, null, 2));

  return data ? (
    <>
      {data[kind]?.map((record) => (
        <Item
          id={record.product.id}
          key={record.id}
          title={record.product.name}
          price={record.product.price}
          comments={1}
          hearts={record.product._count.favs}
          photo={record.product.image}
        />
      ))}
    </>
  ) : null;
}
