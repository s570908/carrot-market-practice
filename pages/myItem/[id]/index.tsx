import type { GetStaticProps, NextPage } from "next";
import Button from "@components/Button";
import Layout from "@components/Layout";
//import useSWR, { mutate, useSWRConfig } from "swr";
import { useRouter } from "next/router";
import Link from "next/link";
import { Product, Reservation, Review, Status, User } from "@prisma/client";
import useMutation from "@libs/client/useMutation";
import { cls } from "@libs/utils";
import useUser from "@libs/client/useUser";
import ImgComponent from "@components/ImgComponent";
import { Suspense, useEffect, useState } from "react";
import RegDate from "@components/RegDate";
import gravatar from "gravatar";
import Dropdown from "@components/Dropdown";
import { IoEllipsisVerticalSharp } from "react-icons/io5";
import { ReserveResponse } from "pages/api/apiTypes";
import EventEmitter from "eventemitter3";
//import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getProduct } from "apiLibs/products"; // API 함수 import
import { ProductDetailResponse } from "@/apiLibs/atypes";
import { getReservation } from "apiLibs/products"; // getReservation 함수가 있다고 가정
import {
  useQuery,
  useQueryClient,
  useMutation as useReactQueryMutation,
} from "@tanstack/react-query";

interface ProductWithReview extends Review {
  createdBy: User;
}

interface ProductWithImage extends Product {
  image: string;
}

interface ProductWithUser extends Product {
  user: User;
  productReviews: ProductWithReview[];
  relatedProducts: ProductWithImage[];
}

interface ItemDetailResponse {
  ok: boolean;
  product: ProductWithUser;
  relatedProducts: ProductWithImage[];
  isLike: boolean;
}

