import React, { useState, useEffect, useRef, useCallback } from "react";
import ClockModeContent from "./modules/ClockModeContent";
import { InputMode, EditMode, TimeValue } from "./types";
import KeyboardModeContent from "./modules/KeyboardModeContent";

interface TimePickerModalProps {
  initialTime?: string;
  onClose: () => void;
  onConfirm: (time: string) => void;
}

const TimePickerModal: React.FC<TimePickerModalProps> = ({
  initialTime,
  onClose,
  onConfirm,
}) => {
  // 모드 관련 상태
  const [inputMode, setInputMode] = useState<InputMode>("clock");
  const [editMode, setEditMode] = useState<EditMode>("hour");

  // 초기 시간 설정을 안전하게 처리
  const [tempTime, setTempTime] = useState<TimeValue>(() => {
    if (initialTime) {
      const [hours, minutes] = initialTime.split(":").map(Number);
      return {
        hour: isNaN(hours) ? 0 : hours,
        minute: isNaN(minutes) ? 0 : minutes,
      };
    }
    const now = new Date();
    return {
      hour: now.getHours(),
      minute: now.getMinutes(),
    };
  });

  const tempTimeRef = useRef(tempTime);

  // 12시간제로 표시할 시간 값 계산
  const getDisplayHour = (hour24: number) => {
    if (hour24 === 0) return 12; // 0시는 12시로 표시
    if (hour24 > 12) return hour24 - 12; // 13~23시는 1~11시로 표시
    return hour24; // 1~12시는 그대로 표시
  };

  const handleTimeChange = (newTime: any) => {
    //console.log("handleTimeChange--newTime: ", newTime);
    tempTimeRef.current = newTime;
    setTempTime((prev) => ({
      hour: newTime.hour !== undefined ? newTime.hour : prev.hour,
      minute:
        newTime.minute !== undefined
          ? Math.max(0, Math.min(59, newTime.minute)) // 0~59 범위 유지
          : prev.minute,
    }));
  };

  // 시간 표시 포맷팅 함수
  const formatDisplayHour = (hour: number): string => {
    // 시간 값이 undefined나 null이 아닌지 확인
    if (hour === undefined || hour === null) return "00";

    try {
      // 12시간제로 변환해서 표시
      const hour12 = getDisplayHour(hour);
      return String(hour12).padStart(2, "0");
    } catch {
      return "00";
    }
  };

  const formatDisplayMinute = useCallback((minute: number) => {
    // 10보다 작은 숫자는 앞에 0을 붙임
    if (minute < 10) {
      return `0${minute}`;
    }
    return String(minute);
  }, []);

  const handleInputModeToggle = useCallback(() => {
    if (inputMode === "clock") {
      // 현재 editMode 상태를 저장 (시간/분 선택 상태 유지)
      const currentEditMode = editMode;

      // 입력 모드 변경
      setInputMode("keyboard");

      // editMode 상태가 변경되지 않도록 명시적으로 다시 설정
      // 이렇게 하면 시간 영역이 선택된 상태로 키보드 모드로 전환할 때
      // 시간 영역 선택 상태가 유지됩니다
      setEditMode(currentEditMode);

      // 포커스 설정을 위한 시간 지연
      setTimeout(() => {
        // 현재 선택된 영역(시간/분)에 따라 적절한 입력 필드에 포커스 설정
        if (currentEditMode === "hour") {
          const hourInput = document.getElementById("hourInput");
          if (hourInput) {
            hourInput.focus();
            // 커서를 텍스트 끝에 위치시키고 전체 선택 방지
            const length = (hourInput as HTMLInputElement).value.length;
            (hourInput as HTMLInputElement).setSelectionRange(length, length);
          }
        } else {
          const minuteInput = document.getElementById("minuteInput");
          if (minuteInput) {
            minuteInput.focus();
            // 커서를 텍스트 끝에 위치시키고 전체 선택 방지
            const length = (minuteInput as HTMLInputElement).value.length;
            (minuteInput as HTMLInputElement).setSelectionRange(length, length);
          }
        }
      }, 50); // 충분한 시간 지연
    } else {
      setInputMode("clock");
    }
  }, [inputMode, editMode]);

  // 확인 버튼 핸들러
  const handleConfirm = useCallback(() => {
    const currentTempTime = tempTimeRef.current;
    const formattedHour = String(currentTempTime.hour).padStart(2, "0");
    const formattedMinute = formatDisplayMinute(currentTempTime.minute);

    // console.log(
    //   "formattedHour, formattedMinute: ",
    //   `${formattedHour}:${formattedMinute}`
    // );
    onConfirm(`${formattedHour}:${formattedMinute}`);
  }, [formatDisplayMinute, onConfirm]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-[320px] overflow-hidden rounded-lg bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()} // 모달 내부 클릭 이벤트 버블링 방지
      >
        <div className="p-4">
          <div className="mb-4">
            <span className="text-sm font-medium text-gray-500">시간 선택</span>
          </div>
          {inputMode === "clock" ? (
            <ClockModeContent
              editMode={editMode}
              tempTime={tempTime}
              onEditModeChange={setEditMode}
              onTimeChange={handleTimeChange}
              formatDisplayHour={formatDisplayHour}
              formatDisplayMinute={formatDisplayMinute}
            />
          ) : (
            <KeyboardModeContent
              editMode={editMode}
              tempTime={tempTime}
              onEditModeChange={setEditMode}
              onTimeChange={handleTimeChange}
              // hourInputRef={hourInputRef}
              // minuteInputRef={minuteInputRef}
              formatDisplayHour={formatDisplayHour}
              formatDisplayMinute={formatDisplayMinute}
            />
          )}
          {/* 하단 컨트롤 */}
          <div className="flex items-center justify-between border-gray-100">
            <button
              onClick={handleInputModeToggle}
              className="py-2 pl-0 pr-2 text-gray-500 transition-colors hover:text-gray-700"
            >
              {inputMode === "clock" ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
                  <path d="M6 8h.01" />
                  <path d="M10 8h.01" />
                  <path d="M14 8h.01" />
                  <path d="M18 8h.01" />
                  <path d="M8 12h.01" />
                  <path d="M12 12h.01" />
                  <path d="M16 12h.01" />
                  <path d="M7 16h10" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              )}
            </button>
            <div className="flex gap-4">
              <button
                onClick={onClose}
                className="p-2 text-sm font-medium text-gray-500"
              >
                취소
              </button>
              <button
                onClick={handleConfirm}
                className="p-2 text-sm font-medium text-orange-500"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimePickerModal;
