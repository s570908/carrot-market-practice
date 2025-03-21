import type { GetServerSideProps, NextPage } from "next";
import Layout from "@components/Layout";
import useUser from "@libs/client/useUser";
import { useRouter } from "next/router";
import { ChatRoom, Review, Status, User as PrismaUser, Product } from "@prisma/client";
import { useForm } from "react-hook-form";
import Message from "@components/Message";
import React, { MutableRefObject, useEffect, useRef, useState, useCallback } from "react";
import { useIntersectionObserver } from "@libs/client/useIntersectionObserver";
import { FiChevronsDown } from "react-icons/fi";
import { cls, parseId } from "@libs/utils";
import Loading from "@components/Loading";
import { getChatRoomData } from "@libs/server/chatUtils";
import { useMutation, useQuery } from "@tanstack/react-query";
import useSocket from "@libs/client/useSocket";
import dayjs from "@libs/dayjs";
import { getChat, writeChatMessage } from "apiLibs/chats";
import { getReservation, getReviewWritable } from "apiLibs/products";
import { ChatFormResponse, ProductWithImages } from "apiLibs/atypes";
import ImgComponent from "@components/ImgComponent";
import Dropdown from "@components/Dropdown";
import { useQueryClient } from "@tanstack/react-query";
import { useAwaitableModal } from "@libs/client/useAwaitableModal";
import { writeToggleReservation, writeSellComplete } from "apiLibs/products";

export type User = PrismaUser & {
  writtenReviews: Review[];
};

interface ChatRoomWithDetails extends ChatRoom {
  buyer: User;
  seller: User;
  product: ProductWithImages;
}

interface ChatDetailProps {
  chatRoomData: ChatRoomWithDetails;
}

const workspace = "market"; // 추후 다른 workspace를 추가하려면 로직을 개편해야 한다.

