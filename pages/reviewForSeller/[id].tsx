import type { NextPage } from "next";
import Layout from "@components/Layout";
import useUser from "@libs/client/useUser";
import { useRouter } from "next/router";
import { cls, parseId } from "@libs/utils";
import Link from "next/link";
import ImgComponent from "@components/ImgComponent";
import { useEffect } from "react";
import gravatar from "gravatar";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ProfileResponse } from "apiLibs/atypes";
import { handleLoadingAndError } from "@components/LoadingError";
import { getOther } from "apiLibs/users";
import dayjs from "dayjs";
import "dayjs/locale/ko"; // Import Korean locale
import StarRating from "@components/StarRating"; // StarRating 컴포넌트 import 추가

dayjs.locale("ko"); // Set dayjs locale to Korean

const ReviewForSellerDetail: NextPage = () => {
  const { user } = useUser();
  const router = useRouter();
  const id = router.query.id ? parseId(router.query.id) : 0;

  const {
    data: profileData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["profile", id],
    queryFn: () => getOther(id!),
    enabled: !!id,
  });

  const salesWithReview = profileData?.other?.sales?.filter(
    (sale) => sale?.product?.productReviews?.length > 0
  );

  const loadingOrError = handleLoadingAndError(isLoading, isError, error);
  if (loadingOrError) return loadingOrError;

  return (
    <Layout
      seoTitle={`${profileData?.other.name}의 Review`}
      title={`${profileData?.other.name}의 받은 후기(Received Reviews)`}
      canGoBack
      backUrl="back"
      isProfile={true}
    >
      <div className="space-y-4 px-4 py-4">
        <div className="mt-4 flex items-center space-x-3 border-b pb-4">
          {profileData?.other?.avatar ? (
            <ImgComponent
              width={48}
              height={48}
              clsProps="rounded-full bg-gray-400"
              imgAdd={`https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_HASH}/${profileData?.other.avatar}/public`}
              imgName={profileData?.other.name}
            />
          ) : (
            <ImgComponent
              imgAdd={`https:${gravatar.url(
                profileData?.other?.email ? profileData?.other?.email : "anonymous@email.com",
                {
                  s: "48px",
                  d: "retro",
                }
              )}`}
              width={48}
              height={48}
              clsProps="rounded-full"
              imgName={"UserAvatar"}
            />
          )}
          <div className="flex flex-col">
            <div className="text-xs">판매자</div>
            <span className="font-medium text-gray-900">
              {profileData?.other?.name || "판매자 이름"}
            </span>
          </div>
        </div>
        {salesWithReview?.map((sale, idx) => (
          <Link key={idx} href={`/products/${sale?.product?.id}`}>
            <a className="mb-2 flex cursor-pointer flex-col border-b pb-2">
              <div className="flex items-center space-x-4">
                <div className="pt-2">
                  <h3 className="text-sm font-medium text-gray-900">{`${sale?.product?.name}`}</h3>
                  <StarRating score={sale?.product?.productReviews[0]?.score || 0} />
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                {sale?.product?.productReviews[0]?.review || "리뷰가 없습니다."}
              </div>
              <div className="mt-1 text-sm font-normal text-gray-800">
                {sale?.product?.productReviews[0]?.updatedAt
                  ? dayjs(sale.product.productReviews[0].updatedAt).format(
                      "YYYY년 MM월 DD일 A h:mm"
                    )
                  : "날짜 정보 없음"}
              </div>
            </a>
          </Link>
        ))}
      </div>
    </Layout>
  );
};
export default ReviewForSellerDetail;
