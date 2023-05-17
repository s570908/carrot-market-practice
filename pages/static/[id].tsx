import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Button from "@components/Button";
import Layout from "@components/Layout";
import useSWR, { mutate, useSWRConfig } from "swr";
import { useRouter } from "next/router";
import Link from "next/link";
import { Product, Review, User } from "@prisma/client";
import useMutation from "@libs/client/useMutation";
import { cls } from "@libs/utils";
import useUser from "@libs/client/useUser";
import ImgComponent from "@components/Img-component";
import { useEffect } from "react";
import RegDate from "@components/RegDate";
import client from "@libs/client/client";

interface ProductWithReview extends Review {
  createBy: User;
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

const ItemDetail: NextPage<ItemDetailResponse> = ({ product, relatedProducts, isLike }) => {
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
    `/api/products/${router.query.id}?seller=${data?.product.userId}`
  );
  const onFavClick = () => {
    if (!data) return;
    boundMutate((prev) => prev && { ...prev, isLike: !prev.isLike }, false);
    // unboundMutate("/api/users/me", (prev: any) => ({ ok: !prev.ok }), false);
    toggleFav({});
  };
  const onChatClick = () => {
    if (talkToSellerLoading) return;
    talkToSeller({ buyerId: user?.id, sellerId: data?.product.userId });
  };
  const onBuyClick = () => {
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
      talkToSellerData.chatRoomList
        ? router.push(`/chats/${talkToSellerData.chatRoomList.id}`)
        : router.push(`/chats/${talkToSellerData.createChat.id}`);
    }
  }, [router, talkToSellerData]);
  // if (router.isFallback) {
  //   return (
  //     <Layout head="캐럿" title="Loading for you" canGoBack backUrl={"back"}>
  //       <span>I love you</span>
  //     </Layout>
  //   );
  // }
  return (
    <Layout seoTitle="캐럿" title="캐럿" canGoBack backUrl={"back"}>
      <div className="px-4 py-4">
        <div className="mb-8">
          <ImgComponent
            isLayout={true}
            layoutHeight="h-80"
            imgAdd={`https://raw.githubusercontent.com/Real-Bird/pb/master/rose.jpg`}
            clsProps="object-scale-down"
          />
          <div className="flex cursor-pointer items-center space-x-3 border-b border-t py-3">
            {product?.user?.avatar ? (
              <ImgComponent
                imgAdd={`https://raw.githubusercontent.com/Real-Bird/pb/master/rose.jpg`}
                width={48}
                height={48}
                clsProps="rounded-full"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-slate-300" />
            )}
            <div>
              <p className="text-sm font-medium text-gray-700">{product?.user?.name}</p>
              <Link
                href={product?.user?.id === user?.id ? `/profile` : `/profile/${product?.user?.id}`}
              >
                <a className="text-xs font-medium text-gray-500">View profile &rarr;</a>
              </Link>
            </div>
          </div>
          <div className="mt-5">
            <h1 className="text-3xl font-bold text-gray-900">{product?.name}</h1>
            <span className="mt-3 block text-3xl text-gray-900">￦{product?.price}</span>
            <div className="my-3">
              <div className="border-t py-3 text-xl font-bold">
                {/*@ts-ignore*/}
                {product?.productReviews?.length > 0 ? "Review" : "Description"}
              </div>
              {/*@ts-ignore*/}
              {product?.productReviews?.length > 0 ? (
                product?.productReviews.map((review) => (
                  <div key={review.id} className="flex flex-row justify-items-start space-x-12">
                    <div className="flex flex-col items-center justify-center space-y-1">
                      {review.createBy?.avatar ? (
                        <ImgComponent
                          imgAdd={`https://raw.githubusercontent.com/Real-Bird/pb/master/rose.jpg`}
                          width={48}
                          height={48}
                          clsProps="rounded-full"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-slate-500" />
                      )}
                      <span className="font-medium text-gray-900">{review?.createBy.name}</span>
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
                <p className="my-6 text-base text-gray-700">{product?.description}</p>
              )}
            </div>
            <div className="flex items-center justify-between space-x-2">
              {/*@ts-ignore*/}
              {data?.product?.productReviews?.length > 0 ? (
                <Button disabled large text="Good Carrot!" />
              ) : data?.product.isSell ? (
                <Button onClick={onReviewClick} large text="Go to Review!" />
              ) : data?.product?.userId === user?.id ? (
                <Button disabled large text="My item" />
              ) : (
                <>
                  <Button onClick={onChatClick} large text="Talk to Seller" />
                  <Button onClick={onBuyClick} large text="Buy It" />
                </>
              )}
              {product.isSell ? null : (
                <button
                  onClick={onFavClick}
                  disabled={product?.userId === user?.id}
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
        {product ? null : (
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Similar Items</h2>
            <div className="grid grid-cols-2 gap-4">
              {relatedProducts?.map((product) => (
                <Link href={`/products/${product.id}`} key={product.id}>
                  <a className="cursor-pointer">
                    <ImgComponent
                      imgAdd={`https://raw.githubusercontent.com/Real-Bird/pb/master/rose.jpg`}
                      isLayout={true}
                      layoutHeight="h-56"
                      clsProps="mt-6 mb-4 bg-slate-300"
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

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps = async (ctx) => {
  if (!ctx?.params?.id) {
    return {
      props: {},
    };
  }
  const product = await client.product.findUnique({
    where: {
      id: +ctx?.params?.id.toString(),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      productReviews: {
        select: {
          createdBy: {
            select: {
              name: true,
              avatar: true,
            },
          },
          review: true,
          score: true,
          createdAt: true,
        },
      },
    },
  });
  const terms = product?.name.split(" ").map((word) => ({
    name: {
      contains: word,
    },
  }));
  const relatedProducts = await client.product.findMany({
    where: {
      OR: terms,
      AND: {
        id: {
          not: product?.id,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });
  // await new Promise((resolve) => setTimeout(resolve, 10000));
  return {
    props: {
      product: JSON.parse(JSON.stringify(product)),
      relatedProducts: JSON.parse(JSON.stringify(relatedProducts)),
    },
  };
};

export default ItemDetail;
