import { useAwaitableModal } from "@libs/client/useAwaitableModal";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Calendar from "./Calendar-kkh";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/ko";

// dayjs 설정
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("ko");

interface DatePickerProps {
  onChange?: (date: string) => void;
  value?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({ onChange, value }) => {
  // UTC 날짜 문자열을 한국 시간대 기준으로 변환하여 초기값 설정
  const initialDate = value ? convertToKoreanDate(value) : "";
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);

  // UTC 날짜 문자열을 한국 시간대 기준의 날짜 문자열(YYYY-MM-DD)로 변환
  function convertToKoreanDate(utcDateString: string): string {
    return dayjs(utcDateString).tz("Asia/Seoul").format("YYYY-MM-DD");
  }

  // 현재 한국 시간대 기준 날짜 문자열 반환
  const getCurrentDateString = (): string => {
    return dayjs().tz("Asia/Seoul").format("YYYY-MM-DD");
  };

  // value prop이 변경되면 선택된 날짜 업데이트
  useEffect(() => {
    if (value) {
      const koreanDate = convertToKoreanDate(value);
      setSelectedDate(koreanDate);
    }
  }, [value]);

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
      // 한국 시간대 기준 날짜를 선택했으므로 그대로 상위 컴포넌트에 전달
      onChange?.(result);
    } catch (error) {
      console.log("Calendar modal closed:", error);
    }
  };

  // 날짜를 한국어 형식으로 표시 (예: 5월 15일 수요일)
  const formatDisplayDate = (dateString: string): string => {
    if (!dateString) return "";

    try {
      const koreanDate = dayjs(dateString).tz("Asia/Seoul");
      return koreanDate.format("M월 D일 dddd");
    } catch (error) {
      console.error("날짜 포맷팅 오류:", error);
      return "";
    }
  };

  return (
    <>
      {renderCalendarModal()}
      <div
        className="flex items-center justify-between w-full date-picker-container"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <span className="font-medium text-gray-700">날짜</span>
        <div className="flex items-center">
          <span className="text-gray-700">
            {selectedDate ? formatDisplayDate(selectedDate) : "날짜 선택"}
          </span>
          <button
            type="button"
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
