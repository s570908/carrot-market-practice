import type { NextPage } from "next";
import Link from "next/link";
import Layout from "@components/Layout";
import useUser from "@libs/client/useUser";
import { cls } from "@libs/utils";
import ImgComponent from "@components/ImgComponent";
import gravatar from "gravatar";
import { useQuery } from "@tanstack/react-query";
import { getReviews } from "apiLibs/reviews";
import { handleLoadingAndError } from "@components/LoadingError";
import StarRating from "@components/StarRating";
import { useRouter } from "next/router";
import { useState } from "react";

// interface ReviewWithUser extends Review {
//   createdBy: User;
// }
// interface ReviewsResponse {
//   ok: boolean;
//   reviews: ReviewWithUser[];
// }

const Reviews = () => {
  const {
    data: reviewsData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["profile"], // 쿼리 키
    queryFn: getReviews, // 데이터를 가져오는 함수
  });

  const isLoadingAny = isLoading;
  const isErrorAny = isError;
  const errorAny = error;

  const loadingOrError = handleLoadingAndError(
    isLoadingAny,
    isErrorAny,
    errorAny
  );
  if (loadingOrError) return loadingOrError;

  return (
    <>
      {reviewsData?.reviews?.map((review) => (
        <Link key={review.id} href={`/products/${review.productForId}`}>
          <a className="mt-12 cursor-pointer">
            <div className="flex items-center space-x-4">
              {review.createdBy.avatar ? (
                <ImgComponent
                  imgAdd={`https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_HASH}/${review.createdBy.avatar}/public`}
                  width={48}
                  height={48}
                  clsProps="rounded-full"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-slate-500" />
              )}
              <div>
                <h4 className="text-sm font-bold text-gray-800">
                  {review.createdBy.name}
                </h4>
                <StarRating score={review.score} showScore={false} />
              </div>
            </div>
            <div className="mt-4 border-b pb-5 text-sm text-gray-600">
              <p>{review.review}</p>
            </div>
          </a>
        </Link>
      ))}
    </>
  );
};

const ProfileHeader = () => {
  const { user } = useUser();
  //console.log("ProfileHeader -- user: ", user);

  return (
    <>
      <div className="mt-4 flex items-center space-x-3">
        {user?.avatar ? (
          <ImgComponent
            imgAdd={`https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_HASH}/${user?.avatar}/public`}
            width={48}
            height={48}
            clsProps="rounded-full"
            imgName={user?.name}
          />
        ) : (
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
            imgName={user?.name}
          />
          // <div className="w-12 h-12 rounded-full bg-slate-500" />
        )}
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{user?.name}</span>
          <Link href="/profile/edit">
            <a className="text-sm text-gray-700">Edit profile &rarr;</a>
          </Link>
        </div>
      </div>
    </>
  );
};

const Profile: NextPage = () => {
  const router = useRouter();
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/users/logout", {
        method: "POST",
      });

      if (response.ok) {
        router.push("/enter");
      } else {
        alert("로그아웃에 실패했습니다.");
      }
    } catch (error) {
      console.error("로그아웃 오류:", error);
      alert("로그아웃 중 오류가 발생했습니다.");
    }
  };

  return (
    <Layout
      seoTitle="나의 댕댕마켓"
      hasTabBar
      title="나의 댕댕마켓"
      notice
      rightButton={
        <button
          onClick={() => router.push("/settings")}
          className="flex h-10 w-10 items-center justify-center text-gray-700 hover:text-gray-900"
        >
          {/* 톱니바퀴 아이콘 */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      }
    >
      <div className="px-4">
        <ProfileHeader />
        <div className="mt-8 flex justify-around border-y py-3">
          <Link href="/profile/sales">
            <a className="flex flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-400 text-white">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  ></path>
                </svg>
              </div>
              <span className="mt-2 text-sm font-medium text-gray-700">
                판매내역
              </span>
            </a>
          </Link>
          <Link href="/profile/purchases">
            <a className="flex flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-400 text-white">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  ></path>
                </svg>
              </div>
              <span className="mt-2 text-sm font-medium text-gray-700">
                구매내역
              </span>
            </a>
          </Link>
          <Link href="/profile/favs">
            <a className="flex flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-400 text-white">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  ></path>
                </svg>
              </div>
              <span className="mt-2 text-sm font-medium text-gray-700">
                관심목록
              </span>
            </a>
          </Link>
        </div>
        <div className="flex flex-col space-y-5">
          <div className="pt-3 text-lg font-bold">Received Reviews</div>
          <Reviews />
        </div>
      </div>
    </Layout>
  );
};

/*export const getServerSideProps = withSsrSession(async function ({
  req,
}: NextPageContext) {
  const profile = await client?.user.findUnique({
    where: { id: req?.session.user?.id },
    include: {
      fav: {
        select: {
          id: true,
          productId: true,
        },
      },
    },
  });
  return { props: { profile: JSON.parse(JSON.stringify(profile)) } };
});*/

export default Profile;
