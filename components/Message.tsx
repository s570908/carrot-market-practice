import { cls } from "@libs/utils";
import Image from "next/image";
import ImgComponent from "@components/ImgComponent";
import TimeFormat from "@components/TimeFormat";
import RegDate from "@components/RegDate";
import gravatar from "gravatar";
import { useState } from "react"; 
import dayjs from "dayjs";
import 'dayjs/locale/ko'; // Import Korean locale
import { useAwaitableModal } from "@libs/client/useAwaitableModal";
import AppointmentModal from "./AppointmentModal";
import { MessageType } from "@prisma/client";

interface MessageProps {
  message: string;
  reversed?: boolean;
  name: string;
  avatar?: string | null;
  date?: Date | string;
  isAppointment?: boolean;
  appointmentData?: {
    appointmentTime: Date; // Single UTC datetime string
    place: string;
    latitude?: number;
    longitude?: number;
  };
  messageType?: MessageType; // 메시지 타입 추가
  actions?: {
    type: 'button' | 'link';
    label: string;
    value: string;
    onClick?: () => void;
  }[];
}

export default function Message({
  message,
  reversed,
  name,
  avatar,
  date,
  isAppointment = false,
  appointmentData,
  messageType = MessageType.USER, // 기본값 설정
  actions,
}: MessageProps) {
  const { openModal: openAppointmentModal, renderModal: renderAppointmentModal } = useAwaitableModal(
    (modal, params) => <AppointmentModal modal={modal} params={params} />
  );

  const handleShowAppointment = async () => {
    if (!appointmentData) return;
    await openAppointmentModal({
      appointmentTime: appointmentData.appointmentTime,
      place: appointmentData.place,
      latitude: appointmentData.latitude || 0,
      longitude: appointmentData.longitude || 0,
    });
  };

  // 시스템 메시지 처리 로직 추가
  if (messageType === MessageType.SYSTEM) {
    return (
      <div className="flex justify-center my-3">
        <div className="px-4 py-2 text-sm bg-gray-100 rounded-2xl text-gray-700 shadow-sm max-w-[80%]">
          <span>{message}</span>
          
          {/* 액션 버튼 렌더링 */}
          {actions && actions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {actions.map((action, index) => {
                if (action.type === 'button') {
                  return (
                    <button 
                      key={index}
                      className="px-2 py-1 text-xs text-white transition-colors bg-orange-500 rounded-md hover:bg-orange-600"
                      onClick={action.onClick}
                    >
                      {action.label}
                    </button>
                  );
                } else if (action.type === 'link') {
                  return (
                    <a 
                      key={index}
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
            <div className="w-1/2 p-2 text-sm text-gray-700 border border-gray-300 rounded-md">
              <p>{message}</p>
              
              {isAppointment && appointmentData && (
                <div className="pt-2 mt-2 border-t border-gray-200">
                  <div className="text-xs">
                    <span className="font-semibold">날짜:</span> {
                      dayjs(appointmentData.appointmentTime)
                        .locale('ko')
                        .format("M월 D일 (ddd)")
                    }
                  </div>
                  <div className="text-xs">
                    <span className="font-semibold">시간:</span> {
                      dayjs(appointmentData.appointmentTime)
                        .locale('ko')
                        .format("A h:mm")
                    }
                  </div>
                  <div className="text-xs">
                    <span className="font-semibold">장소:</span> {appointmentData.place}
                  </div>
                  
                  <div className="flex flex-col mt-2 space-y-1">
                    <button 
                      onClick={handleShowAppointment}
                      className="px-2 py-1 text-xs bg-gray-200 rounded-full hover:bg-gray-300"
                    >
                      약속보기
                    </button>
                  </div>
                </div>
              )}
            </div>
            {actions && actions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {actions.map((action, index) => {
                  if (action.type === 'button') {
                    return (
                      <button
                        key={index}
                        className="px-2 py-1 text-xs text-white transition-colors bg-orange-500 rounded-md hover:bg-orange-600"
                        onClick={action.onClick}
                      >
                        {action.label}
                      </button>
                    );
                  } else if (action.type === 'link') {
                    return (
                      <a 
                        key={index}
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
