import Link from "next/link";
import ImgComponent from "./ImgComponent";
import dayjs from "dayjs";
import { cls } from "@libs/utils";
import { MessageData } from "types/types";
import "dayjs/locale/ko"; // 한국어 로케일을 불러옵니다.

interface User {
  id: number; // string에서 number로 변경
  name: string;
}

interface Product {
  name: string;
  price: number;
  image: string;
}

interface ChatRoom {
  id: string;
  buyerId: number; // string에서 number로 변경
  buyer: User;
  seller: User;
  product: Product;
  recentMsg?: {
    userId: number; // string에서 number로 변경
    chatMsg: string;
    createdAt: string;
  };
}
interface Data {
  unreadCountsPerRoom: Record<string, number>;
}

interface EachChatRoomProps {
  chatRoom: ChatRoom;
  user: User | undefined;
  onlineUsers: number[]; // number[]에서 string[]로 변경
  data: Data;
  messageData?: MessageData | null;
}

const EachChatRoom = ({ chatRoom, user, onlineUsers, data, messageData }: EachChatRoomProps) => {
  console.log("EachChatRoom--messageData: ", messageData);
  if (!user) {
    return null; // user가 undefined일 경우 아무것도 렌더링하지 않음
  }
  // Calculate whether the user is online
  const isUserOnline = onlineUsers.includes(
    chatRoom.buyerId === user?.id ? chatRoom.seller.id : chatRoom.buyer.id
  );

  // 로그인 유저가 채팅방에서 구매자인지 여부
  const isBuyer = chatRoom?.buyerId === user?.id;

  const truncateMessage = (msg: string, length: number) => {
    if (msg.length <= length) return msg;
    return msg.substring(0, length) + "...";
  };

  return (
    <Link href={`/chats/${chatRoom.id}`} key={chatRoom.id}>
      <a className="flex cursor-pointer items-center space-x-3 px-4 py-3">
        <div className="">
          <ImgComponent
            imgAdd={`https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_HASH}/${chatRoom?.product?.image}/public`}
            width={72}
            height={72}
            imgName={chatRoom?.product?.name}
          />
        </div>
        <div className="flex w-full flex-col space-y-1">
          <div className="flex flex-row space-x-2">
            <div className="text-md">{chatRoom?.product?.name}</div>
            <div className="text-md">{`${chatRoom?.product?.price}원`}</div>
          </div>
          <div className="flex w-full flex-row items-center space-x-2">
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
                    {messageData && messageData.channelId === +chatRoom.id
                      ? truncateMessage(messageData.chatMsg, 20)
                      : "No message"}
                  </div>
                </div>
                {data.unreadCountsPerRoom[chatRoom.id] !== 0 ? (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500">
                    <div className="text-sm text-white">
                      {data.unreadCountsPerRoom[chatRoom.id]}
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="text-sm text-gray-400">
                최신 메세지 시간:{" "}
                {messageData?.createdAt && messageData.channelId === +chatRoom.id
                  ? dayjs(messageData.createdAt).format("YYYY년 MM월 DD일 A h:mm")
                  : "N/A"}
              </div>
            </div>
          </div>
        </div>
      </a>
    </Link>
  );
};

export default EachChatRoom;
