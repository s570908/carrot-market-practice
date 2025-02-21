import type { NextPage } from "next";
import FloatingButton from "@components/FloatingButton";
import Item from "@components/Item";
import Layout from "@components/Layout";
import useUser from "@libs/client/useUser";
import useSWR, { SWRConfig } from "swr";
import { Fav, Product, ProductImage, Status } from "@prisma/client";
import { useRouter } from "next/router";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import PaginationButton from "@components/PaginationButton";
import client from "@libs/client/client";
import { useInfiniteQuery, useQuery, useQueryClient } from "react-query";
import axios from "axios";
import useSocket from "@libs/client/useSocket";
import { ChatRoomType, ProductPaging, ProductWithFav, UserID } from "apiLibs/atypes";
import { getChatRoomIDs } from "apiLibs/chatRooms";
import { getProductsPaging } from "apiLibs/products";
import { ClipLoader } from "react-spinners"; // react-spinners에서 ClipLoader 가져오기

export interface ProductWithCount extends Product {
  favs: Fav[];
  _count: {
    favs: number;
  };
  images: ProductImage[];
}

interface User {
  userId: number;
}

interface ProductsResponse {
  ok: boolean;
  products: ProductWithCount[];
  nextProducts: ProductWithCount[];
}

const limitNumber = 3;

const workspace = "market"; // 추후 다른 workspace를 추가하려면 로직을 개편해야 한다.

const Home: NextPage = () => {
  const { user, isLoading } = useUser();
  const [limit, setLimit] = useState(10); // limit을 상태로 설정
  const observerElem = useRef(null);
  const [socket, disconnect] = useSocket(workspace);
  const queryClient = useQueryClient();
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
    refetch, // refetch 메서드 추가
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
      //console.log("channelData.sellerChatRoomList: ", channelData.sellerChatRoomList);
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
      socket.on("changeState", (data) => {
        // product db collection에서 data.productId에 해당하는 상품의 상태를 data.new로 변경되었음을 알림
        // page.products를 다시 fetch하도록 한다.
        console.log("socket.on(changeState) -- data: ", data);
        console.log("socket.on(changeState) -- refetch: ");
        refetch(); // refetch 메서드 호출
      });
    }

    return () => {
      socket?.off("message");
      socket?.off("changeState");
    };
  }, [socket, refetch]);

  //console.log("===data: ", data);
  return (
    <Layout seoTitle="Home" title="홈" hasTabBar notice>
      <div className="flex flex-col space-y-5 divide-y px-4">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <ClipLoader color="#36d7b7" size={50} />
          </div>
        ) : (
          data?.pages.map((page) =>
            page.products.map((product: ProductPaging) => {
              let status: Status;
              switch (product?.status) {
                case Status.Reserved:
                  status = Status.Reserved;
                  break;
                case Status.Sold:
                  status = Status.Sold;
                  break;
                case Status.Registered:
                  status = Status.Registered;
                  break;
                default:
                  status = Status.Unregistered;
                  return null; // Skip products with status Unregistered
              }

              return (
                <Item
                  id={product.id}
                  key={product.id}
                  title={product.name}
                  price={product.price}
                  hearts={product._count?.favs}
                  photo={product?.images?.[0]?.imageId ?? ""}
                  isLike={product.favs
                    .map((uid: UserID) => (uid.userId === user?.id ? true : false))
                    .includes(true)}
                  status={status}
                />
              );
            })
          )
        )}
        {isFetchingNextPage && hasNextPage && (
          <div className="flex h-16 items-center justify-center">
            <ClipLoader color="#36d7b7" size={30} />
          </div>
        )}
      </div>
      <div className="loader" ref={observerElem}></div>
      {data ? (
        <div className="group relative w-full">
          <FloatingButton href="/products/upload" isGroup={true}>
            <svg
              className="h-6 w-6"
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

export default Home;
