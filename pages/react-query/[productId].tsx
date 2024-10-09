import { useProductId } from "@libs/client/useProductId";
import { AxiosError } from "axios";
import { useRouter } from "next/router";

const ReactQueryDetails = () => {
  const router = useRouter();
  const { productId } = router.query;

  // productId가 없거나 배열인 경우 빈 값으로 처리
  const validProductId =
    !productId || Array.isArray(productId) ? "" : productId;

  const { isLoading, isError, error, data } = useProductId(validProductId);
  console.log(data, isLoading);
  if (isLoading) return <>Loading...</>;
  if (isError) {
    const err = error as AxiosError; // 명시적으로 AxiosError로 캐스팅
    return <>{err.message}</>;
  }

  return (
    <>
      {data && (
        <div>
          <h1>ID : {data?.data?.id}</h1>
          <h1>NAME : {data?.data?.name}</h1>
          <h2>USERNAME : {data?.data?.username}</h2>
          <h2>EMAIL : {data?.data?.email}</h2>
        </div>
      )}
    </>
  );
};

export default ReactQueryDetails;
