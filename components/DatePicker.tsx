import { useAwaitableModal } from "@libs/client/useAwaitableModal";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
//import Calendar from "./Calendar";
import Calendar from "./Calendar-kkh";

interface DatePickerProps {
  onChange?: (date: string) => void; // 추가됨
  value?: string; // 추가됨
}

const DatePicker: React.FC<DatePickerProps> = ({ onChange, value }) => {
  const [selectedDate, setSelectedDate] = useState<string>(value || "");

  // Get current date string for default Calendar view
  const getCurrentDateString = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // 추가된 useAwaitableModal 사용
  const { openModal: openCalendarModal, renderModal: renderCalendarModal } =
    useAwaitableModal((modal) => {
      return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => modal.closeWithError("backdrop_click")}
          />
          <div className="z-50">
            <Calendar
              selectedDate={selectedDate || getCurrentDateString()}
              onSelectDate={(date) => {
                setSelectedDate(date);
              }}
              onConfirm={(date) => {
                setSelectedDate(date); // 확인 시에도 상태 업데이트
                modal.closeWithResult(date);
              }}
              onCancel={() => modal.closeWithError("cancel")}
            />
          </div>
        </div>,
        document.body // 모달을 body에 직접 마운트
      );
    });

  // 추가된 모달 핸들링 함수
  const handleDateClick = async () => {
    try {
      const result = await openCalendarModal({});
      setSelectedDate(result); // 모달 결과로 상태 업데이트
      onChange?.(result);
    } catch (error) {
      console.log("Calendar modal closed:", error);
    }
  };

  const formatDisplayDate = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    const dayOfWeek = days[date.getDay()];
    return `${date.getMonth() + 1}월 ${date.getDate()}일 ${dayOfWeek}요일`;
  };

  return (
    <>
      {renderCalendarModal()}
      <div className="flex items-center justify-between w-full">
        <span className="font-medium text-gray-700">날짜</span>
        <div className="flex items-center">
          <span className="text-gray-700">
            {selectedDate ? formatDisplayDate(selectedDate) : "날짜 선택"}
          </span>
          <button
            onClick={handleDateClick}
            className="ml-2 text-gray-400 hover:text-gray-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
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
    </>
  );
};

export default DatePicker;
