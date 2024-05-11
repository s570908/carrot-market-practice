import type { GetStaticProps, NextPage } from "next";
import Button from "@components/Button";
import Layout from "@components/Layout";
import useSWR, { mutate, useSWRConfig } from "swr";
import { useRouter } from "next/router";
import Link from "next/link";
import { Product, Reservation, Review, User } from "@prisma/client";
import useMutation from "@libs/client/useMutation";
import { cls } from "@libs/utils";
import useUser from "@libs/client/useUser";
import ImgComponent from "@components/ImgComponent";
import { Suspense, useEffect } from "react";
import RegDate from "@components/RegDate";
import { Skeleton } from "@mui/material";
import gravatar from "gravatar";
// import EventEmitter from "eventemitter3";
import { useState } from "react";
import eventEmitter from "@libs/eventEmitter";
import Dropdown from "@components/Dropdown";
import axios from "axios";
import { toast } from "react-toastify";

interface ProductWithReview extends Review {
  createdBy: User;
}

interface ProductWithUser extends Product {
  user: User;
  productReviews: ProductWithReview[];
}
interface ItemDetailResponse {
  ok: boolean;
  product: ProductWithUser;
  relatedProducts: Product[];
  isLike: boolean;
}

interface Payload {
  buyerId: string | undefined; // user?.id가 undefined일 수 있으므로 | undefined를 추가
  itemId: number; // 가정으로 number 타입이라고 지정했습니다. 실제 타입에 맞게 수정해야 합니다.
  eventName: string;
}

