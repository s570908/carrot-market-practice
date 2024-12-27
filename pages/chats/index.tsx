import type { NextPage } from "next";
import Link from "next/link";
import Layout from "@components/Layout";
import useUser from "@libs/client/useUser";
import useSWR from "swr";
import ImgComponent from "@components/ImgComponent";
import { ChatRoom, Reservation, SellerChat, Status, User } from "@prisma/client";
import { useEffect, useState } from "react";
import gravatar from "gravatar";
import { useRouter } from "next/router";
import axios from "axios";
import { fetchChatRooms } from "@libs/server/fetchChatRooms";
import Dropdown from "@components/Dropdown";
import RadioButtonGroup from "@components/RadioGroupButton";
import { useQuery } from "react-query";
import useSocket from "@libs/client/useSocket";
import { cls } from "@libs/utils";
import dayjs from "@libs/dayjs";
import EachChatRoom from "@components/EachChatRoom";
import { MessageData } from "types/types";

interface ChatRoomWithUser extends ChatRoom {
  buyer: User;
  seller: User;
  recentMsg: SellerChat;
  reservation?: Reservation;
}

interface ChatRoomResponse {
  ok: boolean;
  chatRoomList: ChatRoomWithUser[];
}

interface ReservationWithUser extends Reservation {
  user: User;
}

interface ReservationResponse {
  ok: boolean;
  isReserved: boolean;
  reserve: ReservationWithUser;
}

