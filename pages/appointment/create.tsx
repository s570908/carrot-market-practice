import DatePicker from "@components/DatePicker";
import Layout from "@components/Layout";
import MapModal from "@components/MapModal";
import MapViewer from "@components/MapViewer";
import TimePicker from "@components/TimePicker-kkh";
import { useAwaitableModal } from "@libs/client/useAwaitableModal";
import useUser from "@libs/client/useUser";
import axios from "axios";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TmapAddressInfo } from "@/types";
import { ChatMeetupParams, ChatMeetupResponse } from "@/apiLibs/atypes";
import { writeChatMeetup, writeSystemMessage, SYSTEM_MESSAGES } from "@/apiLibs/chats";
import dayjs from "dayjs";

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

  const [selectedLocationByAddressInfo, setSelectedLocationByAddressInfo] = useState<{
    latitude: number;
    longitude: number;
    addressInfo: TmapAddressInfo;
    selectedAddress: string | null;
    locationName: string;
  } | null>(null);

  const selectedLocation = selectedLocationByAddressInfo;
  //console.log("create--Selected location:", selectedLocation);

  const [alertTime, setAlertTime] = useState("30분 전");

  const chatRoomId = Number(router.query.chatRoomId); // 숫자로 변환
  //console.log("CreateAppointment--chatRoomId:", chatRoomId);

  const fetchChatRoomData = async (chatRoomId: number) => {
    const response = await axios.get(`/api/chat/${chatRoomId}`);
    return response.data;
  };

  // React Query로 데이터 가져오기
  const { data, isLoading, error } = useQuery({
    queryKey: ["chatRoom", chatRoomId],
    queryFn: () => fetchChatRoomData(chatRoomId),
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
    mutationFn: writeChatMeetup,
    onSuccess: async (responseData) => {
      //console.log("약속이 성공적으로 생성되었습니다:", responseData);
      
      // Only create system message if appointment time exists
      if (responseData.chatMeetup?.appointmentTime) {
        // 시스템 메시지 추가 - 일반 생성 메시지
        await writeSystemMessage({
          chatRoomId: chatRoomId,
          message: SYSTEM_MESSAGES.APPOINTMENT_CREATED(responseData.chatMeetup.appointmentTime),
          userId: user?.id,
        });
        
        // 알림 메시지 추가 - APPOINTMENT_ALERT에서 반환된 객체 구조 활용
        const appointmentAlertInfo = SYSTEM_MESSAGES.APPOINTMENT_ALERT(alertTime, responseData.chatMeetup.id);
        await writeSystemMessage({
          chatRoomId: chatRoomId,
          message: appointmentAlertInfo.message,
          userId: user?.id,
          meta: appointmentAlertInfo.meta
        });
      }
      
      alert("약속이 생성되었습니다!");
      
      // 페이지A → 채팅방 → 약속생성 → 채팅방 흐름으로 수정
      // 약속 생성 후 채팅방으로 돌아가기 (페이지A로 바로 이동하지 않음)
      router.back(); // 채팅방으로 돌아감 (뒤로가기)
    },
    onError: (error) => {
      console.error("약속 생성 중 오류 발생:", error);
      alert("약속 생성에 실패했습니다.");
    }
  });

  // useAwaitableModal을 사용하여 MapModal 컴포넌트를 렌더링
  // params를 initialLocation으로 전달하여 모달이 열릴 때 초기 위치 정보를 설정
  const { openModal: openMapModal, renderModal } = useAwaitableModal((modal, params) => {
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
        ) => modal.closeWithResult({ latitude, longitude, addressInfo, selectedAddress })}
      />
    );
  });

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
        const { latitude, longitude, addressInfo, selectedAddress, locationName } = result;
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

  const validateAlertTime = (appointmentTime: Date, alertTime: string) => {
    const now = new Date();
    const alertTriggerTime = new Date(appointmentTime);

    // 알림 시간 계산
    switch (alertTime) {
      case "10분 전": alertTriggerTime.setMinutes(alertTriggerTime.getMinutes() - 10); break;
      case "30분 전": alertTriggerTime.setMinutes(alertTriggerTime.getMinutes() - 30); break;
      case "1시간 전": alertTriggerTime.setHours(alertTriggerTime.getHours() - 1); break;
      case "1일 전": alertTriggerTime.setDate(alertTriggerTime.getDate() - 1); break;
    }

    // 알림 시간이 현재 시간과 얼마나 차이나는지 계산 (분 단위)
    const timeDiffInMinutes = Math.floor((alertTriggerTime.getTime() - now.getTime()) / (1000 * 60));

    return {
      isValid: timeDiffInMinutes > 0,
      timeDiffInMinutes,
      alertTriggerTime
    };
  };

  // 알림 시간 선택 컴포넌트를 동적으로 렌더링
  const AlertTimeSelector = ({ value, onChange, appointmentTime }: { 
    value: string;
    onChange: (time: string) => void;
    appointmentTime: Date;
  }) => {
    const alertOptions = [
      { label: "10분 전", value: "10분 전" },
      { label: "30분 전", value: "30분 전" },
      { label: "1시간 전", value: "1시간 전" },
      { label: "1일 전", value: "1일 전" }
    ];

    // 날짜와 시간이 모두 선택되었는지 확인
    const isDateTimeSelected = !isNaN(appointmentTime.getTime());

    // 각 옵션의 유효성을 검사하여 disabled 상태 결정
    const validOptions = alertOptions.map(option => {
      const { isValid, timeDiffInMinutes } = validateAlertTime(appointmentTime, option.value);
      return {
        ...option,
        disabled: isDateTimeSelected ? !isValid : false, // 날짜/시간 미선택시 비활성화하지 않음
        warning: isDateTimeSelected && timeDiffInMinutes < 30 && isValid,
      };
    });

    return (
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-700">약속 전 나에게 알림</span>
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-2/3 px-3 py-2 text-gray-700 border border-gray-300 rounded-md"
          >
            {validOptions.map((option) => (
              <option 
                key={option.value} 
                value={option.value}
                disabled={option.disabled}
                className={`
                  ${option.disabled ? 'text-gray-400' : ''}
                  ${option.warning ? 'text-orange-500' : ''}
                `}
              >
                {option.label}
                {option.warning ? ' (임박!)' : ''}
                {option.disabled ? ' (불가)' : ''}
              </option>
            ))}
          </select>
        </div>
        {isDateTimeSelected && validOptions.every(opt => opt.disabled) && (
          <div className="p-2 text-sm text-red-500 rounded bg-red-50">
            ⚠️ 선택 가능한 알림 시간이 없습니다. 약속 시간을 다시 설정해주세요.
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
    const { isValid, timeDiffInMinutes } = validateAlertTime(localDateTime, alertTime);

    if (!isValid) {
      alert("선택한 알림 시간이 이미 지났거나 너무 임박했습니다. 다른 알림 시간을 선택해주세요.");
      return;
    }

    if (timeDiffInMinutes < 30) {
      const proceed = confirm(
        "알림 시간이 30분 미만으로 남았습니다. 계속 진행하시겠습니까?"
      );
      if (!proceed) return;
    }

    // Updated to use flat location properties
    const appointmentData = {
      chatRoomId: chatRoomId,
      appointmentTime: localDateTime, 
      place: selectedLocation.selectedAddress ?? "Unknown location",
      locationLatitude: selectedLocation.latitude,
      locationLongitude: selectedLocation.longitude,
      alertTime,
    };

    console.log("CreateAppointment--handleSubmit-appointmentData: ", JSON.stringify(appointmentData, null, 2));
    
    // useMutation을 사용하여 약속 생성 요청
    createMeetup(appointmentData);
    // router.back()은 mutation의 onSuccess에서 처리됨
  };

  // useEffect를 사용하여 페이지 진입 시 상태 초기화
  useEffect(() => {
    // chatRoomId가 변경될 때마다 모든 상태를 초기화
    setDate("");
    setTime("");
    setSelectedLocationByAddressInfo(null);
    setAlertTime("30분 전");
  }, [router.query.chatRoomId]); // chatRoomId가 변경될 때마다 실행

  return (
    <>
      {renderModal()}
      <Layout
        seoTitle={`${otherName}님과의 약속`}
        title={`${otherName}님과의 약속`}
        canGoBack
        backUrl={"back"}
      >
        <div className="flex flex-col h-screen p-4 bg-white">
          <div className="flex flex-col mt-6 space-y-6">
            {/* 날짜 */}
            <DatePicker value={date} onChange={(newDate) => setDate(newDate)} />

            {/* 시간 */}
            <TimePicker value={time} onChange={setTime} />

            {/* 장소 */}
            <div className="flex flex-col w-full">
              <div className="flex flex-col w-full space-y-2">
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium text-gray-700">장소</span>
                  {selectedLocation ? (
                    <div className="flex items-center gap-1 cursor-pointer">
                      <span className="text-gray-700" onClick={handleOpenModal}>
                        {selectedLocation.selectedAddress}
                      </span>
                      <button
                        onClick={handleClearLocation}
                        className="rounded-full hover:bg-gray-100"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-5 h-5 ml-1 text-gray-500"
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
                    <div className="flex items-center justify-end gap-1 cursor-pointer">
                      <span className="text-gray-500" onClick={handleOpenModal}>
                        장소 선택
                      </span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5 ml-1 text-gray-400"
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
            <AlertTimeSelector 
              value={alertTime} 
              onChange={setAlertTime}
              appointmentTime={new Date(`${date}T${time}`)}
            />
          </div>

          {/* 완료 버튼 */}
          <div className="mt-8">
            <button
              onClick={handleSubmit}
              disabled={status === "pending"}
              className={`w-full py-3 font-medium text-white ${
                status === "pending" ? "bg-gray-400" : "bg-orange-500 hover:bg-orange-600"
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
