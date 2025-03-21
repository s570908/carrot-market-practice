import { useState, useCallback, useEffect, RefObject } from "react";

type EditMode = "hour" | "minute";

interface TimeValue {
  hour: number;
  minute: number;
}

interface UseClockDragProps {
  svgRef: RefObject<HTMLDivElement>;
  editMode: EditMode;
  tempTime: TimeValue;
  onTimeChange: (newTime: TimeValue) => void;
  onHourChangeIntent: () => void;
}

const useClockDrag = ({
  svgRef,
  editMode,
  tempTime,
  onTimeChange,
  onHourChangeIntent,
}: UseClockDragProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !svgRef.current) return;

      const rect = svgRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const x = e.clientX - rect.left - centerX;
      const y = e.clientY - rect.top - centerY;
      const angle = (Math.atan2(x, -y) * 180) / Math.PI;
      const normalizedAngle = (angle + 360) % 360;

      if (editMode === "hour") {
        const hour = Math.round(normalizedAngle / 30) % 12;
        const currentPeriod = tempTime.hour >= 12;
        const newHour = currentPeriod
          ? hour === 0
            ? 12
            : hour + 12
          : hour === 0
          ? 0
          : hour;

        // 현재 시간과 다를 때만 업데이트
        if (newHour !== tempTime.hour) {
          onTimeChange({ ...tempTime, hour: newHour });
        }
      } else {
        const minute = Math.round(normalizedAngle / 6) % 60;
        // 현재 분과 다를 때만 업데이트
        if (minute !== tempTime.minute) {
          onTimeChange({ ...tempTime, minute });
        }
      }
    },
    [isDragging, editMode, tempTime, onTimeChange, svgRef]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging && editMode === "hour") {
      // 드래그 종료 후 지연된 모드 전환
    setTimeout(() => {
      onHourChangeIntent();
    }, 200);
    }
    setIsDragging(false);
  }, [isDragging, editMode, onHourChangeIntent]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return {
    isDragging,
    handleMouseDown: (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      // 첫 이동 위치도 처리
      handleMouseMove(e as unknown as MouseEvent);
    },
  };
};

export default useClockDrag;
