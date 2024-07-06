// import Layout from "@components/Layout";
// import type { NextPage } from "next";
// import Link from "next/link";

// const Write: NextPage = () => {
//   return (
//     <Layout title="채팅" hasTabBar>
//       <div className="divide-y-[1px] py-3">
//         {[...Array(5)].map((_, i) => (
//           <Link href={`chats/${i}`} key={i}>
//             <a className="flex items-center px-3 py-2 mb-3 space-x-3 ">
//               <div className="w-12 h-12 rounded-full bg-slate-300" />
//               <div>
//                 <p className="text-gray-700">Steve Jebs</p>
//                 <p className="text-sm text-gray-500">See you tomorrow in the corner at 2pm</p>
//               </div>
//             </a>
//           </Link>
//         ))}
//       </div>
//     </Layout>
//   );
// };

// export default Write;

import type { NextPage } from "next";
import Link from "next/link";
import Layout from "@components/Layout";
import useUser from "@libs/client/useUser";
import useSWR from "swr";
import ImgComponent from "@components/ImgComponent";
import { ChatRoom, SellerChat, User } from "@prisma/client";
import { useEffect, useState } from "react";
import gravatar from "gravatar";
import { useRouter } from "next/router";
import axios from "axios";
import { fetchChatRooms } from "@libs/server/fetchChatRooms";
import Dropdown from "@components/Dropdown";

interface ChatRoomWithUser extends ChatRoom {
  buyer: User;
  seller: User;
  recentMsg: SellerChat;
}

interface ChatRoomResponse {
  ok: boolean;
  chatRoomList: ChatRoomWithUser[];
}

const Chats: NextPage = () => {
  const router = useRouter();
  const { productId } = router.query; // URL에서 productId 쿼리 파라미터를 추출
  // console.log("productId: ", productId);
  const { user } = useUser();
  // URL을 조건부로 설정
  const url = productId ? `/api/chat?productId=${productId}` : "/api/chat";
  // const { data } = useSWR("/api/chats", {
  //   refreshInterval: 1000,
  // }); // SWR을 사용하여 채팅방 목록을 불러옵니다, 제품 ID에 따라 필터링
  const { data, error } = useSWR(url);
  const [recentMessageShown, setRecentMessageShown] = useState("");

  // console.log("Chats---data:", JSON.stringify(data, null, 2));
  // useEffect(() => {
  //   if (data && data.ok) {
  //     data.chatRoomList.map((room: any) => {
  //       if (!room.recentMsgId) {
  //         fetch(`/api/chat?roomId=${room.id}`, {
  //           method: "DELETE",
  //           headers: {
  //             "Content-Type": "application/json",
  //           },
  //         });
  //       }
  //     });
  //   }
  // }, [data]);

  const chatRooms = productId
    ? data?.chatRoomListRelatedProduct
    : data?.chatRoomList;
  // console.log("chats---login user: ", JSON.stringify(user, null, 2));

  const handleClick = () => {
    console.log("chatRoomList Product Detail clicked");
    router.push(`/products/${productId}`);
  };

  return (
    <Layout
      seoTitle="채팅"
      title="채팅"
      hasTabBar={!productId}
      canGoBack={!!productId}
      backUrl="back"
    >
      <div className="divide-y-[1px]">
        {productId ? (
          <div className="w-full max-w-xl p-4 bg-red-200 border-b border-gray-200">
            <div
              className="flex items-center cursor-pointer"
              onClick={handleClick}
            >
              <div className="flex items-center space-x-4">
                <ImgComponent
                  width={80}
                  height={80}
                  clsProps="rounded-md bg-gray-400"
                  imgAdd={`https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_HASH}/${data?.chatRoomListRelatedProduct[0]?.product?.image}/public`}
                  imgName="사진"
                />
                <div className="flex flex-col space-y-1">
                  <div className="flex flex-row items-center space-x-2">
                    <div className="text-gray-900">
                      
                      {data?.chatRoomListRelatedProduct[0]?.product?.isReserved
                        ? "예약중"
                        : data?.chatRoomListRelatedProduct[0]?.product?.isSold
                        ? "거래완료"
                        : "판매중"}
                    </div>
                    <div className="text-gray-900">
                      {data?.chatRoomListRelatedProduct[0]?.product?.name}
                    </div>
                  </div>
                  <span className="text-gray-900">
                    ￦{data?.chatRoomListRelatedProduct[0]?.product?.price}
                  </span>
                  <div className="text-gray-900">
                    {data?.chatRoomListRelatedProduct[0]?.seller?.name}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
        {chatRooms?.map((chatRoom: any) => {
          return (
            <Link href={`/chats/${chatRoom.id}`} key={chatRoom.id}>
              <a className="flex items-center px-4 py-3 space-x-3 cursor-pointer">
                {chatRoom.buyerId === user?.id ? (
                  chatRoom.seller.avatar ? (
                    <ImgComponent
                      imgAdd={`https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_HASH}/${chatRoom.seller.avatar}/public`}
                      width={48}
                      height={48}
                      clsProps="rounded-full"
                      imgName={chatRoom.seller.name}
                    />
                  ) : (
                    <ImgComponent
                      imgAdd={`https:${gravatar.url(
                        chatRoom.seller.email
                          ? chatRoom.seller.email
                          : "anonymous@email.com",
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
                  )
                ) : chatRoom.buyer.avatar ? (
                  <ImgComponent
                    imgAdd={`https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_HASH}/${chatRoom.buyer.avatar}/public`}
                    width={48}
                    height={48}
                    clsProps="rounded-full"
                    imgName={chatRoom.buyer.name}
                  />
                ) : (
                  <ImgComponent
                    imgAdd={`https:${gravatar.url(
                      chatRoom.buyer.email
                        ? chatRoom.buyer.email
                        : "anonymous@email.com",
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
                <div className="relative w-10/12 space-y-1">
                  <p className="text-gray-700">
                    {chatRoom.buyerId === user?.id
                      ? chatRoom.seller.name
                      : chatRoom.buyer.name}
                  </p>
                  <div className="flex flex-row items-center justify-between">
                    <div className="flex flex-row items-center space-x-2">
                      <div className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                        {chatRoom.recentMsg?.userId === chatRoom.seller.id
                          ? chatRoom.seller.name
                          : chatRoom.buyer.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {chatRoom.recentMsg?.chatMsg}
                        {/* 최신 메시지가 보여지는 곳입니다. */}
                      </div>
                    </div>
                    {data.unreadCountsPerRoom[chatRoom.id] !== 0 ? (
                      <div className="flex items-center justify-center w-5 h-5 bg-red-500 rounded-full">
                        <div className="text-sm text-white">
                          {data.unreadCountsPerRoom[chatRoom.id]}
                        </div>
                      </div>
                    ) : null}
                  </div>
                  {/* <div className="flex flex-row items-center space-x-2">
                    <ImgComponent
                      width={48}
                      height={48}
                      clsProps="rounded-md bg-gray-400"
                      imgAdd={`https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_HASH}/${chatRoom?.product?.image}/public`}
                      imgName="사진"
                    />
                    <div className="flex flex-col">
                      <div className="text-gray-700">
                        {chatRoom?.product?.name}
                      </div>
                      <div className="">{chatRoom.seller.name}</div>
                    </div>
                  </div> */}
                  {/* {chatRoom.recentMsg?.isNew &&
                  chatRoom.recentMsg.userId !== user?.id ? (
                    <span className="absolute right-0 text-orange-500 top-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                      </svg>
                    </span>
                  ) : null} */}
                </div>
              </a>
            </Link>
          );
        })}
      </div>
    </Layout>
  );
};

export default Chats;
