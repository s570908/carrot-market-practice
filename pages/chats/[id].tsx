import type { GetServerSideProps, NextPage } from "next";
import Layout from "@components/Layout";
import useUser from "@libs/client/useUser";
import { useRouter } from "next/router";
//import useSWR from "swr";
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
// import useMutation from "@libs/client/useMutation";
import Message from "@components/Message";
import {
  MutableRefObject,
  useEffect,
  useRef,
  useState,
  useMemo,
  useLayoutEffect,
  useCallback,
} from "react";
import { useIntersectionObserver } from "@libs/client/useIntersectionObserver";
import { FiChevronsDown } from "react-icons/fi";
import { cls } from "@libs/utils";
import Loading from "@components/Loading";
import ImgComponent from "@components/ImgComponent";
import { getChatRoomData } from "@libs/server/chatUtils";
import Dropdown from "@components/Dropdown";
import io, { Socket } from "socket.io-client";
import { useMutation, useQuery, useQueryClient } from "react-query";
import axios from "axios";
import useSocket from "@libs/client/useSocket";
import dayjs from "@libs/dayjs";
// import dayjs from "dayjs";
// import "dayjs/locale/ko";
// dayjs.locale("ko"); // 한국어 설정

type Option = {
  value: string;
  label: string;
  active: boolean;
};

export type User = PrismaUser & {
  writtenReviews: Review[];
};

interface ChatWithUser extends SellerChat {
  user: User;
}

interface ReservationWithUser extends Reservation {
  user: User;
}

interface ReservationResponse {
  ok: boolean;
  isReserved: boolean;
  reserve: ReservationWithUser;
}

interface ReviewWritableResponse {
  ok: boolean;
  error?: string;
  message?: string;
}

interface SellerChatResponse {
  ok: boolean;
  sellerChat: ChatWithUser[];
  chatRoomOfSeller: {
    buyerId: number;
    sellerId: number;
    productId: number;
    buyer: User;
    seller: User;
    product: Product;
  };
}
interface ChatFormResponse {
  chatMsg: string;
}

interface ChatRoomWithDetails extends ChatRoom {
  buyer: User;
  seller: User;
  product: Product;
  // chats: ChatMessage[];
}

interface ChatDetailProps {
  chatRoomData: ChatRoomWithDetails;
}

const workspace = "market"; // 추후 다른 workspace를 추가하려면 로직을 개편해야 한다.

