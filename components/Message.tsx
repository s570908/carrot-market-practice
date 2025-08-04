import { cls } from "@libs/utils";
import Image from "next/image";
import ImgComponent from "@components/ImgComponent";
import TimeFormat from "@components/TimeFormat";
import RegDate from "@components/RegDate";
import gravatar from "gravatar";
import { useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/ko"; // 한국어 로케일
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { useAwaitableModal } from "@libs/client/useAwaitableModal";
// import AppointmentModal from "./AppointmentModal";
import { MessageType } from "@prisma/client";
import AppointmentEditModal from "./AppointmentEditModal";

// dayjs 설정 추가 (타임존 지원)
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("ko");

interface MessageAction {
  type: "link" | "button";
  label: string;
  value: string;
  onClick?: () => void;
  disabled?: boolean;
  tooltip?: string;
}

interface MessageProps {
  message: string;
  reversed?: boolean;
  name?: string;
  avatar?: string | null;
  date?: Date | string;
  isAppointment?: boolean;
  appointmentData?: {
    appointmentTime: Date; // Single UTC datetime string
    place: string;
    latitude?: number;
    longitude?: number;
    isPast?: boolean;
  };
  messageType?: MessageType; // 메시지 타입 추가
  actions?: MessageAction[];
  chatRoomId?: number; // 채팅방 ID 속성
}

export default function Message({
  message,
  reversed,
  name,
  avatar,
  date,
  isAppointment = false,
  appointmentData,
  messageType = MessageType.USER,
  actions,
  chatRoomId, // 채팅방 ID prop 사용
}: MessageProps) {
  //console.log('Message.tsx--chatRoomId:', chatRoomId)

  // AppointmentEditModal에 채팅방 ID 직접 전달
  const {
    openModal: openAppointmentModal,
    renderModal: renderAppointmentModal,
  } = useAwaitableModal((modal, params) => (
    <AppointmentEditModal
      modal={modal}
      params={params}
      chatRoomId={chatRoomId || 0} // 채팅방 ID 전달 (없으면 0 사용)
      chatUsername={name ?? "아무개"}
    />
  ));

  // 시간을 한국 시간대로 변환하고 포맷팅하는 함수
  const formatKoreanTime = (date: Date | string | undefined) => {
    if (!date) return { date: "", time: "" };

    // UTC 시간을 한국 시간대로 변환
    const koreanDate = dayjs(date).tz("Asia/Seoul");

    return {
      date: koreanDate.format("M월 D일 (ddd)"),
      time: koreanDate.format("A h:mm"), // 오전/오후 h:mm 형식
    };
  };

  const handleShowAppointment = async () => {
    if (!appointmentData) return;

    // 채팅방 ID 검증
    if (!chatRoomId) {
      console.warn("채팅방 ID가 없습니다. 약속 생성이 실패할 수 있습니다.");
    }

    await openAppointmentModal({
      appointmentTime: appointmentData.appointmentTime,
      place: appointmentData.place,
      latitude: appointmentData.latitude || 0,
      longitude: appointmentData.longitude || 0,
    });
  };

  // 시스템 메시지 처리 로직 추가
  if (messageType === MessageType.SYSTEM) {
    // console.log('handleShowAppointment--시스템 메시지 렌더링:', {
    //   message,
    //   hasActions: actions && actions.length > 0,
    //   actions
    // });

    return (
      <div className="my-3 flex justify-center">
        <div className="max-w-[80%] rounded-2xl bg-gray-100 px-4 py-2 text-sm text-gray-700 shadow-sm">
          <span>{message}</span>

          {/* 액션 버튼 렌더링 */}
          {actions && actions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {actions.map((action, index) => {
                // 액션 정보 로깅
                // console.log(`Message.tsx--액션 버튼 ${index} 정보:`, {
                //   type: action.type,
                //   label: action.label,
                //   disabled: action.disabled,
                //   hasOnClick: !!action.onClick
                // });

                if (action.type === "button") {
                  return (
                    <div key={index} className="group relative">
                      <button
                        className={cls(
                          "rounded-md bg-orange-500 px-2 py-1 text-xs text-white transition-colors hover:bg-orange-600",
                          action.disabled
                            ? "cursor-not-allowed bg-gray-400 opacity-50 hover:bg-gray-400"
                            : ""
                        )}
                        onClick={(e) => {
                          // console.log('버튼 클릭됨:', {
                          //   type: action.type,
                          //   label: action.label,
                          //   disabled: action.disabled
                          // });

                          // disabled일 때는 이벤트를 중단
                          if (action.disabled) {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log(
                              "버튼이 비활성화되어 있어 클릭 이벤트 무시됨"
                            );
                            return;
                          }

                          if (action.onClick) {
                            action.onClick();
                          }
                        }}
                        disabled={action.disabled}
                      >
                        {action.label}
                      </button>
                      {action.tooltip && (
                        <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 transform opacity-0 transition-opacity group-hover:opacity-100">
                          <div className="whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white">
                            {action.tooltip}
                            <div className="absolute left-1/2 top-full -mt-1 -translate-x-1/2 transform border-4 border-transparent border-t-gray-800"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                } else if (action.type === "link") {
                  return (
                    <div key={index} className="group relative">
                      <a
                        href={action.value}
                        className="px-2 py-1 text-xs text-blue-500 underline hover:text-blue-600"
                        onClick={(e) => {
                          if (action.onClick) {
                            e.preventDefault();
                            action.onClick();
                          }
                        }}
                      >
                        {action.label}
                      </a>
                      {action.tooltip && (
                        <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 transform opacity-0 transition-opacity group-hover:opacity-100">
                          <div className="whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white">
                            {action.tooltip}
                            <div className="absolute left-1/2 top-full -mt-1 -translate-x-1/2 transform border-4 border-transparent border-t-gray-800"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 약속 정보가 있는 경우 한국 시간으로 변환하여 표시
  const appointmentDateTime = appointmentData?.appointmentTime
    ? formatKoreanTime(appointmentData.appointmentTime)
    : { date: "", time: "" };

  return (
    <>
      {renderAppointmentModal()}
      <div
        className={cls(
          "flex items-end space-y-8",
          reversed ? "flex-row-reverse space-x-2 space-x-reverse" : "space-x-2"
        )}
      >
        <div className="flex-shrink-0">
          {avatar ? (
            <ImgComponent
              imgAdd={`https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_HASH}/${avatar}/public`}
              width={32}
              height={32}
              clsProps="rounded-full"
              imgName={name}
            />
          ) : (
            <ImgComponent
              imgAdd={`https:${gravatar.url("anonymous@email.com", {
                s: "32px",
                d: "retro",
              })}`}
              width={32}
              height={32}
              clsProps="rounded-full"
              imgName={"UserAvatar"}
            />
          )}
        </div>
        <div
          className={cls(
            "flex w-full flex-col items-start",
            reversed ? "flex-wrap-reverse space-x-0" : "space-x-0"
          )}
        >
          <span className="m-0 text-center text-[8px]">{name}</span>
          <div
            className={cls(
              reversed ? "flex-row-reverse space-x-1" : "space-x-1",
              "flex w-full flex-row items-end justify-start"
            )}
          >
            <div className="w-1/2 rounded-md border border-gray-300 p-2 text-sm text-gray-700">
              <p>{message}</p>

              {isAppointment && appointmentData && (
                <div className="mt-2 border-t border-gray-200 pt-2">
                  <div className="text-xs">
                    <span className="font-semibold">날짜:</span>{" "}
                    {appointmentDateTime.date}
                  </div>
                  <div className="text-xs">
                    <span className="font-semibold">시간:</span>{" "}
                    {appointmentDateTime.time}
                  </div>
                  <div className="text-xs">
                    <span className="font-semibold">장소:</span>{" "}
                    {appointmentData.place}
                  </div>

                  <div className="mt-2 flex flex-col space-y-1">
                    <button
                      onClick={handleShowAppointment}
                      className="rounded-full bg-gray-200 px-2 py-1 text-xs hover:bg-gray-300"
                    >
                      약속보기
                    </button>
                  </div>
                </div>
              )}
            </div>
            {actions && actions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {actions.map((action, index) => {
                  if (action.type === "button") {
                    return (
                      <div key={index} className="group relative">
                        <button
                          className={cls(
                            "rounded-md px-2 py-1 text-xs text-white transition-colors",
                            action.disabled
                              ? "cursor-not-allowed bg-gray-400 opacity-50 hover:bg-gray-400"
                              : "bg-orange-500 hover:bg-orange-600"
                          )}
                          onClick={action.disabled ? undefined : action.onClick} // disabled일 때 onClick을 완전히 제거
                          disabled={action.disabled}
                        >
                          {action.label}
                        </button>
                        {action.tooltip && action.disabled && (
                          <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 transform opacity-0 transition-opacity group-hover:opacity-100">
                            <div className="whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white">
                              {action.tooltip}
                              <div className="absolute left-1/2 top-full -mt-1 -translate-x-1/2 transform border-4 border-transparent border-t-gray-800"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  } else if (action.type === "link") {
                    return (
                      <div key={index} className="group relative">
                        <a
                          href={action.value}
                          className="px-2 py-1 text-xs text-blue-500 underline hover:text-blue-600"
                          onClick={(e) => {
                            if (action.onClick) {
                              e.preventDefault();
                              action.onClick();
                            }
                          }}
                        >
                          {action.label}
                        </a>
                        {action.tooltip && (
                          <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 transform opacity-0 transition-opacity group-hover:opacity-100">
                            <div className="whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white">
                              {action.tooltip}
                              <div className="absolute left-1/2 top-full -mt-1 -translate-x-1/2 transform border-4 border-transparent border-t-gray-800"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            )}
            {date && (
              <div className={cls("w-fit", reversed ? "px-1" : "")}>
                <TimeFormat date={date} className="text-xs text-gray-500" />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