const ItemDetail: NextPage = () => {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [notification, setNotification] = useState("");
  const [chatRoomCount, setChatRoomCount] = useState(0);
  // const { mutate: unboundMutate } = useSWRConfig();
  const { data, mutate: boundMutate } = useSWR<ItemDetailResponse>(
    router.query.id ? `/api/products/${router.query.id}` : null
  );
  // const url = router.query.id ? `/api/chat?productId=${router.query.id}` : "/api/chat";
  // const { data: dataChatRoom } = useSWR(
  //   `/api/chat?productId=${router.query.id}`
  // ); // SWR을 사용하여 채팅방 목록을 불러옵니다, 제품 ID에 따라 필터링

  const [toggleFav] = useMutation(`/api/products/${router.query.id}/fav`);
  const [
    talkToSeller,
    { loading: talkToSellerLoading, data: talkToSellerData },
  ] = useMutation(`/api/chat/`);
  const [buyItem, { loading: buyItemLoading, data: buyItemData }] = useMutation(
    `/api/products/${router.query.id}?seller=${data?.product.userId.toString()}`
  );
  const isProvider = data?.product?.userId === user?.id;
  const isConsumer = data?.product?.userId !== user?.id;
  const onFavClick = () => {
    if (!data) return;
    boundMutate((prev) => prev && { ...prev, isLike: !prev.isLike }, false);
    // unboundMutate("/api/users/me", (prev: any) => ({ ok: !prev.ok }), false);
    toggleFav({});
  };
  const onChatRoomList = async () => {
    // 1. 해당 chatRoom을 찾는다.
    //    해당 chatRoom을 찾는 방법: productId, 로그인한 user가 product.provider인 chatRoom을 모두 찾는다.
    // 2. 해당 chatRoom이 없으면 toast message를 띄운다.
    // 3. 해당 chatRoom이 있으면 해당 chatRoom목록 페이지로 이동한다.
    console.log("=============router.query.id: ", router.query.id);
    const res = await axios({
      method: "GET",
      url: `/api/chat?productId=${router.query.id}`,
    });
    if (res.data) {
      // setList((prev) => [...prev, { ...res.data[0] }]); //리스트 추가
      // preventRef.current = true;
      console.log("===========res.data: ", res.data);
      // setChatRoomCount(res.data.chatRoomListRelatedProduct.length);
      if (res.data.chatRoomListRelatedProduct.length === 0) {
        toast.success("대화 중인 채팅방이 없습니다.");
      } else {
        router.push(`/chats?productId=${router.query.id}`);
      }
    } else {
      console.log(res); //에러
    }

    const productId = router.query.id;
    // router.push 메서드를 사용하여 쿼리 파라미터와 함께 URL로 이동합니다.
    // router.push({
    //   pathname: "/chats",
    //   query: { productId }, // 쿼리 파라미터로 제품 ID를 전달합니다.
    // });
  };
  const onChatClick = () => {
    console.log("onChatClick clicked.");
    if (talkToSellerLoading) return;
    //// login user가 buyer이고 product를 upload한 사람이 seller이다.
    // talkToSeller({ buyerId: user?.id, sellerId: data?.product.userId });
    console.log(
      "buyerId, sellerId, productId: ",
      user?.id,
      data?.product?.userId,
      data?.product?.id
    );
    if (user?.id && data?.product?.userId && data?.product?.id) {
      talkToSeller({
        buyerId: user?.id,
        sellerId: data?.product.userId,
        productId: data?.product.id,
      });
    }
  };

  // const eventEmitter = new EventEmitter();

  const onBuyClick = () => {
    //console.log("onBuyClick clicked.");
    if (confirm("정말 구매하시겠어요?")) {
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
    if (talkToSellerData && talkToSellerData.ok) {
      talkToSellerData.chatRoom
        ? router.push({
            pathname: `/chats/${talkToSellerData.chatRoom.id}`,
            // query: {
            //   buyerId: user?.id,
            //   sellerId: data?.product.userId,
            //   productId: data?.product.id,
            // },
          })
        : router.push({
            pathname: `/chats/${talkToSellerData.createChatRoom.id}`,
            // query: { productId: data?.product.id },
          });
    }
  }, [router, talkToSellerData]);

  //   useEffect(() => {
  //     // const payload = {
  //     //   buyerId: user?.id,
  //     //   itemId: data?.product.id,
  //     //   eventName: 'intentToBuy'
  //     // };
  //     // eventEmitter.emit('buyerAction', payload);
  //     const handleBuyerAction = (payload: Payload) => {
  //       // Check if the event indicates intention to buy
  //       if (payload.eventName === 'intentToBuy') {
  //         // Process the buyer's intention
  //         const sellerNotification = `Buyer ${payload?.buyerId} wants to buy item ${payload?.itemId}`;
  //         setNotification(sellerNotification);

  //         // Optionally, you can also send notifications to external services (e.g., through WebSocket, HTTP request)
  //       }
  //     };
  // if (data?.product?.userId === user?.id)
  //     eventEmitter.on('buyerAction', handleBuyerAction);

  //     return () => {
  //       if (data?.product?.userId === user?.id)
  //       eventEmitter.off('buyerAction', handleBuyerAction);
  //     };
  //   }, []);

  useEffect(() => {
    // 이벤트를 처리할 콜백 함수 정의
    const handleBuyerAction = (payload: any) => {
      console.log("buyerAction 이벤트 발생:", payload);
      const sellerNotification = `Buyer ${payload?.buyerId} wants to buy item ${payload?.itemId}`;
      setNotification(sellerNotification);
    };

    if (true) {
      console.log("event on");
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

  useEffect(() => {
    const fetchChatRooms = async () => {
      // 페이지 로드 시 productId를 기반으로 API 요청을 보냅니다.
      const productId = router.query.id;
      if (productId) {
        try {
          const response = await axios.get(`/api/chat?productId=${productId}`);
          const chatRooms = response.data.chatRoomListRelatedProduct;
          // 채팅방 목록의 개수를 상태로 설정합니다.
          setChatRoomCount(chatRooms.length);
        } catch (error) {
          console.error("Failed to fetch chat rooms", error);
          // 에러 처리, 예를 들어 토스트 메시지를 표시할 수 있습니다.
        }
      }
    };

    fetchChatRooms();
  }, [router.query.id]);

  return (
    <Layout
      seoTitle="댕댕마켓"
      title="댕댕마켓"
      canGoBack
      backUrl={"back"}
      openModal
    >
      <div className="px-4 py-4">
        <div className="mb-8">
          <ImgComponent
            isLayout={true}
            layoutHeight="h-80"
            imgAdd={`https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_HASH}/${data?.product?.image}/public`}
            // imgAdd={`https://raw.githubusercontent.com/Real-Bird/pb/master/rose.jpg`}
            clsProps="object-scale-down"
            imgName={data?.product?.name}
          />
          <div className="flex cursor-pointer items-center space-x-3 border-b border-t py-3">
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
                imgAdd={`https:${gravatar.url(
                  user?.email ? user?.email : "anonymous@email.com",
                  {
                    s: "48px",
                    d: "retro",
                  }
                )}`}
                width={48}
                height={48}
                clsProps="rounded-full"
                imgName={data?.product?.user?.name}
              />
            )}
            <div>
              <p className="text-sm font-medium text-gray-700">
                {data ? data?.product?.user?.name : "Now Loading..."}
              </p>
              <Link
                href={
                  data?.product?.user?.id === user?.id
                    ? `/profile`
                    : `/profile/${data?.product?.user?.id}`
                }
              >
                <a className="text-xs font-medium text-gray-500">
                  View profile &rarr;
                </a>
              </Link>
            </div>
          </div>
          <div className="mt-5">
            {isProvider ? (
              <Dropdown onValueChange={handleDropdownChange} />
            ) : null}
            <h1 className="text-3xl font-bold text-gray-900">
              {data ? data?.product?.name : "Now Loading..."}
            </h1>
            <span className="mt-3 block text-3xl text-gray-900">
              ￦{data ? data?.product?.price : "Now Loading..."}
            </span>
            {/* <div className="flex items-center justify-between space-x-2">
              {data?.product?.user?.id !== user?.id && !reserveData?.isReserved ? (
                <Button large text="예약하기" onClick={reserveClick} />
              ) : data?.product?.user?.id !== user?.id &&
                reserveData?.reserve?.userId === user?.id &&
                reserveData?.isReserved ? (
                <Button large text="예약취소" onClick={reserveClick} />
              ) : data?.product?.user?.id !== user?.id &&
                reserveData?.isReserved &&
                reserveData?.reserve?.userId !== user?.id ? (
                <Button large text="이미 예약됨" isSale={true} />
              ) : null}
              <button
                onClick={onFacvoriteClick}
                className={cls(
                  "p-3 rounded-md flex items-center justify-center hover:bg-gray-100",
                  data?.isLiked
                    ? "text-red-500 hover:text-red-600"
                    : "text-gray-400 hover:text-gray-500"
                )}
              >
                {isLiked ? (
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                ) : (
                  <svg
                    className="w-6 h-6 "
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
            </div> */}
            <div className="my-3">
              <div className="border-t py-3 text-xl font-bold">
                {/*@ts-ignore*/}
                {data?.product?.productReviews?.length > 0
                  ? "Review"
                  : "Description"}
              </div>
              {/*@ts-ignore*/}
              {data?.product?.productReviews?.length > 0 ? (
                data?.product?.productReviews.map((review) => (
                  <div
                    key={review.id}
                    className="flex flex-row justify-items-start space-x-12"
                  >
                    <div className="flex flex-col items-center justify-center space-y-1">
                      {review.createdBy?.avatar ? (
                        <ImgComponent
                          imgAdd={`https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_HASH}/${review.createdBy?.avatar}/public`}
                          width={48}
                          height={48}
                          clsProps="rounded-full"
                          imgName={review.createdBy?.name}
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-slate-500" />
                      )}
                      <span className="font-medium text-gray-900">
                        {review?.createdBy.name}
                      </span>
                    </div>
                    <div className="flex flex-row items-center justify-evenly space-x-20">
                      <div className="flex flex-col items-start">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className={cls(
                                "h-5 w-5",
                                review.score >= star
                                  ? "text-yellow-400"
                                  : "text-gray-300"
                              )}
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <p className="my-2 text-lg text-gray-700">
                          {review.review}
                        </p>
                      </div>
                      <span className="font-medium text-gray-900">
                        <RegDate regDate={review.createdAt} />
                      </span>
                    </div>
                  </div>
                ))
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
              ) : data?.product.isSold ? (
                <Button onClick={onReviewClick} large text="Go to Review!" />
              ) : data?.product?.userId === user?.id ? (
                <Button
                  onClick={onChatRoomList}
                  large
                  // text="대화 중인 채팅방"
                  text={
                    chatRoomCount > 0
                      ? `대화 중인 채팅방 ${chatRoomCount}`
                      : "대화 중인 채팅방"
                  }
                />
              ) : (
                <>
                  <Button onClick={onChatClick} large text="Talk to Seller" />
                  {/* <Button onClick={onBuyClick} large text="Buy It" /> */}
                </>
              )}
              {isProvider ? null : (
                <button
                  onClick={onFavClick}
                  disabled={data?.product?.userId === user?.id}
                  className={cls(
                    data?.isLike
                      ? " text-red-400 hover:text-red-500"
                      : "text-gray-400 hover:text-gray-500",
                    "flex items-center justify-center rounded-md p-3 hover:bg-gray-100 "
                  )}
                >
                  {data?.isLike ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
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
                      className="h-6 w-6 "
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
        {data?.product.isSold ? null : (
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Similar Items</h2>
            <div className="grid grid-cols-2 gap-4">
              {data?.relatedProducts.map((product) => (
                <Link href={`/products/${product.id}`} key={product.id}>
                  <a className="cursor-pointer">
                    <ImgComponent
                      imgAdd={`https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_HASH}/${product?.image}/public`}
                      isLayout={true}
                      layoutHeight="h-56"
                      clsProps="mt-6 mb-4 bg-slate-300"
                      imgName={product.name}
                    />
                    <h3 className="-mb-1 text-base text-gray-700">
                      {product.name}
                    </h3>
                    <span className="text-xs font-medium text-gray-900">
                      ￦{product.price}
                    </span>
                  </a>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ItemDetail;
