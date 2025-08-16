//import useAwaitableModal from "@libs/client/useAwaitableModal";
import MapModal from "./MapModal";
import MapViewer from "@components/MapViewer";
import React, { useState, useEffect, useRef } from "react";
import DatePicker from "@components/DatePicker";
import TimePicker from "./TimePicker-kkh";
import { useAwaitableModal } from "@/libs/client/useAwaitableModal";
import dayjs from "dayjs";
import "dayjs/locale/ko"; // 한국어 로케일 추가 - 필수
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import AlarmTimeSelector from "./AlarmTimeSelector";
import { validatealarmTime } from "@/libs/utils";
import useUser from "@/libs/client/useUser";
import { TmapAddressInfo } from "@/types";
import type { ModalAPI } from "@/libs/client/useAwaitableModal";
import { useMutation } from "@tanstack/react-query"; // React Query import 추가
import { toast } from "react-toastify"; // Toast 알림을 위한 import
//import { initializePushSubscription } from "@libs/client/pushUtils";

// API 유형과 함수 임포트
import { ChatMeetupParams, ChatMeetupResponse } from "@/apiLibs/atypes";
import {
  writeChatMeetup,
  writeSystemMessage,
  SYSTEM_MESSAGES,
  createAlarmSettings,
  writeAlarmSettings,
  updateChatMeetup,
} from "@/apiLibs/chats";
import { initializePushSubscription } from "@/libs/client/pushUtils";
import axios from "axios";

interface AppointmentEditModalProps {
  modal: ModalAPI;
  params: {
    appointmentTime: Date;
    place: string;
    latitude: number;
    longitude: number;
  };
  chatRoomId: number; // 추가
  chatUsername?: string;
}

// dayjs 설정 - 컴포넌트 외부로 이동
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("ko");
dayjs.tz.setDefault("Asia/Seoul");

