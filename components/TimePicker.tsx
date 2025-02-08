import React, { useState, useEffect, useRef, useCallback } from "react";

interface TimePickerProps {
  selectedTime?: string;
  onChange: (time: string) => void;
}

function TimePicker({ selectedTime, onChange }: TimePickerProps) {
  const [showModal, setShowModal] = useState(false);
  type EditMode = "hour" | "minute";
  const [editMode, setEditMode] = useState<EditMode>("hour");
  // const [isEditingHour, setIsEditingHour] = useState(true);
  // const [isEditingMinute, setIsEditingMinute] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  // 드래그 시작점 좌표 저장을 위한 상태 추가
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null
  );
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

  const handleHourClick = useCallback(
    (value: number) => {
      if (editMode !== "hour") return;

      setTempTime((prevTime) => {
        const isPM = prevTime.hour >= 12;
        let newHour;

        if (value === 12) {
          newHour = isPM ? 12 : 0;
        } else {
          newHour = isPM ? value + 12 : value;
        }

        return {
          ...prevTime,
          hour: newHour,
        };
      });

      // 단일 setState 호출로 모드 전환
      setEditMode("minute");
    },
    [editMode]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !svgRef.current) return;

      const svg = svgRef.current;
      if (!svg) return;

      const rect = svg.getBoundingClientRect();
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
          setTempTime((prev) => ({ ...prev, hour: newHour }));
        }
      } else {
        const minute = Math.round(normalizedAngle / 6) % 60;
        // 현재 분과 다를 때만 업데이트
        if (minute !== tempTime.minute) {
          setTempTime((prev) => ({ ...prev, minute }));
        }
      }
    },
    [isDragging, editMode, tempTime.hour, tempTime.minute]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsDragging(true);
    handleMouseMove(e as unknown as MouseEvent);
  };

  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (dragStart) {
        const dragDistance = Math.sqrt(
          Math.pow(e.clientX - dragStart.x, 2) +
            Math.pow(e.clientY - dragStart.y, 2)
        );

        // 드래그 거리가 작으면 클릭으로 처리
        if (dragDistance < 5) {
          setIsDragging(false);
          setDragStart(null);
          return;
        }
      }

      setIsDragging(false);
      setDragStart(null);
      // 시간 선택 모드에서 드래그가 끝났을 때 분 선택 모드로 전환
      if (editMode === "hour") {
        setEditMode("minute");
      }
    },
    [editMode, dragStart]
  );

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

  useEffect(() => {
    console.log("tempTime updated:", tempTime);
  }, [tempTime]);

  const formatDisplayTime = (hour: number, minute: number): string => {
    const period = hour >= 12 ? "오후" : "오전";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${period} ${String(displayHour).padStart(2, "0")}시 ${String(
      minute
    ).padStart(2, "0")}분`;
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
                      editMode === "hour"
                        ? "bg-orange-100 text-orange-500"
                        : "bg-gray-100 text-gray-900"
                    }`}
                    onClick={() => setEditMode("hour")}
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
                      editMode === "minute"
                        ? "bg-orange-100 text-orange-500"
                        : "bg-gray-100 text-gray-900"
                    }`}
                    onClick={() => setEditMode("minute")}
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
                {/* 배경 원 */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  className="fill-gray-50"
                  stroke="#E2E8F0"
                  strokeWidth="1"
                />

                {editMode === "hour" ? (
                  // 시간 선택 모드 (1-12)
                  [...Array(12)].map((_, i) => {
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
                          // 드래그 중이면 클릭 이벤트 무시
                          if (isDragging) return;

                          e.stopPropagation();
                          handleHourClick(value);
                        }}
                        className="cursor-pointer"
                      >
                        <circle
                          cx={x}
                          cy={y}
                          r="10"
                          className="fill-transparent"
                        />
                        {isSelected && (
                          <circle
                            cx={x}
                            cy={y}
                            r="6"
                            className="fill-orange-500"
                          />
                        )}
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
                  })
                ) : (
                  // 분 선택 모드 (0-55, 5분 단위)
                  <>
                    {/* 선택된 분에 대한 원형 표시 - 모든 분에 대해 적용 */}
                    {(() => {
                      const angle = (tempTime.minute * 6 * Math.PI) / 180;
                      const x = 50 + 35 * Math.sin(angle);
                      const y = 50 - 35 * Math.cos(angle);

                      return (
                        <circle
                          cx={x}
                          cy={y}
                          r="6"
                          className="fill-orange-500"
                        />
                      );
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
                            if (editMode === "minute") {
                              e.stopPropagation(); // 이벤트 버블링 방지 추가
                              // 분 선택 모드일 때만 분 값 변경
                              setTempTime((prev) => ({
                                ...prev,
                                minute: value,
                              }));
                            }
                          }}
                        >
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
                )}

                {/* 시계 바늘 - 현재 편집 모드의 바늘만 표시 */}
                {editMode === "hour" ? (
                  // 시 선택 모드일 때는 시침만 표시
                  <line
                    x1="50"
                    y1="50"
                    x2="50"
                    y2="25"
                    stroke="#F97316"
                    strokeWidth="2"
                    strokeLinecap="round"
                    transform={`rotate(${(tempTime.hour % 12) * 30}, 50, 50)`} // 분에 따른 추가 각도 제거
                    onClick={() => setEditMode("hour")}
                    className="cursor-pointer"
                  />
                ) : (
                  // 분 선택 모드일 때는 분침만 표시
                  <line
                    x1="50"
                    y1="50"
                    x2="50"
                    y2="25"
                    stroke="#F97316"
                    strokeWidth="2"
                    strokeLinecap="round"
                    transform={`rotate(${tempTime.minute * 6}, 50, 50)`}
                    onClick={() => setEditMode("minute")}
                    className="cursor-pointer"
                  />
                )}

                {/* 중심점 */}
                <circle cx="50" cy="50" r="2" className="fill-orange-500" />
              </svg>
            </div>

            <div className="flex justify-between p-4">
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
