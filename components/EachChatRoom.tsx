import Link from "next/link";
import ImgComponent from "./ImgComponent";
import dayjs from "@libs/dayjs";
import { cls } from "@libs/utils";
import useUser from "@libs/client/useUser";
import { useEffect } from "react";
import useSocket from "@libs/client/useSocket";
import { useQuery } from "@tanstack/react-query";
import { Socket } from "socket.io-client";
import { getChatRoom, getChatRoomsById } from "apiLibs/chatRooms";
import { ChatRoomResponse } from "apiLibs/atypes";

// interface User {
//   id: number;
//   name: string;
// }

// interface ChatRoom {
//   id: number;
//   buyerId: number;
//   buyer: User;
//   sellerId: number;
//   seller: User;
//   product: Product;
//   recentMsg?: {
//     userId: number;
//     chatMsg: string;
//     createdAt: string;
//     updatedAt?: string; // updatedAt 속성을 추가합니다.
//   };
//   unreadCount: number;
// }

// interface ChatRoomResponse {
//   ok: boolean;
//   chatRoom: ChatRoom;
// }

interface EachChatRoomProps {
  chatRoomId: number;
  onlineUsers: number[]; // number[]
  shouldRefetch: boolean;
}

const workspace = "market"; // 추후 다른 workspace를 추가하려면 로직을 개편해야 한다.

const EachChatRoom = ({ chatRoomId, onlineUsers, shouldRefetch }: EachChatRoomProps) => {
  const [socket, disconnectSocket] = useSocket(workspace);
  const { user } = useUser();

  const {
    data: chatRoomData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["chatRoomList", chatRoomId], // 쿼리 키
    queryFn: () => getChatRoomsById(chatRoomId), // 쿼리 함수
    enabled: !!chatRoomId, // id가 있을 때만 실행
    //staleTime: 1000 * 60 * 5, // 데이터가 5분 동안 최신 상태로 간주
    // cacheTime: 1000 * 60 * 10, // 데이터 캐시 10분 동안 유지
    // onSuccess: (data) => {
    //   // 성공 시 실행되는 콜백
    //   console.log("Fetched chat room data:", data);
    // },
  });

  useEffect(() => {
    if (socket) {
      //console.log("EachChatRoom--socket: ", socket);
      socket?.on("message", (message: any) => {
        // console.log("EachChatRoom--message 이벤트 들어 왔다. message: ", message);
        // // 이  chatRoom에 새로운 message가 들어오면... chatRoom 관련 data를 다시 읽어온다.
        // // 해당 chatRoom에서만 refetch하도록...
        // console.log(
        //   "EachChatRoom 들어옴--chatRoomId, onlineUsers, shouldRefetch: ",
        //   chatRoomId,
        //   onlineUsers,
        //   shouldRefetch
        // );
        // console.log(
        //   "::EachChatRoom--message.chatRoomId, chatRoomId: ",
        //   message.chatRoomId,
        //   chatRoomId
        // );
        if (chatRoomId && message.chatRoomId === chatRoomId) {
          console.log(
            "EachChatRoom--message.chatRoomId과 chatRoomId 가 동일하다. reftech한다: ",
            message.chatRoomId,
            chatRoomId
          );
          refetch();
        }
      });

      // router.events 가 발생할 때 refetch를 수행한다.
      // 여기서는 router.back()으로 이 페이지로 돌아왔을 때에 발생하는 이벤트에 대한 처리이다.
      if (shouldRefetch) {
        refetch();
      }
    }
    return () => {
      socket?.off("message");
    };
  }, [chatRoomId, onlineUsers, refetch, shouldRefetch, socket]);

  if (!user) {
    return null; // user가 undefined일 경우 아무것도 렌더링하지 않음
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return <div>Error: {errorMessage}</div>;
  }

  const chatRoom = chatRoomData?.chatRoom;
  // Calculate whether the user is online
  let isUserOnline = false;
  if (chatRoom) {
    // Calculate whether the user is online
    isUserOnline = onlineUsers.includes(
      chatRoom.buyerId === user?.id ? chatRoom.sellerId : chatRoom.buyerId
    );
  }

  // 로그인 유저가 채팅방에서 구매자인지 여부
  const isBuyer = chatRoom?.buyerId === user?.id;

  const truncateMessage = (msg: string, length: number) => {
    if (msg.length <= length) return msg;
    return msg.substring(0, length) + "...";
  };

  //console.log("chatRoom--product: ", chatRoom?.product);

  return (
    <>
      {chatRoom ? (
        <Link href={`/chats/${chatRoom.id}`} key={chatRoom.id}>
          <a className="flex items-center px-4 py-3 space-x-3 cursor-pointer">
            <div className="">
              <ImgComponent
                imgAdd={`https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_HASH}/${
                  chatRoom?.product?.images?.[0]?.imageId || ""
                }/public`}
                width={72}
                height={72}
                imgName={chatRoom?.product?.name}
              />
            </div>
            <div className="flex flex-col w-full space-y-1">
              <div className="flex flex-row space-x-2">
                <div className="text-md">{chatRoom?.product?.name}</div>
                <div className="text-md">{`${chatRoom?.product?.price}원`}</div>
              </div>
              <div className="flex flex-row items-center w-full space-x-2">
                <div className="relative w-10/12 space-y-1">
                  <div className="flex flex-row items-center space-x-2">
                    <div
                      className={cls(
                        "h-2.5 w-2.5 rounded-full",
                        isUserOnline ? "bg-green-400" : "bg-gray-400"
                      )}
                    />
                    <p className="text-gray-700">
                      {chatRoom.buyerId === user?.id
                        ? `판매자: ${chatRoom.seller.name}`
                        : `구매자: ${chatRoom.buyer.name}`}
                    </p>
                  </div>
                  <div className="flex flex-row items-center justify-between">
                    <div className="flex flex-row items-center space-x-2">
                      <div className="whitespace-nowrap rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                        {chatRoom.recentMsg?.userId === chatRoom.seller.id
                          ? chatRoom.seller.name
                          : chatRoom.buyer.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {chatRoom.recentMsg?.chatMsg && chatRoom.recentMsg.chatMsg.length > 0
                          ? truncateMessage(chatRoom.recentMsg.chatMsg, 15)
                          : "No message"}
                      </div>
                    </div>
                    {chatRoom.unreadCount > 0 ? (
                      <div className="flex items-center justify-center w-5 h-5 bg-red-500 rounded-full">
                        <div className="text-sm text-white">{chatRoom.unreadCount}</div>
                      </div>
                    ) : null}
                  </div>
                  <div className="text-sm text-gray-400">
                    최신 메세지 시간:{" "}
                    {chatRoom.recentMsg?.updatedAt
                      ? dayjs(chatRoom.recentMsg.updatedAt).format("YYYY년 MM월 DD일 A h:mm")
                      : "N/A"}
                  </div>
                </div>
              </div>
            </div>
          </a>
        </Link>
      ) : (
        <p>Loading chat room data...</p>
      )}
    </>
  );
};

export default EachChatRoom;
