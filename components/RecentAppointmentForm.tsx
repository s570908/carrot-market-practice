import React from "react";
// 지도 모달 관련 import
//import useAwaitableModal from "@hooks/useAwaitableModal";
import MapModal from "@components/MapModal";
import { useAwaitableModal } from "@/libs/client/useAwaitableModal";
import { TmapAddressInfo } from "@/types";
//import type { TmapAddressInfo } from "@libs/types";

interface RecentAppointment {
  date: string;
  time: string;
  location: string;
  alarm: string;
  latitude?: number;
  longitude?: number;
}

interface Props {
  recent: RecentAppointment;
  onDateSelect: () => void;
  onTimeSelect: () => void;
  onLocationSelect: (location: string, lat?: number, lng?: number) => void;
  onAlarmChange: (value: string) => void;
  alarmOptions: string[];
  onSubmit: () => void;
}

export default function RecentAppointmentForm({
  recent,
  onDateSelect,
  onTimeSelect,
  onLocationSelect,
  onAlarmChange,
  alarmOptions,
  onSubmit,
}: Props) {
  // 지도 모달 훅 사용
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

  // 지도 버튼 클릭 핸들러
  const handleMapClick = async () => {
    const result = await openMapModal({
      latitude: recent.latitude,
      longitude: recent.longitude,
      address: recent.location,
    });
    if (result && result.selectedAddress) {
      onLocationSelect(result.selectedAddress, result.latitude, result.longitude);
    }
  };

  return (
    <div className="px-4 py-6 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <button className="flex-1 text-left" style={{ pointerEvents: "none", background: "none", border: "none" }}>
          <span className="text-gray-700">날짜</span>
          <span className="ml-2 font-semibold">{recent.date || "-"}</span>
        </button>
        <button className="text-orange-500" onClick={onDateSelect}>
          날짜 선택 ▾
        </button>
      </div>
      <div className="flex items-center justify-between mb-4">
        <button className="flex-1 text-left" style={{ pointerEvents: "none", background: "none", border: "none" }}>
          <span className="text-gray-700">시간</span>
          <span className="ml-2 font-semibold">{recent.time || "-"}</span>
        </button>
        <button className="text-orange-500" onClick={onTimeSelect}>
          시간 선택 ▾
        </button>
      </div>
      <div className="flex items-center justify-between mb-2">
        <button className="flex-1 text-left" style={{ pointerEvents: "none", background: "none", border: "none" }}>
          <span className="text-gray-700">장소</span>
          <span className="ml-2 font-semibold">{recent.location || "-"}</span>
        </button>
        <button
          className="text-orange-500"
          onClick={() => onLocationSelect(recent.location, recent.latitude, recent.longitude)}
        >
          장소 선택 ▾
        </button>
      </div>
      {/* 지도 미리보기 및 지도 모달 열기 버튼 */}
      <div className="mb-4">
        <button
          type="button"
          className="w-full py-2 text-center text-blue-600 border rounded"
          onClick={handleMapClick}
        >
          지도에서 위치 보기/선택
        </button>
      </div>
      {renderModal()}
      <div className="mb-6">
        <label className="block mb-1 text-gray-700">약속 알림</label>
        <select
          className="w-full px-2 py-2 border rounded"
          value={recent.alarm}
          onChange={e => onAlarmChange(e.target.value)}
        >
          {alarmOptions.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
      <button
        className="w-full py-3 font-semibold text-white bg-orange-500 rounded"
        onClick={onSubmit}
      >
        완료
      </button>
    </div>
  );
}
