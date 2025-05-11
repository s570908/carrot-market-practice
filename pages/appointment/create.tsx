import DatePicker from "@components/DatePicker";
import Layout from "@components/Layout";
import MapModal from "@components/MapModal";
import MapViewer from "@components/MapViewer";
import TimePicker from "@components/TimePicker-kkh";
import { useAwaitableModal } from "@libs/client/useAwaitableModal";
import useUser from "@libs/client/useUser";
import axios from "axios";
import { useRouter } from "next/router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TmapAddressInfo } from "@/types";

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
  console.log("create--Selected location:", selectedLocation);

  const [alertTime, setAlertTime] = useState("30분 전");

  const chatroomId = Number(router.query.chatroomId); // 숫자로 변환

  const fetchChatRoomData = async (chatroomId: number) => {
    const response = await axios.get(`/api/chat/${chatroomId}`);
    return response.data;
  };

  // React Query로 데이터 가져오기
  const { data, isLoading, error } = useQuery({
    queryKey: ["chatRoom", chatroomId],
    queryFn: () => fetchChatRoomData(chatroomId),
    enabled: !!chatroomId, // chatroomId가 유효할 때만 실행
  });

  const otherName =
    data?.chatRoomOfSeller?.buyerId === user?.id
      ? data?.chatRoomOfSeller?.seller?.name
      : data?.chatRoomOfSeller?.buyer?.name;

  // 장소 선택 모달 설정
  // kkh version
  // const { openModal, renderModal } = useAwaitableModal((modal, params) => {
  //   return (
  //     <PlaceSelectionModal
  //       isVisible={modal.isVisible}
  //       onClose={() => modal.closeWithError("취소됨")}
  //       onLocationSelect={(latitude, longitude, address) =>
  //         modal.closeWithResult({ latitude, longitude, address })
  //       }
  //       initialLocation={params?.initialLocation} // 이전에 선택한 위치 전달
  //     />
  //   );
  // });
  // // 장소 선택 버튼 클릭 핸들러
  // const handleOpenModal = async () => {
  //   try {
  //     // 모달을 열 때 현재 선택된 위치 정보를 전달
  //     const result = await openModal({ initialLocation: selectedLocation });
  //     console.log("선택된 위치:", result);

  //     if (result) {
  //       setSelectedLocation(result);
  //     }
  //   } catch (error) {
  //     console.log("장소 선택이 취소되었습니다:", error);
  //   }
  // };

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
      console.log("openMapModal 직전--location:", selectedLocation);
      const result = await openMapModal(selectedLocation);
      console.log("Modal closed--result: ", result);
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
        console.log("Modal closed without selecting a location.");
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

  const handleSubmit = () => {
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

    const appointmentData = {
      date,
      time,
      place: selectedLocation.selectedAddress,
      location: {
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
      },
      alertTime,
      chatroomId,
    };

    console.log(appointmentData);
    alert("약속이 생성되었습니다!");
    router.push("/chats"); // 완료 후 다른 페이지로 이동
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
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
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
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">
                약속 전 나에게 알림
              </span>
              <select
                value={alertTime}
                onChange={(e) => setAlertTime(e.target.value)}
                className="w-2/3 px-3 py-2 text-gray-700 border border-gray-300 rounded-md"
              >
                <option value="10분 전">10분 전</option>
                <option value="30분 전">30분 전</option>
                <option value="1시간 전">1시간 전</option>
                <option value="1일 전">1일 전</option>
              </select>
            </div>
          </div>

          {/* 완료 버튼 */}
          <div className="mt-8">
            <button
              onClick={handleSubmit}
              className="w-full py-3 font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600"
            >
              완료
            </button>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default CreateAppointment;
