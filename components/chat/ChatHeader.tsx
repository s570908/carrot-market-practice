import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import ImgComponent from "@components/ImgComponent";
import Dropdown from "@components/Dropdown";
import { Product, Status } from "@prisma/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAwaitableModal } from "@libs/client/useAwaitableModal";
import { useMutation } from "@tanstack/react-query";
import { writeToggleReservation, writeSellComplete } from "apiLibs/products";
import { parseId } from "@libs/utils";

interface ChatHeaderProps {
  user: any;
  socket: any;
  otherId?: number;
  otherName?: string;
  chatRoomId: number;
  reviewWritableData?: any;
  reservationData?: any;
  data?: any; // 채팅룸 데이터
  handleAppointmentClick: () => void; // 속성 추가
}

const ChatHeader = ({
  user,
  socket,
  otherId,
  otherName,
  chatRoomId,
  reviewWritableData,
  reservationData,
  data,
  handleAppointmentClick, // 매개변수로 받기
}: ChatHeaderProps) => {
  // 내부 상태와 hooks
  const [productStatus, setProductStatus] = useState<string>("");
  const [selectedValue, setSelectedValue] = useState("");
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = router.query.id ? parseId(router.query.id) : 0;

  // product 대신 data에서 상품 정보 가져오기
  const product = data?.chatRoomOfSeller?.product;

  // 상품 상태 계산
  const reserved = product?.status === Status.Reserved;
  const sold = product?.status === Status.Sold;
  const unregistered = product?.status === Status.Unregistered;
  const selling = !reserved && !sold && !unregistered;

  const productId = product?.id;
  const sellerUserId = data?.chatRoomOfSeller?.sellerId;
  console.log("ChatHeader--product: ", product);
  console.log("ChatHeader--sellerUserId: ", sellerUserId);
  const buyerId = data?.chatRoomOfSeller?.buyerId || product?.chatRoom?.buyerId;
  const isProvider = user?.id === sellerUserId;
  const isConsumer = user?.id !== sellerUserId;
  const isSellingAndConsumer = selling && isConsumer;
  const isSellingAndProvider = selling && isProvider;
  const productStatusInitial =
    (reserved && "예약중") || (sold && "거래완료") || (selling && "판매중") || "미등록";
  const reviewType = isProvider ? "SellerReview" : "BuyerReview";
  const chatUserId =
    data?.chatRoomOfSeller?.buyerId === user?.id
      ? data?.chatRoomOfSeller?.sellerId
      : data?.chatRoomOfSeller?.buyerId;
  const reservationUserId = reservationData?.reserve?.userId;

  // 드롭다운 옵션 설정
  const initialOptions = useMemo(
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
  const {
    mutate: toggleReservationMutate,
    isPending: isLoadingToggleReservation,
    isError: isErrorToggleReservation,
    error: errorToggleReservation,
  } = useMutation({
    mutationFn: writeToggleReservation,
  });

  // 판매 완료 mutation
  const {
    mutate: sendSellComplete,
    isPending: isLoadingSendSellComplete,
    isError: isErrorSendSellComplete,
    error: errorSendSellComplete,
  } = useMutation({
    mutationFn: writeSellComplete,
  });

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
        console.log("selling 에서 예약중으로 변경");
        toggleReservationMutate(
          { productId, buyerId },
          {
            onSuccess: () => {
              const stateObj = { productId, old: "판매중", new: "예약중" };
              console.log("socket?.emit(changeState)--stateObj: ", stateObj);
              socket?.emit("changeState", stateObj);
            },
          }
        );
      }
      if (newValue === "거래완료") {
        console.log("selling 에서 거래완료로 변경");
        sendSellComplete(
          { productId, buyerId },
          {
            onSuccess: () => {
              const stateObj = { productId, old: "판매중", new: "거래완료" };
              console.log("socket?.emit(changeState)--stateObj: ", stateObj);
              socket?.emit("changeState", stateObj);
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
          { productId, buyerId },
          {
            onSuccess: () => {
              const stateObj = { productId, old: "예약중", new: "판매중" };
              console.log("socket?.emit(changeState)--stateObj: ", stateObj);
              socket?.emit("changeState", stateObj);
            },
          }
        );
      } else if (newValue === "거래완료") {
        console.log("reserved 에서 거래완료로 변경");
        sendSellComplete(
          { productId, buyerId },
          {
            onSuccess: () => {
              const stateObj = { productId, old: "예약중", new: "거래완료" };
              console.log("socket?.emit(changeState)--stateObj: ", stateObj);
              socket?.emit("changeState", stateObj);
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

  // 캐시 업데이트 함수
  const updateProductStatus = useCallback(
    (newState: string, status: Status) => {
      queryClient.setQueryData(["chat", chatRoomId], (oldData: any) => {
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
    [queryClient, chatRoomId]
  );

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

  // 상태 표시 컴포넌트
  const ProductStatusDisplay = React.memo(({ status }: { status: string }) => {
    return <div>{status}</div>;
  });
  ProductStatusDisplay.displayName = "ProductStatusDisplay";

  console.log(
    "ChatHeader--user?.id, sellerUserId, selling, reserved: ",
    user?.id,
    sellerUserId,
    selling,
    reserved
  );

  return (
    <>
      {renderReservedModal()}
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
              <div className="text-gray-900">{product?.seller?.name}</div>
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
    </>
  );
};

export default ChatHeader;
