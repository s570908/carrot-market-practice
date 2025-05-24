import type { GetStaticProps, NextPage } from "next";
import Button from "@components/Button";
import Layout from "@components/Layout";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  ChatRoom,
  Product as PrismaProduct,
  ProductImage,
  Reservation,
  Review,
  Status,
  User,
} from "@prisma/client";
import { cls, parseId } from "@libs/utils";
import useUser from "@libs/client/useUser";
import ImgComponent from "@components/ImgComponent";
import { Suspense, useEffect, useRef } from "react";
import RegDate from "@components/RegDate";
// import { Skeleton } from "@mui/material";
import gravatar from "gravatar";
import { useState } from "react";
import eventEmitter from "@libs/eventEmitter";
import Dropdown from "@components/Dropdown";
import axios from "axios";
import { toast } from "react-toastify";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Swiper, SwiperSlide } from "swiper/react";
import { Swiper as SwiperCore } from "swiper"; // SwiperCore 타입 가져오기
import { Navigation } from "swiper/modules"; // 네비게이션 모듈
import "swiper/css";
import "swiper/css/navigation";
import { getProduct, getReservation, writeToggleFav } from "@/apiLibs/products";
import { getChatRoomsByProduct, writeChatRoom } from "@/apiLibs/chatRooms";
import { handleLoadingAndError } from "@components/LoadingError";
//import { ProductDetailResponse } from "apiLibs/atypes";
import useSocket from "@libs/client/useSocket";
import { ProductDetailResponse } from "@/types";
import StarRating from "@components/StarRating";
import { getSellerRating } from "@/apiLibs/users";
//import { getSellerRating } from "@/apiLibs/reviews";

interface ProductWithReview extends Review {
  createdBy: User;
}

// interface ProductWithUser extends PrismaProduct {
//   user: User;
//   productReviews: ProductWithReview[];
//   images: ProductImage[];
// }

interface LocalProduct {
  id: number;
  name: string;
  price: number;
  description: string;
  userId: number;
  status: Status;
  images: ProductImage[]; // Add this line to include images property
}
// interface ItemDetailResponse {
//   ok: boolean;
//   product: ProductWithUser;
//   relatedProducts: LocalProduct[];
//   isLike: boolean;
// }

interface ReservationWithUser extends Reservation {
  user: User;
}

interface ReservationResponse {
  ok: boolean;
  isReserved: boolean;
  reserve: ReservationWithUser;
}

interface Payload {
  buyerId: string | undefined; // user?.id가 undefined일 수 있으므로 | undefined를 추가
  itemId: number; // 가정으로 number 타입이라고 지정했습니다. 실제 타입에 맞게 수정해야 합니다.
  eventName: string;
}

const workspace = "market"; // 추후 다른 workspace를 추가하려면 로직을 개편해야 한다.