const ItemDetail: NextPage = () => {
  const { user, isLoading } = useUser();
  const router = useRouter();
  // const { mutate: unboundMutate } = useSWRConfig();
  // useQueryClient 훅 사용
  const queryClient = useQueryClient();
  const id = router.query.id ? +router.query.id : undefined;

  // React Query로 제품 데이터 가져오기
  const {
    data,
    isLoading: isQueryLoading,
    isError,
  } = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProduct(id!),
    enabled: !!id, // id가 존재할 때만 쿼리 실행
  });

  // SWR의 boundMutate 기능과 유사한 함수 구현
  const boundMutate = (newData?: ProductDetailResponse) => {
    if (newData) {
      // 새 데이터로 캐시 직접 업데이트
      queryClient.setQueryData(["product", id], newData);
    } else {
      // 캐시 무효화하고 다시 가져오기
      queryClient.invalidateQueries({ queryKey: ["product", id] });
    }
  };

  // SWR 코드를 React Query로 변환
  const {
    data: reserveData,
    isLoading: reserveLoading,
    refetch: refreshReservation,
  } = useQuery({
    queryKey: ["reservation", id],
    queryFn: () => getReservation(id!),
    enabled: !!id, // id가 있을 때만 쿼리 활성화
  });

  // mutate 함수 대체 (SWR의 mutate와 유사한 기능)
  const updateReservation = (newData?: ReserveResponse) => {
    if (newData) {
      // 새 데이터로 캐시 직접 업데이트
      queryClient.setQueryData(["reservation", id], newData);
    } else {
      // 캐시 무효화하고 다시 가져오기
      queryClient.invalidateQueries({ queryKey: ["reservation", id] });
    }
  };

  // useMutation 사용 부분도 React Query의 useMutation으로 변경할 수 있습니다
  // 필요에 따라 아래와 같이 변경
  const { mutate: reserveProduct, isPending: isReservingProduct } = useReactQueryMutation({
    mutationFn: (data: any) =>
      fetch(`/api/products/${id}/reservation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservation", id] });
    },
  });

  const [toggleFav] = useMutation(`/api/products/${router.query.id}/fav`);
  const [talkToSeller, { loading: talkToSellerLoading, data: talkToSellerData }] =
    useMutation(`/api/chat`);
  const [buyItem, { loading: buyItemLoading, data: buyItemData }] = useMutation(
    `/api/products/${router.query.id}?buyer=${data?.product.userId.toString()}`
  );
  const onFavClick = () => {
    if (!data) return;
    boundMutate({ ...data, isLike: !data.isLike } as ProductDetailResponse);
    // unboundMutate("/api/users/me", (prev: any) => ({ ok: !prev.ok }), false);
    toggleFav({});
  };
  const onItemClick = () => {
    router.push(`/products`);
  };
  const onChatClick = () => {
    console.log("onChatClick clicked.");
    if (talkToSellerLoading) return;
    //// login user가 buyer이고 product를 upload한 사람이 seller이다.
    talkToSeller({ buyerId: user?.id, sellerId: data?.product.userId });
  };

  const eventEmitter = new EventEmitter();

  const onBuyClick = () => {
    //console.log("onBuyClick clicked.");
    if (confirm("정말 구매하시겠어요?")) {
      if (buyItemLoading) return;
      buyItem({});
      router.push(`/profile/purchases/`);
    }
  };
  const onReviewClick = () => {
    router.push(`/products/${data?.product.id}/review`);
  };

  useEffect(() => {
    if (talkToSellerData && talkToSellerData.ok) {
      talkToSellerData.chatRoom
        ? router.push(`/chats/${talkToSellerData.chatRoom.id}`)
        : router.push(`/chats/${talkToSellerData.createChatRoom.id}`);
    }
  }, [router, talkToSellerData]);

  return (
    <Layout seoTitle="댕댕마켓" title="댕댕마켓" canGoBack backUrl={"back"} openModal>
      <div className="px-4 py-4">
        <div className="mb-8">
          <ImgComponent
            isLayout={true}
            layoutHeight="h-80"
            // imgAdd={`https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_HASH}/${data?.product?.image}/public`}
            imgAdd={`https://raw.githubusercontent.com/Real-Bird/pb/master/rose.jpg`}
            clsProps="object-scale-down"
            // imgName={data?.product?.name}
            imgName="장미꽃"
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
                <a className="text-xs font-medium text-gray-500">View profile &rarr;</a>
              </Link>
            </div>
          </div>
          {/* <div><Dropdown onValueChange={handleDropdownChange} /></div> */}
          <div className="mt-5">
            <h1 className="text-3xl font-bold text-gray-900">
              {data ? data?.product?.name : "Now Loading..."}
            </h1>
            <span className="mt-3 block text-3xl text-gray-900">
              ￦{data ? data?.product?.price : "Now Loading..."}
            </span>
            <div className="my-3">
              <div className="border-t py-3 text-xl font-bold">
                {/*@ts-ignore*/}
                {data?.product?.productReviews?.length > 0 ? "Review" : "Description"}
              </div>
              {/*@ts-ignore*/}
              {data?.product?.productReviews?.length > 0 ? (
                data?.product?.productReviews.map((review) => (
                  <div key={review.id} className="flex flex-row justify-items-start space-x-12">
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
                      <span className="font-medium text-gray-900">{review?.createdBy.name}</span>
                    </div>
                    <div className="flex flex-row items-center justify-evenly space-x-20">
                      <div className="flex flex-col items-start">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className={cls(
                                "h-5 w-5",
                                review.score >= star ? "text-yellow-400" : "text-gray-300"
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
                        <p className="my-2 text-lg text-gray-700">{review.review}</p>
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
              ) : data?.product?.status === Status.Sold ? (
                <Button onClick={onReviewClick} large text="Go to Review!" />
              ) : data?.product?.userId === user?.id ? (
                <Button onClick={onItemClick} large text="My item" />
              ) : (
                <>
                  <Button onClick={onChatClick} large text="Talk to Seller" />
                  <Button onClick={onBuyClick} large text="Buy It" />
                </>
              )}
              {data?.product?.status === Status.Sold ? null : (
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
        {data?.product?.status === Status.Sold ? null : (
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Similar Items</h2>
            <div className="grid grid-cols-2 gap-4">
              {data?.relatedProducts.map((product) => (
                <Link href={`/products/${product.id}`} key={product.id}>
                  <a className="cursor-pointer">
                    <ImgComponent
                      imgAdd={`https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_HASH}/${product?.images[0]?.id}/public`}
                      isLayout={true}
                      layoutHeight="h-56"
                      clsProps="mt-6 mb-4 bg-slate-300"
                      imgName={product.name}
                    />
                    <h3 className="-mb-1 text-base text-gray-700">{product.name}</h3>
                    <span className="text-xs font-medium text-gray-900">￦{product.price}</span>
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
