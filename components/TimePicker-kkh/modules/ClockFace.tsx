import React, { useRef, useCallback, RefObject, useState } from "react";
import useClockDrag from "../hooks/useClockDrag";

interface TimeValue {
  hour: number;
  minute: number;
}

type EditMode = "hour" | "minute";

interface ClockFaceProps {
  editMode: EditMode;
  tempTime: TimeValue;
  showClock: boolean;
  onTimeChange: (newTime: TimeValue) => void;
  onHourChangeIntent: () => void;
}

const ClockFace: React.FC<ClockFaceProps> = ({
  editMode,
  tempTime,
  showClock,
  onTimeChange,
  onHourChangeIntent,
}) => {
  const svgRef = useRef<HTMLDivElement>(null);

  // useClockDrag 훅 사용
  const clockDrag = useClockDrag({
    svgRef,
    editMode,
    tempTime,
    onTimeChange,
    onHourChangeIntent,
  });

  // 클릭 이벤트 처리 함수
  interface HandleTimeClickProps {
    value: number;
  }

  const [isUpdating, setIsUpdating] = useState(false);

  const handleTimeClick = useCallback(
    ({ value }: HandleTimeClickProps) => {
      if (clockDrag.isDragging) return; // 드래그 중이면 클릭 무시

      if (editMode === "hour") {
        const isPM = tempTime.hour >= 12;
        const newHour =
          value === 12 ? (isPM ? 12 : 0) : isPM ? value + 12 : value;

        setIsUpdating(true);
        onTimeChange({ ...tempTime, hour: newHour });

        // 시간 업데이트가 완료된 후 모드 전환
        setTimeout(() => {
          setIsUpdating(false);
          onHourChangeIntent();
        }, 200);
      } else {
        onTimeChange({ ...tempTime, minute: value });
      }
    },
    [tempTime, onTimeChange, clockDrag.isDragging, editMode, onHourChangeIntent]
  );

  const renderHourMarkers = () => {
    return [...Array(12)].map((_, i) => {
      const value = i + 1;
      const angle = (value * 30 * Math.PI) / 180;
      const x = 50 + 35 * Math.sin(angle);
      const y = 50 - 35 * Math.cos(angle);
      const currentHour12 = tempTime.hour % 12 || 12;
      const isSelected = currentHour12 === value;

      return (
        <g
          key={value}
          onClick={(e) => {
            e.stopPropagation();
            handleTimeClick({ value });
          }}
          className="cursor-pointer"
        >
          <circle cx={x} cy={y} r="16" className="fill-transparent" />
          <circle
            cx={x}
            cy={y}
            r="6"
            className={isSelected ? "fill-orange-500" : "fill-transparent"}
          />
          <text
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={isSelected ? "5" : "4"}
            fill={isSelected ? "#FFFFFF" : "#64748B"}
            className="pointer-events-none select-none"
          >
            {value}
          </text>
        </g>
      );
    });
  };

  const renderMinuteMarkers = () => {
    return (
      <>
        {/* 현재 선택된 분에 대한 원형 표시 */}
        {(() => {
          const angle = (tempTime.minute * 6 * Math.PI) / 180;
          const x = 50 + 35 * Math.sin(angle);
          const y = 50 - 35 * Math.cos(angle);

          return <circle cx={x} cy={y} r="6" className="fill-orange-500" />;
        })()}

        {[...Array(12)].map((_, i) => {
          const value = i * 5;
          const angle = (value * 6 * Math.PI) / 180;
          const x = 50 + 35 * Math.sin(angle);
          const y = 50 - 35 * Math.cos(angle);
          const isSelected = tempTime.minute === value;

          return (
            <g
              key={value}
              onClick={(e) => {
                e.stopPropagation();
                handleTimeClick({ value });
              }}
              className="cursor-pointer"
            >
              <circle cx={x} cy={y} r="16" className="fill-transparent" />
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={isSelected ? "5" : "4"}
                fill={isSelected ? "#FFFFFF" : "#64748B"}
                className="select-none"
              >
                {String(value).padStart(2, "0")}
              </text>
            </g>
          );
        })}
      </>
    );
  };

  const isInsideCircle = useCallback(
    (clientX: number, clientY: number): boolean => {
      if (!svgRef.current) return false;

      const rect = svgRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // 마우스 포인터와 원의 중심 사이의 거리 계산
      const distance = Math.sqrt(
        Math.pow(clientX - centerX, 2) + Math.pow(clientY - centerY, 2)
      );

      // SVG viewBox가 100x100이고 원의 반지름이 45인데, 이를 실제 픽셀 크기로 변환
      const radiusInPixels = (rect.width / 100) * 45;

      return distance <= radiusInPixels;
    },
    []
  );

  return (
    <div
      className={`relative mx-auto mb-4 h-[280px] w-[280px] ${
        showClock ? "block" : "hidden"
      }`}
      ref={svgRef}
    >
      <svg
        className="h-full w-full"
        viewBox="0 0 100 100"
        onMouseDown={clockDrag.handleMouseDown}
      >
        {/* 배경 원 */}
        <circle
          cx="50"
          cy="50"
          r="45"
          className="fill-gray-50" // 모든 모드에서 동일한 배경색 사용
          stroke="#E2E8F0"
          strokeWidth="1"
        />

        {/* 시간/분 마커 */}
        {editMode === "hour" ? renderHourMarkers() : renderMinuteMarkers()}

        {/* 시계 바늘 */}
        <line
          x1="50"
          y1="50"
          x2="50"
          y2="25"
          stroke="#F97316"
          strokeWidth="2"
          strokeLinecap="round"
          transform={`rotate(${
            editMode === "hour"
              ? (tempTime.hour % 12) * 30
              : tempTime.minute * 6
          }, 50, 50)`}
          className="cursor-pointer"
          onMouseDown={(e) => {
            e.stopPropagation();
            clockDrag.handleMouseDown(e);
          }}
        />

        {/* 중심점 */}
        <circle cx="50" cy="50" r="2" className="fill-orange-500" />
      </svg>
    </div>
  );
};

export default ClockFace;
