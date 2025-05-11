import React, { useCallback, useEffect, useState } from "react";
import TimeDisplaySection from "./TimeDisplaySection";
import { EditMode, TimeValue } from "../types";

interface KeyboardModeContentProps {
  editMode: EditMode;
  tempTime: TimeValue;
  onEditModeChange: (mode: EditMode) => void;
  onTimeChange: (time: Partial<TimeValue>) => void;
  formatDisplayHour: (hour: number) => string;
  formatDisplayMinute: (minute: number) => string;
}

// Keyboard 입력 모드에서 TimeDisplaySection을 감싸는 컨테이너 역할
const KeyboardModeContent = ({
  editMode,
  tempTime,
  onEditModeChange,
  onTimeChange,
  formatDisplayHour,
  formatDisplayMinute,
}: KeyboardModeContentProps) => {
  // 포커스 상태를 관리하기 위한 로컬 상태
  const [focusedInput, setFocusedInput] = useState<EditMode>(editMode);

  // editMode가 변경될 때 focusedInput 상태도 업데이트
  useEffect(() => {
    // inputMode가 "keyboard"로 변경될 때마다 실행
    if (editMode === "hour") {
      const hourInput = document.getElementById("hourInput");
      if (hourInput) {
        hourInput.focus();
        const length = (hourInput as HTMLInputElement).value.length;
        (hourInput as HTMLInputElement).setSelectionRange(length, length);
      }
    } else if (editMode === "minute") {
      const minuteInput = document.getElementById("minuteInput");
      if (minuteInput) {
        minuteInput.focus();
        const length = (minuteInput as HTMLInputElement).value.length;
        (minuteInput as HTMLInputElement).setSelectionRange(length, length);
      }
    }
  }, [editMode]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Tab") {
        // 분 영역에서 일반 Tab을 누른 경우는 기본 동작(다음 요소로 이동) 허용
        if (editMode === "minute" && !event.shiftKey) {
          return; // 기본 동작 실행 (다음 요소로 이동)
        }

        event.preventDefault();

        if (event.shiftKey) {
          // Shift+Tab은 항상 시간 영역으로 이동
          onEditModeChange("hour");
        } else {
          // 일반 Tab은 시간 영역에서만 분 영역으로 이동
          onEditModeChange("minute");
        }
      }
    },
    [editMode, onEditModeChange]
  );

  // 입력 필드에 포커스를 주는 핸들러
  const handleHourInputFocus = () => {
    onEditModeChange("hour");
    setFocusedInput("hour");
  };

  const handleMinuteInputFocus = () => {
    onEditModeChange("minute");
    setFocusedInput("minute");
  };

  return (
    <div onKeyDown={handleKeyDown}>
      <TimeDisplaySection
        editMode={editMode}
        inputMode="keyboard"
        tempTime={tempTime}
        onEditModeChange={onEditModeChange}
        onTimeChange={onTimeChange}
        formatDisplayHour={formatDisplayHour}
        formatDisplayMinute={formatDisplayMinute}
        autoFocus={focusedInput}
        onHourInputFocus={handleHourInputFocus}
        onMinuteInputFocus={handleMinuteInputFocus}
      />
    </div>
  );
};

export default KeyboardModeContent;
