import type { NextPage } from "next";
import Button from "@components/Button";
import Layout from "@components/Layout";
import TextArea from "@components/TextArea";
import { useForm } from "react-hook-form";
// import useMutation from "@libs/client/useMutation";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import useUser from "@libs/client/useUser";
import useSWR from "swr";
import { Product, User, ReviewType } from "@prisma/client";
import ImgComponent from "@components/ImgComponent";
import Link from "next/link";
import { useMutation, useQuery } from "react-query";
import axios from "axios";

interface ProductWithUser extends Product {
  user: User;
}

interface UserResponse extends User {
  ok: boolean;
  other: User;
}

interface ItemDetailResponse {
  ok: boolean;
  product: ProductWithUser;
}

interface ReviewForm {
  [key: string]: string;
}

interface ReviewData {
  review: string;
  score: number;
  reviewType: ReviewType;
  createdForId: any;
}

const Review: NextPage = () => {
  const { user } = useUser();
  const router = useRouter();
  // const { data, mutate: boundMutate } = useSWR<ItemDetailResponse>(
  //   router.query.id ? `/api/products/${router.query.id}` : null
  // );
  const { data, refetch: boundMutate } = useQuery<ItemDetailResponse>(
    ["product", router?.query?.id], // 쿼리 키 (id에 따라 쿼리가 달라짐)
    () =>
      axios.get(`/api/products/${router?.query?.id}`).then((res) => res.data),
    {
      enabled: !!router?.query?.id, // query.id가 있을 때만 쿼리 실행
    }
  );
  const { otherId } = router.query;
  // const { data: dataOther } = useSWR<UserResponse>(
  //   `/api/users/${otherId}/simpleProfile`
  // );
  const { data: dataOther } = useQuery<UserResponse>(
    ["user", otherId], // 쿼리 키 (otherId에 따라 변경)
    () =>
      axios.get(`/api/users/${otherId}/simpleProfile`).then((res) => res.data),
    {
      enabled: !!otherId, // otherId가 있을 때만 쿼리 실행
    }
  );
  const isSeller = data?.product.userId === user?.id;
  const isBuyer = data?.product.userId !== user?.id;
  console.log("isSeller: -----------", data?.product.userId, otherId, isSeller);
  const { register, handleSubmit, watch } = useForm<ReviewForm>({
    mode: "onChange",
  });
  const [starScore, setStarScore] = useState(0);
  // const [writeReview, { loading: writeReviewLoading, data: writeReviewData }] =
  //   useMutation(`/api/products/${router.query.id}/reviewNew`);
  const {
    mutate: writeReview,
    isLoading: writeReviewLoading,
    data: writeReviewData,
  } = useMutation(
    (reviewData: ReviewData) =>
      axios.post(`/api/products/${router?.query?.id}/reviewNew`, reviewData), // POST 요청
    {
      onSuccess: (data) => {
        console.log("Review submitted successfully", data);
        // 성공 시 처리할 로직 추가
      },
      onError: (error) => {
        console.error("Error submitting review", error);
        // 에러 시 처리할 로직 추가
      },
    }
  );

  const handleSubmitReview = (reviewData: ReviewData) => {
    writeReview(reviewData); // mutate() 함수 호출
  };

  const onValid = ({ review }: ReviewForm) => {
    if (writeReviewLoading) return;
    handleSubmitReview({
      review,
      score: starScore,
      reviewType: isSeller ? ReviewType.SellerReview : ReviewType.BuyerReview,
      createdForId: otherId,
    });
  };

  useEffect(() => {
    if (writeReviewData?.data?.ok) {
      router.back();
    }
  }, [writeReviewData, router]);

  return (
    <Layout
      seoTitle="리뷰"
      canGoBack
      title={isSeller ? "판매자가 후기 쓰기" : "구매자가 후기 쓰기"}
      backUrl="back"
    >
      <div className="px-4 py-2">
        <div className="mb-8">
          <ImgComponent
            isLayout={true}
            layoutHeight="h-72"
            imgAdd={`https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_HASH}/${data?.product?.image}/public`}
            clsProps="object-scale-down"
            imgName={data?.product?.name}
          />
          <div className="flex items-center py-3 space-x-3 border-t border-b cursor-pointer">
            {dataOther?.other?.avatar ? (
              <ImgComponent
                imgAdd={`https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_HASH}/${data?.product?.user?.avatar}/public`}
                width={48}
                height={48}
                clsProps="rounded-full"
                imgName={dataOther?.other?.name}
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-slate-300" />
            )}
            <div>
              <p className="text-sm font-medium text-gray-700">
                {dataOther ? dataOther?.other?.name : "Now Loading..."}
              </p>
              <Link href={`/profile/${data?.product?.user?.id}`}>
                <a className="text-xs font-medium text-gray-500">
                  View profile &rarr;
                </a>
              </Link>
            </div>
          </div>
          <div className="flex flex-col items-start py-3 space-x-3 border-t border-b">
            <h1 className="text-3xl font-bold text-gray-900">
              {data ? data?.product?.name : "Now Loading..."}
            </h1>
            <span className="block mt-3 text-3xl text-gray-900">
              ￦{data ? data?.product?.price : "Now Loading..."}
            </span>
          </div>
          <form className="p-4 space-y-4" onSubmit={handleSubmit(onValid)}>
            <div className="flex flex-col items-start justify-start">
              <span className="text-sm font-bold">몇 점짜리 물건인고?</span>
              <div className="flex flex-row-reverse items-center justify-around my-2">
                {[5, 4, 3, 2, 1].map((val, key) => (
                  <>
                    <input
                      key={Date.now() + key}
                      type="radio"
                      {...register(`score${val}`)}
                      value={val}
                      checked={val === starScore}
                      id={`score${val}`}
                      className="hidden peer"
                      name="score"
                    />
                    <label
                      htmlFor={`score${val}`}
                      onClick={(e) => setStarScore(val)}
                      className="text-gray-300 cursor-pointer peer-checked:text-orange-400 peer-hover:text-orange-300"
                    >
                      <svg
                        className="w-5 h-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </label>
                  </>
                ))}
              </div>
            </div>
            <TextArea
              register={register("review", { required: true })}
              name="review"
              label="Review"
            />
            <Button text={"Upload Review"} />
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default Review;