export default function AppointmentEditModal({
  modal,
  params,
  chatRoomId,
  chatUsername,
}: AppointmentEditModalProps) {
  const { user, isLoading: isUserLoading } = useUser();

  // 사용자 로딩 상태와 유효성 확인
  const [isUserAvailable, setIsUserAvailable] = useState(false);

  useEffect(() => {
    if (user && user.id) {
      setIsUserAvailable(true);
    } else if (!isUserLoading) {
      setIsUserAvailable(false);
    }
  }, [user, isUserLoading]);

  // 약속 생성용 useMutation 훅
  const {
    mutate: createMeetup,
    status,
    isPending,
    reset,
  } = useMutation<ChatMeetupResponse, Error, ChatMeetupParams>({
    mutationFn: writeChatMeetup, // 약속 생성 및 약속 메시지 생성
    onSuccess: async (responseData) => {
      try {
        console.log("약속 생성 성공:", responseData);
        if (responseData.chatMeetup?.appointmentTime) {
          // 시스템 메시지 추가 - 일반 생성 메시지
          try {
            // 이 시스템 메시지로 채팅창에서 다음의 UI를 만든다.
            // 예: 약속이 생성되었습니다. (5월 27일 오후 7:28)
            await writeSystemMessage({
              chatRoomId: chatRoomId,
              message: SYSTEM_MESSAGES.APPOINTMENT_CREATED(
                responseData.chatMeetup.appointmentTime
              ),
              userId: user?.id,
            });
          } catch (systemMessageError) {
            console.error("시스템 메시지 생성 실패:", systemMessageError);
          }
          // 알림 설정 및 관련 메시지 처리
          if (responseData.chatMeetup?.alarmTime && responseData.message?.id) {
            try {
              // 1. 동일 chatRoomId에 속한 가장 최근의 SCHEDULED AlarmSetting 조회
              let latestAlarm: any = null;
              try {
                const res = await axios.get(
                  `/api/chat/${chatRoomId}/alarm-settings/latest`
                );
                if (res.data?.alarm) {
                  latestAlarm = res.data.alarm;
                }
              } catch (fetchError) {
                console.warn("기존 알림 조회 중 오류:", fetchError);
              }

              // 2. 기존 SCHEDULED 알림이 있고 새로 생성될 알림과 다르면 취소
              if (
                latestAlarm &&
                latestAlarm.status === "SCHEDULED" &&
                latestAlarm.messageId !== responseData.message.id
              ) {
                try {
                  await axios.post(
                    `/api/chat/${chatRoomId}/alarm-settings/${latestAlarm.messageId}/cancel`,
                    {}
                  );
                  console.log(`기존 알림 취소됨: ${latestAlarm.id}`);
                } catch (cancelError) {
                  console.warn("기존 알림 취소 중 오류:", cancelError);
                }
              }

              // 3. 새 알림 생성
              const appointmentTime = new Date(
                responseData.chatMeetup.appointmentTime
              );
              const triggerAt = calculateTriggerTime(
                appointmentTime,
                responseData.chatMeetup.alarmTime
              );
              const utcTriggerAt = new Date(triggerAt.toISOString());
              await createAlarmSettings({
                chatId: chatRoomId,
                messageId: responseData.message.id,
                alarmTime: responseData.chatMeetup.alarmTime,
                triggerAt: utcTriggerAt.toISOString(),
                disableAlarm: false,
              });
              // 약속 생성 후 푸시 구독 상태 자동 갱신 시도 (만료된 구독 자동 복구)
              try {
                await initializePushSubscription();
              } catch (pushError) {
                console.warn("푸시 구독 자동 갱신 실패:", pushError);
              }
              console.log("알람 설정 완료 (알림 메시지 안내 없이)");
            } catch (alarmError) {
              console.error("알람 설정 중 오류 발생:", alarmError);
              toast?.error?.(
                "알람 설정에 실패했습니다. 채팅방에서 다시 설정해주세요."
              );
            }
          }
        }
        toast?.success?.("약속이 생성되었습니다!");

        // 모달만 닫기 (모달 컨텍스트이므로 router.back()은 사용하지 않음)
        modal.closeWithResult({ success: true });
        reset(); // 상태 초기화
      } catch (error) {
        console.error("약속 생성 후처리 중 전체 오류 발생:", error);
        toast?.error?.("약속은 생성되었으나 일부 기능에 문제가 발생했습니다.");
        modal.closeWithResult({ success: true, withError: true });
        reset(); // 상태 초기화
      }
    },
    onError: (error) => {
      console.error("약속 생성 중 오류 발생:", error);
      alert("약속 생성에 실패했습니다.");
      reset(); // 상태 초기화
    },
  });

  // 약속 수정용 useMutation 훅
  const {
    mutate: updateMeetup,
    status: updateStatus,
    isPending: isUpdatePending,
    reset: resetUpdate,
  } = useMutation<ChatMeetupResponse, Error, ChatMeetupParams>({
    mutationFn: updateChatMeetup,
    onSuccess: async (responseData) => {
      try {
        console.log("약속 수정 성공:", responseData);
        if (responseData.chatMeetup?.appointmentTime) {
          try {
            await writeSystemMessage({
              chatRoomId: chatRoomId,
              message: SYSTEM_MESSAGES.APPOINTMENT_UPDATED(
                responseData.chatMeetup.appointmentTime
              ),
              userId: user?.id,
            });
          } catch (systemMessageError) {
            console.error("시스템 메시지 생성 실패:", systemMessageError);
          }
          if (responseData.chatMeetup?.alarmTime && responseData.message?.id) {
            try {
              // 1. 동일 chatRoomId에 속한 가장 최근의 SCHEDULED AlarmSetting 조회
              let latestAlarm: any = null;
              try {
                const res = await axios.get(
                  `/api/chat/${chatRoomId}/alarm-settings/latest`
                );
                if (res.data?.alarm) {
                  latestAlarm = res.data.alarm;
                }
              } catch (fetchError) {
                console.warn("기존 알림 조회 중 오류:", fetchError);
              }

              // 2. 기존 SCHEDULED 알림이 있고 새로 생성될 알림과 다르면 취소
              if (
                latestAlarm &&
                latestAlarm.status === "SCHEDULED" &&
                latestAlarm.messageId !== responseData.message.id
              ) {
                try {
                  await axios.post(
                    `/api/chat/${chatRoomId}/alarm-settings/${latestAlarm.messageId}/cancel`,
                    {}
                  );
                  console.log(`기존 알림 취소됨: ${latestAlarm.id}`);
                } catch (cancelError) {
                  console.warn("기존 알림 취소 중 오류:", cancelError);
                }
              }

              // 3. 새 알림 생성
              const appointmentTime = new Date(
                responseData.chatMeetup.appointmentTime
              );
              const triggerAt = calculateTriggerTime(
                appointmentTime,
                responseData.chatMeetup.alarmTime
              );
              const utcTriggerAt = new Date(triggerAt.toISOString());
              await createAlarmSettings({
                chatId: chatRoomId,
                messageId: responseData.message.id,
                alarmTime: responseData.chatMeetup.alarmTime,
                triggerAt: utcTriggerAt.toISOString(),
                disableAlarm: false,
              });
              try {
                await initializePushSubscription();
              } catch (pushError) {
                console.warn("푸시 구독 자동 갱신 실패:", pushError);
              }
              console.log("알람 설정 완료 (알림 메시지 안내 없이)");
            } catch (alarmError) {
              console.error("알람 설정 중 오류 발생:", alarmError);
              toast?.error?.(
                "알람 설정에 실패했습니다. 채팅방에서 다시 설정해주세요."
              );
            }
          }
        }
        toast?.success?.("약속이 수정되었습니다!");
        modal.closeWithResult({ success: true });
        resetUpdate();
      } catch (error) {
        console.error("약속 수정 후처리 중 전체 오류 발생:", error);
        toast?.error?.("약속은 수정되었으나 일부 기능에 문제가 발생했습니다.");
        modal.closeWithResult({ success: true, withError: true });
        resetUpdate();
      }
    },
    onError: (error) => {
      console.error("약속 수정 중 오류 발생:", error);
      alert("약속 수정에 실패했습니다.");
      resetUpdate();
    },
  });

  // 로딩 및 오류 상태
  const isLoading = isUserLoading || isPending;
  const isDisabled = isLoading || !isUserAvailable || !user;

  //console.log("AppointmentEditModal--params:", params);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState<string>(params.place);
  const [alarmTime, setAlarmTime] = useState("30분 전");
  const [changed, setChanged] = useState(false);

  const [selectedLocationByAddressInfo, setSelectedLocationByAddressInfo] =
    useState<{
      latitude: number;
      longitude: number;
      addressInfo: TmapAddressInfo;
      selectedAddress: string | null;
      locationName: string;
    } | null>({
      latitude: params.latitude,
      longitude: params.longitude,
      addressInfo: {} as TmapAddressInfo, // 기본값으로 빈 객체
      selectedAddress: params.place,
      locationName: params.place,
    });

  const selectedLocation = selectedLocationByAddressInfo;
  //console.log("AppointmentEditModal--selectedLocation:", selectedLocation);

  const { openModal: openMapModal, renderModal } = useAwaitableModal(
    (modal, params) => {
      // console.log("MapModal renderModal called with params:", params);
      // console.log("modal.isVisible:", modal.isVisible);

      return (
        <MapModal
          isOpen={modal.isVisible}
          initialLocation={params}
          onClose={() => modal.closeWithResult(null)}
          onLocationSelectAddressInfo={(
            latitude: number,
            longitude: number,
            addressInfo: TmapAddressInfo | null,
            selectedAddress: string | null
          ) =>
            modal.closeWithResult({
              latitude,
              longitude,
              addressInfo,
              selectedAddress,
            })
          }
        />
      );
    }
  );

  // 트리거 시간 계산 함수 (create.tsx에서 가져옴)
  const calculateTriggerTime = (appointmentTime: Date, alarmTime: string) => {
    const triggerTime = new Date(appointmentTime);

    switch (alarmTime) {
      case "10분 전":
        triggerTime.setMinutes(triggerTime.getMinutes() - 10);
        break;
      case "30분 전":
        triggerTime.setMinutes(triggerTime.getMinutes() - 30);
        break;
      case "1시간 전":
        triggerTime.setHours(triggerTime.getHours() - 1);
        break;
      case "1일 전":
        triggerTime.setDate(triggerTime.getDate() - 1);
        break;
    }

    return triggerTime;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 사용자 정보 확인
    if (!isUserAvailable || !user || !user.id) {
      alert("사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.");
      return;
    }

    // chatRoomId 확인 - 필수 필드 검증
    if (!chatRoomId) {
      console.error("채팅방 ID가 없습니다.");
      alert("채팅방 정보를 찾을 수 없습니다. 다시 시도해주세요.");
      return;
    }

    // 현재 값들 가져오기 (변경되지 않았으면 원본 값 사용)
    console.log(
      "handleSubmit--params.appointmentTime 타입:",
      typeof params.appointmentTime
    );
    console.log(
      "handleSubmit--params.appointmentTime 값:",
      params.appointmentTime
    );

    // 현재 값들 가져오기 (변경되지 않았으면 원본 값 사용)
    console.log(
      "handleSubmit--params.appointmentTime 타입:",
      typeof params.appointmentTime
    );
    console.log(
      "handleSubmit--params.appointmentTime 값:",
      params.appointmentTime
    );

    // 날짜 객체 확인 및 변환 보장
    let appointmentTimeDate = params.appointmentTime;
    // 만약 문자열이라면 Date 객체로 변환
    if (typeof appointmentTimeDate === "string") {
      appointmentTimeDate = new Date(appointmentTimeDate);
    }

    // 유효한 Date 객체 확인
    // 유효한 Date 객체 확인
    if (
      !(appointmentTimeDate instanceof Date) ||
      isNaN(appointmentTimeDate.getTime())
    ) {
      console.error(
        "Invalid appointmentTime:",
        appointmentTimeDate,
        " 현재 날짜로 대체합니다."
      );
      // 현재 날짜로 대체
      // 현재 날짜로 대체
      appointmentTimeDate = new Date();
    }

    // 타입 및 시간대 분석을 위한 디버깅 로그 추가
    // 1. API 백업 값의 타입과 형식 확인
    const backupDate = formatDateToString(appointmentTimeDate); // YYYY-MM-DD 형식
    console.log("API 백업 날짜:", backupDate, "타입:", typeof backupDate);

    const backupTime = getKoreanTimeString(appointmentTimeDate); // HH:mm 형식
    console.log("API 백업 시간:", backupTime, "타입:", typeof backupTime);

    // 2. 사용자 입력 값의 타입과 형식 확인
    console.log("사용자 입력 날짜:", date, "타입:", typeof date);
    console.log("사용자 입력 시간:", time, "타입:", typeof time);

    // API 요청용 표준 형식 날짜와 시간 (YYYY-MM-DD, HH:MM)
    const finalDate = date || backupDate;
    const finalTime = time || backupTime;

    console.log("최종 날짜:", finalDate, "타입:", typeof finalDate);
    console.log("최종 시간:", finalTime, "타입:", typeof finalTime);

    const finalLocation = selectedLocationByAddressInfo || {
      latitude: params.latitude,
      longitude: params.longitude,
      selectedAddress: params.place,
    };

    // 유효성 검사
    if (!finalDate) {
      alert("날짜를 선택해주세요.");
      return;
    }

    if (!finalTime) {
      alert("시간을 선택해주세요.");
      return;
    }

    if (!finalLocation) {
      alert("장소를 선택해주세요.");
      return;
    }

    // 날짜와 시간을 결합하여 Date 객체 생성
    try {
      // 형식 검증
      if (!finalDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        console.warn(`날짜 형식이 잘못되었습니다: ${finalDate}`);
      }

      if (!finalTime.match(/^\d{2}:\d{2}$/)) {
        console.warn(`시간 형식이 잘못되었습니다: ${finalTime}`);
      }

      // 날짜와 시간 결합
      const localDateTimeStr = `${finalDate}T${finalTime}`;
      console.log("날짜+시간 문자열:", localDateTimeStr);
      console.log("날짜+시간 문자열:", localDateTimeStr);

      // 명시적으로 한국 시간대로 처리 후 Date 객체로 변환
      const localDateTimeDayjs = dayjs.tz(localDateTimeStr, "Asia/Seoul");
      console.log("Dayjs로 변환 (한국시간):", localDateTimeDayjs.format());

      const localDateTime = localDateTimeDayjs.toDate();
      console.log("변환된 Date 객체:", localDateTime);
      console.log("ISO 문자열:", localDateTime.toISOString());
      console.log("변환된 Date 객체:", localDateTime);
      console.log("ISO 문자열:", localDateTime.toISOString());

      // 현재 시간 (브라우저의 로컬 시간)
      const now = new Date();
      // triggerAt 계산
      const triggerAt = calculateTriggerTime(localDateTime, alarmTime);
      const utcTriggerAt = new Date(triggerAt.toISOString());

      // 최종 알림 시간 결정 로직
      let finalalarmTime = alarmTime;

      // 약속시간이 과거인 경우 메시지 수정
      if (localDateTime < now) {
        const proceed = confirm(
          "선택하신 약속 시간이 이미 지났습니다.\n그래도 새로운 약속을 생성하시겠습니까?\n\n(과거의 약속에는 알림이 설정되지 않습니다)"
        );
        if (!proceed) return; // 사용자가 "취소"를 누르면 여기서 함수가 종료됨
        finalalarmTime = "알림 없이 생성";
      }
      // 미래 시간이지만 현재 알림 시간이 유효하지 않은 경우 메시지 수정
      else if (alarmTime !== "알림 없이 생성") {
        const { isValid } = validatealarmTime(localDateTime, alarmTime);
        if (!isValid) {
          // triggerAt이 과거인 경우 등
          const proceed = confirm(
            `현재 약속 시간으로는 "${alarmTime}" 알림을 설정할 수 없습니다.\n알림 없이 새 약속을 생성하시겠습니까?`
          );
          if (!proceed) return; // 사용자가 "취소"를 누르면 여기서 함수가 종료됨
          finalalarmTime = "알림 없이 생성";
        }
      }

      const newAppointmentData = {
        chatRoomId: Number(chatRoomId), // 명시적으로 숫자로 변환
        appointmentTime: localDateTime,
        place: finalLocation.selectedAddress ?? location,
        locationLatitude: finalLocation.latitude,
        locationLongitude: finalLocation.longitude,
        alarmTime: finalalarmTime === "알림 없이 생성" ? null : finalalarmTime,
      };

      const isChanged: boolean = isAppointmentChanged(
        params,
        newAppointmentData
      );

      // 변경 여부 판단 (params: 기존 데이터, newAppointmentData: 새 데이터)
      setChanged(isChanged);
      console.log("약속 변경됨?", changed);

      // React Query의 useMutation으로 약속 생성 API 호출
      if (isChanged) {
        updateMeetup(newAppointmentData);
      }
    } catch (error) {
      console.error("약속 생성 중 오류 발생:", error);
      alert(
        error instanceof Error
          ? error.message
          : "약속 생성에 실패했습니다. 다시 시도해주세요."
      );
    }
  };

  const handleLocationIconClick = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    try {
      console.log(
        "handleLocationIconClick openMapModal 호출 - selectedLocation:",
        selectedLocation
      );
      const result = await openMapModal(selectedLocation);
      console.log("handleLocationIconClick MapModal result:", result);

      if (result) {
        const {
          latitude,
          longitude,
          addressInfo,
          selectedAddress,
          locationName,
        } = result;
        setSelectedLocationByAddressInfo({
          latitude,
          longitude,
          addressInfo,
          selectedAddress,
          locationName,
        });
        // location input도 함께 업데이트
        setLocation(selectedAddress || locationName || "");
      }
    } catch (error) {
      console.error("Error opening modal:", error);
    }
  };

  const handleCancel = () => {
    reset();
    modal.closeWithResult(null);
  };

  // 날짜를 "M월 D일 요일" 형식의 한국어 문자열로 변환하는 함수
  const formatDateToKoreanDay = (date: Date | null): string => {
    // 유효한 Date 객체가 아니면 빈 문자열 반환
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return "";
    }

    // dayjs를 사용해 한국 시간대로 변환 및 포맷팅
    try {
      return dayjs(date).tz("Asia/Seoul").format("M월 D일 dddd");
    } catch (error) {
      console.error("날짜 포맷팅 오류:", error);
      return "";
    }
  };

  // 시간을 "오전/오후 HH시 MM분" 형식의 한국어 문자열로 변환하는 함수
  const formatDateToKoreanTime = (date: Date | null): string => {
    // 유효한 Date 객체가 아니면 빈 문자열 반환
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return "";
    }

    // dayjs를 사용해 한국 시간대와 한국어 로케일로 변환 및 포맷팅
    try {
      // 한국어 로케일은 이미 설정되어 있으므로(dayjs.locale("ko"))
      // a 포맷을 사용하면 한글로 '오전'/'오후' 표시됨
      return dayjs(date).tz("Asia/Seoul").format("a h시 mm분");
    } catch (error) {
      console.error("시간 포맷팅 오류:", error);
      return "";
    }
  };

  // params.appointmentTime을 한국시간 HH:MM 형식으로 변환
  const getKoreanTimeString = (date: Date | null | undefined): string => {
    // 문자열이라면 Date 객체로 변환
    let dateObj: Date | null = null;

    if (typeof date === "string") {
      dateObj = new Date(date);
    } else if (date instanceof Date) {
      dateObj = date;
    } else if (params.appointmentTime instanceof Date) {
      dateObj = params.appointmentTime;
    } else if (typeof params.appointmentTime === "string") {
      dateObj = new Date(params.appointmentTime);
    } else {
      dateObj = new Date();
    }

    if (!dateObj || isNaN(dateObj.getTime())) {
      console.warn("유효하지 않은 날짜 객체. 현재 시간을 사용합니다.");
      dateObj = new Date();
    }

    try {
      // dayjs를 사용해 한국 시간대로 변환하고 HH:MM 형식으로 추출
      return dayjs(dateObj).tz("Asia/Seoul").format("HH:mm");
    } catch (error) {
      console.error("Error converting date to Korean time:", error);
      return dayjs().tz("Asia/Seoul").format("HH:mm"); // 현재 시간 반환
    }
  };

  // 현재 약속 시간을 Date 객체로 변환하는 함수
  const getCurrentAppointmentTime = (): Date => {
    // 날짜나 시간이 변경되었다면 새로운 Date 객체 생성
    if (date || time) {
      const baseDate = date ? new Date(date) : new Date(params.appointmentTime);
      if (time) {
        const [hours, minutes] = time.split(":").map(Number);
        baseDate.setHours(hours, minutes, 0, 0);
      }
      return baseDate;
    }

    // 변경사항이 없다면 원본 appointmentTime 사용 (문자열이면 Date로 변환)
    const appointmentTime =
      typeof params.appointmentTime === "string"
        ? new Date(params.appointmentTime)
        : params.appointmentTime;

    return appointmentTime;
  };

  // 날짜를 YYYY-MM-DD 형식의 문자열로 변환하는 함수 (한국 시간대 기준)
  const formatDateToString = (date: Date | null): string => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) return "";
    // UTC ISO 문자열 대신 한국 시간대 기준으로 변환
    return dayjs(date).tz("Asia/Seoul").format("YYYY-MM-DD");
  };

  /*
약속 수정용 useMutation 훅의 알고리즘 상세 설명

1. useMutation 훅 정의
   - updateMeetup: 약속 수정 요청을 트리거하는 함수
   - status, isUpdatePending, resetUpdate: 상태 관리 변수

2. mutationFn
   - 인자로 { chatRoomId, params }를 받아 updateChatMeetup(chatRoomId, params) 호출
   - updateChatMeetup은 /api/chat-meetups/[id]에 POST 요청을 보내 약속을 수정

3. onSuccess(responseData)
   - 약속 수정이 성공하면 실행
   - 1) 약속 데이터가 있으면 시스템 메시지(약속이 생성되었습니다)를 생성
   - 2) 알림 시간이 있고 메시지 id가 있으면:
      - a) 알림 트리거 시간 계산
      - b) createAlarmSettings로 알림 설정(서버에 POST)
      - c) 푸시 구독 상태 자동 갱신 시도
   - 3) 성공 토스트 메시지 출력
   - 4) 모달 닫기 및 상태 초기화

4. onError
   - 약속 수정 중 에러 발생 시 에러 메시지 출력 및 상태 초기화

정리:
- updateMeetup({ chatRoomId, params })를 호출하면
  1. 서버에 약속 수정 요청
  2. 성공 시 시스템 메시지, 알림 설정, 푸시 구독 갱신 등 후처리
  3. 실패 시 에러 처리 및 상태 초기화
  */

  // 기존 약속과 새 약속의 변경 여부를 판단하는 함수
  function isAppointmentChanged(original: any, updated: any) {
    // 시간 비교 (1분 이상 차이)
    const timeChanged =
      Math.abs(
        new Date(original.appointmentTime).getTime() -
          new Date(updated.appointmentTime).getTime()
      ) > 60000;
    // 장소 비교
    const placeChanged = original.place !== updated.place;
    // 위치 비교 (소수점 4자리까지)
    const latitudeChanged =
      Math.abs(
        Number(original.latitude ?? original.locationLatitude) -
          Number(updated.locationLatitude)
      ) > 0.0001;
    const longitudeChanged =
      Math.abs(
        Number(original.longitude ?? original.locationLongitude) -
          Number(updated.locationLongitude)
      ) > 0.0001;
    // 알림 비교
    const alarmChanged =
      (original.alarmTime ?? null) !== (updated.alarmTime ?? null);

    // 각 변경 여부를 콘솔에 출력
    console.log("시간 변경됨:", timeChanged);
    console.log("장소 변경됨:", placeChanged);
    console.log("위도 변경됨:", latitudeChanged);
    console.log("경도 변경됨:", longitudeChanged);
    console.log("알림 변경됨:", alarmChanged);

    // 하나라도 변경되었으면 true 반환
    return (
      timeChanged ||
      placeChanged ||
      latitudeChanged ||
      longitudeChanged ||
      alarmChanged
    );
  }

  useEffect(() => {
    // params에서 가져온 값과 현재 값 비교
    // date와 time은 params.appointmentTime에서 파생
    let isDateChanged = false;
    let isTimeChanged = false;
    if (date) {
      const appointmentTime = params.appointmentTime;
      // 항상 한국시간 기준으로 변환
      const paramsDateStr = dayjs(appointmentTime)
        .tz("Asia/Seoul")
        .format("YYYY-MM-DD");
      console.log("date: ", date);
      console.log("paramsDateStr: ", paramsDateStr);
      isDateChanged = date !== paramsDateStr;
    }
    if (time) {
      const appointmentTime = params.appointmentTime;
      // 항상 한국시간 기준으로 변환
      const paramsTimeStr = dayjs(appointmentTime)
        .tz("Asia/Seoul")
        .format("HH:mm");
      console.log("time: ", time);
      console.log("paramsTimeStr:", paramsTimeStr);
      isTimeChanged = time !== paramsTimeStr;
    }

    console.log("location: ", location);
    console.log("params.place: ", params.place);
    const isLocationChanged = location !== params.place;
    // alarmTime은 params에 없으므로 초기값("30분 전")과 비교

    console.log("alarmTime: ", alarmTime);
    const isAlarmTimeChanged = alarmTime !== "30분 전";

    setChanged(
      isDateChanged || isTimeChanged || isLocationChanged || isAlarmTimeChanged
    );
  }, [date, time, location, alarmTime, params.appointmentTime, params.place]);

  return (
    <>
      {renderModal()}
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black opacity-50"
          onClick={() => modal.closeWithResult(null)}
        ></div>
        <div className="z-10 max-h-[95vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
          <h2 className="mb-5 text-center text-lg font-medium">
            {chatUsername ? `${chatUsername} 약속` : "상대방과의 약속"}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <DatePicker
                  value={
                    params.appointmentTime
                      ? formatDateToString(new Date(params.appointmentTime))
                      : ""
                  }
                  onChange={(newDate) => setDate(newDate)}
                />
              </div>
              <div className="flex items-center justify-between">
                <TimePicker
                  value={getKoreanTimeString(params.appointmentTime)}
                  onChange={(timeStr: string) => {
                    if (timeStr) {
                      setTime(timeStr);
                    }
                  }}
                />
              </div>
              <div>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 bg-transparent p-0.5"
                    onClick={handleLocationIconClick}
                    tabIndex={-1}
                    aria-label="장소 검색"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 21c-4.418 0-8-4.03-8-9a8 8 0 1116 0c0 4.97-3.582 9-8 9z"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="3"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="mt-4 w-full overflow-hidden rounded-lg shadow-md">
                <MapViewer
                  lat={
                    selectedLocationByAddressInfo?.latitude || params.latitude
                  }
                  lng={
                    selectedLocationByAddressInfo?.longitude || params.longitude
                  }
                  height="300px"
                  width="100%"
                  zoomLevel={15}
                  name={
                    selectedLocationByAddressInfo?.selectedAddress ||
                    params.place
                  }
                  containerClassName="w-full"
                />
              </div>

              <AlarmTimeSelector
                value={alarmTime}
                onChange={setAlarmTime}
                appointmentTime={getCurrentAppointmentTime()}
              />
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 rounded-md border border-gray-300 bg-gray-100 py-2 font-medium text-gray-700 hover:bg-gray-200"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isDisabled}
                className="flex-1 rounded-md bg-orange-500 py-2 font-medium text-white hover:bg-orange-600 disabled:opacity-50"
              >
                {isUserLoading
                  ? "사용자 정보 로딩 중..."
                  : !isUserAvailable
                  ? "로그인이 필요합니다"
                  : status === "pending"
                  ? "생성 중..."
                  : changed
                  ? "수정 완료"
                  : "완료"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

/*
알림 트리거 시간 계산이 필요한 이유

- 알림(AlarmSetting)은 "약속 시간"이 아니라, "약속 시간 몇 분/몇 시간/며칠 전"에 울려야 합니다.
- 예를 들어, 약속이 2024-06-10 15:00이고, 알림이 "30분 전"이면 실제 알림이 울려야 할 시간은 2024-06-10 14:30입니다.
- 따라서, 사용자가 선택한 alarmTime("10분 전", "30분 전" 등)과 appointmentTime(약속 시간)으로
  실제로 알림이 울릴 정확한 시각(triggerAt)을 계산해야 합니다.
- 이 triggerAt 값이 DB에 저장되고, node-schedule 등에서 알림 예약의 기준이 됩니다.

정리:
- 알림 트리거 시간 계산은 "언제 알림을 울릴지"를 정확히 결정하기 위해 반드시 필요합니다.
*/
