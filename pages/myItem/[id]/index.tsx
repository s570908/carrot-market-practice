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
import { Suspense, useEffect, useState } from "react";
import RegDate from "@components/RegDate";
import { Skeleton } from "@mui/material";
import gravatar from "gravatar";
import Dropdown from "@components/Dropdown";
import { IoEllipsisVerticalSharp } from "react-icons/io5";
import { ReserveResponse } from "pages/api/apiTypes";
import EventEmitter from "eventemitter3";

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

const ItemDetail: NextPage = () => {
  const { user, isLoading } = useUser();
  const router = useRouter();
  // const { mutate: unboundMutate } = useSWRConfig();
  const { data, mutate: boundMutate } = useSWR<ItemDetailResponse>(
    router.query.id ? `/api/products/${router.query.id}` : null
  );

  const [toggleFav] = useMutation(`/api/products/${router.query.id}/fav`);
  const [talkToSeller, { loading: talkToSellerLoading, data: talkToSellerData }] =
    useMutation(`/api/chat`);
  const [buyItem, { loading: buyItemLoading, data: buyItemData }] = useMutation(
    `/api/products/${router.query.id}?buyer=${data?.product.userId.toString()}`
  );
  const {
    data: reserveDataSWR,
    isLoading: reserveLoadingSWR,
    mutate: reserveMutateSWR,
  } = useSWR<ReserveResponse>(
    router.query.id ? `/api/products/${router.query.id}/reservation` : null
  );
  const [reservedApi, { loading: reserveMutateLoadingApi, data: reserveMutateDataApi }] =
    useMutation(`/api/products/${router.query.id}/reservation`);
  const onFavClick = () => {
    if (!data) return;
    boundMutate((prev) => prev && { ...prev, isLike: !prev.isLike }, false);
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
  const handleDropdownChange = (selectedValue: string) => {
    // Dropdown에서 선택값이 변경될 때 호출될 함수
    // 예: 선택된 값으로 API 호출
    if (reserveMutateLoadingApi) return;
    if (selectedValue === '예약중') {
      reserveMutateSWR(
        (prev) =>
          prev && {
            ...prev,
            isReserved: !prev.isReserved,
          },
        false
      );
      reservedApi({ variables: { selectedValue }});
    } else if(selectedValue === '거래완료') {
      if (reserveDataSWR?.isReserved === true) {
        reservedApi({ variables: { selectedValue }});
      } 
      
    } else {
      // 판매중
      console.log("reserveDataSWR?.isReserved: ", reserveDataSWR?.isReserved)
      if (reserveDataSWR?.isReserved === true) {
        reservedApi({ variables: { selectedValue }});
      }
    }
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
          <div><Dropdown onValueChange={handleDropdownChange} /></div>
          <div className="mt-5">
            <h1 className="text-3xl font-bold text-gray-900">
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
                data?.product?.productReviews.map((review) => (
                  <div key={review.id} className="flex flex-row space-x-12 justify-items-start">
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
                        <div className="w-12 h-12 rounded-full bg-slate-500" />
                      )}
                      <span className="font-medium text-gray-900">{review?.createdBy.name}</span>
                    </div>
                    <div className="flex flex-row items-center space-x-20 justify-evenly">
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
              ) : data?.product.isSold ? (
                <Button onClick={onReviewClick} large text="Go to Review!" />
              ) : data?.product?.userId === user?.id ? (
                <Button onClick={onItemClick} large text="My item" />
              ) : (
                <>
                  <Button onClick={onChatClick} large text="Talk to Seller" />
                  <Button onClick={onBuyClick} large text="Buy It" />
                </>
              )}
              {data?.product.isSold ? null : (
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