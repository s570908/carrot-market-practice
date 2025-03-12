import type { NextPage } from "next";
import Layout from "@components/Layout";
import useUser from "@libs/client/useUser";
import ImgComponent from "@components/ImgComponent";
import { ChatRoom, Reservation, SellerChat, Status, User } from "@prisma/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import RadioButtonGroup from "@components/RadioGroupButton";
import { useQuery } from "@tanstack/react-query";
import useSocket from "@libs/client/useSocket";
import EachChatRoom from "@components/EachChatRoom";
import { parseId } from "@libs/utils";
import { getChatRoomsByKey, getChatRoomsByProduct } from "apiLibs/chatRooms";
import {
  ChatRoomByProduct,
  ChatRoomsByKeyResponse,
  ChatRoomsByProductResponse,
  ChatRoomType,
} from "apiLibs/atypes";
import { handleLoadingAndError } from "@components/LoadingError";

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
  if (!productId) console.log("Chats---productId: ", productId, " (not given)");
  else {
    console.log("Chats---productId: ", productId);
  }

  const [socket, disconnectSocket] = useSocket("market");
  const [onlineUsers, setOnlineUsers] = useState<number[]>([]); // Array to store online users

  const [shouldRefetch, setShouldRefetch] = useState(false);

  // URL을 조건부로 설정
  // productId 가 주어지지 않으면 나와 관련된 모든 chat room 목록을 가져온다.
  const url = productId ? `/api/chatRoomList/product/${productId}` : "/api/chatRoomList";

  const {
    data,
    error,
    isLoading,
    isError,
    refetch: refetchChats,
  } = useQuery({
    queryKey: ["chatRoomList", productId || ""], // 쿼리 키
    queryFn: () =>
      productId
        ? getChatRoomsByProduct(parseId(productId)!)
        : (getChatRoomsByKey(ChatRoomType.All) as Promise<
            ChatRoomsByProductResponse | ChatRoomsByKeyResponse
          >), // 타입 강제 변환
    enabled: !!url, // URL이 유효할 때만 쿼리 실행
  });

  useEffect(() => {
    if (data) {
      console.log("chatRoomList Fetched data and url: ", data, url); // 데이터가 성공적으로 가져와졌을 때 콘솔에 로그 출력
    }
  }, [data, url]);

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

  useEffect(() => {
    const handleRouteChange = () => {
      console.log("Chats Page--routeChangeComplete 실행됨");
      setShouldRefetch(true);
    };

    router.events.on("routeChangeComplete", handleRouteChange);

    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events]);

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

    socket.on("onlineList", handleOnlineList);
    socket.on("roomList", handleOnRoomList);
    socket.on("chats", handleOnChats);

    // Request online list on component mount
    socket.emit("requestOnlineList");
    socket.emit("requestRoomList");

    // Cleanup the event listener when the component is unmounted or socket changes
    return () => {
      socket.off("onlineList", handleOnlineList);
      socket.off("roomList", handleOnRoomList);
      socket.off("chats", handleOnChats);
    };
  }, [refetchChats, socket]); // Add 'socket' as a dependency to ensure it updates when the socket changes

  const isLoadingAny = isLoading;
  const isErrorAny = isError;
  const errorAny = error;
  const loadingOrError = handleLoadingAndError(isLoadingAny, isErrorAny, errorAny);
  if (loadingOrError) return loadingOrError;

  const chatRooms: ChatRoomByProduct[] = productId
    ? (data! as ChatRoomsByProductResponse).chatRoomListWithUnreadCount
    : (data! as ChatRoomsByKeyResponse).sellerChatRoomList;

  const filteredChatRooms = chatRooms
    .filter((chatRoom: any) => {
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
    })
    ?.filter((chatRoom: any) => chatRoom.recentMsg?.updatedAt !== undefined)
    ?.sort((a: any, b: any) => {
      const dateA = new Date(a.recentMsg.updatedAt).getTime();
      const dateB = new Date(b.recentMsg.updatedAt).getTime();
      return dateB - dateA;
    }); // 최신 메시지 순으로 정렬

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true, // 12시간제(오전/오후) 사용
    });
  };

  // Added data existence check
  if (!data) return <div>Loading...</div>;

  return (
    <Layout
      seoTitle="채팅목록"
      title="채팅목록"
      hasTabBar={!productId}
      canGoBack={!!productId}
      backUrl="back"
    >
      <div className="divide-y-[1px]">
        {productId ? (
          <div className="w-full max-w-xl border-b border-gray-200 bg-red-200 p-4">
            <div className="flex cursor-pointer items-center" onClick={handleClick}>
              <div className="flex items-center space-x-4">
                <ImgComponent
                  width={80}
                  height={80}
                  clsProps="rounded-md bg-gray-400"
                  imgAdd={`https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_HASH}/${
                    productId
                      ? (data as ChatRoomsByProductResponse).chatRoomListWithUnreadCount[0]?.product
                          ?.images?.[0]?.imageId
                      : (data as ChatRoomsByKeyResponse).sellerChatRoomList[0]?.product?.images?.[0]
                          ?.imageId
                  }/public`}
                  // imgAdd={`https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_HASH}/${chatRooms[0].product?.image}/public`}
                  imgName="사진"
                />
                <div className="flex flex-col space-y-1">
                  <div className="flex flex-row items-center space-x-2">
                    <div className="text-gray-900">
                      {chatRooms[0].product?.status === Status.Reserved
                        ? "예약중"
                        : chatRooms[0].product?.status === Status.Sold
                        ? "거래완료"
                        : "판매중"}
                    </div>
                    <div className="text-gray-900">{chatRooms[0].product?.name}</div>
                  </div>
                  <span className="text-gray-900">￦{chatRooms[0].product?.price}</span>
                  <div className="text-gray-900">{chatRooms[0].seller?.name}</div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
        {chatRooms?.length > 0 && (
          <div className="flex items-center justify-between px-4 py-4">
            <RadioButtonGroup
              options={buttonOptions}
              selectedOption={selectedOption}
              onChange={handleOptionChange}
            />
          </div>
        )}
        {filteredChatRooms?.length === 0 ? (
          <div className="flex h-20 items-center justify-center">채팅방이 없습니다</div>
        ) : (
          filteredChatRooms.map((chatRoom: any) => {
            return (
              <EachChatRoom
                key={chatRoom.id}
                chatRoomId={chatRoom.id}
                onlineUsers={onlineUsers}
                shouldRefetch={shouldRefetch}
              />
            );
          })
        )}
      </div>
    </Layout>
  );
};

export default Chats;
