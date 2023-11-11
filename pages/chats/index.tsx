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
  const { user } = useUser();
  const { data } = useSWR<ChatRoomResponse>(`/api/chat`, {
    refreshInterval: 1000,
  });
  const [recentMessageShown, setRecentMessageShown] = useState("");

  console.log("Chats---data:", JSON.stringify(data, null, 2));

  useEffect(() => {
    if (data && data.ok) {
      data.chatRoomList.map((room) => {
        if (!room.recentMsgId) {
          fetch(`/api/chat?roomId=${room.id}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
          });
        }
      });
    }
  }, [data]);

  console.log("chats---data.chatRoomList: ", JSON.stringify(data?.chatRoomList, null, 2));
  console.log("chats---login user: ", JSON.stringify(user, null, 2));

  return (
    <Layout seoTitle="채팅" title="채팅" hasTabBar notice>
      <div className="divide-y-[1px] py-10">
        {data?.chatRoomList?.map((chatRoom) => (
          <Link href={`/chats/${chatRoom.id}`} key={chatRoom.id}>
            <a className="flex cursor-pointer items-center space-x-3 px-4 py-3">
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
                  <div className="h-12 w-12 rounded-full bg-slate-500" />
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
                <div className="h-12 w-12 rounded-full bg-slate-500" />
              )}
              <div className="relative w-10/12">
                <p className="text-gray-700">
                  {chatRoom.buyerId === user?.id ? chatRoom.seller.name : chatRoom.buyer.name}
                </p>
                <div className="flex flex-row">
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                    {chatRoom.recentMsg.userId === chatRoom.seller.id
                      ? chatRoom.seller.name
                      : chatRoom.buyer.name}
                  </span>
                  <p className="text-sm text-gray-500">{chatRoom.recentMsg?.chatMsg}</p>
                </div>

                {chatRoom.recentMsg?.isNew && chatRoom.recentMsg.userId !== user?.id ? (
                  <span className="absolute right-0 top-2 text-orange-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                    </svg>
                  </span>
                ) : null}
              </div>
            </a>
          </Link>
        ))}
      </div>
    </Layout>
  );
};

export default Chats;
