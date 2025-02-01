import React, { useEffect, useMemo, useRef, useState } from "react";

interface CalendarProps {
  onSelectDate: (date: string) => void;
  onClose: () => void;
  selectedDate: string;
}

interface DayInfo {
  date: Date;
  isCurrentMonth: boolean;
}

const Calendar: React.FC<CalendarProps> = ({
  onSelectDate,
  onClose,
  selectedDate: initialDate,
}) => {
  const [showYearSelect, setShowYearSelect] = useState<boolean>(false);
  const [currentDate, setCurrentDate] = useState<Date>(
    () => new Date(initialDate)
  );

  // 임시로 선택된 날짜를 저장하는 상태 추가
  const [tempSelectedDate, setTempSelectedDate] = useState<string>(initialDate);

  // 연도 목록 생성 (1900년부터 2100년까지)
  const years = useMemo(() => {
    const selectedYear = new Date(tempSelectedDate).getFullYear();
    const startYear = 1900;
    const endYear = 2100;
    const years: number[] = [];

    // 현재 연도를 기준으로 위쪽으로 100개의 연도 추가
    for (
      let year = selectedYear;
      year >= Math.max(startYear, selectedYear - 100);
      year--
    ) {
      years.unshift(year);
    }

    // 현재 연도를 기준으로 아래쪽으로 100개의 연도 추가
    for (
      let year = selectedYear + 1;
      year <= Math.min(endYear, selectedYear + 100);
      year++
    ) {
      years.push(year);
    }

    return years;
  }, [tempSelectedDate]);

  const yearListRef = useRef<HTMLDivElement>(null);

  // 연도 선택 모드로 전환될 때 현재 연도가 중앙에 오도록 스크롤 조정
  useEffect(() => {
    if (showYearSelect && yearListRef.current) {
      const container = yearListRef.current;
      const currentYear = new Date(tempSelectedDate).getFullYear();
      const yearElement = container.querySelector(
        `[data-year="${currentYear}"]`
      );

      if (yearElement) {
        const containerHeight = container.clientHeight;
        const yearElementHeight = (yearElement as HTMLElement).offsetHeight;
        const yearElementPosition = (yearElement as HTMLElement).offsetTop;

        // 스크롤 위치를 더 위로 조정하여 선택된 연도가 중앙보다 약간 위에 오도록 함
        const scrollPosition =
          yearElementPosition - (containerHeight - yearElementHeight) / 2 - 80;

        container.scrollTop = Math.max(0, scrollPosition);
      }
    }
  }, [showYearSelect, tempSelectedDate]);

  // 달력에 필요한 전체 칸 수 계산 (이전 달의 날짜 + 현재 달의 날짜)
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );
  const lastDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  );
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 (일요일) ~ 6 (토요일)
  const daysInMonth = lastDayOfMonth.getDate();
  const totalSlots = startDayOfWeek + daysInMonth;
  const totalWeeks = Math.ceil(totalSlots / 7);

  // 달력에 표시할 날짜 배열 생성
  const days: DayInfo[] = [];

  // 이전 달의 날짜들 추가
  const prevMonthLastDay = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    0
  );
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push({
      date: new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1,
        prevMonthLastDay.getDate() - (startDayOfWeek - i - 1)
      ),
      isCurrentMonth: false,
    });
  }

  // 현재 달의 날짜들 추가
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      date: new Date(currentDate.getFullYear(), currentDate.getMonth(), i),
      isCurrentMonth: true,
    });
  }

  // 마지막 주의 남은 칸을 다음 달 날짜로 채우기
  const remainingDays = totalWeeks * 7 - (startDayOfWeek + daysInMonth);
  for (let i = 1; i <= remainingDays; i++) {
    days.push({
      date: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i),
      isCurrentMonth: false,
    });
  }

  const handlePrevMonth = (): void => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );
  };

  const handleNextMonth = (): void => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    );
  };

  const formatSelectedDate = (
    dateString: string
  ): { year: string; date: string } => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    const dayOfWeek = days[date.getDay()];

    return {
      year: `${year}년`,
      date: `${month}월 ${day}일 (${dayOfWeek})`,
    };
  };

  // 모달 외부 클릭 처리
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // 확인 버튼 클릭 시
  const handleConfirm = (): void => {
    onSelectDate(tempSelectedDate);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleOverlayClick}
    >
      <div className="w-[320px] overflow-hidden rounded-lg bg-white shadow-lg">
        {/* 선택된 날짜 헤더 */}
        <div className="bg-orange-500 px-4 py-2 text-white">
          <div
            onClick={() => setShowYearSelect(true)}
            className={`cursor-pointer text-sm ${
              !showYearSelect ? "opacity-80" : ""
            }`}
          >
            {formatSelectedDate(tempSelectedDate).year}
          </div>
          <div
            onClick={() => setShowYearSelect(false)}
            className={`cursor-pointer text-2xl font-medium ${
              showYearSelect ? "opacity-80" : ""
            }`}
          >
            {formatSelectedDate(tempSelectedDate).date}
          </div>
        </div>

        {/* 본문 부분 */}
        <div className="p-4">
          <div className="h-[320px]">
            {showYearSelect ? (
              <div
                ref={yearListRef}
                className="scrollbar-hide h-full overflow-auto"
              >
                {years.map((year) => (
                  <button
                    key={year}
                    data-year={year}
                    onClick={() => {
                      const newDate = new Date(tempSelectedDate);
                      newDate.setFullYear(year);
                      setTempSelectedDate(newDate.toISOString().split("T")[0]);
                      setCurrentDate(newDate);
                      setShowYearSelect(false);
                    }}
                    className={`w-full py-2 text-center text-base
                      ${
                        year === new Date(tempSelectedDate).getFullYear()
                          ? "font-medium text-orange-500"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            ) : (
              <div className="h-full">
                <div className="mb-6 grid grid-cols-7 items-center">
                  <button
                    onClick={handlePrevMonth}
                    className="justify-self-center text-lg text-gray-600"
                  >
                    ＜
                  </button>
                  <span className="col-span-5 text-center text-base font-normal">
                    {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
                  </span>
                  <button
                    onClick={handleNextMonth}
                    className="justify-self-center text-lg text-gray-600"
                  >
                    ＞
                  </button>
                </div>
                <div className="mb-2 grid grid-cols-7 text-center">
                  {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                    <div key={day} className="pb-2 text-sm text-gray-600">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-y-2">
                  {days.map(({ date, isCurrentMonth }, index) => {
                    const dateString = `${date.getFullYear()}-${String(
                      date.getMonth() + 1
                    ).padStart(2, "0")}-${String(date.getDate()).padStart(
                      2,
                      "0"
                    )}`;
                    const isSelected = tempSelectedDate === dateString;

                    return (
                      <button
                        key={index}
                        onClick={() => setTempSelectedDate(dateString)}
                        className={`mx-auto h-8 w-8 rounded-full text-sm
                          ${isCurrentMonth ? "text-gray-800" : "text-gray-300"}
                          ${
                            isSelected
                              ? "bg-orange-500 text-white"
                              : "hover:bg-gray-100"
                          }`}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 버튼 부분 */}
          <div
            className={`flex justify-end gap-2 pt-3 ${
              showYearSelect ? "border-t" : ""
            }`}
          >
            <button
              onClick={onClose}
              className="rounded px-4 py-1 text-sm text-gray-800 hover:bg-gray-100"
            >
              취소
            </button>
            <button
              onClick={handleConfirm}
              className="rounded px-4 py-1 text-sm text-orange-500 hover:bg-orange-50"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DatePicker: React.FC = () => {
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

  const handleSelectDate = (date: string): void => {
    setSelectedDate(date);
  };

  const formatDisplayDate = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    const dayOfWeek = days[date.getDay()];
    return `${date.getMonth() + 1}월 ${date.getDate()}일 ${dayOfWeek}요일`;
  };

  return (
    <div className="flex w-full items-center justify-between">
      <span className="font-medium text-gray-700">날짜</span>
      <div className="flex items-center">
        <span className="text-gray-700">
          {selectedDate ? formatDisplayDate(selectedDate) : "날짜 선택"}
        </span>
        <button
          onClick={() => setShowCalendar(true)}
          className="ml-2 text-gray-400 hover:text-gray-600"
        >
          ▼
        </button>
      </div>

      {showCalendar && (
        <Calendar
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          onClose={() => setShowCalendar(false)}
        />
      )}
    </div>
  );
};

export default DatePicker;
