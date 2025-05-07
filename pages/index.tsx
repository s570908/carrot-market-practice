import type { NextPage } from "next";
import FloatingButton from "@components/FloatingButton";
import Item from "@components/Item";
import Layout from "@components/Layout";
import useUser from "@libs/client/useUser";
//import useSWR, { SWRConfig } from "swr";
import { Fav, Product, ProductImage, Status } from "@prisma/client";
import { useRouter } from "next/router";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import PaginationButton from "@components/PaginationButton";
import client from "@libs/client/client";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import useSocket from "@libs/client/useSocket";
import { ChatRoomType, UserID } from "apiLibs/atypes";
import { getChatRoomIDs } from "apiLibs/chatRooms";
import { getProductsPaging } from "apiLibs/products";
import dynamic from "next/dynamic"; // dynamic import 추가
import { getUnreadMessagesForUser } from "apiLibs/chats"; // 새로운 API 함수 가져오기
import React from "react";
import { ProductPaging } from "@/types";
import ServiceWorkerStatus from "@components/ServiceWorkerStatus";

// ClipLoader를 클라이언트 사이드에서만 로드 (SSR 비활성화)
const ClipLoader = dynamic(() => import("react-spinners").then(mod => mod.ClipLoader), { 
  ssr: false,
  loading: () => <div className="w-10 h-10 border-2 border-orange-500 rounded-full border-t-transparent animate-spin"></div>
});

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

// 개별 제품 렌더링을 담당할 메모이제이션된 컴포넌트
const MemoizedProductItem = React.memo(
  ({
    product,
    user,
    changedProductId,
  }: {
    product: ProductPaging;
    user: any;
    changedProductId: number | null;
  }) => {
    // product.id와 changedProductId가 일치하면 이 제품은 변경된 것
    const isChanged = product.id === changedProductId;

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
  },
  // product.id와 changedProductId가 일치하지 않으면 이전 상태를 유지
  // 이전 상태를 유지하면 불필요한 렌더링을 방지할 수 있습니다.
  (prevProps, nextProps) => prevProps.product.id !== nextProps.changedProductId
);

// 주로 디버깅과 개발 도구에서 컴포넌트의 이름을 명확하게 표시하기 위해 사용됩니다.
// React 개발 도구(React DevTools)나 콘솔 로그에서 컴포넌트의 이름을 명확하게 볼 수 있게 해줍니다.
MemoizedProductItem.displayName = "MemoizedProductItem";

const Home: NextPage = () => {
  const { user, isLoading } = useUser();
  const [limit, setLimit] = useState(10); // limit을 상태로 설정
  const observerElem = useRef(null);
  const [socket, disconnect] = useSocket(workspace);
  const queryClient = useQueryClient();
  const [isNew, setIsNew] = useState(false); // isNew 상태 추가
  const [changedProductId, setChangedProductId] = useState<number | null>(null); // 변경된 제품 ID 추적
  // console.log("Home socket: ", socket);
  // const { data } = useSWR<ProductsResponse>(`/api/products?page=${page}`);
  // ProductsResponse 타입에 맞는 데이터 요청 함수
  const fetchProducts = async (page: number, limit: number) => {
    const response = await axios.get(`/api/products?page=${page}&limit=${limit}`);
    return response.data;
  };

  const { data: channelData } = useQuery({
    queryKey: ["chatRoomIDs"],
    queryFn: () => getChatRoomIDs(ChatRoomType.All),
  });

  // 안 읽은 메시지 확인 쿼리
  const { data: unreadMessagesData } = useQuery({
    queryKey: ["unreadMessages", user?.id],
    queryFn: () => getUnreadMessagesForUser(),
    enabled: !!user, // 사용자가 로그인한 경우에만 쿼리를 실행
  });

  // 안 읽은 메시지가 있으면 isNew 상태 업데이트
  useEffect(() => {
    if (unreadMessagesData?.ok) {
      setIsNew(unreadMessagesData.hasUnreadMessages);
    }
  }, [unreadMessagesData]);

  const {
    data,
    isLoading: isProductLoading,
    isFetching,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch, // refetch 메서드 추가
  } = useInfiniteQuery({
    queryKey: ["products", limit], // 쿼리 키에 limit을 포함
    initialPageParam: 1,
    queryFn: ({ pageParam = 1 }) => getProductsPaging(pageParam as number, limit),
    getNextPageParam: (lastPage, allPages) => {
      // 다음 페이지가 존재하면 다음 페이지 번호를 반환
      if ((lastPage as any)?.products?.length === limit) {
        return allPages.length + 1;
      }
      return undefined;
    },
    placeholderData: undefined, // keepPreviousData -> placeholderData
  });

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
        console.log("message 이벤트 received--message: ", message);
        queryClient.invalidateQueries({ queryKey: ["unreadMessages", user?.id] });
      });

      socket.on("changeState", (data) => {
        console.log("socket.on(changeState) -- data: ", data);

        // 변경된 제품의 ID와 새 상태 추출
        const { productId, new: newStatus } = data;

        // 변경된 제품 ID 설정
        setChangedProductId(productId);

        // 현재 캐시된 제품 데이터에서 해당 제품만 업데이트. 이미 서버는 새로운 정보로 업데이트되어 있으므로
        // client만 업데이트하는 것으로 충분하다.
        queryClient.setQueryData(["products", limit], (oldData: any) => {
          if (!oldData) return oldData;

          // 각 페이지를 복사하면서 해당 제품만 상태 업데이트
          const newPages = oldData.pages.map((page: any) => {
            return {
              ...page,
              products: page.products.map((product: ProductPaging) => {
                // 변경된 제품인 경우만 상태 업데이트
                if (product.id === productId) {
                  return {
                    ...product,
                    status:
                      newStatus === "판매중"
                        ? Status.Registered
                        : newStatus === "예약중"
                        ? Status.Reserved
                        : Status.Sold,
                  };
                }
                return product;
              }),
            };
          });

          return {
            ...oldData,
            pages: newPages,
          };
        });

        // 일정 시간 후 changedProductId 초기화 (선택적)
        setTimeout(() => {
          setChangedProductId(null);
        }, 0);
      });
    }

    return () => {
      socket?.off("message");
      socket?.off("changeState");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, queryClient, limit]);

  //console.log("===data: ", data);
  return (
    <Layout seoTitle="Home" title="홈" hasTabBar notice={isNew}>
      {/* 서비스 워커 상태 컴포넌트는 개발 환경에서만 표시 */}
      {process.env.NODE_ENV === "development" && <ServiceWorkerStatus />}

      <div className="flex flex-col px-4 space-y-5 divide-y">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <ClipLoader color="#36d7b7" size={50} />
          </div>
        ) : (
          data?.pages.map((page, pageIndex) =>
            page.products.map((product: ProductPaging) => (
              <MemoizedProductItem
                key={`${product.id}-${product.status}`}
                product={product}
                user={user}
                changedProductId={changedProductId}
              />
            ))
          )
        )}
        {isFetchingNextPage && hasNextPage && (
          <div className="flex items-center justify-center h-16">
            <ClipLoader color="#36d7b7" size={30} />
          </div>
        )}
      </div>
      <div className="loader" ref={observerElem}></div>
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

export default Home;
