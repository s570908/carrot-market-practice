import React, { useState, useEffect, useRef, useCallback } from "react";

interface TimePickerProps {
  selectedTime?: string;
  onChange: (time: string) => void;
}

function TimePicker({ selectedTime, onChange }: TimePickerProps) {
  const [showModal, setShowModal] = useState(false);
  const [isEditingHour, setIsEditingHour] = useState(true);
  const [isEditingMinute, setIsEditingMinute] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const svgRef = useRef<HTMLDivElement>(null);

  const [tempTime, setTempTime] = useState(() => {
    if (!selectedTime) {
      return { hour: 0, minute: 0 };
    }
    const [hours, minutes] = selectedTime.split(":").map(Number);
    return {
      hour: isNaN(hours) ? 0 : hours,
      minute: isNaN(minutes) ? 0 : minutes,
    };
  });

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const svg = svgRef.current;
      if (!svg) return;

      const rect = svg.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const x = e.clientX - rect.left - centerX;
      const y = e.clientY - rect.top - centerY;
      const angle = (Math.atan2(x, -y) * 180) / Math.PI;
      const normalizedAngle = (angle + 360) % 360;

      if (isEditingHour) {
        const hour = Math.round(normalizedAngle / 30) % 12;
        const currentPeriod = tempTime.hour >= 12;
        const newHour = currentPeriod
          ? hour === 0
            ? 12
            : hour + 12
          : hour === 0
          ? 0
          : hour;
        setTempTime((prev) => ({ ...prev, hour: newHour }));
      } else {
        const minute = Math.round(normalizedAngle / 6) % 60;
        setTempTime((prev) => ({ ...prev, minute }));
      }
    },
    [isDragging, isEditingHour, tempTime.hour]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleMouseMove(e as unknown as MouseEvent);
  };

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

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

  const formatDisplayTime = (hour: number, minute: number): string => {
    const period = hour >= 12 ? "오후" : "오전";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${period} ${String(displayHour).padStart(2, "0")}시 ${String(
      minute
    ).padStart(2, "0")}분`;
  };

  const getHandRotation = (isHour = true): number => {
    if (isHour) {
      const hour = tempTime.hour % 12;
      const minute = tempTime.minute;
      return hour * 30 + minute * 0.5;
    }
    return tempTime.minute * 6;
  };

  return (
    <div className="flex w-full items-center justify-between">
      <span className="font-medium text-gray-700">시간</span>
      <div className="flex items-center gap-1">
        <span className="text-gray-700">
          {formatDisplayTime(tempTime.hour, tempTime.minute)}
        </span>
        <button
          onClick={() => setShowModal(true)}
          className="ml-1 text-gray-400 hover:text-gray-600"
        >
          ▼
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-[320px] overflow-hidden rounded-lg bg-white shadow-lg">
            <div className="p-4">
              <div className="mb-4">
                <span className="text-sm font-medium text-gray-500">
                  시간 선택
                </span>
              </div>
              <div className="flex h-16 items-center">
                <div className="flex h-full w-full items-center justify-between gap-1">
                  <span
                    className={`flex h-full flex-1 cursor-pointer items-center justify-center rounded px-4 text-4xl font-medium transition-colors ${
                      isEditingHour
                        ? "bg-orange-100 text-orange-500"
                        : "bg-gray-100 text-gray-900"
                    }`}
                    onClick={() => {
                      setIsEditingHour(true);
                      setIsEditingMinute(false);
                    }}
                  >
                    {String(
                      tempTime.hour > 12
                        ? tempTime.hour - 12
                        : tempTime.hour === 0
                        ? 12
                        : tempTime.hour
                    ).padStart(2, "0")}
                  </span>
                  <span className="text-4xl">:</span>
                  <span
                    className={`flex h-full flex-1 cursor-pointer items-center justify-center rounded px-4 text-4xl font-medium transition-colors ${
                      isEditingMinute
                        ? "bg-orange-100 text-orange-500"
                        : "bg-gray-100 text-gray-900"
                    }`}
                    onClick={() => {
                      setIsEditingHour(false);
                      setIsEditingMinute(true);
                    }}
                  >
                    {String(tempTime.minute).padStart(2, "0")}
                  </span>
                  <div className="ml-2 flex h-full flex-col">
                    <button
                      onClick={() => {
                        if (tempTime.hour >= 12) {
                          setTempTime((prev) => ({
                            ...prev,
                            hour: prev.hour - 12,
                          }));
                        }
                      }}
                      className={`min-w-[48px] flex-1 rounded-t px-3 text-sm transition-colors ${
                        tempTime.hour < 12
                          ? "bg-orange-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      오전
                    </button>
                    <button
                      onClick={() => {
                        if (tempTime.hour < 12) {
                          setTempTime((prev) => ({
                            ...prev,
                            hour: prev.hour + 12,
                          }));
                        }
                      }}
                      className={`min-w-[48px] flex-1 rounded-b px-3 text-sm transition-colors ${
                        tempTime.hour >= 12
                          ? "bg-orange-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      오후
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="relative mx-auto mb-4 h-[280px] w-[280px]"
              onMouseDown={handleMouseDown}
              ref={svgRef}
            >
              <svg className="h-full w-full" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  className={
                    isEditingHour || isEditingMinute
                      ? "fill-orange-50"
                      : "fill-slate-50"
                  }
                  stroke="#E2E8F0"
                  strokeWidth="1"
                />

                {/* Numbers */}
                {[...Array(isEditingHour ? 12 : 60)].map((_, i) => {
                  const value = isEditingHour ? i + 1 : i * 5;
                  const angle =
                    (value * (isEditingHour ? 30 : 6) * Math.PI) / 180;
                  const x = 50 + 35 * Math.sin(angle);
                  const y = 50 - 35 * Math.cos(angle);
                  const isSelected = isEditingHour
                    ? (tempTime.hour % 12 || 12) === value
                    : Math.abs(tempTime.minute - value) < 3;

                  return (
                    <g
                      key={value}
                      onClick={() => {
                        if (isEditingHour) {
                          const currentPeriod = tempTime.hour >= 12;
                          const newHour = currentPeriod
                            ? value === 12
                              ? 12
                              : value + 12
                            : value === 12
                            ? 0
                            : value;
                          setTempTime((prev) => ({ ...prev, hour: newHour }));
                        } else {
                          setTempTime((prev) => ({ ...prev, minute: value }));
                        }
                      }}
                    >
                      <circle
                        cx={x}
                        cy={y}
                        r="4"
                        fill="transparent"
                        className="cursor-pointer"
                      />
                      <text
                        x={x}
                        y={y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="6"
                        fill={isSelected ? "#F97316" : "#64748B"}
                        className="pointer-events-none select-none"
                      >
                        {isEditingHour ? value : String(value).padStart(2, "0")}
                      </text>
                    </g>
                  );
                })}

                {/* Tick marks */}
                {[...Array(60)].map((_, i) => {
                  const angle = (i * 6 * Math.PI) / 180;
                  const outerRadius = 42;
                  const innerRadius = i % 5 === 0 ? 38 : 40;
                  const x1 = 50 + outerRadius * Math.sin(angle);
                  const y1 = 50 - outerRadius * Math.cos(angle);
                  const x2 = 50 + innerRadius * Math.sin(angle);
                  const y2 = 50 - innerRadius * Math.cos(angle);
                  return (
                    <line
                      key={i}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#CBD5E1"
                      strokeWidth="0.5"
                    />
                  );
                })}

                {/* Selected position circle */}
                <circle
                  cx={
                    50 +
                    30 *
                      Math.sin(
                        ((isEditingHour
                          ? (tempTime.hour % 12) * 30
                          : tempTime.minute * 6) *
                          Math.PI) /
                          180
                      )
                  }
                  cy={
                    50 -
                    30 *
                      Math.cos(
                        ((isEditingHour
                          ? (tempTime.hour % 12) * 30
                          : tempTime.minute * 6) *
                          Math.PI) /
                          180
                      )
                  }
                  r="4"
                  fill="#F97316"
                />

                {/* Hour hand */}
                <line
                  x1="50"
                  y1="50"
                  x2="50"
                  y2="30"
                  stroke={isEditingHour ? "#F97316" : "#94A3B8"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  transform={`rotate(${getHandRotation(true)}, 50, 50)`}
                  onClick={() => {
                    setIsEditingHour(true);
                    setIsEditingMinute(false);
                  }}
                  className="cursor-pointer"
                />

                {/* Minute hand */}
                <line
                  x1="50"
                  y1="50"
                  x2="50"
                  y2="25"
                  stroke={isEditingMinute ? "#F97316" : "#94A3B8"}
                  strokeWidth="1"
                  strokeLinecap="round"
                  transform={`rotate(${getHandRotation(false)}, 50, 50)`}
                  onClick={() => {
                    setIsEditingHour(false);
                    setIsEditingMinute(true);
                  }}
                  className="cursor-pointer"
                />

                <circle cx="50" cy="50" r="1.5" fill="#F97316" />
              </svg>
            </div>

            <div className="flex justify-between border-t p-4">
              <button
                onClick={() => setShowModal(false)}
                className="text-sm font-medium text-orange-500"
              >
                취소
              </button>
              <button
                onClick={() => {
                  onChange(
                    `${String(tempTime.hour).padStart(2, "0")}:${String(
                      tempTime.minute
                    ).padStart(2, "0")}`
                  );
                  setShowModal(false);
                }}
                className="text-sm font-medium text-orange-500"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TimePicker;
