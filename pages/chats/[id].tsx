import type { GetServerSideProps, NextPage } from "next";
import Layout from "@components/Layout";
import useUser from "@libs/client/useUser";
import { useRouter } from "next/router";
import {
  ChatRoom,
  Product,
  Reservation,
  Review,
  SellerChat,
  Status,
  User as PrismaUser,
} from "@prisma/client";
import { useForm } from "react-hook-form";
import Message from "@components/Message";
import React, { MutableRefObject, useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useIntersectionObserver } from "@libs/client/useIntersectionObserver";
import { FiChevronsDown } from "react-icons/fi";
import { cls, parseId } from "@libs/utils";
import Loading from "@components/Loading";
import ImgComponent from "@components/ImgComponent";
import { getChatRoomData } from "@libs/server/chatUtils";
import Dropdown from "@components/Dropdown";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import useSocket from "@libs/client/useSocket";
import dayjs from "@libs/dayjs";
import { getChat, writeChatMessage } from "apiLibs/chats";
import { handleLoadingAndError } from "@components/LoadingError";
import {
  getReservation,
  getReviewWritable,
  writeSellComplete,
  writeToggleReservation,
} from "apiLibs/products";
import { ChatFormResponse } from "apiLibs/atypes";
import { useAwaitableModal } from "@libs/client/useAwaitableModal";
import { ProductWithImages } from "@/types";

type Option = {
  value: string;
  label: string;
  active: boolean;
};

export type User = PrismaUser & {
  writtenReviews: Review[];
};

interface ReviewWritableResponse {
  ok: boolean;
  error?: string;
  message?: string;
}

// interface SellerChatResponse {
//   ok: boolean;
//   sellerChat: ChatWithUser[];
//   chatRoomOfSeller: {
//     buyerId: number;
//     sellerId: number;
//     productId: number;
//     buyer: User;
//     seller: User;
//     product: Product;
//   };
// }

// interface ChatFormResponse {
//   chatMsg: string;
// }

interface ChatRoomWithDetails extends ChatRoom {
  buyer: User;
  seller: User;
  product: ProductWithImages;
  // chats: ChatMessage[];
}

interface ChatDetailProps {
  chatRoomData: ChatRoomWithDetails;
}

const workspace = "market"; // 추후 다른 workspace를 추가하려면 로직을 개편해야 한다.