const Chats: NextPage = () => {
  const router = useRouter();
  const { productId } = router.query; // URL에서 productId 쿼리 파라미터를 추출
  const { user } = useUser();
  const fetchChats = async (url: string, params?: URLSearchParams) => {
    const response = await axios.get(url, { params });
    return response.data;
  };
  const [socket, disconnectSocket] = useSocket("market");
  const [onlineUsers, setOnlineUsers] = useState<number[]>([]); // Array to store online users

  const [messageData, setMessageData] = useState<MessageData | null>(null);

  // URL을 조건부로 설정
  const url = "/api/chat";
  const params = productId ? new URLSearchParams({ productId: productId.toString() }) : undefined;
  const {
    data,
    error,
    isLoading,
    isError,
    refetch: refetchChats,
  } = useQuery(
    ["chats", productId], // 쿼리 키: productId가 있으면 달라짐
    () => fetchChats(url, params), // 데이터를 가져오는 함수
    {
      // refetchInterval: 1000, // 1초마다 데이터를 다시 가져오는 옵션
      enabled: !!url, // URL이 유효할 때만 쿼리 실행
    }
  );

  const chatRooms = productId ? data?.chatRoomListRelatedProduct : data?.chatRoomList;

  async function fetchAndAddReservationData(chatRoomList: ChatRoom[]) {
    try {
      const reservationPromises = chatRoomList.map((chatRoom: ChatRoom) =>
        axios.get(`/api/products/${chatRoom.productId}/reservation`)
      );

      const responses = await Promise.all(reservationPromises);

      const updatedChatRoomList = chatRoomList.map((chatRoom, index) => ({
        ...chatRoom,
        reservation: responses[index].data,
      }));

      return updatedChatRoomList;
    } catch (error) {
      console.error("예약 데이터를 가져오는 중 오류 발생:", error);
      throw error;
    }
  }

  const [recentMessageShown, setRecentMessageShown] = useState("");

  const handleClick = () => {
    console.log("chatRoomList Product Detail clicked");
    router.push(`/products/${productId}`);
  };

  const options: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  };

  const [selectedOption, setSelectedOption] = useState<string>("전체"); // Default selection

  const buttonOptions = [
    { value: "판매중", label: "판매중" },
    { value: "거래완료", label: "거래완료" },
    { value: "예약중", label: "예약중" },
    { value: "전체", label: "전체" },
  ];

  const handleOptionChange = (value: string) => {
    console.log("Selected value:", value); // Handle the selected value
    setSelectedOption(value); // Update the selected value in state
  };

  const filteredChatRooms = chatRooms?.filter((chatRoom: any) => {
    const filterOption = selectedOption;
    if (filterOption === "판매중") {
      return chatRoom.product.status === "Registered";
    } else if (filterOption === "예약중") {
      return chatRoom.product.status === "Reserved";
    } else if (filterOption === "거래완료") {
      return chatRoom.product.status === "Sold";
    } else if (filterOption === "전체") {
      return true; // 모든 채팅방을 필터링 없이 보여줍니다.
    }
    return true; // filterOption이 설정되지 않은 경우도 모든 채팅방을 보여줍니다.
  });

  useEffect(() => {
    if (!socket) return;

    // Listen for the 'onlineList' event from the server
    const handleOnlineList = (users: number[]) => {
      console.log("onlineList event received. onlineList: ", users);
      setOnlineUsers(users); // Update online users list
    };
    const handleOnRoomList = (rooms: string[]) => {
      console.log(`Rooms for socket ${socket.id}:`, rooms);
    };

    const handleOnChats = (chats: string) => {
      console.log("chats: ", chats);
      refetchChats();
    };

    const handleOnMessage = (data: MessageData) => {
      console.log("handleOnMessage--data: ", data);
      setMessageData(data);
    };

    socket.on("onlineList", handleOnlineList);
    socket.on("roomList", handleOnRoomList);
    socket.on("chats", handleOnChats);
    socket.on("message", handleOnMessage);

    // Request online list on component mount
    socket.emit("requestOnlineList");
    socket.emit("requestRoomList");

    // Cleanup the event listener when the component is unmounted or socket changes
    return () => {
      socket.off("onlineList", handleOnlineList);
      socket.off("roomList", handleOnRoomList);
      socket.off("chats", handleOnChats);
      socket.off("message", handleOnMessage);
    };
  }, [refetchChats, socket]); // Add 'socket' as a dependency to ensure it updates when the socket changes

  // if (data?.unreadCountsPerRoom) console.log("data: ", JSON.stringify(data, null, 2));

  const truncateMessage = (msg: string, length: number) => {
    if (msg.length <= length) return msg;
    return msg.substring(0, length) + "...";
  };

  return (
    <Layout
      seoTitle="채팅목록"
      title="채팅목록"
      hasTabBar={!productId}
      canGoBack={!!productId}
      backUrl="back"
    >
      <div className="absolute right-[200px] top-[8.5px] z-30">
        <RadioButtonGroup
          options={buttonOptions}
          selectedOption={selectedOption}
          onChange={handleOptionChange}
        />
      </div>
      <div className="divide-y-[1px]">
        {productId ? (
          <div className="w-full max-w-xl border-b border-gray-200 bg-red-200 p-4">
            <div className="flex cursor-pointer items-center" onClick={handleClick}>
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
                      {data?.chatRoomListRelatedProduct[0]?.product?.status === Status.Reserved
                        ? "예약중"
                        : data?.chatRoomListRelatedProduct[0]?.product?.status === Status.Sold
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
        {filteredChatRooms?.length === 0 ? (
          <div className="flex h-20 items-center justify-center">채팅방이 없습니다</div>
        ) : (
          filteredChatRooms
            ?.sort((a: any, b: any) => {
              const dateA = new Date(a.recentMsg?.updatedAt).getTime();
              const dateB = new Date(b.recentMsg?.updatedAt).getTime();
              return dateB - dateA;
            })
            .map((chatRoom: any) => {
              return (
                <EachChatRoom
                  key={chatRoom.id}
                  chatRoom={chatRoom}
                  user={user}
                  onlineUsers={onlineUsers}
                  data={data}
                  messageData={messageData}
                />
              );
            })
        )}
      </div>
    </Layout>
  );
};

export default Chats;
