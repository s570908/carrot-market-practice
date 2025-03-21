import { useAwaitableModal } from "@libs/client/useAwaitableModal";
import React, { useCallback, useEffect, useState } from "react";
import TimePickerModal from "./TimePickerModal";

interface TimePickerProps {
  value?: string;
  onChange?: (time: string) => void;
}

const TimePicker: React.FC<TimePickerProps> = ({ value, onChange }) => {
  const { openModal, renderModal } = useAwaitableModal((modal, params) => (
    <TimePickerModal
      initialTime={params.initialTime}
      onClose={() => modal.closeWithResult("Cancelled")}
      onConfirm={(time) => modal.closeWithResult(time)}
    />
  ));

  const formatDisplayTime = useCallback((timeString?: string): string => {
    if (!timeString) return "시간 선택";

    try {
      const [hours, minutes] = timeString.split(":").map(Number);
      if (isNaN(hours) || isNaN(minutes)) return "시간 선택";

      const period = hours >= 12 ? "오후" : "오전";
      const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      return `${period} ${String(displayHour).padStart(2, "0")}시 ${String(
        minutes
      ).padStart(2, "0")}분`;
    } catch {
      return "시간 선택";
    }
  }, []);

  const handleTimePickerClick = async () => {
    try {
      const result = await openModal({
        initialTime: value && /^\d{2}:\d{2}$/.test(value) ? value : undefined,
      });
      console.log("시분 결정 result: ", result);
      if (onChange && result !== "Cancelled") {
        onChange(result);
      }
    } catch (error) {
      if (error === "Cancelled") {
        return;
      }
      console.error("TimePicker Error:", error);
    }
  };

  // 초기 렌더링 시의 hydration 문제를 방지하기 위한 상태 추가
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex w-full items-center justify-between">
      {renderModal()}
      <span className="font-medium text-gray-700">시간</span>
      <div className="flex items-center gap-1">
        <span className="text-gray-700">
          {/* mounted 상태를 체크하여 안전하게 렌더링 */}
          {mounted ? formatDisplayTime(value) : "시간 선택"}
        </span>
        <button
          onClick={handleTimePickerClick}
          className="ml-1 text-gray-400 hover:text-gray-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TimePicker;
