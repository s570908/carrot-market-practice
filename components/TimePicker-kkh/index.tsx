import { useAwaitableModal } from "@libs/client/useAwaitableModal";
import React, { useCallback, useEffect, useState } from "react";
import TimePickerModal from "./TimePickerModal";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/ko";

// dayjs 설정
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("ko");

interface TimePickerProps {
  value?: string;  // "14:30"
  onChange?: (time: string) => void;
}

const TimePicker: React.FC<TimePickerProps> = ({ value, onChange }) => {
  // 시간 문자열 형식 검증 및 변환
  // 간소화된 시간 문자열 형식 변환 함수
  const formatTimeToKorean = (timeString: string | undefined): string => {
    if (!timeString) return "";
    
    try {
      // 이미 HH:mm 형식이면 그대로 반환
      if (timeString.match(/^\d{2}:\d{2}$/)) {
        return timeString;
      }
      
      // dayjs를 사용하여 다양한 형식을 처리
      // 1. 전체 날짜+시간 문자열
      if (timeString.includes("T") || timeString.includes(" ") || 
          timeString.includes("-") || timeString.includes("/")) {
        const parsed = dayjs(timeString).tz("Asia/Seoul");
        if (parsed.isValid()) {
          return parsed.format("HH:mm");
        }
      }
      
      // 2. 시:분(:초) 형식
      if (timeString.includes(":")) {
        const parts = timeString.split(":");
        if (parts.length >= 2) {
          const hours = parseInt(parts[0], 10);
          const minutes = parseInt(parts[1], 10);
          if (!isNaN(hours) && !isNaN(minutes)) {
            return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
          }
        }
      }
      
      // 3. 숫자만 있는 경우 (예: "1430" -> "14:30")
      if (/^\d{3,4}$/.test(timeString)) {
        const timeNum = parseInt(timeString, 10);
        if (!isNaN(timeNum)) {
          const hours = Math.floor(timeNum / 100);
          const minutes = timeNum % 100;
          if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
            return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
          }
        }
      }
      
      // 변환 불가능한 형식은 dayjs로 마지막 시도
      const fallback = dayjs(timeString).tz("Asia/Seoul");
      if (fallback.isValid()) {
        return fallback.format("HH:mm");
      }
      
      // 모든 변환 시도 실패 시 빈 문자열 반환
      return "";
    } catch (error) {
      console.error("시간 포맷팅 오류:", error);
      return "";
    }
  };

  // 부모로부터 받은 value를 검증하고 포맷팅
  const [selectedTime, setSelectedTime] = useState(formatTimeToKorean(value));
  
  // value props가 변경될 때 검증 및 업데이트
  useEffect(() => {
    const formattedTime = formatTimeToKorean(value);
    if (formattedTime !== selectedTime) {
      setSelectedTime(formattedTime);
    }
  }, [value]);
  
  const { openModal, renderModal } = useAwaitableModal((modal, params) => (
    <TimePickerModal
      initialTime={params.initialTime || getCurrentTimeString()}
      onClose={() => modal.closeWithResult("Cancelled")}
      onConfirm={(time) => modal.closeWithResult(time)}
    />
  ));

  // Helper function to get current time in HH:MM format - 한국 시간대 기준
  const getCurrentTimeString = () => {
    return dayjs().tz("Asia/Seoul").format("HH:mm");
  };

  const formatDisplayTime = useCallback((timeString?: string): string => {
    if (!timeString) return "시간 선택";

    try {
      // dayjs로 표준화된 방식으로 시간 포맷팅
      const timeDayjs = dayjs(`2000-01-01T${timeString}`).tz("Asia/Seoul");
      if (!timeDayjs.isValid()) return "시간 선택";
      
      // 한글 locale 설정이 되어 있으므로 "a"로 오전/오후 표시
      return timeDayjs.format("a h시 mm분");
    } catch (error) {
      console.error("시간 표시 변환 오류:", error);
      return "시간 선택";
    }
  }, []);

  const handleTimePickerClick = async () => {
    try {
      const result = await openModal({
        initialTime: selectedTime || undefined,
      });
      
      if (onChange && result !== "Cancelled") {
        // 선택된 시간을 일관된 형식으로 변환
        const formattedTime = formatTimeToKorean(result);
        setSelectedTime(formattedTime);
        onChange(formattedTime);
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
    <div className="flex items-center justify-between w-full">
      {renderModal()}
      <span className="font-medium text-gray-700">시간</span>
      <div className="flex items-center gap-1">
        <span className="text-gray-700">
          {selectedTime ? formatDisplayTime(selectedTime) : "시간 선택"}
        </span>
        <button
          type="button"
          onClick={handleTimePickerClick}
          className="ml-1 text-gray-400 hover:text-gray-600"
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
  );
};

export default TimePicker;
