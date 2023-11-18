import type { NextPage } from "next";
import Layout from "@components/Layout";
import useUser from "@libs/client/useUser";
import useSWR from "swr";
import { useRouter } from "next/router";
import Button from "@components/Button";
import { Product, Review, User } from "@prisma/client";
import { cls } from "@libs/utils";
import Link from "next/link";
import ImgComponent from "@components/ImgComponent";
import useMutation from "@libs/client/useMutation";
import { useEffect } from "react";
import gravatar from "gravatar";

interface ProductScore extends Product {
  productReviews: Review[];
}

interface ProfileWithReview extends User {
  sales: [
    {
      product: ProductScore;
    }
  ];
}

interface ProfileResponse {
  ok: boolean;
  other: ProfileWithReview;
}

const Profile: NextPage = () => {
  const { user } = useUser();
  const router = useRouter();

  const { data } = useSWR<ProfileResponse>(
    router.query.id ? `/api/users/other/${router.query.id}` : null
    // other 상대방
  );

  console.log("Profile---data: ", JSON.stringify(data, null, 2));

  const [talkToSeller, { loading: talkToSellerLoading, data: talkToSellerData }] =
    useMutation(`/api/chat`);

  useEffect(() => {
    if (talkToSellerData && talkToSellerData.ok) {
      talkToSellerData.chatRoomList
        ? router.push(`/chats/${talkToSellerData.chatRoomList.id}`)
        : router.push(`/chats/${talkToSellerData.createChat.id}`);
    }
  }, [router, talkToSellerData]);

  if (!router.query.id) {
    console.log("Logical error: router.query.id should be given but not.");
    return null;
  }

  const onChatClick = () => {
    console.log("onChatClick clicked.");
    if (talkToSellerLoading) return;
    talkToSeller({ buyerId: user?.id, sellerId: +router.query.id! });
  };

  return (
    <Layout
      seoTitle={`${data?.other.name} || 프로필`}
      title={`${data?.other.name}의 프로필`}
      canGoBack
      backUrl="back"
      isProfile={true}
    >
      <div className="space-y-4 px-4 py-4">
        <div className="mt-4 flex items-center space-x-3">
          {data?.other.avatar ? (
            <ImgComponent
              width={48}
              height={48}
              clsProps="rounded-md bg-gray-400"
              imgAdd={`https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_HASH}/${data?.other.avatar}/public`}
              imgName={data?.other.name}
            />
          ) : (
            <ImgComponent
              imgAdd={`https:${gravatar.url(
                data?.other.email ? data?.other.email : "anonymous@email.com",
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
            <span className="font-medium text-gray-900">{data?.other.name}</span>
          </div>
        </div>
        <Button onClick={onChatClick} large text="Talk to seller" />
        {data?.other.sales?.map((item, idx) => (
          <Link key={idx} href={`/products/${item.product.id}`}>
            <a className="flex cursor-pointer space-x-4">
              <ImgComponent
                width={80}
                height={80}
                clsProps="rounded-md bg-gray-400"
                imgAdd={`https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_HASH}/${item.product.image}/public`}
              />
              <div className="flex flex-col pt-2">
                <h3 className="text-sm font-medium text-gray-900">{item.product.name}</h3>

                <span className="mt-1 flex items-center font-medium text-gray-900">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={cls(
                        "h-5 w-5",
                        item.product.productReviews[0]?.score >= star
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
                </span>
              </div>
            </a>
          </Link>
        ))}
      </div>
    </Layout>
  );
};
export default Profile;
