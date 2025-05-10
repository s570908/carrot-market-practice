import React from "react";
import TimeDisplaySection from "./TimeDisplaySection"; // Add this import statement
import ClockFace from "./ClockFace"; // Add this import statement
import { EditMode, TimeValue } from "../types";

interface ClockModeContentProps {
  editMode: EditMode;
  tempTime: TimeValue;
  onEditModeChange: (mode: EditMode) => void;
  onTimeChange: (time: Partial<TimeValue>) => void;
  formatDisplayHour: (hour: number) => string;
  formatDisplayMinute: (minute: number) => string;
}

const ClockModeContent = ({
  editMode,
  tempTime,
  onEditModeChange,
  onTimeChange,
  formatDisplayHour,
  formatDisplayMinute,
}: ClockModeContentProps) => (
  <>
    <TimeDisplaySection
      editMode={editMode}
      inputMode="clock"
      tempTime={tempTime}
      onEditModeChange={onEditModeChange}
      onTimeChange={onTimeChange}
      formatDisplayHour={formatDisplayHour}
      formatDisplayMinute={formatDisplayMinute}
    />
    <ClockFace
      editMode={editMode}
      tempTime={tempTime}
      showClock={true}
      onTimeChange={onTimeChange}
      onHourChangeIntent={() => onEditModeChange("minute")}
    />
  </>
);

export default ClockModeContent;