const ItemDetail: NextPage = () => {
  const { user } = useUser();
  const router = useRouter();
  const [swiperInstance, setSwiperInstance] = useState(null);
  const [notification, setNotification] = useState("");
  const [chatRoomCount, setChatRoomCount] = useState(0);
  const queryClient = useQueryClient();
  const id = parseId(router.query.id);
  const [socket, disconnectSocket] = useSocket(workspace);

  const { data, refetch, isLoading, isError, error } = useQuery({
    queryKey: ["product", id], // 쿼리 키 (id에 따라 쿼리가 달라짐)
    queryFn: () => getProduct(id!),
    enabled: !!id, // query.id가 있을 때만 쿼리 실행
  });

  // 판매자 평점 가져오기
  const { data: sellerRatingData, isLoading: isLoadingRating } = useQuery({
    queryKey: ["sellerRating", data?.product?.user?.id],
    queryFn: () => getSellerRating(data?.product?.user?.id!),
    enabled: !!data?.product?.user?.id,
  });

  const {
    data: reservationData,
    refetch: refetchReservation,
    isLoading: isLoadingReservation,
    isError: isErrorReservation,
    error: errorReservation,
  } = useQuery({
    queryKey: ["reservation", id], // 쿼리 키 (id에 따라 쿼리가 달라짐)
    queryFn: () => getReservation(id!),
    enabled: !!id, // query.id가 있을 때만 쿼리 실행
  });

  //console.log("reservationData: ", reservationData);

  const {
    data: chatRoomData,
    error: errorChatRoom,
    isLoading: isLoadingChatRoom,
    isError: isErrorChatRoom,
    refetch: refetchChatRoom,
  } = useQuery({
    queryKey: ["chatRoomList", id], // 쿼리 키 (productId에 따라 달라짐)
    queryFn: () => getChatRoomsByProduct(id!),
    enabled: !!id, // query.id가 있을 때만 쿼리 실행
  });

  const {
    mutate: toggleFavMutate,
    error: errorFav,
    isPending: isLoadingFav,
    isError: isErrorFav,
  } = useMutation({
    mutationFn: writeToggleFav,
    // mutation이 발생하기 전에 호출되어 optimistic UI 처리
    onMutate: async () => {
      // 현재 쿼리를 취소하여 새로운 데이터가 들어오기 전에 중복되지 않게 함
      await queryClient.cancelQueries({ queryKey: ["product", id] });

      // 캐시에서 현재 데이터를 가져옴
      const previousData = queryClient.getQueryData<ProductDetailResponse>(["product", id]);

      // optimistic하게 데이터를 업데이트
      if (previousData) {
        queryClient.setQueryData(["product", id], {
          ...previousData,
          isLike: !previousData.isLike,
        });
      }

      // 만약 에러가 발생했을 경우를 대비해 이전 데이터를 반환
      return { previousData };
    },
    // mutation 중 에러가 발생하면 optimistic 업데이트를 롤백
    onError: (error, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["product", id], context.previousData);
      }
    },
  });

  const {
    mutate: talkToSeller,
    isPending: isLoadingTalkToSeller,
    isError: isErrorTalkToSeller,
    error: errorTalkToSeller,
    data: talkToSellerData,
  } = useMutation({
    mutationFn: writeChatRoom,
    onSuccess: (data) => {
      console.log("Chat initialized successfully", data);
      //// 성공 시 처리할 로직
      //// 만약 data.isNew가 true이면 새로 생성된 chatRoom이고, false이면 기존에 존재하는 chatRoom입니다.
      // isNew가 true이면 새로운 chatRoom이 생성되었으므로, chatRoom을 생성한 후 chatRoom을 socket server에 송부한다.
      //    event name은 'chatRoomCreated'로 한다. event payload는 {chatRoom: data.chatRoom}이다.
      //    socket event를 송부하는 방법은 socket.emit('chatRoomCreated', {chatRoom: data.chatRoom})이다.
      //    socket server는 이 socket event를 수신하고는 이 socket을 /ws-market-chatRoomId 채널에 join을 시켜준다.
      // isNew가 false이면 아무일도 하지 않는다.
      // if (!data.isNew) {
      //   return;
      // }
      // if (data.isNew) {
      //   if (socket) {
      //     socket.emit("chatRoomCreated", {chatRoom: data.chatRoom });
      //   }
      // }
    },
    onError: (error) => {
      console.error("Error initializing chat", error);
    },
  });

  const handleChat = (buyerId: number, sellerId: number, productId: number) => {
    talkToSeller({ buyerId, sellerId, productId });
  };

  const onFavClick = () => {
    if (!data) return;
    toggleFavMutate(id!);
  };

  const onChatRoomList = () => {
    //console.log("onChatRoomList--chatRoomData: ", chatRoomData);

    // 1. 해당 chatRoom을 찾는다.
    //    해당 chatRoom을 찾는 방법: productId, 로그인한 user가 product.provider(product의 seller)인 chatRoom을 모두 찾는다.
    // 2. 해당 chatRoom이 없으면 toast message를 띄운다.
    // 3. 해당 chatRoom이 한개이상 있으면 해당 chatRoom목록 페이지로 이동한다.
    // 4. 해당 chatRoom이 한개 있으면 그 chatRoom으로 이동한다.

    // Check if chatRoomData is available from useQuery
    if (
      !chatRoomData ||
      !chatRoomData.chatRoomListWithUnreadCount ||
      chatRoomData.chatRoomListWithUnreadCount.length === 0
    ) {
      toast.success("대화 중인 채팅방이 없습니다.");
      return;
    }

    const chatRooms = chatRoomData.chatRoomListWithUnreadCount;
    console.log("chatRooms: ", chatRooms);

    if (chatRooms.length === 1) {
      // If there's only one chat room, navigate directly to it
      router.push(`/chats/${chatRooms[0].id}`);
    } else {
      // If there are multiple chat rooms, navigate to the chat room list page
      toast.success("채팅방이 여러개입니다. 채팅방 목록으로 이동합니다.");
      router.push(`/chats?productId=${id}`);
    }
  };

  const onChatClick = () => {
    console.log("onChatClick clicked.");
    if (isLoadingTalkToSeller) return;
    //// login user가 buyer이고 product를 upload한 사람이 seller이다.
    // talkToSeller({ buyerId: user?.id, sellerId: data?.product.userId });
    // handleChat(user?.id, data?.product?.userId);
    if (user?.id && data?.product?.userId && data?.product?.id) {
      // talkToSeller({
      //   buyerId: user?.id,
      //   sellerId: data?.product.userId,
      //   productId: data?.product.id,
      // });
      handleChat(user?.id, data?.product?.userId, data?.product?.id);
    }
  };

  // const eventEmitter = new EventEmitter();

  const onBuyClick = () => {
    //console.log("onBuyClick clicked.");
    if (
      confirm(
        '정말 구매하시겠어요?  \n \
        ToDo: 구매의사를 표시했을 경우 처리에 대한 코딩이 필요하다. \n\
         1. 판메자에게 알림을 발송하고 \n \
         2. 관련 채팅방이 존재하면 그 채팅방으로 이동한다. 존재하지 않으면 채팅방을 생성하고 그 채팅방으로 이동한다. \n \
         3. 토스트 메시지 "판매자에게 구매하겠다고 말해주세요." 라는 메시지를 띄운다. '
      )
      // 아래의 eventEmitter.emit("buyerAction", payload) 를 제거하는 것이 좋을 것 같다.
    ) {
      // if (buyItemLoading) return;
      // buyItem({});
      const payload = {
        buyerId: user?.id,
        itemId: data?.product.id,
        eventName: "intentToBuy",
      };
      eventEmitter.emit("buyerAction", payload);
      // console.log("event emitted")
      // router.push(`/profile/purchases/`);
    }
  };

  const handleDropdownChange = () => {};

  const onReviewClick = () => {
    router.push(`/products/${data?.product.id}/review`);
  };

  useEffect(() => {
    const handleRouteChange = () => {
      if (swiperInstance as any) {
        // 페이지가 로드될 때 첫 번째 이미지로 초기화
        (swiperInstance as any)?.slideTo(0);
      }
      // if (swiperRef.current) {
      //   // 페이지가 로드될 때 첫 번째 이미지로 초기화
      //   swiperRef.current.slideTo(0);
      // }
    };

    // 라우터 이벤트 리스너 추가
    router.events.on("routeChangeComplete", handleRouteChange);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [swiperInstance, router.events]);

  useEffect(() => {
    if (talkToSellerData && talkToSellerData.chatRoom) {
      router.push({
        pathname: `/chats/${talkToSellerData.chatRoom.id}`,
        // query: {
        //   buyerId: user?.id,
        //   sellerId: data?.product.userId,
        //   productId: data?.product.id,
        // },
      });
    }
  }, [router, talkToSellerData]);

  useEffect(() => {
    if (socket) {
      socket.on("changeState", async (data) => {
        console.log("changeState socket event received:", data);
        await refetch();
        await refetchChatRoom();
        await refetchReservation();
      });
    }
    return () => {
      if (socket) {
        socket.off("changeState");
      }
    };
  }, [refetch, refetchChatRoom, refetchReservation, socket]);

  useEffect(() => {
    // 이벤트를 처리할 콜백 함수 정의
    const handleBuyerAction = (payload: any) => {
      console.log("buyerAction 이벤트 발생:", payload);
      const sellerNotification = `Buyer ${payload?.buyerId} wants to buy item ${payload?.itemId}`;
      setNotification(sellerNotification);
    };

    if (true) {
      // console.log("event on");
      // isProvider가 true일 때만 이벤트 리스너를 등록합니다.
      eventEmitter.on("buyerAction", handleBuyerAction);
    }

    // 컴포넌트가 언마운트되거나 isProvider가 변경될 때 이벤트 리스너를 제거합니다.
    return () => {
      if (true) {
        eventEmitter.off("buyerAction", handleBuyerAction);
      }
    };
  }); // isProvider가 변경될 때마다 이펙트를 다시 실행합니다.

  // Update chatRoomCount whenever chatRoomData changes
  useEffect(() => {
    if (chatRoomData?.chatRoomListWithUnreadCount) {
      setChatRoomCount(chatRoomData.chatRoomListWithUnreadCount.length);
    }
  }, [chatRoomData]);

  // Handle error state
  useEffect(() => {
    if (error) {
      console.error("Failed to fetch chat rooms", error);
      // Add toast notifications or UI error feedback here if needed
    }
  }, [error]);

  const onChatRoom = () => {
    console.log("Clicked");
    router.push(`/chats/${chatRoom?.[0].id}`);
  };

  const isLoadingAny =
    isLoading || isLoadingReservation || isLoadingChatRoom || isLoadingTalkToSeller;
  const isErrorAny =
    isError || isErrorReservation || isErrorChatRoom || isErrorFav || isErrorTalkToSeller;
  const errorAny = error || errorReservation || errorChatRoom || errorFav || errorTalkToSeller;

  const loadingOrError = handleLoadingAndError(isLoadingAny, isErrorAny, errorAny);
  if (loadingOrError) return loadingOrError;

  const isProvider = data?.product?.userId === user?.id;
  const isConsumer = data?.product?.userId !== user?.id;

  const reserved = data?.product?.status === Status.Reserved ? true : false;
  const sold = data?.product?.status === Status.Sold ? true : false;
  const selling = !reserved && !sold;
  // 판매중이면 selling이 true이고, 판매중으로 표시된다.
  // 예약중이면 reserved가 true이다.
  //           로그인 유저가 예약자면 '내가 예약중'으로 표시한다.
  //           로그인 유저가 판매자면 '예약자(XX)가 예약중'과 '예약자(XX)와의 채팅방으로 이동' 버튼을 표시한다.
  //           로그인 유저가 일반 유저라면 '다른 사람이 예약중'이라고 표시한다.

  const reservationUserName = reservationData?.reserve?.user?.name;

  const chatRoom = chatRoomData?.chatRoomListWithUnreadCount?.filter(
    (chatRoom) =>
      chatRoom.product.id === id &&
      chatRoom.seller.id === user?.id &&
      chatRoom.buyer.id === reservationData?.reserve?.user?.id
  );

  console.log("chatRoomCount: ", chatRoomCount);

  return (
    <Layout
      seoTitle={data?.product?.name || "댕댕마켓"}
      title={data?.product?.name || "댕댕마켓"}
      canGoBack
      backUrl={"back"}
      openDots
      userId={data?.product?.userId} // userId prop 전달
      goHome
    >
      <div className="px-4 py-4">
        {/* 제품 이미지 슬라이더 */}
        <Swiper
          modules={[Navigation]}
          navigation
          loop={false} // 무한 루프 false
          spaceBetween={16} // 슬라이드 간격
          slidesPerView={1} // 한 번에 한 개 슬라이드
          onSwiper={(swiper: any) => {
            setSwiperInstance(swiper);
          }}
          className="overflow-hidden rounded-lg shadow-lg"
        >
          {data?.product?.images?.map((image: ProductImage, index: number) => {
            return (
              <SwiperSlide key={image.id || index}>
                <ImgComponent
                  isLayout={true}
                  layoutHeight="h-80"
                  imgAdd={`https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_HASH}/${image.imageId}/public`}
                  clsProps="object-scale-down"
                  imgName={data?.product?.name}
                />
              </SwiperSlide>
            );
          })}
        </Swiper>
        {/* 기존 코드 유지 */}
        <div className="mb-8">
          <div className="flex items-center py-3 space-x-3 border-t border-b cursor-pointer">
            {data?.product?.user?.avatar ? (
              <ImgComponent
                imgAdd={`https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_HASH}/${data?.product?.user?.avatar}/public`}
                width={48}
                height={48}
                clsProps="rounded-full"
                imgName={data?.product?.user?.name}
              />
            ) : (
              // <div className="w-12 h-12 rounded-full bg-slate-300" />
              <ImgComponent
                imgAdd={`https:${gravatar.url(user?.email ? user?.email : "anonymous@email.com", {
                  s: "48px",
                  d: "retro",
                })}`}
                width={48}
                height={48}
                clsProps="rounded-full"
                imgName={data?.product?.user?.name}
              />
            )}
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-700">
                  {data ? data?.product?.user?.name : "Now Loading..."}
                </p>
                <StarRating
                  score={sellerRatingData?.averageScore || 0}
                  size={"lg"}
                  showScore={true}
                />
                {(sellerRatingData?.reviewCount ?? 0) > 0 && (
                  <span className="text-xs text-gray-500">
                    ({sellerRatingData?.reviewCount ?? 0}개 리뷰)
                  </span>
                )}
              </div>
              <Link
                // href={
                //   data?.product?.user?.id === user?.id
                //     ? `/profile`
                //     : `/profile/${data?.product?.user?.id}`
                // }
                href={
                  data?.product?.user?.id === user?.id
                    ? `/profile`
                    : `/reviewForSeller/${data?.product?.user?.id}`
                }
              >
                <a className="text-xs font-medium text-gray-500">
                  판매자에 대한 후기 보기{" "}
                  <span style={{ fontSize: "1.5rem", position: "relative", top: "2px" }}>
                    &rarr;
                  </span>
                </a>
              </Link>
            </div>
          </div>
          <div className="mt-5">
            <div className="flex flex-col gap-2">
              {selling ? (
                <div className="text-base">판매중</div>
              ) : reserved && isProvider ? (
                <div className="flex flex-row items-center gap-3">
                  <div className="text-base">{`예약자: ${reservationUserName} `}</div>
                  <button className="p-2 text-sm rounded-full bg-slate-200" onClick={onChatRoom}>
                    예약자와의 채팅방으로 이동
                  </button>
                </div>
              ) : reserved && reservationData?.reserve?.userId === user?.id ? (
                <div className="text-base">내가 예약중임</div>
              ) : reserved && reservationData?.reserve?.userId !== user?.id ? (
                <div className="text-base">다른 사람이 예약중임</div>
              ) : sold ? (
                <div className="text-base">거래완료</div>
              ) : null}
            </div>
            {/* {isProvider ? (
              <Dropdown onValueChange={handleDropdownChange} />
            ) : null} */}
            <h1 className="mt-4 text-3xl font-bold text-gray-900">
              {data ? data?.product?.name : "Now Loading..."}
            </h1>
            <span className="block mt-3 text-3xl text-gray-900">
              ￦{data ? data?.product?.price : "Now Loading..."}
            </span>
            <div className="my-3">
              <div className="py-3 text-xl font-bold border-t">
                {/*@ts-ignore*/}
                {data?.product?.productReviews?.length > 0 ? "Review" : "Description"}
              </div>
              {/*@ts-ignore*/}
              {data?.product?.productReviews?.length > 0 ? (
                <>
                  {console.log("data?.product?.productReviews: ", data?.product?.productReviews)}
                  {data?.product?.productReviews.map((review) => (
                    <div key={review.id} className="flex flex-row space-x-12 justify-items-start">
                      {/* <div className="flex flex-col items-center justify-center space-y-1">
                        {review.createdBy?.avatar ? (
                          <ImgComponent
                            imgAdd={`https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_HASH}/${review.createdBy?.avatar}/public`}
                            width={48}
                            height={48}
                            clsProps="rounded-full"
                            imgName={review.createdBy?.name}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-slate-500" />
                        )}
                        <span className="font-medium text-gray-900">{review?.createdBy.name}</span>
                      </div> */}
                      <div className="flex flex-row items-center space-x-20 justify-evenly">
                        <div className="flex flex-col items-start mb-2">
                          Test
                          <StarRating score={review.score} />
                          <p className="mt-2 text-lg text-gray-700">{review.review}</p>
                          <span className="space-x-4 text-xs text-gray-900 font-extralight">
                            <RegDate regDate={review.createdAt} />
                            <span className="font-medium text-gray-900">
                              {review?.createdBy.name}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <p className="my-6 text-base text-gray-700">
                  {data ? data?.product?.description : "Now Loading..."}
                </p>
              )}
            </div>
            <div className="flex items-center justify-between space-x-2">
              {/*@ts-ignore*/}
              {data?.product?.productReviews?.length > 0 ? (
                <Button disabled large text="Good Carrot!" />
              ) : data?.product?.status === Status.Sold ? (
                <Button onClick={onReviewClick} large text="Go to Review!" />
              ) : data?.product?.userId === user?.id ? (
                <Button
                  onClick={onChatRoomList}
                  large
                  text={
                    chatRoomCount > 0
                      ? `대화 중인 채팅방: ${chatRoomCount}개`
                      : "대화 중인 채팅방이 없습니다."
                  }
                  disabled={chatRoomCount <= 0}
                />
              ) : (
                <>
                  <Button onClick={onChatClick} large text="Talk to Seller" />
                  <Button onClick={onBuyClick} large text="Buy It" />
                </>
              )}
              {isProvider ? null : (
                <button
                  onClick={onFavClick}
                  disabled={data?.product?.userId === user?.id || isLoadingFav}
                  className={cls(
                    data?.isLike
                      ? "text-red-400 hover:text-red-500"
                      : "text-gray-400 hover:text-gray-500",
                    "flex items-center justify-center rounded-md p-3 hover:bg-gray-100"
                  )}
                >
                  {isLoadingFav ? (
                    // 버튼 내부에만 로딩 표시
                    <div className="w-6 h-6 bg-gray-300 rounded-full animate-pulse"></div>
                  ) : data?.isLike ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-6 h-6"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
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
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
        {data?.product?.status === Status.Sold ? null : (
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Similar Items</h2>
            <div className="grid grid-cols-2 gap-4">
              {data?.relatedProducts.map((product) => {
                //console.log("product: ", product);
                return (
                  <Link href={`/products/${product.id}`} key={product.id}>
                    <a className="cursor-pointer">
                      <ImgComponent
                        imgAdd={`https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_HASH}/${product?.images[0]?.imageId}/public`}
                        isLayout={true}
                        layoutHeight="h-56"
                        clsProps="mt-6 mb-4 bg-slate-300 object-cover"
                        imgName={product.name}
                      />
                      <h3 className="-mb-1 text-base text-gray-700">{product.name}</h3>
                      <span className="text-xs font-medium text-gray-900">￦{product.price}</span>
                    </a>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ItemDetail;