const ChatDetail: NextPage<ChatDetailProps> = ({ chatRoomData }) => {
  // 채팅 관련 상태
  const [newMessageSubmitted, setNewMessageSubmitted] = useState(false);
  const [currentVisibleDate, setCurrentVisibleDate] = useState<string | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const { user } = useUser();
  const [socket, disconnectSocket] = useSocket(workspace);
  const router = useRouter();
  const id = (router.query.id !== undefined ? parseId(router.query.id) : 0) ?? 0;
  const queryClient = useQueryClient();

  // 헤더 상태 관련
  const [productStatus, setProductStatus] = useState<string>("");
  const [selectedValue, setSelectedValue] = useState("");

  // 스크롤 관련 참조 및 observer
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const chatBoxRef = useRef<HTMLDivElement | null>(null);
  const messageRefs = useRef<Map<string, { element: HTMLDivElement; createdAt: string }>>(
    new Map()
  );
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 채팅 데이터 가져오기
  const { data, refetch: refetchChat } = useQuery({
    queryKey: ["chat", id],
    queryFn: () => getChat(id!),
    enabled: id !== undefined,
  });

  // 상대방 ID/이름 계산
  const otherId =
    data?.chatRoomOfSeller?.buyerId === user?.id
      ? data?.chatRoomOfSeller?.seller?.id
      : data?.chatRoomOfSeller?.buyer?.id;

  const otherName =
    data?.chatRoomOfSeller?.buyerId === user?.id
      ? data?.chatRoomOfSeller?.seller?.name
      : data?.chatRoomOfSeller?.buyer?.name;

  // 상품 상태 계산
  const product = data?.chatRoomOfSeller?.product;
  const reserved = product?.status === Status.Reserved;
  const sold = product?.status === Status.Sold;
  const unregistered = product?.status === Status.Unregistered;
  const selling = !reserved && !sold && !unregistered;

  const productId = product?.id;
  const sellerUserId = data?.chatRoomOfSeller?.sellerId;
  const sellerUserName = data?.chatRoomOfSeller?.seller?.name;
  const buyerId = data?.chatRoomOfSeller?.buyerId;
  const isProvider = user?.id === sellerUserId;
  const isConsumer = user?.id !== sellerUserId;
  const isSellingAndConsumer = selling && isConsumer;
  const isSellingAndProvider = selling && isProvider;

  // 예약 정보 쿼리
  const { data: reservationData } = useQuery({
    queryKey: ["reservation", productId],
    queryFn: () => getReservation(productId!),
    enabled: productId !== undefined,
  });

  const reservationUserId = reservationData?.reserve?.userId;

  // 리뷰 작성 가능 여부 쿼리
  const { data: reviewWritableData } = useQuery({
    queryKey: ["reviewWritable", productId, otherId, ""],
    queryFn: () =>
      getReviewWritable({
        productId: productId!,
        otherId: otherId!,
        reviewType: data?.chatRoomOfSeller?.sellerId === user?.id ? "SellerReview" : "BuyerReview",
      }),
    enabled: !!id && !!productId && !!otherId,
  });

  // 드롭다운 옵션 설정
  const initialOptions = React.useMemo(
    () => [
      { value: "판매중", label: "판매중", active: false },
      { value: "예약중", label: "예약중", active: true },
      { value: "거래완료", label: "거래완료", active: true },
    ],
    []
  );

  const [options, setOptions] = useState(initialOptions);

  // 모달 설정
  const { openModal: openReservedModal, renderModal: renderReservedModal } = useAwaitableModal(
    (modal, params) => {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-50" />
          <div className="z-50">
            <div className="w-96 rounded-lg bg-white p-4 text-base font-normal">
              <h4 className="mb-4">예약 중입니다. 예약자: {params.name} </h4>
              <h4 className="mb-4">예약취소 후 판매중으로 변경하시겠습니까?</h4>
              <button
                className="rounded-lg bg-blue-500 px-4 py-2 text-white"
                onClick={() => modal.closeWithResult("selling")}
              >
                변경
              </button>
              <button
                className="ml-2 rounded-lg bg-gray-200 px-4 py-2 text-black"
                onClick={() => modal.closeWithResult("keep")}
              >
                예약유지
              </button>
            </div>
          </div>
        </div>
      );
    }
  );

  // 예약 상태 토글 mutation
  const { mutate: toggleReservationMutate, isPending: isLoadingToggleReservation } = useMutation({
    mutationFn: writeToggleReservation,
  });

  // 판매 완료 mutation
  const { mutate: sendSellComplete, isPending: isLoadingSendSellComplete } = useMutation({
    mutationFn: writeSellComplete,
  });

  const entry = useIntersectionObserver(scrollRef, {
    root: null,
    rootMargin: "0%",
    threshold: 0,
    freezeOnceVisible: false,
  });

  const scrollToBottom = (elementRef: MutableRefObject<HTMLDivElement | null>) => {
    if (elementRef && elementRef.current) {
      elementRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
        inline: "nearest",
      });
    }
  };

  // 폼 관련
  const { register, handleSubmit, reset } = useForm<ChatFormResponse>();

  // 채팅 보내기 mutation
  const { mutate: sendChat, isPending: isLoadingSendChat } = useMutation({
    mutationFn: writeChatMessage,
    onSuccess: () => {
      refetchChat();
    },
  });

  // 캐시 업데이트 함수
  const updateProductStatus = useCallback(
    (newState: string, status: Status) => {
      queryClient.setQueryData(["chat", id], (oldData: any) => {
        if (!oldData || !oldData.chatRoomOfSeller) {
          return oldData;
        }

        return {
          ...oldData,
          chatRoomOfSeller: {
            ...oldData.chatRoomOfSeller,
            product: {
              ...oldData.chatRoomOfSeller.product,
              status,
            },
          },
        };
      });
    },
    [queryClient, id]
  );

  // 드롭다운 변경 핸들러
  const handleChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = event.target.value;
    setSelectedValue(newValue);

    if (productId === undefined || buyerId === undefined) {
      console.error("Product ID or Buyer ID is undefined");
      return;
    }

    if (selling) {
      if (newValue === "예약중") {
        toggleReservationMutate(
          { productId, buyerId },
          {
            onSuccess: () => {
              const stateObj = { productId, old: "판매중", new: "예약중" };
              socket?.emit("changeState", stateObj);
              setProductStatus("예약중");
              updateProductStatus("예약중", Status.Reserved);
            },
          }
        );
      }
      if (newValue === "거래완료") {
        sendSellComplete(
          { productId, buyerId },
          {
            onSuccess: () => {
              const stateObj = { productId, old: "판매중", new: "거래완료" };
              socket?.emit("changeState", stateObj);
              setProductStatus("거래완료");
              updateProductStatus("거래완료", Status.Sold);
            },
          }
        );
      }
    } else if (reserved) {
      if (newValue === "판매중") {
        const result = await openReservedModal({ name: otherName });
        if (result === "keep") {
          setSelectedValue("");
          return;
        }

        toggleReservationMutate(
          { productId, buyerId },
          {
            onSuccess: () => {
              const stateObj = { productId, old: "예약중", new: "판매중" };
              socket?.emit("changeState", stateObj);
              setProductStatus("판매중");
              updateProductStatus("판매중", Status.Registered);
            },
          }
        );
      } else if (newValue === "거래완료") {
        sendSellComplete(
          { productId, buyerId },
          {
            onSuccess: () => {
              const stateObj = { productId, old: "예약중", new: "거래완료" };
              socket?.emit("changeState", stateObj);
              setProductStatus("거래완료");
              updateProductStatus("거래완료", Status.Sold);
            },
          }
        );
      }
    }
    setSelectedValue("");
  };

  const onValid = (chatForm: ChatFormResponse) => {
    if (isLoadingSendChat) return;
    reset();
    setNewMessageSubmitted(true);
    sendChat({ chatForm, chatId: id });
  };

  // 새 메시지 제출 시 스크롤
  useEffect(() => {
    if (newMessageSubmitted) {
      scrollToBottom(scrollRef);
      setNewMessageSubmitted(false);
    }
  }, [newMessageSubmitted]);

  // 새 메시지 수신 시 스크롤
  useEffect(() => {
    scrollToBottom(scrollRef);
  }, [data?.sellerChat]);

  // 소켓 이벤트 리스너
  useEffect(() => {
    if (socket) {
      const handleMessage = (message: any) => {
        if (router.query.id && message.channelId === +router.query.id) {
          refetchChat();
        }
      };

      const handleChangeState = (eventData: any) => {
        const { productId: changedProductId, new: newState } = eventData;

        if (productId === changedProductId) {
          setProductStatus(newState);

          let newStatus: Status;
          switch (newState) {
            case "예약중":
              newStatus = Status.Reserved;
              break;
            case "거래완료":
              newStatus = Status.Sold;
              break;
            case "판매중":
              newStatus = Status.Registered;
              break;
            default:
              newStatus = Status.Unregistered;
          }

          updateProductStatus(newState, newStatus);
        }
      };

      const roomName = `/ws-${workspace}-${id}`;
      socket.emit("joinRoom", { room: roomName });
      socket.on("message", handleMessage);
      socket.on("changeState", handleChangeState);

      return () => {
        socket.off("message", handleMessage);
        socket.off("changeState", handleChangeState);
      };
    }
  }, [socket, id, refetchChat, router.query.id, productId, updateProductStatus]);

  // 페이지 로드 시 온라인 목록 요청
  useEffect(() => {
    if (socket) {
      socket.emit("requestOnlineList");
    }
  }, [socket]);

  // 초기 상태 설정
  useEffect(() => {
    const initialStatus =
      (reserved && "예약중") || (sold && "거래완료") || (selling && "판매중") || "미등록";
    setProductStatus(initialStatus);

    if (initialStatus === "판매중") {
      setOptions(
        initialOptions.map((option) => ({
          ...option,
          active: option.value !== "판매중",
        }))
      );
    } else if (initialStatus === "예약중") {
      setOptions(
        initialOptions.map((option) => ({
          ...option,
          active: option.value !== "예약중",
        }))
      );
    } else if (initialStatus === "거래완료") {
      setOptions(
        initialOptions.map((option) => ({
          ...option,
          active: false,
        }))
      );
    }
  }, [reserved, sold, selling, initialOptions]);

  // 툴팁 관련 상태와 핸들러
  const [tooltipDate, setTooltipDate] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleScroll = useCallback(() => {
    if (!chatBoxRef.current || !messageRefs.current || messageRefs.current.size === 0) {
      setTooltipDate("");
      return;
    }

    if (chatBoxRef.current) {
      setShowTooltip(true);

      const firstVisibleMessage = Array.from(messageRefs.current.values()).find(({ element }) => {
        try {
          const rect = element.getBoundingClientRect();
          return rect.top >= 0 && rect.top < chatBoxRef.current!.clientHeight;
        } catch (error) {
          console.error("Error accessing DOM element:", error);
          return false;
        }
      });

      if (firstVisibleMessage) {
        setTooltipDate(dayjs(firstVisibleMessage.createdAt).format("YYYY년 MM월 DD일 dddd"));
      }

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        setShowTooltip(false);
      }, 1000);
    }
  }, []);

  // 메모리 누수 방지
  useEffect(() => {
    const currentMessageRefs = messageRefs.current;
    return () => {
      currentMessageRefs.clear();
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // 스크롤 이벤트 리스너
  useEffect(() => {
    const chatBoxElement = chatBoxRef.current;
    if (chatBoxElement) {
      chatBoxElement.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (chatBoxElement) {
        chatBoxElement.removeEventListener("scroll", handleScroll);
      }
    };
  }, [data?.sellerChat, handleScroll]);

  // 약속잡기 핸들러
  const handleAppointmentClick = () => {
    const chatroomId = router.query.id;
    router.push(`/appointment/create?chatroomId=${chatroomId}`);
  };

  let lastMessageDate: string | null = null;

  // 날짜 포맷 함수
  const formatDateWithDay = (date: string | null) => {
    if (!date) return "";
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    const dateObj = dayjs(date);
    const dayOfWeek = days[dateObj.day()];
    return `${dateObj.format("YYYY. MM. DD")}. ${dayOfWeek}`;
  };

  // 상태 표시 컴포넌트
  const ProductStatusDisplay = React.memo(({ status }: { status: string }) => {
    return <div>{status}</div>;
  });
  ProductStatusDisplay.displayName = "ProductStatusDisplay";

  return (
    <>
      {renderReservedModal()}

      <Layout seoTitle={`${otherName} || 채팅`} title={`${otherName}`} canGoBack backUrl={"back"}>
        <div className="relative h-full px-4 pb-12">
          <div className="w-full max-w-xl border-b border-gray-200 bg-red-200 p-4">
            <div
              className="flex cursor-pointer items-center"
              onClick={() => {
                router.push(`/products/${productId}`);
              }}
            >
              <div className="flex items-center space-x-4">
                <ImgComponent
                  width={80}
                  height={80}
                  clsProps="rounded-md bg-gray-400"
                  imgAdd={`https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_HASH}/${
                    (product as Product & { images: { imageId: string }[] })?.images[0]?.imageId
                  }/public`}
                  imgName="사진"
                />
                <div className="flex flex-col space-y-1">
                  <div className="flex flex-row items-center space-x-2">
                    <div className="text-gray-900">{product?.name}</div>
                    <ProductStatusDisplay status={productStatus} />
                    <div className="">
                      {/*로그인 유저가 판매자이고, selling | reserved 이면 drop down  */}
                      {user?.id === sellerUserId && (selling || reserved) && (
                        <Dropdown options={options} value={selectedValue} onChange={handleChange} />
                      )}
                    </div>
                  </div>
                  <span className="text-gray-900">￦{product?.price}</span>
                  <div className="text-gray-900">{sellerUserName}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-2 flex flex-row justify-between">
            <div
              className="text-md cursor-pointer rounded-md border border-black p-1"
              onClick={handleAppointmentClick}
            >
              약속잡기
            </div>
            {isSellingAndConsumer && (
              <div
                className="text-md cursor-pointer rounded-md border border-black p-1"
                onClick={() => {
                  console.log("당근페이가 클릭되었습니다.");
                }}
              >
                당근페이
              </div>
            )}
            {isSellingAndProvider && (
              <div
                className="text-md cursor-pointer rounded-md border border-black p-1"
                onClick={() => {
                  console.log("송금요청이 클릭되었습니다.");
                }}
              >
                송금요청
              </div>
            )}
            {isSellingAndConsumer && (
              <div
                className="text-md cursor-pointer rounded-md border border-black p-1"
                onClick={() => {
                  console.log("물품추가가 클릭되었습니다.");
                }}
              >
                물품추가
              </div>
            )}
            <button
              className={`text-md cursor-pointer rounded-md border p-1 ${
                reserved || selling || reviewWritableData?.ok === false
                  ? "cursor-not-allowed border-gray-400 opacity-50"
                  : "border-black hover:bg-gray-100"
              }`}
              onClick={() => {
                router.push(`/products/${productId}/review?otherId=${otherId}`);
              }}
              disabled={!sold || reviewWritableData?.ok === false}
            >
              {`${isProvider ? "판매" : "구매"} 후기 보내기`}
            </button>
            <div
              className="text-md cursor-pointer rounded-md border border-black p-1"
              onClick={() => {
                console.log("장소공유가 클릭 되었습니다.");
              }}
            >
              장소공유
            </div>
            <div
              className="text-md cursor-pointer rounded-md border border-black p-1"
              onClick={() => {
                console.log("기타가 클릭 되었습니다.");
              }}
            >
              기타
            </div>
          </div>

          {/* 채팅 메시지 영역 */}
          <div
            className="flex h-[calc(95vh-300px)] flex-col space-y-2 overflow-y-auto py-5 transition-all"
            id="chatBox"
            ref={chatBoxRef}
          >
            {/* Sticky 날짜 헤더 */}
            {currentVisibleDate && (
              <div className="sticky top-4 z-10 w-full">
                <div
                  className={`mx-auto w-fit rounded-full bg-black/70 px-4 py-1.5 
                text-center text-sm text-white transition-opacity duration-200 ease-out
                ${isScrolling ? "opacity-100" : "opacity-0"}`}
                >
                  {formatDateWithDay(currentVisibleDate)}
                </div>
              </div>
            )}

            {/* 메시지 목록 */}
            {data?.sellerChat?.map((message: any) => {
              const messageDate = dayjs(message.createdAt).format("YYYY-MM-DD");
              const showDate = lastMessageDate !== messageDate;
              lastMessageDate = messageDate;

              return (
                <div
                  key={message.id}
                  ref={(el) => {
                    if (el) {
                      messageRefs.current.set(message.id, {
                        element: el,
                        createdAt: message.createdAt,
                      });
                    } else {
                      messageRefs.current.delete(message.id);
                    }
                  }}
                  className="border-b border-gray-200 p-4"
                >
                  {/* 툴팁 */}
                  {showTooltip && tooltipDate && (
                    <div className="fixed left-1/2 top-2 z-20 -translate-x-1/2 transform rounded-full bg-gray-600 bg-opacity-20 px-4 py-2 text-sm text-white">
                      {tooltipDate}
                    </div>
                  )}

                  {/* 날짜 변경 시 날짜 표시 */}
                  {showDate && (
                    <div className="my-2 text-center text-sm text-white">
                      <span className="rounded-full bg-gray-400 px-4">
                        {dayjs(message.createdAt).format("YYYY년 MM월 DD일 dddd")}
                      </span>
                    </div>
                  )}

                  <Message
                    reversed={message.userId === user?.id}
                    key={message.id}
                    name={message.user.name}
                    message={message.chatMsg}
                    avatar={message.user.avatar}
                    date={message.createdAt}
                  />
                </div>
              );
            })}

            {/* 스크롤 맨 아래로 이동 버튼 */}
            {!entry?.isIntersecting && (
              <button
                onClick={() => scrollToBottom(scrollRef)}
                className="absolute bottom-28 right-1 z-50 flex h-7 w-7 cursor-pointer items-center justify-center rounded-md bg-slate-700"
              >
                <FiChevronsDown className="text-xl text-gray-400" />
              </button>
            )}

            <div ref={scrollRef} style={{ height: "1px" }}></div>
          </div>

          {/* 채팅 입력 폼 */}
          <form onSubmit={handleSubmit(onValid)} className="mt-10 w-full border-t px-1 py-1">
            <div className="relative w-full rounded-md bg-white px-2 py-2 outline-none">
              <input
                {...register("chatMsg", { required: true, maxLength: 80 })}
                maxLength={80}
                placeholder={
                  user === undefined ? "로그인 후 이용가능합니다." : "메세지를 입력해주세요."
                }
                className="w-full text-[15px] outline-none placeholder:text-gray-300"
              />
              <button
                disabled={user === undefined}
                type="submit"
                className="absolute bottom-3 right-3 flex h-8 items-end rounded-md bg-orange-400 px-4 py-1.5 text-sm text-white hover:bg-orange-500"
              >
                {isLoadingSendChat ? <Loading color="" size={12} /> : "전송"}
              </button>
            </div>
          </form>
        </div>
      </Layout>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const chatRoomId = Number(context.params?.id);
  let chatRoomData = await getChatRoomData(chatRoomId);

  if (!chatRoomData) {
    return {
      notFound: true,
    };
  }

  chatRoomData = JSON.parse(JSON.stringify(chatRoomData));

  return {
    props: { chatRoomData },
  };
};

export default ChatDetail;
