import type { NextPage } from "next";
import FloatingButton from "@components/FloatingButton";
import Item from "@components/Item";
import Layout from "@components/Layout";
import useUser from "@libs/client/useUser";
import { Status } from "@prisma/client";
import { useCallback, useEffect, useRef, useState } from "react";
import client from "@libs/client/client";
import { useInfiniteQuery, useQuery } from "react-query";
import axios from "axios";
import useSocket from "@libs/client/useSocket";
import { ChatRoomType, ProductPaging, ProductWithFav, UserID } from "apiLibs/atypes";
import { getChatRoomIDs } from "apiLibs/chatRooms";
import { SWRConfig } from "swr";
import { getProductsPaging } from "apiLibs/products";

// interface User {
//   userId: number;
// }

const Home: NextPage = () => {
  const { user, isLoading } = useUser();
  const [limit, setLimit] = useState(10); // limit을 상태로 설정
  const observerElem = useRef(null);
  const [socket, disconnect] = useSocket("market");
  // console.log("Home socket: ", socket);
  // const { data } = useSWR<ProductsResponse>(`/api/products?page=${page}`);
  // ProductsResponse 타입에 맞는 데이터 요청 함수
  const fetchProducts = async (page: number, limit: number) => {
    const response = await axios.get(`/api/products?page=${page}&limit=${limit}`);
    return response.data;
  };

  const { data: channelData } = useQuery("chatRoomIDs", () => getChatRoomIDs(ChatRoomType.All));

  const {
    data,
    isLoading: isProductLoading,
    isFetching,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery(
    ["products", limit], // 쿼리 키에 limit을 포함
    ({ pageParam = 1 }) => getProductsPaging(pageParam, limit),
    {
      getNextPageParam: (lastPage, allPages) => {
        // 다음 페이지가 존재하면 다음 페이지 번호를 반환
        if (lastPage?.products?.length === limit) {
          return allPages.length + 1;
        }
        return undefined;
      },
      keepPreviousData: true, // 이전 데이터 유지
    }
  );

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage]
  );

  useEffect(() => {
    const element = observerElem.current;
    const options = {
      root: null,
      rootMargin: "0px",
      threshold: 1.0,
    };

    const observer = new IntersectionObserver(handleObserver, options);
    if (element) observer.observe(element);

    return () => {
      if (element) observer.unobserve(element);
    };
  }, [fetchNextPage, hasNextPage, handleObserver]);

  // 로그인 user가 가입되어 있는 모든 chat room (channel) 목록을 가져온 후에 channels에 그 목록을 저장한다.
  useEffect(() => {
    const userData = user;
    if (channelData?.ok && userData) {
      console.info("로그인하자", socket);
      console.log("channelData.sellerChatRoomList: ", channelData.sellerChatRoomList);
      socket?.emit("login", {
        id: userData?.id,
        channels: channelData.sellerChatRoomList.map((v: any) => v.id),
      });
    }
  }, [channelData?.ok, channelData?.sellerChatRoomList, socket, user]);

  useEffect(() => {
    if (socket) {
      socket?.on("message", (message: any) => {
        console.log("message received: ", message);
      });
    }

    return () => {
      socket?.off("message");
    };
  }, [socket]);

  //console.log("===data: ", data);
  return (
    <Layout seoTitle="Home" title="홈" hasTabBar notice>
      <div className="flex flex-col px-4 space-y-5 divide-y">
        {data?.pages.map((page) =>
          page.products.map((product: ProductPaging) => {
            const reserved = product?.status === Status.Reserved;
            const sold = product?.status === Status.Sold;
            let status: Status = Status.Registered;

            if (reserved) {
              status = Status.Reserved;
            } else if (sold) {
              status = Status.Sold;
            }

            return (
              <Item
                id={product.id}
                key={product.id}
                title={product.name}
                price={product.price}
                hearts={product._count?.favs}
                photo={product.image ?? undefined} // null 값을 undefined로 변환
                isLike={product.favs
                  .map((uid: UserID) => (uid.userId === user?.id ? true : false))
                  .includes(true)}
                status={status}
              />
            );
          })
        )}
        {isLoading && <p>Loading...</p>}
      </div>
      {/* 사용자에게 limit을 조정할 수 있는 인터페이스 추가 */}
      <div className="my-4">
        <label htmlFor="limit" className="mr-2">
          페이지 당 항목 수:
        </label>
        <input
          id="limit"
          type="number"
          min="1"
          value={limit === 0 ? "" : limit} // limit이 0일 때 빈 문자열로 설정
          onChange={(e) => setLimit(Number(e.target.value) || 0)} // 빈 문자열 처리
          className="px-2 py-1 border rounded"
        />
      </div>
      <div className="loader" ref={observerElem}>
        {isFetchingNextPage && hasNextPage ? "Loading..." : "No product left"}
      </div>
      {data ? (
        <div className="relative w-full group">
          <FloatingButton href="/products/upload" isGroup={true}>
            <svg
              className="w-6 h-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </FloatingButton>
        </div>
      ) : null}
    </Layout>
  );
};

const Page: NextPage<{ products: ProductWithFav[] }> = ({ products }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/products?page=1": {
            ok: true,
            products,
          },
        },
      }}
    >
      <Home />
    </SWRConfig>
  );
};

export async function getServerSideProps() {
  const products = await client.product.findMany({
    include: {
      _count: {
        select: {
          favs: true,
        },
      },
      favs: {
        select: {
          userId: true,
        },
      },
      user: {
        select: {
          id: true,
        },
      },
    },
    take: 10,
    skip: 0,
    orderBy: { createdAt: "desc" },
  });
  return {
    props: {
      products: JSON.parse(JSON.stringify(products)),
    },
  };
}

export default Page;
