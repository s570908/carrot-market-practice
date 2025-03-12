import Item from "./Item";
import { useQuery } from "@tanstack/react-query";
import { getProducts } from "apiLibs/users";
import { handleLoadingAndError } from "./LoadingError";
import { Kind } from "@prisma/client";
import { getKindString } from "@libs/utils";

interface ProductListProps {
  kind: Kind;
}

export default function ProductList({ kind }: ProductListProps) {
  const { data, isLoading, isError, error } = useQuery(
    ["products", kind],
    () => getProducts(kind),
    {
      keepPreviousData: true,
    }
  );

  console.log("ProductList: data---", JSON.stringify(data, null, 2));

  const loadingOrError = handleLoadingAndError(isLoading, isError, error);
  if (loadingOrError) return loadingOrError;

  const kindStr = getKindString(kind);

  return data ? (
    <>
      {data[kindStr]?.map((record) => {
        const { product } = record;
        console.log("ProductList--record: ", record);
        // kind에 따라 hearts 값을 동적으로 설정
        let hearts: number = 0;
        if (kind === Kind.Fav) {
          hearts = (product._count as { favs: number }).favs;
        } else if (kind === Kind.Sale) {
          hearts = (product._count as { sales: number }).sales;
        } else if (kind === Kind.Purchase) {
          hearts = (product._count as { purchases: number }).purchases;
        }
        console.log("ProductList--hearts: ", hearts);

        return (
          <Item
            id={product.id}
            key={record.id}
            title={product.name}
            price={product.price}
            comments={1}
            hearts={hearts}
            photo={product.images[0].imageId ?? undefined} // null 값을 undefined로 변환
            isLike={true} // isLoading을 사용하여 처리}
            status={product.status}
          />
        );
      })}
    </>
  ) : null;
}