const ChatDetail: NextPage<ChatDetailProps> = ({ chatRoomData }) => {
  // console.log("chatRoomData: ", chatRoomData);

  const [newMessageSubmitted, setNewMessageSubmitted] = useState(false);
  const { user } = useUser();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [socket, disconnectSocket] = useSocket(workspace);

  //// router.query.id: chatRoom id
  //// chatRoom list 가져오기
  // const { buyerId, sellerId, productId } = router.query;
  // console.log(
  //   "chats.id.tsx -------- buyerId, sellerId, productId: ",
  //   buyerId,
  //   sellerId,
  //   productId
  // );
  // const { data, mutate } = useSWR<SellerChatResponse>(
  //   router.query.id ? `/api/chat/${router.query.id}` : null,
  //   { refreshInterval: 300000 }
  // );

  // axios를 사용해 데이터를 가져오는 함수
  const fetchChatData = async () => {
    const response = await axios.get(`/api/chat/${router.query.id}`);
    return response.data;
  };

  const {
    data,
    isLoading,
    error: queryError,
    refetch, // 데이터를 수동으로 패칭할 수 있는 함수
  } = useQuery(
    ["chat", router.query.id], // 쿼리 키
    // () => fetch(`/api/chat/${router.query.id}`).then((res) => res.json()), // 데이터 패칭 함수
    fetchChatData,
    {
      enabled: !!router.query.id, // id가 있을 때만 쿼리를 실행
      refetchInterval: 300000, // 5분마다 데이터 재패칭
    }
  );

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
  // selling은 Status.Registered와 동일하다.
  const selling = !reserved && !sold;

  const productStatus = (reserved && "예약중") || (sold && "거래완료") || "판매중";

  const isProvider = data?.chatRoomOfSeller?.sellerId === user?.id;
  const isConsumer = data?.chatRoomOfSeller?.buyerId === user?.id;

  const fetchReservation = async (productId: string) => {
    const { data } = await axios.get(`/api/products/${productId}/reservation`);
    return data;
  };

  const productId = data?.chatRoomOfSeller?.productId;

  const {
    data: reservationData,
    isLoading: isFetchingReservation,
    isError,
  } = useQuery(["reservation", productId], () => fetchReservation(productId), {
    enabled: !!router.query.id && !!productId,
  });

  const reviewType = isProvider ? "SellerReview" : "BuyerReview";

  const fetchReviewWritable = async (url: string) => {
    const { data } = await axios.get(url);
    return data;
  };

  const url =
    router.query.id && data?.chatRoomOfSeller?.productId
      ? `/api/products/${data?.chatRoomOfSeller?.productId}/checkReviewWritable?createdForId=${otherId}&reviewType=${reviewType}`
      : null;

  const { data: reviewWritableData, error } = useQuery(
    ["reviewWritable", url],
    () => fetchReviewWritable(url!),
    {
      enabled: !!url, // url이 있을 때만 쿼리를 실행
    }
  );

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

  const { register, handleSubmit, reset } = useForm<ChatFormResponse>();
  const {
    mutate: sendChat,
    isLoading: sendChatDataLoading,
    data: sendChatData,
  } = useMutation(
    (chatForm: ChatFormResponse) => axios.post(`/api/chat/${router.query.id}`, chatForm),
    {
      onMutate: async (chatForm: ChatFormResponse) => {
        await queryClient.cancelQueries(["chat", router.query.id]);
        const previousChatData = queryClient.getQueryData(["chat", router.query.id]);
        queryClient.setQueryData(["chat", router.query.id], (prev: any) => {
          if (prev) {
            const newMessage = {
              id: Date.now(),
              chatMsg: chatForm.chatMsg + "test",
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
      },
      onError: (error, variables, context) => {
        if (context?.previousChatData) {
          queryClient.setQueryData(["chat", router.query.id], context.previousChatData); // 이전 데이터로 롤백
        }
      },
      onSettled: () => {
        queryClient.invalidateQueries(["chat", router.query.id]); // 쿼리 무효화
      },
    }
  );

  const toggleReservation = async ({
    productId,
    buyerId,
  }: {
    productId: number;
    buyerId: number;
  }) => {
    const { data } = await axios.post(`/api/products/${productId}/reservation`, { buyerId });
    return data;
  };

  const { mutate: toggleReservationMutate } = useMutation(
    (variables: { productId: number; buyerId: number }) => toggleReservation(variables),
    {
      onSuccess: () => {
        // 쿼리 무효화하여 최신 데이터로 갱신
        queryClient.invalidateQueries("reservation");
      },
    }
  );

  const sellComplete = async ({ productId, buyerId }: { productId: number; buyerId: number }) => {
    const { data } = await axios.post(`/api/products/${productId}`, {
      buyerId,
    });
    return data;
  };

  const { mutate: sellCompleteMutate } = useMutation(
    (variables: { productId: number; buyerId: number }) => sellComplete(variables),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["chat", router.query.id]); // 판매 완료 후 데이터 갱신
      },
    }
  );

  const onValid = (chatForm: ChatFormResponse) => {
    if (sendChatDataLoading) return;
    reset();

    setNewMessageSubmitted(true);

    sendChat(chatForm); // mutate에서 option을 false로 하였기 때문에 서버의 데이터가 아직 업데이트되지 않았으므로 지금 여기서 서버의 데이터를 업데이트한다.
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

  const [selectedValue, setSelectedValue] = useState("");

  const initialOptions = useMemo(
    () => [
      { value: "판매중", label: "판매중", active: false },
      { value: "예약중", label: "예약중", active: true },
      { value: "거래완료", label: "거래완료", active: true },
    ],
    []
  );

  const [connected, setConnected] = useState<boolean>(false);

  useEffect(() => {
    if (socket) {
      socket?.on("message", (message: any) => {
        //console.log("message received: ", message);
        //console.log("to do: mutate()를 useQuery function으로 대체한다.");
        refetch();
        // mutate();
        //setChat((chat) => [...chat, message]);
      });
    }
    return () => {
      socket?.off("message");
    };
  }, [connected, refetch, router.query.id, socket]);

  // 드롭다운에서 선택 변경 시 호출되는 함수
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedValue(event.target.value);
  };

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

  // api server call is here
  useEffect(() => {
    //console.log("selectedValue: ", selectedValue);
    //console.log("reserved: ", reserved);
    // console.log("sold: ", sold);
    if (selling) {
      // 로그인 유저가 파는 사람이고 구매자가 예약 하겠다고 하면 예약중으로 변경한다.
      if (selectedValue === "예약중") {
        //console.log("api to do: 예약중");
        toggleReservationMutate({
          productId: data?.chatRoomOfSeller?.productId,
          buyerId: data?.chatRoomOfSeller?.buyerId,
        });
      }
      // 로그인 유저가 파는 사람이고 구매자가 예약중이면 구매자의 예약을 제거하고 구매자에게 판매 완료한다.
      if (selectedValue === "거래완료") {
        //console.log("api to do: 거래완료");
        sellCompleteMutate({
          productId: data?.chatRoomOfSeller?.productId,
          buyerId: data?.chatRoomOfSeller?.buyerId,
        });
      }
    } else if (reserved) {
      if (selectedValue === "판매중") {
        // 로그인 유저가 파는 사람이고 구매자가 예약중인 상태에서 구매자의 예약을 취소한다.
        //console.log("api to do: 예약중에서 판매중으로 바뀌도록 한다.");
        toggleReservationMutate({
          productId: data?.chatRoomOfSeller?.productId,
          buyerId: data?.chatRoomOfSeller?.buyerId,
        });
      } else if (selectedValue === "거래완료") {
        // 로그인 유저가 파는 사람이고 구매자가 예약중이면 구매자의 예약을 제거하고 구매자에게 판매 완료한다.
        //console.log("api to do: 거래완료");
        sellCompleteMutate({
          productId: data?.chatRoomOfSeller?.productId,
          buyerId: data?.chatRoomOfSeller?.buyerId,
        });
      } else if (selectedValue === "거래완료") {
        // 거래 완료시 거래 완료 선택시 할일 없음
        console.log("할일 없음");
      }
    }
    setSelectedValue("");
    // reservationMutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedValue, reserved, sold, data?.chatRoomOfSeller?.buyerId]);

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

  if (isLoading) return <div>Loading...</div>;
  if (queryError instanceof Error) return <div>Error: {queryError.message}</div>;

  let lastMessageDate: string | null = null; // 마지막으로 표시된 날짜

  return (
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
              router.push(`/products/${data?.chatRoomOfSeller?.productId}`);
            }}
          >
            <div className="flex items-center space-x-4">
              <ImgComponent
                width={80}
                height={80}
                clsProps="rounded-md bg-gray-400"
                imgAdd={`https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_HASH}/${data?.chatRoomOfSeller?.product?.image}/public`}
                imgName="사진"
              />
              <div className="flex flex-col space-y-1">
                <div className="flex flex-row items-center space-x-2">
                  <div className="text-gray-900">{data?.chatRoomOfSeller?.product?.name}</div>
                  <div>{productStatus}</div>
                  <div className="">
                    {/*로그인 유저가 판매자이고, 아직 안 팔렸고, 구매요청자(채팅상대자)가 예약자가 아니면  */}
                    {!(
                      user?.id !== sellerUserId ||
                      sold ||
                      (reserved && chatUserId !== reservationUserId)
                    ) && (
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
              onClick={() => {
                console.log("약속잡기가 클릭 되었습니다.");
              }}
            >
              약속잡기
            </div>
            <div
              className="text-md cursor-pointer rounded-md border border-black p-1"
              onClick={() => {
                console.log("송금요청이 클릭 되었습니다.");
              }}
            >
              송금요청
            </div>
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
          {data?.sellerChat?.map((message: any) => {
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
                {sendChatDataLoading === true ? (
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