const ChatDetail: NextPage<ChatDetailProps> = ({ chatRoomData }) => {
  // console.log("chatRoomData: ", chatRoomData);
  const [newMessageSubmitted, setNewMessageSubmitted] = useState(false);
  const [currentVisibleDate, setCurrentVisibleDate] = useState<string | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [socket, disconnectSocket] = useSocket(workspace);
  const router = useRouter();
  const id = (router.query.id !== undefined ? parseId(router.query.id) : 0) ?? 0;

  // 헤더 상태 관련
  const [productStatus, setProductStatus] = useState<string>("");
  const [selectedValue, setSelectedValue] = useState("");

  const {
    data,
    isLoading,
    isError,
    error,
    refetch: refetchChat, // 데이터를 수동으로 패칭할 수 있는 함수
  } = useQuery({
    queryKey: ["chat", id], // 쿼리 키
    queryFn: () => getChat(id!), // id가 undefined가 아닌 경우에만 호출
    enabled: id !== undefined, // id가 있을 때만 쿼리를 실행
    refetchInterval: 300000, // 5분마다 데이터 재패칭
    // onSuccess: (data) => {
    //   console.log("/api/chat/${router.query.id}--router.query.id:", router.query.id);
    //   console.log("/api/chat/${router.query.id}--data:", data);
    // },
  });

  // const { openModal: openReservedModal, renderModal: renderReservedModal } = useAwaitableModal(
  //   (modal, params) => {
  //     return (
  //       <div className="fixed inset-0 z-50 flex items-center justify-center">
  //         {/* backdrop */}
  //         <div
  //           className="fixed inset-0 bg-black bg-opacity-50"
  //           //onClick={() => modal.closeWithError("backdrop_click")}
  //         />
  //         <div className="z-50">
  //           <div className="p-4 bg-white rounded-lg w-96">
  //             <h2 className="mb-4 text-xl font-bold">{params.name}과 예약 중입니다.</h2>
  //             <button
  //               className="px-4 py-2 text-white bg-blue-500 rounded-lg"
  //               onClick={() => modal.closeWithResult("keep")}
  //             >
  //               예약유지
  //             </button>
  //             <button
  //               className="px-4 py-2 ml-2 text-black bg-gray-200 rounded-lg"
  //               onClick={() => modal.closeWithResult("cancel")}
  //             >
  //               예약취소
  //             </button>
  //           </div>
  //         </div>
  //       </div>
  //     );
  //   }
  // );

  const { openModal: openReservedModal, renderModal: renderReservedModal } = useAwaitableModal(
    (modal, params) => {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            //onClick={() => modal.closeWithError("backdrop_click")}
          />
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

  const MemoizedMessage = React.memo(Message);

  const otherId =
    data?.chatRoomOfSeller?.buyerId === user?.id
      ? data?.chatRoomOfSeller?.seller?.id
      : data?.chatRoomOfSeller?.buyer?.id;

  const otherName =
    data?.chatRoomOfSeller?.buyerId === user?.id
      ? data?.chatRoomOfSeller?.seller?.name
      : data?.chatRoomOfSeller?.buyer?.name;

  const reserved = data?.chatRoomOfSeller?.product?.status === Status.Reserved ? true : false;
  const sold = data?.chatRoomOfSeller?.product?.status === Status.Sold ? true : false;
  const unregistered =
    data?.chatRoomOfSeller?.product?.status === Status.Unregistered ? true : false;
  // selling은 Status.Registered와 동일하다.
  const selling = !reserved && !sold && !unregistered;
  // const productStatus =
  //   (reserved && "예약중") || (sold && "거래완료") || (selling && "판매중") || "미등록";

  const isProvider = data?.chatRoomOfSeller?.sellerId === user?.id;
  const isConsumer = data?.chatRoomOfSeller?.buyerId === user?.id;
  const reviewType = isProvider ? "SellerReview" : "BuyerReview";

  const isSellingAndConsumer = selling && isConsumer;
  const isSellingAndProvider = selling && isProvider;
  const productStatusInitial =
    (reserved && "예약중") || (sold && "거래완료") || (selling && "판매중") || "미등록";

  const fetchReservation = async (productId: string) => {
    const { data } = await axios.get(`/api/products/${productId}/reservation`);
    return data;
  };
  // const fetchReservation = async (productId: string) => {
  //   const { data } = await axios.get(`/api/products/${productId}/reservation`);
  //   return data;
  // };

  const productId = data?.chatRoomOfSeller?.productId;
  const buyerId = data?.chatRoomOfSeller?.buyerId;

  const {
    data: reservationData,
    refetch: refetchReservation,
    isLoading: isLoadingReservation,
    isError: isErrorReservation,
    error: errorReservation,
  } = useQuery({
    queryKey: ["reservation", productId],
    queryFn: () => getReservation(productId!),
    enabled: productId !== undefined,
  });

  const {
    data: reviewWritableData,
    refetch: refetchReviewWritable,
    isLoading: isLoadingReviewWritable,
    isError: isErrorReviewWritable,
    error: errorReviewWritable,
  } = useQuery({
    queryKey: ["reviewWritable", productId, otherId, reviewType],
    queryFn: () => getReviewWritable({ productId: productId!, otherId: otherId!, reviewType }),
    enabled: !!id && !!productId && !!otherId, // 모든 값이 있을 때만 쿼리를 실행
  });

  //console.log("reviewWritableData================: ", reviewWritableData);

  const writtenReviews = data?.chatRoomOfSeller?.buyer?.writtenReviews;

  const reviewExists =
    writtenReviews?.find((review: Review) => review.productForId === productId) !== undefined;

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const chatBoxRef = useRef<HTMLDivElement | null>(null);

  const entry = useIntersectionObserver(scrollRef, {
    root: null,
    rootMargin: "0%",
    threshold: 0, // visibleRef가 모두 보였을 때만 true,
    freezeOnceVisible: false, // 계속하여 감지하겠다.
  });
  const scrollToBottom = (elementRef: MutableRefObject<HTMLDivElement | null>) => {
    if (elementRef) {
      elementRef.current!?.scrollIntoView({
        behavior: "smooth",
        block: "end",
        inline: "nearest",
      });
    }
  };

  // Intersection Observer 설정
  const dateObserverRef = useRef<IntersectionObserver | null>(null);
  const dateRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const { register, handleSubmit, reset } = useForm<ChatFormResponse>();

  const {
    mutate: sendChat,
    isPending: isLoadingSendChat, // isLoading → isPending으로 변경
    isError: isErrorSendChat,
    error: errorSendChat,
    data: sendChatData,
  } = useMutation({
    mutationFn: writeChatMessage,
    onMutate: async (params: { chatForm: ChatFormResponse; chatId: number }) => {
      await queryClient.cancelQueries({ queryKey: ["chat", params.chatId] });
      const previousChatData = queryClient.getQueryData(["chat", params.chatId]);
      queryClient.setQueryData(["chat", params.chatId], (prev: any) => {
        if (prev) {
          const newMessage = {
            id: Date.now(),
            chatMsg: params.chatForm.chatMsg + "test",
            user: { ...user },
            userId: user?.id,
          };
          return {
            ...prev,
            sellerChat: [...prev.sellerChat, newMessage],
          };
        }
        return prev;
      });
      return { previousChatData };
      // React Query 내부에서 해당 mutation의 컨텍스트(context)로 저장,
      // 저장된 컨텍스트는 같은 mutation 내의 다른 콜백 함수들에서 세 번째 매개변수를 통해 접근
    },
    onError: (error, variables, context) => {
      if (context?.previousChatData) {
        queryClient.setQueryData(["chat", variables.chatId], context.previousChatData); // 이전 데이터로 롤백
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", id] }); // 쿼리 무효화
      // 채팅은 여러 사용자가 동시에 메시지를 주고받는 실시간 기능이므로,
      // 메시지 전송 후 자동으로 최신 데이터를 가져오는 것이 일관된 사용자 경험을 제공하는 데 필수적
    },
  });

  // // 채팅 보내기 mutation
  // const { mutate: sendChat, isPending: isLoadingSendChat } = useMutation({
  //   mutationFn: writeChatMessage,
  //   onSuccess: () => {
  //     refetchChat();
  //   },
  // });

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

  const {
    mutate: toggleReservationMutate,
    isPending: isLoadingToggleReservation, // isLoading -> isPending으로 변경
    isError: isErrorToggleReservation,
    error: errorToggleReservation,
  } = useMutation({
    mutationFn: writeToggleReservation,
    // onSuccess: () => {
    //   // 즉시 데이터를 다시 가져옵니다
    //   console.log("refetch(): ");
    //   refetchChat();
    //   // 쿼리를 무효화하고, 해당 쿼리가 다시 접근될 때 데이터를 가져오도록 하고 싶을 때 사용됩니다.
    //   // queryClient.invalidateQueries({ queryKey: ["chat", id] });  // 새로운 형식으로 수정
    // },
  });

  // const sellComplete = async ({ productId, buyerId }: { productId: number; buyerId: number }) => {
  //   const { data } = await axios.post(`/api/products/${productId}`, {
  //     buyerId,
  //   });
  //   return data;
  // };

  const {
    mutate: sendSellComplete,
    isPending: isLoadingSendSellComplete, // isLoading -> isPending으로 변경
    isError: isErrorSendSellComplete,
    error: errorSendSellComplete,
  } = useMutation({
    mutationFn: writeSellComplete,
    // onSuccess: () => {
    //   queryClient.invalidateQueries({ queryKey: ["chat", id] }); // 새로운 형식으로 수정
    // },
  });

  const onValid = (chatForm: ChatFormResponse) => {
    if (isLoadingSendChat) return;
    reset();

    setNewMessageSubmitted(true);

    sendChat({ chatForm, chatId: id }); //  지금 여기서 서버의 데이터를 업데이트한다.
  };

  // useEffect(() => {
  //   const chatBox = document.getElementById("chatBox") as HTMLElement;
  //   //// scrollTop 의 최대치는 scrollHeight-clientHeght. scrollTop에 이 최대치보다 큰 수를 넣더라도 scrollTop은 최대치 만큼만 반응한다.
  //   chatBox.scrollTop = chatBox.scrollHeight + 20;
  // }, [data?.ok, sendChatData, mutate]);
  // ref: https://velog.io/@lumpenop/TIL-nextron-React-%EC%B1%84%ED%8C%85%EC%B0%BD-%EA%B5%AC%ED%98%84-%EC%9E%85%EB%A0%A5-%EC%8B%9C-%EC%B1%84%ED%8C%85%EC%B0%BD-%EC%95%84%EB%9E%98%EB%A1%9C-%EC%8A%A4%ED%81%AC%EB%A1%A4-220724

  // 새로운 메시지를 작성하고 submit하면 scroll to bottom이 되게 한다.
  const isScrollToBottom = newMessageSubmitted === true;
  useEffect(() => {
    scrollToBottom(scrollRef);
    setNewMessageSubmitted(false);
  }, [isScrollToBottom]);

  useEffect(() => {
    scrollToBottom(scrollRef);
  }, [data?.sellerChat]); // chat data를 모두 가져온 후에만 scrollRef의 값을 가져올 수 있다.

  const initialOptions = useMemo(
    () => [
      { value: "판매중", label: "판매중", active: false },
      { value: "예약중", label: "예약중", active: true },
      { value: "거래완료", label: "거래완료", active: true },
    ],
    []
  );

  const [options, setOptions] = useState(initialOptions);

  useEffect(() => {
    const getUpdatedOptions = (pStatus: string) => {
      if (pStatus === "판매중") {
        return initialOptions.map((option: any) => ({
          ...option,
          active: option.value !== "판매중",
        }));
      }
      if (pStatus === "예약중") {
        return initialOptions.map((option: any) => ({
          ...option,
          active: option.value !== "예약중",
        }));
      }
      if (pStatus === "거래완료") {
        return initialOptions.map((option: any) => ({
          ...option,
          active: false,
        }));
      }
      return initialOptions;
    };
    setOptions(getUpdatedOptions(productStatus));
  }, [productStatus, initialOptions]);

  const [connected, setConnected] = useState<boolean>(false);

  // useEffect(() => {
  //   if (socket) {
  //     socket.on("changeState", async (data) => {
  //       console.log("changeState socket event received:", data);
  //       await refetchChat();
  //       await refetchReservation();
  //       await refetchReviewWritable();
  //     });
  //   }
  //   return () => {
  //     if (socket) {
  //       socket.off("changeState");
  //     }
  //   };
  // }, [socket]);

  // 소켓 이벤트 리스너
  useEffect(() => {
    if (socket) {
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

      socket.on("changeState", handleChangeState);

      return () => {
        socket.off("changeState", handleChangeState);
      };
    }
  }, [socket, productId, updateProductStatus]);

  // 소켓 이벤트 리스너
  useEffect(() => {
    if (socket) {
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

      socket.on("changeState", handleChangeState);

      return () => {
        socket.off("changeState", handleChangeState);
      };
    }
  }, [socket, productId, updateProductStatus]);

  // 초기 상태 설정
  useEffect(() => {
    const initialStatus = productStatusInitial;
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
  }, [reserved, sold, selling, initialOptions, productStatusInitial]);

  useEffect(() => {
    if (socket) {
      const roomName = `/ws-${workspace}-${id}`;
      socket.emit("joinRoom", { room: roomName });
      console.log(`Joined room: ${roomName}`);

      socket.on("message", (message: any) => {
        // message는 같은 채널에 있는 모든 사용자에게 전달된다.
        // 따라서  if (id && message.channelId === id) 는 항상 true이다.
        // 그러나 메시지가 현재 채팅방에 해당하는지 확인하는 것이 좋다.
        // 애플리케이션 확장성: 향후 기능 확장 시 구현이 변경될 수 있으므로, 이 검사는 방어적 프로그래밍 측면에서 유용합니다.
        // 해당 chatRoom에서만 refetch하도록...
        if (id && message.channelId === id) {
          refetchChat();
        }
      });
    }
    return () => {
      if (socket) {
        socket.off("message");
      }
    };
  }, [socket, id, refetchChat, router.query.id]);

  // 드롭다운에서 선택 변경 시 호출되는 함수
  // const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
  //   //console.log("handleChange called --- event.target.value: ", event.target.value);
  //   setSelectedValue(event.target.value); // 새로운 값으로 설정
  // };

  const handleChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    //console.log("handleChange--selling, reserved, sold: ", selling, reserved, sold);
    const newValue = event.target.value;
    //console.log("handleChange--newValue: ", newValue);

    setSelectedValue(newValue);

    if (productId === undefined || buyerId === undefined) {
      console.error("Product ID or Buyer ID is undefined");
      return;
    }

    if (selling) {
      if (newValue === "예약중") {
        console.log("selling 에서 예약중으로 변경");
        toggleReservationMutate(
          {
            productId,
            buyerId,
          },
          {
            onSuccess: () => {
              const stateObj = { productId, old: "판매중", new: "예약중" };
              console.log("socket?.emit(changeState)--stateObj: ", stateObj);
              socket?.emit("changeState", stateObj);
              setProductStatus("예약중");
            },
          }
        );
      }
      if (newValue === "거래완료") {
        console.log("selling 에서 거래완료로 변경");
        sendSellComplete(
          {
            productId,
            buyerId,
          },
          {
            onSuccess: () => {
              const stateObj = { productId, old: "판매중", new: "거래완료" };
              console.log("socket?.emit(changeState)--stateObj: ", stateObj);
              socket?.emit("changeState", stateObj);
              setProductStatus("거래완료");
            },
          }
        );
      }
    } else if (reserved) {
      if (newValue === "판매중") {
        console.log("reserved 에서 판매중으로 변경");
        const result = await openReservedModal({ name: otherName });
        console.log("openReservedModal--result: ", result);
        if (result === "keep") {
          console.log("모달에서 예약유지(keep)을 선택했습니다.");
          setSelectedValue("");
          return;
        }
        console.log("모달에서 변경(판매중)을 선택했습니다.");
        toggleReservationMutate(
          {
            productId,
            buyerId,
          },
          {
            onSuccess: () => {
              const stateObj = { productId, old: "예약중", new: "판매중" };
              console.log("socket?.emit(changeState)--stateObj: ", stateObj);
              socket?.emit("changeState", stateObj);
              setProductStatus("판매중");
            },
          }
        );
      } else if (newValue === "거래완료") {
        console.log("reserved 에서 거래완료로 변경");
        sendSellComplete(
          {
            productId,
            buyerId,
          },
          {
            onSuccess: () => {
              const stateObj = { productId, old: "예약중", new: "거래완료" };
              console.log("socket?.emit(changeState)--stateObj: ", stateObj);
              socket?.emit("changeState", stateObj);
              setProductStatus("거래완료");
            },
          }
        );
      }
    } else if (sold) {
      if (newValue === "거래완료") {
        console.log("할일 없음");
      }
    }
    setSelectedValue("");
  };

  useEffect(() => {
    const getUpdatedOptions = (pStatus: string) => {
      if (pStatus === "판매중") {
        return initialOptions.map((option: any) => ({
          ...option,
          active: option.value !== "판매중",
        }));
      }
      if (pStatus === "예약중") {
        return initialOptions.map((option: any) => ({
          ...option,
          active: option.value !== "예약중",
        }));
      }
      if (pStatus === "거래완료") {
        return initialOptions.map((option: any) => ({
          ...option,
          active: false,
        }));
      }
      return initialOptions;
    };
    setOptions(getUpdatedOptions(productStatus));
  }, [productStatus, initialOptions]);

  const chatUserId =
    data?.chatRoomOfSeller?.buyerId === user?.id
      ? data?.chatRoomOfSeller?.sellerId
      : data?.chatRoomOfSeller?.buyerId;
  //console.log("chatUser 채팅자: ", chatUserId);

  const sellerUserId = data?.chatRoomOfSeller?.sellerId;

  const reservationUserId = reservationData?.reserve?.userId;

  let optionsMenu: Option[];

  const [tooltipDate, setTooltipDate] = useState<string | null>(null); // 현재 툴팁에 표시될 날짜
  const [showTooltip, setShowTooltip] = useState(false); // 툴팁 표시 여부
  const messageRefs = useRef<Map<string, { element: HTMLDivElement; createdAt: string }>>(
    new Map()
  );
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleScroll = useCallback(() => {
    if (!chatBoxRef.current || !messageRefs.current || messageRefs.current.size === 0) {
      setTooltipDate("");
      return;
    }
    if (chatBoxRef.current) {
      const { scrollTop, clientHeight } = chatBoxRef.current;

      // 스크롤 중일 때 툴팁을 표시
      //setScrolling(true);
      setShowTooltip(true);

      // 화면 상단에 표시된 첫 번째 메시지 찾기
      const firstVisibleMessage = Array.from(messageRefs.current.values()).find(({ element }) => {
        try {
          const rect = element.getBoundingClientRect();
          return rect.top >= 0 && rect.top < clientHeight;
        } catch (error) {
          console.error("Error accessing DOM element:", error);
          return false;
        }
      });

      if (firstVisibleMessage) {
        setTooltipDate(dayjs(firstVisibleMessage.createdAt).format("YYYY년 MM월 DD일 dddd"));
      }

      // 스크롤이 멈춘 후 1초 후에 툴팁 숨기기
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        setShowTooltip(false);
        //setScrolling(false);
      }, 1000);
    }
  }, [setShowTooltip, setTooltipDate, messageRefs]);

  // scrollTimeoutRef.current와 관련된 메모리 누수 방지를 위해, 컴포넌트 언마운트 시 타이머를 정리합니다:
  useEffect(() => {
    // messageRefs.current를 로컬 변수로 저장
    const currentMessageRefs = messageRefs.current;
    return () => {
      // cleanup 함수에서 로컬 변수를 사용하여 초기화
      currentMessageRefs.clear();
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // 로컬 변수에 chatBoxRef.current 복사
    const chatBoxElement = chatBoxRef.current;
    if (chatBoxElement) {
      chatBoxElement.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (chatBoxElement) {
        chatBoxElement.removeEventListener("scroll", handleScroll);
      }
    };
  }, [data?.sellerChat, handleScroll]); // 의존성 배열은 필요에 따라 조정

  if (selling) {
    optionsMenu = [
      { value: "예약중", label: "예약중", active: true },
      { value: "거래완료", label: "거래완료", active: true },
    ];
  } else if (reserved) {
    if (chatUserId === reservationUserId) {
      [
        { value: "판매중", label: "판매중", active: true },
        { value: "거래완료", label: "거래완료", active: true },
      ];
    }
  }

  // const isLoadingAny =
  //   isLoading ||
  //   isLoadingReservation ||
  //   isLoadingReviewWritable ||
  //   isLoadingSendChat ||
  //   isLoadingToggleReservation ||
  //   isLoadingSendSellComplete;
  // const isErrorAny =
  //   isError ||
  //   isErrorReservation ||
  //   isErrorReviewWritable ||
  //   isErrorSendChat ||
  //   isErrorToggleReservation ||
  //   isErrorSendSellComplete;
  // const errorAny =
  //   error ||
  //   errorReservation ||
  //   errorReviewWritable ||
  //   errorSendChat ||
  //   errorToggleReservation ||
  //   errorSendSellComplete;

  // const loadingOrError = handleLoadingAndError(isLoadingAny, isErrorAny, errorAny);
  // if (loadingOrError) return loadingOrError;

  let lastMessageDate: string | null = null; // 마지막으로 표시된 날짜

  const formatDate = (date: string) => {
    return dayjs(date).format("YYYY년 MM월 DD일");
  };

  // 스티키 헤더용 포맷 함수
  const formatDateWithDay = (date: string | null) => {
    if (!date) return "";

    const days = ["일", "월", "화", "수", "목", "금", "토"];
    const dateObj = dayjs(date);
    const dayOfWeek = days[dateObj.day()];

    return `${dateObj.format("YYYY. MM. DD")}. ${dayOfWeek}`;
  };

  const handleAppointmentClick = () => {
    const chatroomId = router.query.id; // 현재 채팅방방 ID
    router.push(`/appointment/create?chatroomId=${chatroomId}`); // 채팅방 ID를 URL로 전달
  };

  // 상태 표시 컴포넌트
  const ProductStatusDisplay = React.memo(({ status }: { status: string }) => {
    return <div>{status}</div>;
  });
  ProductStatusDisplay.displayName = "ProductStatusDisplay";

  return (
    <>
      {renderReservedModal()}
      <Layout
        seoTitle={`${otherName} || 채팅`}
        title={`${otherName}`}
        canGoBack
        // backUrl={"/chats"}
        // backUrl={data?.chatRoomOfSeller?.buyerId === user?.id ? "/chats" : "back"}
        backUrl={"back"}
      >
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
                    (data?.chatRoomOfSeller?.product as Product & { images: { imageId: string }[] })
                      ?.images[0]?.imageId
                  }/public`}
                  imgName="사진"
                />
                <div className="flex flex-col space-y-1">
                  <div className="flex flex-row items-center space-x-2">
                    <div className="text-gray-900">{data?.chatRoomOfSeller?.product?.name}</div>
                    <div>{productStatus}</div>
                    <div className="">
                      {/*로그인 유저가 판매자이고, selling | reserved 이면 drop down  */}
                      {user?.id === sellerUserId && (selling || reserved) && (
                        <Dropdown options={options} value={selectedValue} onChange={handleChange} />
                      )}
                    </div>
                  </div>
                  <span className="text-gray-900">￦{data?.chatRoomOfSeller?.product?.price}</span>
                  <div className="text-gray-900">{data?.chatRoomOfSeller?.seller?.name}</div>
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
                  router.push(
                    `/products/${data?.chatRoomOfSeller?.productId}/review?otherId=${otherId}`
                  );
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
          </div>
          <div
            className="flex h-[calc(95vh-300px)] flex-col space-y-2 overflow-y-auto py-5 transition-all"
            id="chatBox"
            ref={chatBoxRef}
          >
            {/* Sticky 날짜 헤더 - 투명 배경과 애니메이션 적용 */}
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
            {data?.sellerChat?.map((message: any, index: number) => {
              //console.log("message: ", JSON.stringify(message, null, 2));
              const messageDate = dayjs(message.createdAt).format("YYYY-MM-DD"); // 메시지 날짜
              const showDate = lastMessageDate !== messageDate; // 날짜를 표시할지 여부
              lastMessageDate = messageDate; // 마지막 메시지 날짜 업데이트
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
                  {/* 날짜 툴팁 */}
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
            {!entry?.isIntersecting ? (
              <button
                onClick={() => {
                  scrollToBottom(scrollRef);
                }}
                className={cls(
                  "inline",
                  "absolute bottom-28 right-1 z-50 flex h-7 w-7 cursor-pointer items-center justify-center rounded-md bg-slate-700 "
                )}
              >
                <FiChevronsDown className="text-xl text-gray-400" />
              </button>
            ) : null}
            <div ref={scrollRef} style={{ height: "1px" }}></div>
          </div>
          <div>
            {/* <form onSubmit={handleSubmit(onValid)} className="fixed inset-x-0 bottom-0 py-2 bg-white">
            <div className="relative flex items-center w-full max-w-md pl-2 mx-auto">
              <input
                {...register("chatMsg", { required: true })}
                type="text"
                className="w-full pr-12 border-gray-300 rounded-full shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500"
              />
              <div className="absolute inset-y-0 right-0 flex py-1.5 pr-1.5">
                <button className="flex items-center px-3 text-sm text-white bg-orange-500 rounded-full hover:bg-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2">
                  &rarr;
                </button>
              </div>
            </div>
          </form> */}
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
                  {isLoadingSendChat === true ? (
                    <div>
                      <Loading color="" size={12} />
                    </div>
                  ) : (
                    "전송"
                  )}
                </button>
              </div>
            </form>
          </div>
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
