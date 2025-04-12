import DatePicker from "@components/DatePicker";
import Layout from "@components/Layout";
import MapModal from "@components/MapModal";
import PlaceSelectionModal from "@components/PlaceSelectionModal";
import TimePicker from "@components/TimePicker";
import { useAwaitableModal } from "@libs/client/useAwaitableModal";
import useUser from "@libs/client/useUser";
import axios from "axios";
import { useRouter } from "next/router";
import { useState } from "react";
import { useQuery } from "react-query";

interface SelectedLocation {
  latitude: number;
  longitude: number;
  address: string;
}

const CreateAppointment = () => {
  const { user } = useUser();
  const router = useRouter();
  const [date, setDate] = useState("");
  const [time, setTime] = useState(() => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  });
  const [selectedLocation, setSelectedLocation] =
    useState<SelectedLocation | null>(null);
  const [alertTime, setAlertTime] = useState("30분 전");

  const chatroomId = Number(router.query.chatroomId); // 숫자로 변환

  const fetchChatRoomData = async (chatroomId: number) => {
    const response = await axios.get(`/api/chat/${chatroomId}`);
    return response.data;
  };

  // React Query로 데이터 가져오기
  const { data, isLoading, error } = useQuery(
    ["chatRoom", chatroomId], // 쿼리 키
    () => fetchChatRoomData(chatroomId), // 채팅방 데이터 API 호출
    {
      enabled: !!chatroomId, // chatroomId가 유효할 때만 실행
    }
  );

  const otherName =
    data?.chatRoomOfSeller?.buyerId === user?.id
      ? data?.chatRoomOfSeller?.seller?.name
      : data?.chatRoomOfSeller?.buyer?.name;

  // 장소 선택 모달 설정
  const { openModal, renderModal } = useAwaitableModal((modal, params) => {
    return (
      <PlaceSelectionModal
        isVisible={modal.isVisible}
        onClose={() => modal.closeWithError("취소됨")}
        onLocationSelect={(latitude, longitude, address) =>
          modal.closeWithResult({ latitude, longitude, address })
        }
      />
    );
  });

  // 장소 선택 버튼 클릭 핸들러
  const handleOpenModal = async () => {
    try {
      // let params = selectedLocation;
      const result = await openModal(null);
      console.log("선택된 위치:", result);

      if (result) {
        setSelectedLocation(result);
      }
    } catch (error) {
      console.log("장소 선택이 취소되었습니다:", error);
    }
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
      place: selectedLocation.address,
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
        <div className="flex h-screen flex-col bg-white p-4">
          <div className="mt-6 flex flex-col space-y-6">
            {/* 날짜 */}
            <DatePicker value={date} onChange={(newDate) => setDate(newDate)} />

            {/* 시간 */}
            <TimePicker value={time} onChange={setTime} />

            {/* 장소 */}
            <div className="flex w-full items-center justify-between">
              <span className="font-medium text-gray-700">장소</span>
              <div className="flex items-center gap-1">
                <span
                  className="cursor-pointer text-gray-500"
                  onClick={handleOpenModal}
                >
                  {selectedLocation ? selectedLocation.address : "장소 선택"}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400"
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
            </div>

            {/* 알림 시간 */}
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">
                약속 전 나에게 알림
              </span>
              <select
                value={alertTime}
                onChange={(e) => setAlertTime(e.target.value)}
                className="w-2/3 rounded-md border border-gray-300 px-3 py-2 text-gray-700"
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
              className="w-full rounded-md bg-orange-500 py-3 font-medium text-white hover:bg-orange-600"
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
