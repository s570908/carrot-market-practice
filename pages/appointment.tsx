// pages/appointment.tsx

import { useState } from "react";
import { useRouter } from "next/router";

const AppointmentPage = () => {
  const [date, setDate] = useState("11월 9일 토요일");
  const [time, setTime] = useState("오후 4:00");
  const [location, setLocation] = useState("위례포레샤인 카페포레");
  const [reminder, setReminder] = useState("30분 전");

  const router = useRouter();

  const handleComplete = () => {
    // 완료 버튼 클릭 시 동작할 코드 작성
    console.log("약속이 저장되었습니다.");
  };

  return (
    <div className="flex min-h-screen flex-col bg-white p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b pb-4">
        <button onClick={() => router.back()}>
          <span className="text-lg font-semibold">✕</span>
        </button>
        <h1 className="text-lg font-semibold">소이님과 약속</h1>
        <div></div> {/* 오른쪽 공간 확보용 */}
      </div>

      {/* 약속 입력 폼 */}
      <div className="mt-4 flex-1 space-y-6">
        {/* 날짜 선택 */}
        <div className="flex items-center justify-between border-b pb-4">
          <label className="font-medium text-gray-700">날짜</label>
          <div className="flex items-center space-x-2">
            <span className="text-gray-900">{date}</span>
            <button className="text-xl text-gray-500">▾</button>
          </div>
        </div>

        {/* 시간 선택 */}
        <div className="flex items-center justify-between border-b pb-4">
          <label className="font-medium text-gray-700">시간</label>
          <div className="flex items-center space-x-2">
            <span className="text-gray-900">{time}</span>
            <button className="text-xl text-gray-500">▾</button>
          </div>
        </div>

        {/* 장소 선택 */}
        <div className="flex items-center justify-between border-b pb-4">
          <label className="font-medium text-gray-700">장소</label>
          <button className="text-gray-400">장소 선택 ▸</button>
        </div>
        <div className="flex items-center">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
            {location}
          </span>
        </div>

        {/* 약속 전 알림 */}
        <div className="flex items-center justify-between border-b pb-4">
          <label className="font-medium text-gray-700">
            약속 전 나에게 알림
          </label>
          <div className="flex items-center space-x-2">
            <span className="text-gray-900">{reminder}</span>
            <button className="text-xl text-gray-500">▾</button>
          </div>
        </div>
      </div>

      {/* 완료 버튼 */}
      <button
        onClick={handleComplete}
        className="mt-6 w-full rounded bg-orange-500 py-3 text-center font-semibold text-white"
      >
        완료
      </button>
    </div>
  );
};

export default AppointmentPage;
