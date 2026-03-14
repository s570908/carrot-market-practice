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
  MessageType,
  ChatMeetup,
} from "@prisma/client";
import { useForm } from "react-hook-form";
import Message from "@components/Message";
import React, {
  MutableRefObject,
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
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
import {
  writeSystemMessage,
  getChat,
  SYSTEM_MESSAGES,
  writeChatMessage,
  writeAlarmSettings,
  getAlarmSettings,
  readChatMeetup,
  updateChatMeetup,
  deleteAlarmSettings,
} from "apiLibs/chats";
import { handleLoadingAndError } from "@components/LoadingError";
import {
  getReservation,
  getReviewWritable,
  writeSellComplete,
  writeToggleReservation,
} from "apiLibs/products";
import { ChatFormResponse, ChatWithUser } from "apiLibs/atypes";
import { useAwaitableModal } from "@libs/client/useAwaitableModal";
import { ProductWithImages } from "@/types";
import ActionSheet from "@components/ActionSheet";
import AppointmentEditModal from "@components/AppointmentEditModal";

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

interface ChatRoomWithDetails extends ChatRoom {
  buyer: User;
  seller: User;
  product: ProductWithImages;
  chatMeetup?: ChatMeetup; // 타입에 chatMeetup 추가
}

interface ChatDetailProps {
  chatRoomData: ChatRoomWithDetails;
}

const workspace = "market"; // 추후 다른 workspace를 추가하려면 로직을 개편해야 한다.

// 1. getLatestChatMeetup 함수 추가
export async function getLatestChatMeetup(chatRoomId: number) {
  const response = await axios.get(`/api/chat/${chatRoomId}/latest-meetup`);
  return response.data;
}

const ChatDetail: NextPage<ChatDetailProps> = ({ chatRoomData }) => {
  const [newMessageSubmitted, setNewMessageSubmitted] = useState(false);
  //const [currentVisibleDate, setCurrentVisibleDate] = useState<string | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [socket, disconnectSocket] = useSocket(workspace);
  const router = useRouter();
  const id =
    (router.query.id !== undefined ? parseId(router.query.id) : 0) ?? 0;

  // 알림 ActionSheet 상태 관리
  const [alarmSheetOpen, setAlarmSheetOpen] = useState(false);
  const [alarmSheetValue, setAlarmSheetValue] = useState("");

  // ActionSheet가 열릴 때마다 defaultValue로 초기화
  // useEffect(() => {
  //   if (alarmSheetOpen) {
  //     if (appointment?.chatMeetup?.alarmTime) {
  //       setAlarmSheetValue(appointment.chatMeetup.alarmTime);
  //     } else {
  //       setAlarmSheetValue("");
  //     }
  //   }
  // }, [alarmSheetOpen, appointment?.alarmTime]);

  // 현재 메시지 ID 저장 (알림 설정 버튼이 클릭된 메시지)
  const [currentMessageId, setCurrentMessageId] = useState<number | null>(null);

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
  });

  // 2. 약속 정보 react-query로 가져오기
  const {
    data: chatMeetupData,
    isLoading: isLoadingChatMeetup,
    isError: isErrorChatMeetup,
    error: errorChatMeetup,
    refetch: refetchChatMeetup,
  } = useQuery({
    queryKey: ["chatMeetup", id],
    queryFn: () => readChatMeetup(id),
    enabled: !!id,
  });

  const appointment = chatMeetupData?.chatMeetup ?? null;
  const chatMeetupId = appointment?.id ?? null;

  // {
  //     "id": 142,
  //     "appointmentTime": "2025-10-04T11:05:00.000Z",
  //     "place": "위례우미린아파트 (경기 하남시 위례대로6길 100)",
  //     "locationLatitude": 37.48493919,
  //     "locationLongitude": 127.16156223,
  //     "alarmTime": "30분 전"
  // }

  // alarmSettings 정보 가져오기
  const {
    data: alarmSettingsData,
    isLoading: isLoadingAlarmSettings,
    isError: isErrorAlarmSettings,
    error: errorAlarmSettings,
    refetch: refetchAlarmSettings,
  } = useQuery({
    queryKey: ["alarmSettings", id],
    queryFn: () => getAlarmSettings(id),
    enabled: !!id,
  });

  // ActionSheet가 열릴 때마다 alarmSettings를 refetch
  useEffect(() => {
    if (alarmSheetOpen) {
      refetchAlarmSettings();
    }
  }, [alarmSheetOpen, refetchAlarmSettings]);

  useEffect(() => {
    if (alarmSheetOpen) {
      if (alarmSettingsData?.ok) {
        setAlarmSheetValue(alarmSettingsData?.alarm?.alarmTime ?? "없음");
      } else {
        setAlarmSheetValue("없음");
      }
    }
  }, [
    alarmSettingsData?.alarm?.alarmTime,
    alarmSettingsData?.ok,
    alarmSheetOpen,
  ]);

  // console.log("/api/chat/${router.query.id}--data:", data);
  // If you want to debug appointment data, use sellerChat array:
  // console.log("Appointment messages:", data?.sellerChat?.filter((msg: any) => msg.chatMeetup));

  const { openModal: openReservedModal, renderModal: renderReservedModal } =
    useAwaitableModal((modal, params) => {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            //onClick={() => modal.closeWithError("backdrop_click")}
          />
          <div className="z-50">
            <div className="p-4 text-base font-normal bg-white rounded-lg w-96">
              <h4 className="mb-4">예약 중입니다. 예약자: {params.name} </h4>
              <h4 className="mb-4">예약취소 후 판매중으로 변경하시겠습니까?</h4>
              <button
                className="px-4 py-2 text-white bg-blue-500 rounded-lg"
                onClick={() => modal.closeWithResult("selling")}
              >
                변경
              </button>
              <button
                className="px-4 py-2 ml-2 text-black bg-gray-200 rounded-lg"
                onClick={() => modal.closeWithResult("keep")}
              >
                예약유지
              </button>
            </div>
          </div>
        </div>
      );
    });

  // AppointmentEditModal 모달 오픈용
  const {
    openModal: openAppointmentEditModal,
    renderModal: renderAppointmentEditModal,
  } = useAwaitableModal((modal, params) => (
    <AppointmentEditModal
      modal={modal}
      params={params}
      chatRoomId={id}
      chatUsername={otherName}
    />
  ));

  const MemoizedMessage = React.memo(Message);

  const otherId =
    data?.chatRoomOfSeller?.buyerId === user?.id
      ? data?.chatRoomOfSeller?.seller?.id
      : data?.chatRoomOfSeller?.buyer?.id;

  const otherName =
    data?.chatRoomOfSeller?.buyerId === user?.id
      ? data?.chatRoomOfSeller?.seller?.name
      : data?.chatRoomOfSeller?.buyer?.name;

  const reserved =
    data?.chatRoomOfSeller?.product?.status === Status.Reserved ? true : false;
  const sold =
    data?.chatRoomOfSeller?.product?.status === Status.Sold ? true : false;
  const unregistered =
    data?.chatRoomOfSeller?.product?.status === Status.Unregistered
      ? true
      : false;
  const selling = !reserved && !sold && !unregistered;

  const isProvider = data?.chatRoomOfSeller?.sellerId === user?.id;
  const isConsumer = data?.chatRoomOfSeller?.buyerId === user?.id;
  const reviewType = isProvider ? "SellerReview" : "BuyerReview";

  const isSellingAndConsumer = selling && isConsumer;
  const isSellingAndProvider = selling && isProvider;
  const productStatusInitial =
    (reserved && "예약중") ||
    (sold && "거래완료") ||
    (selling && "판매중") ||
    "미등록";

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
    queryFn: () =>
      getReviewWritable({
        productId: productId!,
        otherId: otherId!,
        reviewType,
      }),
    enabled: !!id && !!productId && !!otherId, // 모든 값이 있을 때만 쿼리를 실행
  });

  //console.log("reviewWritableData================: ", reviewWritableData);

  //console.log("reviewWritableData================: ", reviewWritableData);

  const writtenReviews = data?.chatRoomOfSeller?.buyer?.writtenReviews;

  const reviewExists =
    writtenReviews?.find(
      (review: Review) => review.productForId === productId
    ) !== undefined;

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const chatBoxRef = useRef<HTMLDivElement | null>(null);

  const entry = useIntersectionObserver(scrollRef, {
    root: null,
    rootMargin: "0%",
    threshold: 0, // visibleRef가 모두 보였을 때만 true,
    freezeOnceVisible: false, // 계속하여 감지하겠다.
  });
  const scrollToBottom = (
    elementRef: MutableRefObject<HTMLDivElement | null>
  ) => {
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
    // onMutate: async (params) => {
    //   // 기존 쿼리 취소 및 이전 데이터 저장
    //   await queryClient.cancelQueries({ queryKey: ["chat", params.chatId] });
    //   const previousChatData = queryClient.getQueryData([
    //     "chat",
    //     params.chatId,
    //   ]);

    //   // optimistic update
    //   queryClient.setQueryData(["chat", params.chatId], (prev: any) => {
    //     if (prev) {
    //       const now = new Date();
    //       const newMessage = {
    //         id: Date.now(),
    //         chatMsg: params.chatForm.chatMsg,
    //         user: { ...user },
    //         userId: user?.id,
    //         createdAt: now.toISOString(), // 현재 시간을 추가
    //         updatedAt: now.toISOString(), // 필요한 경우 updatedAt도 추가
    //         messageType: "USER", // MessageType.USER 대신 문자열로
    //       };
    //       return {
    //         ...prev,
    //         sellerChat: [...prev.sellerChat, newMessage],
    //       };
    //     }
    //     return prev;
    //   });
    //   return { previousChatData };
    //   // React Query 내부에서 해당 mutation의 컨텍스트(context)로 저장,
    //   // 저장된 컨텍스트는 같은 mutation 내의 다른 콜백 함수들에서 세 번째 매개변수를 통해 접근
    // },
    onSuccess: (data) => {
      // 메시지 전송 성공 후 서버에 저장된 메시지를 socket으로 broadcast 요청
      if (socket && data?.sellerChat) {
        socket.emit("message", {
          ...data.sellerChat,
          chatRoomId: id,
        });
      }
      // queryClient.invalidateQueries({ queryKey: ["chat", id] }); // <-- 이 부분은 onSettled에서 이미 처리하므로 중복입니다. 제거해도 됩니다.
    },
    // onError: (error, variables, context) => {
    //   if (context?.previousChatData) {
    //     queryClient.setQueryData(
    //       ["chat", variables.chatId],
    //       context.previousChatData
    //     );
    //   }
    // },
    onSettled: () => {
      // queryClient.invalidateQueries({ queryKey: ["chat", id] }); // 쿼리 무효화
      // 채팅은 여러 사용자가 동시에 메시지를 주고받는 실시간 기능이므로,
      // 메시지 전송 후 자동으로 최신 데이터를 가져오는 것이 일관된 사용자 경험을 제공하는 데 필수적
    },
  });

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
    onSuccess: async (data, variables) => {
      const stateObj = { productId, old: "판매중", new: "예약중" };
      socket?.emit("changeState", stateObj);
      setProductStatus("예약중");

      // 시스템 메시지 추가
      if (otherName) {
        await writeSystemMessage({
          chatRoomId: id,
          message: SYSTEM_MESSAGES.PRODUCT_RESERVED(otherName),
        });
        refetchChat();
      }
    },
  });

  const {
    mutate: sendSellComplete,
    isPending: isLoadingSendSellComplete, // isLoading -> isPending으로 변경
    isError: isErrorSendSellComplete,
    error: errorSendSellComplete,
  } = useMutation({
    mutationFn: writeSellComplete,
    onSuccess: async (data, variables) => {
      const stateObj = {
        productId,
        old: selling ? "판매중" : "예약중",
        new: "거래완료",
      };
      socket?.emit("changeState", stateObj);
      setProductStatus("거래완료");

      // 시스템 메시지 추가

      await writeSystemMessage({
        chatRoomId: id,
        message: SYSTEM_MESSAGES.PRODUCT_SOLD(),
      });
      refetchChat();
    },
  });

  const {
    mutate: setAlarmSettings,
    isPending: isSettingAlarm,
    isError: isErrorSettingAlarm,
    error: errorSettingAlarm,
  } = useMutation({
    mutationFn: writeAlarmSettings,
    onSuccess: (data) => {
      // data.alarmTime이 undefined인 경우를 방지
      const alarmTimeText = data?.alarm?.alarmTime || "알림";
      alert(
        `${
          data?.alarm?.disableAlarm
            ? "알림이 해제되었습니다."
            : `${alarmTimeText} 알림이 설정되었습니다.`
        }`
      );
      setAlarmSheetOpen(false); // ActionSheet 닫기 추가
      refetchChat();
      refetchAlarmSettings(); // 추가: 알림 설정 쿼리도 갱신
    },
    onError: (error: any) => {
      console.error("알림 설정 중 오류 발생:", error);

      // 오류 원인 확인 및 사용자 친화적인 메시지 제공
      let errorMessage = "알림 설정에 실패했습니다.";

      if (error.response) {
        // 서버 응답이 있는 경우 (상태 코드가 2xx 범위 밖)
        const status = error.response.status;
        const serverMessage =
          error.response.data?.error || error.response.data?.message;
        const errorCode = error.response.data?.code; // 서버에서 보내는 구체적인 에러 코드

        if (status === 400) {
          // 잘못된 요청에 대한 더 상세한 메시지
          if (
            serverMessage?.includes("past") &&
            serverMessage?.includes("appointment")
          ) {
            errorMessage = "지난 약속에는 알림을 설정할 수 없습니다.";
          } else if (
            serverMessage?.includes("alarm") &&
            serverMessage?.includes("past")
          ) {
            errorMessage =
              "설정하려는 알림 시간이 이미 지났습니다. 다른 시간을 선택해주세요.";
          } else {
            errorMessage = `알림 설정 오류: ${
              serverMessage || "필수 정보가 누락되었습니다."
            }`;
          }
        } else if (status === 404) {
          // 404 에러에 대한 더 상세한 메시지
          if (serverMessage?.includes("past")) {
            errorMessage = "이미 지난 약속입니다. 새로운 약속을 잡아 주세요.";
          } else if (serverMessage?.includes("appointment")) {
            errorMessage = "약속 정보가 변경되었거나 삭제되었습니다.";
          } else {
            errorMessage =
              "약속 정보를 찾을 수 없습니다. 새로고침 후 다시 시도해주세요.";
          }
        } else if (status === 500) {
          errorMessage = "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
        } else if (serverMessage) {
          errorMessage = `알림 설정 오류: ${serverMessage}`;
        }
      }

      alert(errorMessage);
    },
  });

  const onValid = (chatForm: ChatFormResponse) => {
    if (isLoadingSendChat) return;
    reset();

    setNewMessageSubmitted(true);

    sendChat({ chatForm, chatId: id });
  };

  // 새로운 메시지를 작성하고 submit하면 scroll to bottom이 되게 한다.
  // useEffect(() => {
  //   const chatBox = document.getElementById("chatBox") as HTMLElement;
  //   //// scrollTop 의 최대치는 scrollHeight-clientHeght. scrollTop에 이 최대치보다 큰 수를 넣더라도 scrollTop은 최대치 만큼만 반응한다.
  //   chatBox.scrollTop = chatBox.scrollHeight + 20;
  // }, [data?.ok, sendChatData, mutate]);
  // ref: https://velog.io/@lumpenop/TIL-nextron-React-%EC%B1%84%ED%8C%90%EC%B0%BD-%EA%B5%AC%ED%98%84-%EC%9E%85%EB%A0%A5-%EC%8B%9C-%EC%B1%84%ED%8C%90%EC%B0%BD-%EC%95%84%EB%A1%9C-%EC%8A%A4%ED%81%AC%EB%A1%A4-220724

  // 새로운 메시지를 작성하고 submit하면 scroll to bottom이 되게 한다.
  const isScrollToBottom = newMessageSubmitted === true;
  useEffect(() => {
    scrollToBottom(scrollRef);
    setNewMessageSubmitted(false);
  }, [isScrollToBottom]);

  useEffect(() => {
    scrollToBottom(scrollRef);
  }, [data?.sellerChat]);

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
      console.log("useEffect socket in!!!!!!!");
      //const roomName = `/ws-${workspace}-${id}`;
      console.log("-------------socket.id: ", socket.id);

      // 2. 모든 이벤트 리스너 등록
      socket.on("message", (message: any) => {
        console.log("-----------------message socket event received:", message);

        if (id && message.chatRoomId === id) {
          // 기존: refetchChat();
          // 변경: 새 메시지만 캐시에 추가
          console.log("before QueryClient message: ", message);
          // queryClient.setQueryData(["chat", id], (prev: any) => {
          //   if (prev) {
          //     return {
          //       ...prev,
          //       sellerChat: [...prev.sellerChat, message],
          //     };
          //   }
          //   return prev;
          // });
          refetchChat();
          console.log("after QueryClient");
        }
      });

      // socket.on("alarm_setting_changed", (data: any) => {
      //   console.log("alarm_setting_changed event received:", data);
      //   if (id && data.chatRoomId === id) {
      //     // 나 자신이 보낸 이벤트가 아닌 경우에만 refetch (이미 로컬에서 처리했으므로)
      //     if (data.updatedBy !== user?.id) {
      //       refetchChat();
      //     }
      //   }
      // });

      // // 3. 리스너 등록 후 룸 참여 요청 (roomName 재선언 없이 사용)
      // socket.emit("joinRoom", { room: roomName });
      // console.log(`Joined room: ${roomName}`);

      socket.on("joined_room", (data) => {
        console.log(`Successfully joined room: ${data.room}`);
      });

      socket.on("meetupCreated", (data: any) => {
        console.log("meetupCreated 이벤트 수신:", data);
        // 필요하다면 알림, 모달, refetch 등 추가 동작
        refetchChat();
        // 예: toast.success("새 약속이 생성되었습니다!");
      });

      // const handleMeetupCreated = (data: any) => {
      //   console.log("meetupCreated 이벤트 수신:", data);
      //   // 필요하다면 알림, 모달, refetch 등 추가 동작
      //   refetchChat();
      //   // 예: toast.success("새 약속이 생성되었습니다!");
      // };
      // socket.on("meetupCreated", handleMeetupCreated);

      socket.on("meetupUpdated", (data) => {
        console.log("meetupUpdated 이벤트 수신: ", data);
        refetchChat();
      });

      return () => {
        socket.off("message");
        // socket.off("alarm_setting_changed");
        socket.off("joined_room");
        socket.off("meetupCreated");
        socket.off("meetupUpdated");
      };
    }
  }, [id, queryClient, refetchChat, socket, user?.id]);

  const [shouldRefetch, setShouldRefetch] = useState(false);

  //   실행 순서

  // 사용자가 약속 생성 페이지에서 router.back()으로 채팅방으로 돌아옴
  // Next.js가 라우팅 완료 후 'routeChangeComplete' 이벤트 발생
  // handleRouteChange 함수가 현재 URL을 파라미터로 받아 실행됨
  // URL이 현재 채팅방 URL과 일치하면 shouldRefetch를 true로 설정
  // shouldRefetch가 true이고 router.isReady이면 채팅 데이터 갱신
  // 이 방식은 약속 생성 페이지에서 채팅방으로 돌아올 때만 선택적으로 데이터를 갱신할 수 있게 해줍니다.
  useEffect(() => {
    // 약속 생성 페이지에서 돌아온 경우에만 refetch
    const handleRouteChange = (url: string) => {
      if (url.includes(`/chats/${id}`)) {
        setShouldRefetch(true);
      }
    };

    router.events.on("routeChangeComplete", handleRouteChange);

    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [id, router.events]);

  useEffect(() => {
    if (shouldRefetch && router.isReady) {
      refetchChat();
      setShouldRefetch(false);
    }
  }, [router.isReady, shouldRefetch, refetchChat]);

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

  const sellerUserId = data?.chatRoomOfSeller?.sellerId;

  const reservationUserId = reservationData?.reserve?.userId;

  const [tooltipDate, setTooltipDate] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const messageRefs = useRef<
    Map<string, { element: HTMLDivElement; createdAt: string }>
  >(new Map());
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleScroll = useCallback(() => {
    if (
      !chatBoxRef.current ||
      !messageRefs.current ||
      messageRefs.current.size === 0
    ) {
      setTooltipDate("");
      return;
    }
    if (chatBoxRef.current) {
      const { scrollTop, clientHeight } = chatBoxRef.current;

      // 스크롤 중일 때 툴팁을 표시
      setIsScrolling(true);
      setShowTooltip(true);

      // 화면 상단에 표시된 첫 번째 메시지 찾기
      const firstVisibleMessage = Array.from(messageRefs.current.values()).find(
        ({ element }) => {
          try {
            const rect = element.getBoundingClientRect();
            return rect.top >= 0 && rect.top < clientHeight;
          } catch (error) {
            console.error("Error accessing DOM element:", error);
            return false;
          }
        }
      );

      if (firstVisibleMessage) {
        const dateStr = firstVisibleMessage.createdAt;
        setTooltipDate(dayjs(dateStr).format("YYYY년 MM월 DD일 dddd"));
        //setCurrentVisibleDate(dateStr);
      }

      // 스크롤이 멈춘 후 1초 후에 툴팁 숨기기
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        setShowTooltip(false);
        setIsScrolling(false);
      }, 1000);
    }
  }, [setShowTooltip, setTooltipDate, setIsScrolling, messageRefs]);

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

  const handleAlarmTimeSelected = async (timeOption: string) => {
    console.log("=== 알림 시간 선택 디버깅 시작 ===");
    console.log("선택된 알림 시간:", timeOption);

    try {
      if (!appointment) {
        alert("약속 정보를 찾을 수 없습니다.");
        return;
      }

      // 2. 약속 시간이 이미 지났는지 확인
      const meetupTime = new Date(appointment?.appointmentTime);
      if (meetupTime < new Date()) {
        alert("이미 지난 약속입니다. 알림을 설정할 수 없습니다.");
        return;
      }

      // 3. 알림 끄기 처리
      if (timeOption === "없음") {
        try {
          // await updateChatMeetup({
          //   alarmTime: null,
          //   chatRoomId: id,
          //   appointmentTime: appointment?.appointmentTime,
          //   place: appointment?.place,
          //   locationLatitude: appointment?.locationLatitude,
          //   locationLongitude: appointment?.locationLongitude,
          // });
          await deleteAlarmSettings(id);

          // 3-3. 알림 해제 메시지 생성
          // alert("writeSystemMessage1를 작성해야함");
          // await writeSystemMessage({
          //   chatRoomId: id,
          //   message: SYSTEM_MESSAGES.APPOINTMENT_ALERT("없음", chatMeetupId!)
          //     .message,
          //   meta: SYSTEM_MESSAGES.APPOINTMENT_ALERT("없음", chatMeetupId!).meta,
          //   userId: user?.id,
          // });

          alert("알림이 해제되었습니다.");
          setAlarmSheetOpen(false);
          refetchChat();
          return;
        } catch (error) {
          console.error("알림 해제 중 오류 발생:", error);
          alert("알림 해제에 실패했습니다.");
          return;
        }
      }

      // 4. 알림 설정 로직 - 알림 설정 시간(triggerAt) 계산
      let triggerAt = new Date(meetupTime.getTime());

      switch (timeOption) {
        case "10분 전":
          triggerAt.setMinutes(triggerAt.getMinutes() - 10);
          break;
        case "30분 전":
          triggerAt.setMinutes(triggerAt.getMinutes() - 30);
          break;
        case "1시간 전":
          triggerAt.setHours(triggerAt.getHours() - 1);
          break;
        case "1일 전":
          triggerAt.setDate(triggerAt.getDate() - 1);
          break;
        default:
          alert("올바르지 않은 알림 시간입니다.");
          return;
      }

      // 알림 트리거 시간이 이미 지났는지 확인
      if (triggerAt < new Date()) {
        alert(
          `선택한 알림 시간(${timeOption})이 이미 지났습니다. 다른 알림 시간을 선택해주세요.`
        );
        return;
      }

      try {
        // await updateChatMeetup({
        //   chatRoomId: id,
        //   appointmentTime: appointment?.appointmentTime,
        //   place: appointment?.place,
        //   locationLatitude: appointment?.locationLatitude,
        //   locationLongitude: appointment?.locationLongitude,
        //   alarmTime: timeOption,
        // });
        await writeAlarmSettings({
          chatId: id,
          alarmTime: timeOption,
          triggerAt: triggerAt.toISOString(),
          disableAlarm: false,
        });
        // 5-2. 기존 SCHEDULED 알림 조회 및 취소
        let latestAlarm = null;
        try {
          // const alarmRes = await axios.get(`/api/alarm-settings/${id}`);
          const alarmRes = await getAlarmSettings(id);
          latestAlarm = alarmRes.data.alarm || null;
          if (latestAlarm && latestAlarm.status === "SCHEDULED") {
            // await axios.post(
            //   `/api/chat/${id}/alarm-settings/cancel`,
            //   {}
            // );
            await writeAlarmSettings({
              chatId: id,
              alarmTime: timeOption,
              triggerAt: triggerAt.toISOString(),
              disableAlarm: true,
            });
            console.log(`기존 알림 취소됨: ${latestAlarm.id}`);
          }
        } catch (fetchError) {
          console.warn("기존 알림 조회/취소 중 오류:", fetchError);
        }

        // 5-3. 새 AlarmSetting 생성
        setAlarmSettings({
          chatId: id,
          // messageId: appointmentMessage.id,
          alarmTime: timeOption,
          triggerAt: triggerAt.toISOString(),
          disableAlarm: false,
        });

        // 5-4. 시스템 메시지 생성 (알림 변경 안내)
        // alert("writeSystemMessage2를 작성해야함");
        // await writeSystemMessage({
        //   chatRoomId: id,
        //   message: SYSTEM_MESSAGES.APPOINTMENT_ALERT(
        //     timeOption,
        //     chatMeetupId!
        //     // appointmentMessage.id
        //   ).message,
        //   meta: SYSTEM_MESSAGES.APPOINTMENT_ALERT(
        //     timeOption,
        //     chatMeetupId!
        //     // appointmentMessage.id
        //   ).meta,
        //   userId: user?.id,
        // });

        setAlarmSheetOpen(false);
        refetchChat();
      } catch (error) {
        console.error("알림 설정 중 오류 발생:", error);
        alert("알림 설정에 실패했습니다.");
      }

      console.log("=== 알림 시간 선택 디버깅 완료 ===");
    } catch (error) {
      console.error("알림 설정 중 오류 발생:", error);
      alert("알림 설정에 실패했습니다.");
    }
  };

  // 객체인지 문자열인지 판단하는 유틸리티 함수
  function getMetaData(meta: any) {
    // 문자열인 경우 (JSON 문자열)
    if (typeof meta === "string") {
      try {
        return JSON.parse(meta);
      } catch (e) {
        console.error("JSON 파싱 실패:", e);
        return {};
      }
    }
    // 이미 객체인 경우
    else if (typeof meta === "object" && meta !== null) {
      return meta;
    }
    // 다른 타입인 경우 빈 객체 반환
    return {};
  }

  const handleAlarmButtonClick = async (messageId: number) => {
    try {
      console.log("=== 알림 버튼 클릭 디버깅 시작 ===");
      console.log("클릭된 messageId:", messageId);
      console.log("전체 채팅 데이터:", data?.sellerChat);

      // 알림 설정 메시지를 찾기 (APPOINTMENT_ALERT 타입)
      const alertMessage = data?.sellerChat?.find(
        (msg: ChatWithUser) => msg.id === messageId
      );

      console.log("찾은 알림 메시지:", alertMessage);

      if (!alertMessage) {
        throw new Error("메시지를 찾을 수 없습니다");
      }

      // 메타데이터에서 chatMeetupId 추출
      let parsedMeta;
      try {
        parsedMeta = getMetaData(alertMessage.meta);
        console.log("파싱된 메타데이터:", parsedMeta);
      } catch (e) {
        console.error("메타데이터 파싱 오류:", e);
        throw new Error("메타데이터 파싱에 실패했습니다");
      }

      const chatMeetupId = parsedMeta.chatMeetupId;
      console.log("추출된 chatMeetupId:", chatMeetupId);

      if (!chatMeetupId) {
        console.error("전체 메타데이터:", parsedMeta);
        throw new Error(
          `chatMeetupId를 찾을 수 없습니다: ${JSON.stringify(parsedMeta)}`
        );
      }

      // 모든 약속 메시지들을 로깅
      const allAppointmentMessages = data?.sellerChat?.filter(
        (msg) => msg.chatMeetup
      );
      console.log(
        "모든 약속 메시지들:",
        allAppointmentMessages?.map((msg) => ({
          messageId: msg.id,
          chatMeetupId: msg.chatMeetup?.id,
          appointmentTime: msg.chatMeetup?.appointmentTime,
          messageType: msg.messageType,
          chatMsg: msg.chatMsg,
        }))
      );

      // chatMeetupId로 실제 약속 메시지 찾기 - 조건을 완화
      let appointmentMessage = data?.sellerChat?.find(
        (msg: ChatWithUser) => msg.chatMeetup?.id === chatMeetupId
      );

      // 첫 번째 시도 실패 시, 문자열 비교로 재시도
      if (!appointmentMessage) {
        console.log("숫자 비교 실패, 문자열 비교 시도");
        appointmentMessage = data?.sellerChat?.find(
          (msg: ChatWithUser) =>
            msg.chatMeetup?.id?.toString() === chatMeetupId?.toString()
        );
      }

      // 여전히 실패 시, 가장 최근 약속 메시지 사용
      if (!appointmentMessage) {
        console.log("chatMeetupId로 찾기 실패, 가장 최근 약속 메시지 사용");
        const appointmentMessages = data?.sellerChat?.filter(
          (msg) => msg.chatMeetup
        );
        if (appointmentMessages && appointmentMessages.length > 0) {
          appointmentMessage =
            appointmentMessages[appointmentMessages.length - 1];
          console.log("대안으로 선택된 약속 메시지:", appointmentMessage);
        }
      }

      console.log("최종 선택된 약속 메시지:", appointmentMessage);

      if (!appointmentMessage || !appointmentMessage.chatMeetup) {
        console.error("약속 메시지를 찾을 수 없음");
        throw new Error("약속 정보를 찾을 수 없습니다");
      }

      // 약속 시간이 이미 지났는지 확인
      const appointmentTime = new Date(
        appointmentMessage.chatMeetup.appointmentTime
      );
      const now = new Date();

      console.log("약속 시간:", appointmentTime);
      console.log("현재 시간:", now);

      if (appointmentTime < now) {
        throw new Error("이미 지난 약속입니다. 알림을 설정할 수 없습니다.");
      }

      // 알림 설정을 위해 alertMessage의 ID를 사용 (알림 메시지 ID)
      setCurrentMessageId(alertMessage.id); // 알림 메시지의 ID를 설정
      setAlarmSheetOpen(true);

      console.log("=== 알림 버튼 클릭 디버깅 완료 ===");
    } catch (error: any) {
      console.error("알림 설정 중 오류:", error);
      alert(error.message || "알림 설정에 실패했습니다.");
    }
  };

  // 로그인한 사용자의 알림 설정 찾기
  const userAlarmSetting =
    data?.chatRoomOfSeller?.alarmSettings?.find(
      (alarm: { userId: number }) => alarm.userId === user?.id
    ) ?? null;

  let optionsMenu: Option[] = selling
    ? [
        { value: "예약중", label: "예약중", active: true },
        { value: "거래완료", label: "거래완료", active: true },
      ]
    : reserved && chatUserId === reservationUserId
    ? [
        { value: "판매중", label: "판매중", active: true },
        { value: "거래완료", label: "거래완료", active: true },
      ]
    : [];

  // if (selling) {
  //   optionsMenu = [
  //     { value: "예약중", label: "예약중", active: true },
  //     { value: "거래완료", label: "거래완료", active: true },
  //   ];
  // } else if (reserved) {
  //   if (chatUserId === reservationUserId) {
  //     optionsMenu = [
  //       { value: "판매중", label: "판매중", active: true },
  //       { value: "거래완료", label: "거래완료", active: true },
  //     ];
  //   }
  // }

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
    return dayjs(date).locale("ko").format("YYYY. MM. DD. ddd");
  };

  const handleAppointmentClick = () => {
    const chatRoomId = router.query.id; // 현재 채팅방 ID
    router.push(`/appointment/create?chatRoomId=${chatRoomId}`); // 채팅방 ID를 URL로 전달
  };

  const ProductStatusDisplay = React.memo(({ status }: { status: string }) => {
    return <div>{status}</div>;
  });
  ProductStatusDisplay.displayName = "ProductStatusDisplay";

  // 약속 시간 포맷 함수
  const formatDetailedAppointmentTime = (dateTime: string | Date) => {
    const koreanDate = dayjs(dateTime).tz("Asia/Seoul");
    const now = dayjs().tz("Asia/Seoul");
    if (koreanDate.isSame(now, "day")) {
      return `오늘 ${koreanDate.format("A h:mm")}`;
    }
    if (koreanDate.isSame(now.add(1, "day"), "day")) {
      return `내일 ${koreanDate.format("A h:mm")}`;
    }
    return koreanDate.format("M월 D일 A h:mm");
  };

  // 약속 버튼 렌더링
  const renderAppointmentButton = () => {
    if (!data?.chatRoomOfSeller?.chatMeetup) {
      // 약속이 없으면 기존처럼 생성 페이지로 이동
      return (
        <div
          className="p-1 border border-black rounded-md cursor-pointer text-md"
          onClick={handleAppointmentClick}
        >
          약속잡기
        </div>
      );
    }

    const chatMeetup = data?.chatRoomOfSeller?.chatMeetup;
    const formattedTime = formatDetailedAppointmentTime(
      chatMeetup?.appointmentTime
    );
    const messageId = appointment?.id; // 최신 약속 메시지의 id
    const chatMeetupId = chatMeetup.id; // chatMeetup의 id

    // 약속이 있으면 시간 표시, 클릭시 수정 모달 오픈
    // 약속 시간이 지났는지 체크
    const isPast = dayjs(chatMeetup.appointmentTime).isBefore(
      dayjs().tz("Asia/Seoul")
    );

    return (
      <button
        className={`text-md rounded-md border border-blue-500 bg-blue-50 p-1 text-blue-700 ${
          isPast ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        }`}
        onClick={async () => {
          if (isPast) return;
          // alarmSetting을 조회해서 현재 사용자(user)의 alarmTime을 전달
          let alarmTimeFromSetting: string | null = null;
          try {
            const alarmRes = await axios.get(`/api/alarm-settings/${id}`);
            // alarmRes.data.alarms가 배열이면, userId로 필터링
            if (alarmRes.data.alarms && Array.isArray(alarmRes.data.alarms)) {
              const userAlarm = alarmRes.data.alarms.find(
                (a: any) => a.userId === user?.id
              );
              alarmTimeFromSetting = userAlarm?.alarmTime ?? null;
            } else if (alarmRes.data.alarm) {
              // 단일 alarm 객체일 경우
              alarmTimeFromSetting = alarmRes.data.alarm.alarmTime ?? null;
            }
          } catch (err) {
            // 조회 실패 시 chatMeetup.alarmTime을 fallback
            alarmTimeFromSetting = chatMeetup.alarmTime ?? null;
          }

          const result = await openAppointmentEditModal({
            appointmentTime: chatMeetup.appointmentTime,
            place: chatMeetup.place,
            latitude: chatMeetup.locationLatitude ?? 0,
            longitude: chatMeetup.locationLongitude ?? 0,
            alarmTime: alarmTimeFromSetting,
            chatMeetupId: chatMeetupId,
          });
          // ✅ 약속/알림이 변경된 경우 refetchChat() 호출
          if (result && result.success) {
            refetchChat();
          }
        }}
        disabled={isPast}
        title={isPast ? "이미 지난 약속입니다" : ""}
      >
        {formattedTime}
      </button>
    );
  };

  // console.log("message: ", message)
  // console.log("message.messageType", message.messageType)
  // console.log("MessageType.SYSTEM: ", MessageType)
  // console.log("message.messageType === MessageType.SYSTEM", message.messageType === MessageType.SYSTEM)

  // 커스텀 이벤트 리스너 등록: Message 컴포넌트에서 약속 모달 오픈 요청 감지
  useEffect(() => {
    const handleOpenAppointmentModal = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const {
        appointmentTime,
        place,
        latitude,
        longitude,
        alarmTime,
        chatMeetupId,
      } = customEvent.detail;

      try {
        const result = await openAppointmentEditModal({
          appointmentTime,
          place,
          latitude: latitude ?? 0,
          longitude: longitude ?? 0,
          alarmTime,
          chatMeetupId,
        });

        if (result && result.success) {
          refetchChat();
        }
      } catch (error) {
        console.error("약속 모달 오픈 중 오류:", error);
      }
    };

    window.addEventListener("openAppointmentModal", handleOpenAppointmentModal);

    return () => {
      window.removeEventListener("openAppointmentModal", handleOpenAppointmentModal);
    };
  }, [openAppointmentEditModal, refetchChat]);

  return (
    <>
      {renderReservedModal()}
      {renderAppointmentEditModal()}
      <ActionSheet
        isOpen={alarmSheetOpen}
        onClose={() => setAlarmSheetOpen(false)}
        title="약속 전 나에게 알림"
        options={[
          { label: "없음", value: "없음" },
          { label: "10분 전", value: "10분 전" },
          { label: "30분 전", value: "30분 전" },
          { label: "1시간 전", value: "1시간 전" },
        ]}
        selectedValue={alarmSheetValue}
        onChange={setAlarmSheetValue}
        onConfirm={handleAlarmTimeSelected}
        maxWidth="max-w-xs"
      />
      <Layout
        seoTitle={`${otherName} || 채팅`}
        title={`${otherName}`}
        canGoBack
        backUrl={"back"}
      >
        <div className="relative h-full px-4 pb-12">
          <div className="w-full max-w-xl p-4 bg-red-200 border-b border-gray-200">
            <div
              className="flex items-center cursor-pointer"
              onClick={() => {
                router.push(`/products/${productId}`);
              }}
            >
              <div className="flex items-center space-x-4">
                <ImgComponent
                  width={80}
                  height={80}
                  clsProps="rounded-md bg-gray-400"
                  imgAdd={`https://imagedelivery.net/${
                    process.env.NEXT_PUBLIC_CF_HASH
                  }/${
                    (
                      data?.chatRoomOfSeller?.product as Product & {
                        images: { imageId: string }[];
                      }
                    )?.images[0]?.imageId
                  }/public`}
                  imgName="사진"
                />
                <div className="flex flex-col space-y-1">
                  <div className="flex flex-row items-center space-x-2">
                    <div className="text-gray-900">
                      {data?.chatRoomOfSeller?.product?.name}
                    </div>
                    <div>{productStatus}</div>
                    <div className="">
                      {/*로그인 유저가 판매자이고, selling | reserved 이면 drop down  */}
                      {user?.id === sellerUserId && (selling || reserved) && (
                        <Dropdown
                          options={options}
                          value={selectedValue}
                          onChange={handleChange}
                        />
                      )}
                    </div>
                  </div>
                  <span className="text-gray-900">
                    ￦{data?.chatRoomOfSeller?.product?.price}
                  </span>
                  <div className="text-gray-900">
                    {data?.chatRoomOfSeller?.seller?.name}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-row justify-between mt-2">
              {renderAppointmentButton()}
              <button
                className="p-1 text-blue-700 border border-blue-500 rounded-md cursor-pointer text-md bg-blue-50"
                onClick={() => {
                  if (!appointment) {
                    alert("약속 정보가 없습니다. 약속을 먼저 잡아주세요.");
                    return;
                  }
                  const appointmentTime = new Date(appointment.appointmentTime ?? "");
                  if (appointmentTime < new Date()) {
                    alert("이미 지난 약속입니다. 알림을 설정할 수 없습니다.");
                    return;
                  }
                  refetchAlarmSettings(); // 추가: ActionSheet 열기 전에 최신값 요청
                  setAlarmSheetOpen(true);
                }}
              >
                {`알림 ${userAlarmSetting ? userAlarmSetting?.alarmTime : "없음"}`}{/* {(() => {
                  if (!userAlarmSetting?.alarmTime) {
                    return "알림 없음";
                  }
                  
                  // 약속 시간이 없으면 알림 없음
                  if (!appointment?.appointmentTime) {
                    return "알림 없음";
                  }
                  
                  // 알림 트리거 시간 계산
                  const appointmentDate = new Date(appointment.appointmentTime);
                  let triggerAt = new Date(appointmentDate);
                  
                  switch (userAlarmSetting.alarmTime) {
                    case "10분 전":
                      triggerAt.setMinutes(triggerAt.getMinutes() - 10);
                      break;
                    case "30분 전":
                      triggerAt.setMinutes(triggerAt.getMinutes() - 30);
                      break;
                    case "1시간 전":
                      triggerAt.setHours(triggerAt.getHours() - 1);
                      break;
                    case "1일 전":
                      triggerAt.setDate(triggerAt.getDate() - 1);
                      break;
                    default:
                      return "알림 없음";
                  }
                  
                  // 트리거 시간이 이미 지났으면 "알림 없음"
                  if (triggerAt < new Date()) {
                    return "알림 없음";
                  }
                  
                  return `알림 ${userAlarmSetting.alarmTime}`;
                })()} */}
              </button>

              {isSellingAndConsumer && (
                <div
                  className="p-1 border border-black rounded-md cursor-pointer text-md"
                  onClick={() => {
                    console.log("당근페이가 클릭되었습니다.");
                  }}
                >
                  당근페이
                </div>
              )}
              {isSellingAndProvider && (
                <div
                  className="p-1 border border-black rounded-md cursor-pointer text-md"
                  onClick={() => {
                    console.log("송금요청이 클릭되었습니다.");
                  }}
                >
                  송금요청
                </div>
              )}
              {isSellingAndConsumer && (
                <div
                  className="p-1 border border-black rounded-md cursor-pointer text-md"
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
            </div>
          </div>
          <div
            className="flex h-[calc(95vh-300px)] flex-col space-y-2 overflow-y-auto py-5 transition-all"
            id="chatBox"
            ref={chatBoxRef}
          >
            {/* Sticky 날짜 헤더 - 투명 배경과 애니메이션 적용 */}
            {/* {currentVisibleDate && (
              <div className="sticky z-10 w-full top-4">
                <div
                  className={`mx-auto w-fit rounded-full bg-black/70 px-4 py-1.5 
                text-center text-sm text-white transition-opacity duration-200 ease-out
                ${isScrolling ? "opacity-100" : "opacity-0"}`}
                >
                  {formatDateWithDay(currentVisibleDate)}
                </div>
              </div>
            )} */}
            {data?.sellerChat?.map((message: ChatWithUser, index: number) => {
              const messageDate = dayjs(message.createdAt).format("YYYY-MM-DD"); // 메시지 날짜
              const showDate = lastMessageDate !== messageDate; // 날짜를 표시할지 여부
              lastMessageDate = messageDate; // 마지막 메시지 날짜 업데이트

              // meta를 이용해 약속 메시지 여부를 판별하는 유틸리티 함수
              function getMetaData(meta: any) {
                if (typeof meta === "string") {
                  try {
                    return JSON.parse(meta);
                  } catch (e) {
                    return {};
                  }
                } else if (typeof meta === "object" && meta !== null) {
                  return meta;
                }
                return {};
              }

              const parsedMeta = getMetaData(message.meta);
              const isAppointmentMessage = parsedMeta.type === "appointment";

              // 약속 시간이 지났는지 확인 - 현재 시간과 비교
              const now = new Date();
              const isAppointmentPassed =
                isAppointmentMessage &&
                parsedMeta.appointmentTime &&
                new Date(parsedMeta.appointmentTime).getTime() < now.getTime();

              // 알림 설정 버튼 표시 여부 결정 - 과거 약속이면 완전히 제거
              const showAlarmButton
                = message.messageType === MessageType.SYSTEM
                && message.chatMsg.includes("알림이 울릴 거예요")
                && !isAppointmentPassed;

              // 약속 메시지에만 appointmentData 전달
              const appointmentData
                = isAppointmentMessage && parsedMeta.appointmentTime
                  ? {
                    appointmentTime: parsedMeta.appointmentTime,
                    place: parsedMeta.place,
                    latitude: parsedMeta.locationLatitude ?? undefined,
                    longitude: parsedMeta.locationLongitude ?? undefined,
                    alarmTime: parsedMeta.alarmTime,
                    isPast: isAppointmentPassed,
                    chatMeetupId: parsedMeta.chatMeetupId,
                  }
                  : undefined;

              // 알림 설정 버튼이 비활성화된 경우 툴팁 메시지
              const disabledButtonTooltip = isAppointmentPassed
                ? "이미 지난 약속입니다"
                : undefined;

              return (
                <div
                  key={message.id}
                  ref={(el) => {
                    if (el) {
                      messageRefs.current.set(`${message.id}`, {
                        element: el,
                        createdAt: message.createdAt?.toString(),
                      });
                    } else {
                      messageRefs.current.delete(`${message.id}`);
                    }
                  }}
                  className="p-4 border-b border-gray-200"
                >
                  {/* 날짜 툴팁 */}
                  {showTooltip && tooltipDate && (
                    <div className="fixed z-20 px-4 py-2 text-sm text-white transform -translate-x-1/2 bg-gray-600 rounded-full left-1/2 top-2 bg-opacity-20">
                      {tooltipDate}
                    </div>
                  )}
                  {/* 날짜 변경 시 날짜 표시 */}
                  {showDate && (
                    <div className="my-2 text-sm text-center text-white">
                      <span className="px-4 bg-gray-400 rounded-full">
                        {dayjs(message.createdAt)
                          .locale("ko")
                          .format("YYYY년 MM월 DD일 dddd")}
                      </span>
                    </div>
                  )}
                  <Message
                    key={message.id}
                    reversed={message.userId === user?.id}
                    name={
                      message.messageType === MessageType.SYSTEM
                        ? "시스템"
                        : message.user?.name || "알 수 없음"
                    }
                    message={message.chatMsg}
                    avatar={message.user?.avatar}
                    date={message.createdAt}
                    isAppointment={isAppointmentMessage}
                    appointmentData={appointmentData}
                    messageType={message.messageType || MessageType.USER}
                    actions={
                      showAlarmButton
                        ? [
                            {
                              type: "button",
                              label: "알림설정",
                              value: "set_alarm",
                              onClick: isAppointmentPassed
                                ? undefined
                                : () => handleAlarmButtonClick(message.id),
                              disabled: isAppointmentPassed,
                              tooltip: disabledButtonTooltip,
                            },
                          ]
                        : undefined
                    }
                    chatRoomId={id}
                    otherName={otherName}
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
            <form
              onSubmit={handleSubmit(onValid)}
              className="w-full px-1 py-1 mt-10 border-t"
            >
              <div className="relative w-full px-2 py-2 bg-white rounded-md outline-none">
                <input
                  {...register("chatMsg", { required: true, maxLength: 80 })}
                  maxLength={80}
                  autoComplete="off"
                  placeholder={
                    user === undefined
                      ? "로그인 후 이용가능합니다."
                      : "메세지를 입력해주세요."
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
