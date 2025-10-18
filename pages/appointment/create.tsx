import DatePicker from "@components/DatePicker";
import Layout from "@components/Layout";
import MapModal from "@components/MapModal";
import MapViewer from "@components/MapViewer";
import TimePicker from "@components/TimePicker-kkh";
import { useAwaitableModal } from "@libs/client/useAwaitableModal";
import useUser from "@libs/client/useUser";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TmapAddressInfo } from "@/types";
import { ChatMeetupParams, ChatMeetupResponse } from "@/apiLibs/atypes";
import {
  writeChatMeetup,
  writeSystemMessage,
  SYSTEM_MESSAGES,
  createAlarmSettings,
  getChat,
} from "@/apiLibs/chats";
import dayjs from "dayjs";
import { toast } from "react-toastify";

interface SelectedLocation {
  latitude: number;
  longitude: number;
  address: string;
}

const CreateAppointment = () => {
  const { user } = useUser();
  const router = useRouter();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const [selectedLocationByAddressInfo, setSelectedLocationByAddressInfo] =
    useState<{
      latitude: number;
      longitude: number;
      addressInfo: TmapAddressInfo;
      selectedAddress: string | null;
      locationName: string;
    } | null>(null);

  const selectedLocation = selectedLocationByAddressInfo;
  //console.log("create--Selected location:", selectedLocation);

  const [alarmTime, setAlarmTime] = useState("30분 전");

  const chatRoomId = Number(router.query.chatRoomId); // 숫자로 변환
  //console.log("CreateAppointment--chatRoomId:", chatRoomId);

  // React Query로 데이터 가져오기
  const { data, isLoading, error } = useQuery({
    queryKey: ["chatRoom", chatRoomId],
    queryFn: () => getChat(chatRoomId),
    enabled: !!chatRoomId, // chatRoomId가 유효할 때만 실행
  });

  const otherName =
    data?.chatRoomOfSeller?.buyerId === user?.id
      ? data?.chatRoomOfSeller?.seller?.name
      : data?.chatRoomOfSeller?.buyer?.name;

  // useMutation 훅 설정
  const { mutate: createMeetup, status } = useMutation<
    ChatMeetupResponse,
    Error,
    ChatMeetupParams
  >({
    mutationFn: writeChatMeetup, // 약속 생성 맟 약속 메시지 생성
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
            // 시스템 메시지 실패는 치명적이지 않으므로 계속 진행
          }

          // 알림 설정 및 관련 메시지 처리
          // if (responseData.chatMeetup?.alarmTime && responseData.message?.id) {
          //   try {
          //     // 알람 메시지 안내 및 알림설정 메시지 생성 코드 전체 제거
          //     // 알람 설정 메시지 없이 바로 알람만 설정
          //     const appointmentTime = new Date(responseData.chatMeetup.appointmentTime);
          //     const triggerAt = calculateTriggerTime(appointmentTime, responseData.chatMeetup.alarmTime);
          //     const utcTriggerAt = new Date(triggerAt.toISOString());

          //     await createAlarmSettings({
          //       chatId: chatRoomId,
          //       messageId: responseData.message.id,
          //       alarmTime: responseData.chatMeetup.alarmTime,
          //       triggerAt: utcTriggerAt.toISOString(),
          //       disableAlarm: false
          //     });

          //     console.log("알람 설정 완료 (알림 메시지 안내 없이)");
          //   } catch (alarmError) {
          //     console.error("알람 설정 중 오류 발생:", alarmError);
          //     toast.error("알람 설정에 실패했습니다. 채팅방에서 다시 설정해주세요.");
          //   }
          // }
        }

        // 성공 메시지 표시
        toast.success("약속이 생성되었습니다!");

        // 페이지A → 채팅방 → 약속생성 → 채팅방 흐름으로 수정
        // 약속 생성 후 채팅방으로 돌아가기 (페이지A로 바로 이동하지 않음)
        router.back(); // 채팅방으로 돌아감 (뒤로가기)
      } catch (error) {
        console.error("약속 생성 후처리 중 전체 오류 발생:", error);
        // 전체적인 실패 시 사용자에게 알림
        toast.error("약속은 생성되었으나 일부 기능에 문제가 발생했습니다.");

        // 심각한 오류라도 채팅방으로는 돌아가도록 함
        router.back();
      }
    },
    onError: (error) => {
      console.error("약속 생성 중 오류 발생:", error);
      alert("약속 생성에 실패했습니다.");
    },
  });

  // useAwaitableModal을 사용하여 MapModal 컴포넌트를 렌더링
  // params를 initialLocation으로 전달하여 모달이 열릴 때 초기 위치 정보를 설정
  const { openModal: openMapModal, renderModal } = useAwaitableModal(
    (modal, params) => {
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

  const handleOpenModal = async (e?: React.MouseEvent) => {
    // 이벤트가 있는 경우 기본 동작 방지 (폼 제출 방지)
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    try {
      // location 정보를 인자로 전달하여 MapModal이 초기화될 때 이 정보를 사용하도록 함
      //console.log("openMapModal 직전--location:", selectedLocation);
      const result = await openMapModal(selectedLocation);
      //console.log("Modal closed--result: ", result);
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
      } else {
        //console.log("Modal closed without selecting a location.");
        // 선택된 위치를 초기화하지 않도록 수정 (기존 위치 유지)
        // setSelectedLocationByAddressInfo(null);
      }
    } catch (error) {
      console.error("Error opening modal:", error);
    }
  };

  // 선택한 장소 초기화
  const handleClearLocation = () => {
    setSelectedLocationByAddressInfo(null);
  };

  const validatealarmTime = (appointmentTime: Date, alarmTime: string) => {
    // 알림 없이 생성 옵션이면 항상 유효
    if (alarmTime === "알림 없이 생성") {
      return {
        isValid: true,
        timeDiffInMinutes: 0,
        alertTriggerTime: new Date(),
      };
    }

    const now = new Date();
    // 약속 시간과 현재 시간의 차이를 먼저 계산
    const appointmentDiffInMinutes = Math.floor(
      (appointmentTime.getTime() - now.getTime()) / (1000 * 60)
    );

    // 알림 시간(분)을 계산
    let alertMinutesBefore = 0;
    switch (alarmTime) {
      case "10분 전":
        alertMinutesBefore = 10;
        break;
      case "30분 전":
        alertMinutesBefore = 30;
        break;
      case "1시간 전":
        alertMinutesBefore = 60;
        break;
      case "1일 전":
        alertMinutesBefore = 1440;
        break; // 24시간 * 60분
    }

    // 알림이 가능한지 확인: 약속시간까지 남은 시간이 알림 시간보다 크거나 같아야 함
    const isValid = appointmentDiffInMinutes >= alertMinutesBefore;

    // 알림 발송 시간 계산
    const alertTriggerTime = new Date(
      appointmentTime.getTime() - alertMinutesBefore * 60 * 1000
    );
    const timeDiffInMinutes = Math.floor(
      (alertTriggerTime.getTime() - now.getTime()) / (1000 * 60)
    );

    return {
      isValid,
      timeDiffInMinutes,
      alertTriggerTime,
    };
  };

  // 알림 시간 선택 컴포넌트를 동적으로 렌더링
  const AlarmTimeSelector = ({
    value,
    onChange,
    appointmentTime,
  }: {
    value: string;
    onChange: (time: string) => void;
    appointmentTime: Date;
  }) => {
    const baseAlertOptions = [
      { label: "30분 전", value: "30분 전" },
      { label: "10분 전", value: "10분 전" },
      { label: "1시간 전", value: "1시간 전" },
      { label: "1일 전", value: "1일 전" },
      { label: "알림 없이 생성", value: "알림 없이 생성" },
    ];

    // 날짜와 시간이 모두 선택되었는지 확인
    const isDateTimeSelected = !isNaN(appointmentTime.getTime());

    // 각 옵션의 유효성을 검사하고 유효한 것부터 정렬
    const sortedOptions = baseAlertOptions
      .map((option) => {
        if (option.value === "알림 없이 생성") {
          return { ...option, disabled: false, warning: false, isValid: true };
        }
        const { isValid, timeDiffInMinutes } = validatealarmTime(
          appointmentTime,
          option.value
        );
        return {
          ...option,
          disabled: isDateTimeSelected ? !isValid : false,
          warning: isDateTimeSelected && timeDiffInMinutes < 30 && isValid,
          isValid,
        };
      })
      .sort((a, b) => {
        // 유효한 옵션을 먼저 정렬
        if (a.isValid && !b.isValid) return -1;
        if (!a.isValid && b.isValid) return 1;
        return 0;
      });

    // 현재 선택된 값이 무효하면 첫 번째 유효한 옵션으로 자동 변경
    useEffect(() => {
      if (isDateTimeSelected) {
        const currentOption = sortedOptions.find((opt) => opt.value === value);
        if (currentOption?.disabled) {
          const firstValidOption = sortedOptions.find((opt) => !opt.disabled);
          if (firstValidOption) {
            onChange(firstValidOption.value);
          }
        }
      }
    }, [isDateTimeSelected, onChange, sortedOptions, value]);

    // "알림 없이 생성"을 제외한 옵션 중 하나라도 enabled라면 안내 메시지 표시하지 않음
    const allExceptNoneDisabled =
      isDateTimeSelected &&
      sortedOptions
        .filter((opt) => opt.value !== "알림 없이 생성")
        .every((opt) => opt.disabled);

    return (
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-700">약속 알림</span>
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-2/3 rounded-md border border-gray-300 px-3 py-2 text-gray-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            title="알림 시간을 선택하세요"
          >
            <option value="" disabled hidden className="text-gray-500">
              알림 시간을 선택하세요
            </option>
            {sortedOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className={`
                  ${
                    option.disabled
                      ? "bg-gray-50 text-gray-300"
                      : "bg-white font-medium text-gray-900 hover:bg-orange-50"
                  }
                  ${option.warning ? "font-semibold text-orange-600" : ""}
                `}
                style={{
                  fontWeight: option.disabled ? "normal" : "500",
                  opacity: option.disabled ? 0.4 : 1,
                }}
              >
                {option.label}
                {option.warning ? " (임박!)" : ""}
                {option.disabled ? " 선택불가" : ""}
              </option>
            ))}
          </select>
        </div>
        {/* 더 명확한 안내 메시지 */}
        {allExceptNoneDisabled && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            <div className="flex items-center gap-2">
              <span className="text-amber-600">⚠️</span>
              <span>
                선택한 시간으로는 알림 설정이 불가능하여{" "}
                <strong>알림 없이 생성</strong>됩니다.
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleSubmit = () => {
    console.log("handleSubmit--entered=======>");
    if (!date) {
      alert("날짜를 선택해주세요.");
      return;
    }

    if (!time) {
      alert("시간을 선택해주세요.");
      return;
    }

    if (!selectedLocation) {
      alert("장소를 선택해주세요.");
      return;
    }

    // Format date and time as ISO string for proper UTC conversion
    const localDateTime = new Date(`${date}T${time}`);
    const now = new Date();

    // // 현재 시간과 선택된 약속 시간 로그 출력 (한국 로컬시간으로)
    // console.log("현재 시간(now, KST):", dayjs(now).format("YYYY-MM-DD HH:mm:ss"));
    // console.log("선택된 약속 시간(localDateTime, KST):", dayjs(localDateTime).format("YYYY-MM-DD HH:mm:ss"));

    // 최종 알림 시간 결정 로직 통합
    let finalalarmTime = alarmTime;

    // 약속시간이 과거인 경우
    if (localDateTime < now) {
      const proceed = confirm(
        "선택하신 약속 시간이 이미 지났습니다.\n그래도 약속을 생성하시겠습니까?\n\n(과거의 약속에는 알림이 설정되지 않습니다)"
      );
      if (!proceed) return;
      finalalarmTime = "알림 없이 생성";
    }
    // 미래 시간이지만 현재 알림 시간이 유효하지 않은 경우
    else if (alarmTime !== "알림 없이 생성") {
      const { isValid } = validatealarmTime(localDateTime, alarmTime);
      if (!isValid) {
        console.log(
          `현재 설정된 알림 시간 "${alarmTime}"이 유효하지 않아 "알림 없이 생성"으로 변경됩니다.`
        );
        const proceed = confirm(
          `현재 약속 시간으로는 "${alarmTime}" 알림을 설정할 수 없습니다.\n알림 없이 약속을 생성하시겠습니까?`
        );
        if (!proceed) return;
        finalalarmTime = "알림 없이 생성";
      }
    }

    // UI 상태도 업데이트 (다음 렌더링을 위해)
    if (finalalarmTime !== alarmTime) {
      setAlarmTime(finalalarmTime);
    }

    const appointmentData = {
      chatRoomId: chatRoomId,
      appointmentTime: localDateTime,
      place: selectedLocation.selectedAddress ?? "Unknown location",
      locationLatitude: selectedLocation.latitude,
      locationLongitude: selectedLocation.longitude,
      alarmTime: finalalarmTime === "알림 없이 생성" ? null : finalalarmTime,
    };

    console.log(
      "CreateAppointment--handleSubmit-appointmentData: ",
      JSON.stringify(appointmentData, null, 2)
    );

    // useMutation을 사용하여 약속 생성 요청
    createMeetup(appointmentData); // 여기서 appointmentData에alarmTime이 포함됨
    // router.back()은 mutation의 onSuccess에서 처리됨
  };

  // useEffect를 사용하여 페이지 진입 시 상태 초기화
  useEffect(() => {
    // chatRoomId가 변경될 때마다 모든 상태를 초기화
    setDate("");
    setTime("");
    setSelectedLocationByAddressInfo(null);
    setAlarmTime("30분 전");
  }, [router.query.chatRoomId]); // chatRoomId가 변경될 때마다 실행

  // 트리거 시간 계산 함수
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

  return (
    <>
      {renderModal()}
      <Layout
        seoTitle={`${otherName}님과의 약속`}
        title={`${otherName}님과의 약속`}
        canGoBack
        backUrl={"back"}
      >
        <div className="flex h-screen flex-col bg-white p-4">
          <div className="mt-6 flex flex-col space-y-6">
            {/* 날짜 */}
            <DatePicker value={date} onChange={(newDate) => setDate(newDate)} />

            {/* 시간 */}
            <TimePicker
              value={time}
              onChange={(newTime) => {
                setTime(newTime);
                // 현재 시간과 선택된 시간 로그 (한국 로컬타임)
                const now = new Date();
                const selectedDateTime = new Date(`${date}T${newTime}`);
                console.log(
                  "현재 시간(now, KST):",
                  dayjs(now).format("YYYY-MM-DD HH:mm:ss")
                );
                console.log(
                  "선택된 약속 시간(localDateTime, KST):",
                  dayjs(selectedDateTime).format("YYYY-MM-DD HH:mm:ss")
                );
                setAlarmTime((prev) => prev); // 상태 변경 트리거 (불필요하면 생략 가능)
              }}
            />

            {/* 장소 */}
            <div className="flex w-full flex-col">
              <div className="flex w-full flex-col space-y-2">
                <div className="flex w-full items-center justify-between">
                  <span className="font-medium text-gray-700">장소</span>
                  {selectedLocation ? (
                    <div className="flex cursor-pointer items-center gap-1">
                      <span className="text-gray-700" onClick={handleOpenModal}>
                        {selectedLocation.selectedAddress}
                      </span>
                      <button
                        onClick={handleClearLocation}
                        className="rounded-full hover:bg-gray-100"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="ml-1 h-5 w-5 text-gray-500"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 011.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="flex cursor-pointer items-center justify-end gap-1">
                      <span className="text-gray-500" onClick={handleOpenModal}>
                        장소 선택
                      </span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="ml-1 h-5 w-5 text-gray-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="9 6 15 12 9 18"></polyline>
                      </svg>
                    </div>
                  )}
                </div>

                {/* 미니 맵 뷰어 - 지도가 선택된 경우에만 표시 */}
                {selectedLocation && (
                  <div className="w-full overflow-hidden rounded-lg shadow-md">
                    <MapViewer
                      lat={selectedLocation.latitude}
                      lng={selectedLocation.longitude}
                      height="300px"
                      zoomLevel={15}
                      name={selectedLocation.selectedAddress ?? undefined}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 알림 시간 */}
            <AlarmTimeSelector
              value={alarmTime}
              onChange={setAlarmTime}
              appointmentTime={new Date(`${date}T${time}`)}
            />
          </div>

          {/* 완료 버튼 */}
          <div className="mt-8">
            <button
              onClick={handleSubmit}
              disabled={status === "pending"}
              className={`w-full py-3 font-medium text-white ${
                status === "pending"
                  ? "bg-gray-400"
                  : "bg-orange-500 hover:bg-orange-600"
              } rounded-md`}
            >
              {status === "pending" ? "처리 중..." : "완료"}
            </button>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default CreateAppointment;
