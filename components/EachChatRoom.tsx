import Link from "next/link";
import { ChatRoom, User } from "@prisma/client";
import ImgComponent from "./ImgComponent";

interface EachChatRoomProps {
  chatRoom: any; // Consider creating a more specific type
  user: User | undefined;
  unreadCount: number;
  formatDate: (date: string) => string;
}

export default function EachChatRoom({
  chatRoom,
  user,
  unreadCount,
  formatDate,
}: EachChatRoomProps) {
  return (
    <Link href={`/chats/${chatRoom.id}`}>
      <a className="flex cursor-pointer items-center space-x-3 px-4 py-3">
        <div className="">
          <ImgComponent
            imgAdd={`https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_HASH}/${chatRoom?.product?.images?.[0]?.imageId}/public`}
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
              <div className="flex flex-row space-x-2">
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
                    {chatRoom.recentMsg?.chatMsg}
                  </div>
                </div>
                {unreadCount !== 0 &&
                chatRoom.recentMsg?.userId !== user?.id ? (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500">
                    <div className="text-sm text-white">{unreadCount}</div>
                  </div>
                ) : null}
              </div>
              <div className="text-sm text-gray-400">
                최신 메세지 시간: {formatDate(chatRoom.recentMsg?.updatedAt)}
              </div>
            </div>
          </div>
        </div>
      </a>
    </Link>
  );
}

/* <EachChatRoom
                key={chatRoom.id}
                chatRoom={chatRoom}
                user={user}
                unreadCount={data.unreadCountsPerRoom[chatRoom.id]}
                formatDate={formatDate}
              /> */
