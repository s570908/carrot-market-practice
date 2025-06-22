import React, { useEffect, useRef, useState } from "react";

type EditMode = "hour" | "minute";
type InputMode = "clock" | "keyboard";

type TimeValue = {
  hour: number;
  minute: number;
};

type TimeDisplaySectionProps = {
  editMode: EditMode; // EditMode 타입 사용
  inputMode: InputMode; // InputMode 타입 사용
  tempTime: TimeValue;
  onEditModeChange: (mode: EditMode) => void; // EditMode 타입으로 변경
  onTimeChange: (time: TimeValue) => void;
  formatDisplayHour: (hour: number) => string;
  formatDisplayMinute: (minute: number) => string;
  onHourInputFocus?: () => void;
  onMinuteInputFocus?: () => void;
  autoFocus?: EditMode; // 자동 포커스할 입력 필드
};

const TimeDisplaySection = ({
  editMode,
  inputMode,
  tempTime,
  onEditModeChange,
  onTimeChange,
  formatDisplayHour,
  formatDisplayMinute,
  onHourInputFocus,
  onMinuteInputFocus,
  autoFocus,
}: TimeDisplaySectionProps) => {
  // ref 추가
  const hourInputRef = useRef<HTMLInputElement>(null);
  const minuteInputRef = useRef<HTMLInputElement>(null);
  // Hour input state
  const [hourValue, setHourValue] = useState("");
  const [hourDisplayValue, setHourDisplayValue] = useState<number | null>(null);
  const [hourPrevValue, setHourPrevValue] = useState("");

  // Minute input state
  const [minuteValue, setMinuteValue] = useState("");
  const [minuteDisplayValue, setMinuteDisplayValue] = useState<number | null>(
    null
  );
  const [minutePrevValue, setMinutePrevValue] = useState("");

  const [inputValues, setInputValues] = useState({
    hour: formatDisplayHour(tempTime.hour), // "01" ~ "12" 형식
    minute: formatDisplayMinute(tempTime.minute), // "00" ~ "59" 형식
  });

  const [isAmSelected, setIsAmSelected] = useState(
    tempTime.hour >= 12 ? false : true
  );

  // 시간 입력 처리
  const correctInput = ({ inputValue }: { inputValue: string }): void => {
    console.log("correctHourInput—inputValue: ", inputValue);

    let valueTmp = inputValue.replace(/[^0-9]/g, "");
    console.log(
      "correctHourInput--initial: value[0], value[1]: ",
      valueTmp[0],
      valueTmp[1]
    );

    let firstDigit = parseInt(valueTmp[0]);
    let secondDigit: number | undefined = parseInt(valueTmp[1]);

    // 2자리 숫자가 12보다 큰 경우 처리
    if (valueTmp.length === 2 && firstDigit * 10 + (secondDigit || 0) > 12) {
      console.log("시간 범위 초과:", firstDigit, secondDigit);
      return;
    }

    // 두 자리 이상 입력 시 앞 두 자리만 사용
    if (valueTmp.length > 2) {
      valueTmp = valueTmp.slice(0, 2);
    }

    // 첫째 자리가 1이고 둘째 자리가 2보다 큰 경우 처리
    if (valueTmp.length === 2) {
      if (firstDigit === 1 && secondDigit > 2) {
        secondDigit = undefined;
        valueTmp = `${firstDigit}`;
      } else {
        valueTmp = `${firstDigit}${secondDigit ?? ""}`;
      }
    }

    if (valueTmp.length === 0) {
      valueTmp = "";
    }

    console.log(
      "correctHourInput--final: value[0], value[1]: ",
      valueTmp[0],
      valueTmp[1]
    );

    if (hourValue.length === 2 && hourPrevValue.length !== 2) {
      setHourPrevValue(hourValue);
    }

    setHourValue(valueTmp);

    // 시간 값이 변경될 때마다 tempTime 업데이트
    const hourNum = parseInt(valueTmp);
    if (!isNaN(hourNum)) {
      // 시간 범위 조정 (0은 12로 변환)
      const isPM = tempTime.hour >= 12;
      let newHour;

      // 12시의 특별 처리
      if (hourNum === 12) {
        newHour = isPM ? 12 : 0;
      } else {
        newHour = isPM ? hourNum + 12 : hourNum;
      }

      // const newHour = isAmSelected ? hourNum : hourNum + 12;
      // console.log("newHour: ", newHour);

      console.log("coorectInput--tempTime: ", tempTime);

      onTimeChange({ ...tempTime, hour: newHour });
    }
  };

  // 분 입력 처리
  const correctMinuteInput = ({ inputValue }: { inputValue: string }): void => {
    console.log("correctMinuteInput—inputValue: ", inputValue);

    let valueTmp = inputValue.replace(/[^0-9]/g, "");
    console.log(
      "correctMinuteInput--initial: value[0], value[1]: ",
      valueTmp[0],
      valueTmp[1]
    );

    let firstDigit = parseInt(valueTmp[0]);
    let secondDigit: number | undefined = parseInt(valueTmp[1]);

    if (valueTmp.length === 2 && firstDigit * 10 + secondDigit > 59) {
      console.log("분 범위 초과:", firstDigit, secondDigit);
      return;
    }

    // 두 자리 이상 입력 시 앞 두 자리만 사용
    if (valueTmp.length > 2) {
      valueTmp = valueTmp.slice(0, 2);
    }

    if (valueTmp.length === 0) {
      valueTmp = "";
    }

    console.log(
      "correctMinuteInput--final: value[0], value[1]: ",
      valueTmp[0],
      valueTmp[1]
    );

    if (minuteValue.length === 2 && minutePrevValue.length !== 2) {
      setMinutePrevValue(minuteValue);
    }

    setMinuteValue(valueTmp);

    // 분 값이 변경될 때마다 tempTime 업데이트
    const minuteNum = parseInt(valueTmp);
    if (!isNaN(minuteNum) && minuteNum >= 0 && minuteNum <= 59) {
      console.log("coorectMinuteInput--tempTime: ", tempTime);
      onTimeChange({ ...tempTime, minute: minuteNum });
    }
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // 숫자만 추출
    let value = inputValue.replace(/[^0-9]/g, "");

    // 빈 입력값 처리
    if (value.length === 0) {
      setInputValues((prev) => ({
        ...prev,
        minute: "",
      }));
      return;
    }

    // 첫째 자리, 둘째 자리 숫자 추출
    const firstDigit = parseInt(value[0]);
    const secondDigit = value.length > 1 ? parseInt(value[1]) : undefined;

    // 입력값이 2자리이고 59보다 큰 경우 처리
    if (value.length === 2 && firstDigit * 10 + (secondDigit || 0) > 59) {
      return; // 유효하지 않은 입력은 무시
    }

    // 두 자리 이상 입력 시 앞 두 자리만 사용
    if (value.length > 2) {
      value = value.slice(0, 2);
    }

    // 첫째 자리가 6 이상인 경우 처리
    if (firstDigit > 5) {
      // value의 첫 자리를 제거하거나 수정
      value = value.length > 1 ? value.slice(1) : "0";
    }

    // 입력값 업데이트
    setInputValues((prev) => ({
      ...prev,
      minute: value,
    }));

    // 실제 분값 업데이트 (숫자로 변환하여 전달)
    const minuteNum = parseInt(value);
    if (!isNaN(minuteNum) && minuteNum >= 0 && minuteNum <= 59) {
      console.log("handleInputChange--tempTime: ", tempTime);
      onTimeChange({ ...tempTime, minute: minuteNum });
    }
  };

  // 입력창에서 포커스가 벗어났을 때 형식 맞추기
  const handleHourBlur = () => {
    // 입력값 형식 맞추기
    const hourNum = parseInt(inputValues.hour);
    if (!isNaN(hourNum)) {
      // 범위 내 값을 형식에 맞게 표시
      const adjustedHour = hourNum === 0 ? 12 : hourNum > 12 ? 12 : hourNum;
      setInputValues((prev) => ({
        ...prev,
        hour: adjustedHour.toString().padStart(2, "0"),
      }));
    } else {
      // 비어있거나 유효하지 않은 값을 기본값으로 설정
      setInputValues((prev) => ({
        ...prev,
        hour: formatDisplayHour(tempTime.hour),
      }));
    }
  };

  // 분 입력창 포커스 해제 처리
  const handleMinuteBlur = () => {
    // 입력값 형식 맞추기
    const minuteNum = parseInt(inputValues.minute);
    if (!isNaN(minuteNum) && minuteNum >= 0 && minuteNum <= 59) {
      setInputValues((prev) => ({
        ...prev,
        minute: minuteNum.toString().padStart(2, "0"),
      }));
    } else {
      // 비어있거나 유효하지 않은 값을 기본값으로 설정
      setInputValues((prev) => ({
        ...prev,
        minute: formatDisplayMinute(tempTime.minute),
      }));
    }
  };

  useEffect(() => {
    const now = new Date();
    let hours = now.getHours();
    if (hours > 12) {
      hours = hours - 12;
    } else if (hours === 0) {
      hours = 12; // 0시는 12시로 표시
    }
    const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;
    setHourValue(formattedHours);
    setHourPrevValue(formattedHours);

    // 분 초기화
    let minutes = now.getMinutes();
    const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
    setMinuteValue(formattedMinutes);
    setMinutePrevValue(formattedMinutes);
  }, []);

  useEffect(() => {
    if (
      hourValue.length === 2 &&
      hourPrevValue.length === 2 &&
      hourValue[1] !== hourPrevValue[1]
    ) {
      const hourNum = parseInt(hourValue, 10);
      if (hourNum >= 0 && hourNum <= 12) {
        console.log(
          "useEffect--hourPrevValue, hourValue: ",
          hourPrevValue,
          hourValue
        );
        handleHourComplete();
      }
    }
    //setPrevValue(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hourValue]);

  useEffect(() => {
    if (
      minuteValue.length === 2 &&
      minutePrevValue.length === 2 &&
      minuteValue[1] !== minutePrevValue[1]
    ) {
      const minuteNum = parseInt(minuteValue, 10);
      if (minuteNum >= 0 && minuteNum <= 59) {
        console.log(
          "useEffect--minutePrevValue, minuteValue: ",
          minutePrevValue,
          minuteValue
        );
        handleMinuteComplete();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minuteValue]);

  const handleHourComplete = () => {
    const hourNum = parseInt(hourValue, 10);
    setHourDisplayValue(isNaN(hourNum) ? null : hourNum);
    setHourPrevValue(hourValue);

    // 분 입력으로 자동 이동
    onEditModeChange("minute");
    // 분 input에 명시적으로 포커스 설정
    setTimeout(() => {
      if (minuteInputRef.current) {
        minuteInputRef.current.focus();
        const length = minuteInputRef.current.value.length;
        minuteInputRef.current.setSelectionRange(length, length);
      }
    }, 0);
  };

  // Handle minute completion (when user finishes typing minute)
  const handleMinuteComplete = () => {
    const minuteNum = parseInt(minuteValue, 10);
    setMinuteDisplayValue(isNaN(minuteNum) ? null : minuteNum);
    setMinutePrevValue(minuteValue);
    console.log(
      "Minute completed. handleMinuteComplete--minuteNum: ",
      minuteNum
    );
  };

  // 12시간제로 표시할 시간 값 계산
  const getDisplayHour = React.useCallback(() => {
    const hour24 = tempTime.hour;
    if (hour24 === 0) return 12; // 0시는 12시로 표시
    if (hour24 > 12) return hour24 - 12; // 13~23시는 1~11시로 표시
    return hour24; // 1~12시는 그대로 표시
  }, [tempTime.hour]);

  useEffect(() => {
    if (inputMode === "keyboard") {
      // 12시간제로 변환
      const hour12 =
        tempTime.hour > 12
          ? tempTime.hour - 12
          : tempTime.hour === 0
          ? 12
          : tempTime.hour;

      const formattedHour = String(hour12).padStart(2, "0");
      const formattedMinute = String(tempTime.minute).padStart(2, "0");

      setHourValue(formattedHour);
      setMinuteValue(formattedMinute);

      console.log(`입력 필드 값 업데이트: ${formattedHour}:${formattedMinute}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMode, inputMode]);

  return (
    <>
      <div className="mb-8 flex h-16 items-start">
        <div className="flex h-full w-full items-start justify-between gap-1">
          {/* 시간 입력/표시 */}
          {inputMode === "clock" ? (
            <span
              className={`flex h-full w-[88px] items-center justify-center rounded text-4xl font-medium transition-colors ${
                editMode === "hour"
                  ? "bg-orange-100 text-orange-500"
                  : "bg-gray-100 text-gray-900"
              }`}
              onClick={() => onEditModeChange("hour")}
            >
              {/* {formatDisplayHour(tempTime.hour)} */}
              {formatDisplayHour(getDisplayHour())}
            </span>
          ) : (
            <div className="flex flex-col items-start">
              <input
                ref={hourInputRef}
                type="text"
                inputMode="numeric" // 모바일에서 숫자 키패드 표시
                autoComplete="off"
                id="hourInput"
                maxLength={2}
                value={hourValue}
                // placeholder={formatDisplayHour(tempTime.hour)}
                onClick={(e) => {
                  // 클릭 시 전체 선택 방지
                  e.preventDefault();
                  const target = e.target as HTMLInputElement;

                  // 입력 필드에 포커스는 유지
                  onEditModeChange("hour");

                  // 전체 선택 상태 제거 및 커서 위치 설정
                  // 이벤트 발생 시점에 바로 실행하면 브라우저의 기본 동작에 의해 다시 선택될 수 있음
                  setTimeout(() => {
                    // 커서를 텍스트 끝에 위치시키기
                    const length = target.value.length;
                    target.setSelectionRange(length, length);
                  }, 0);
                }}
                onFocus={(e) => {
                  // 포커스 시 전체 선택 방지
                  e.preventDefault();

                  // 기존 onFocus 핸들러 호출
                  if (onHourInputFocus) onHourInputFocus();

                  // 전체 선택 상태 제거 및 커서 위치 설정
                  setTimeout(() => {
                    const length = e.target.value.length;
                    e.target.setSelectionRange(length, length);
                  }, 0);
                }}
                // onChange={handleHourChange}
                onChange={(e) => correctInput({ inputValue: e.target.value })}
                // onBlur={handleHourBlur}
                autoFocus={autoFocus === "hour"}
                className={`h-full w-[88px] rounded text-center text-4xl font-medium outline-none transition-colors ${
                  editMode === "hour"
                    ? "border border-orange-500 bg-white text-gray-900 caret-orange-500"
                    : "border-0 bg-gray-100 text-gray-900"
                } focus:border-orange-500 focus:outline-none focus:ring-0`}
              />
              <span className="mt-1 text-xs font-medium text-gray-700">
                시간
              </span>
            </div>
          )}

          <span className="flex h-16 items-center text-4xl">:</span>

          {/* 분 입력/표시 */}
          {inputMode === "clock" ? (
            <span
              className={`flex h-full w-[88px] items-center justify-center rounded text-4xl font-medium transition-colors ${
                editMode === "minute"
                  ? "bg-orange-100 text-orange-500"
                  : "bg-gray-100 text-gray-900"
              }`}
              onClick={() => onEditModeChange("minute")}
            >
              {formatDisplayMinute(tempTime.minute)}
            </span>
          ) : (
            <div className="flex flex-col items-start">
              <input
                ref={minuteInputRef}
                type="text"
                inputMode="numeric" // 모바일에서 숫자 키패드 표시
                autoComplete="off"
                id="minuteInput"
                maxLength={2}
                value={minuteValue}
                onChange={(e) =>
                  correctMinuteInput({ inputValue: e.target.value })
                }
                onClick={(e) => {
                  // 클릭 시 전체 선택 방지
                  e.preventDefault();
                  const target = e.target as HTMLInputElement;

                  // 입력 필드에 포커스는 유지
                  onEditModeChange("minute");

                  // 전체 선택 상태 제거 및 커서 위치 설정
                  setTimeout(() => {
                    const length = target.value.length;
                    target.setSelectionRange(length, length);
                  }, 0);
                }}
                onFocus={(e) => {
                  // 포커스 시 전체 선택 방지
                  e.preventDefault();

                  // 기존 onFocus 핸들러 호출
                  if (onMinuteInputFocus) onMinuteInputFocus();

                  // 전체 선택 상태 제거 및 커서 위치 설정
                  setTimeout(() => {
                    const length = e.target.value.length;
                    e.target.setSelectionRange(length, length);
                  }, 0);
                }}
                // onBlur={handleMinuteBlur}
                autoFocus={autoFocus === "minute"}
                // placeholder={formatDisplayMinute(tempTime.minute)}
                className={`h-full w-[88px] rounded text-center text-4xl font-medium outline-none transition-colors ${
                  editMode === "minute"
                    ? "border border-orange-500 bg-white text-gray-900 caret-orange-500"
                    : "border-0 bg-gray-100 text-gray-900"
                } focus:border-orange-500 focus:outline-none focus:ring-0`}
              />
              <span className="mt-1 text-xs font-medium text-gray-700">분</span>
            </div>
          )}

          {/* 오전/오후 버튼 */}
          <div className="ml-2 flex h-16 flex-col">
            <button
              type="button"
              onClick={() => {
                setIsAmSelected(true);
                console.log("오전 Clicked!!---tempTime: ", tempTime);

                let newHour;

                // 현재 시간이 12시면 0시로 변경, 그 외 12 이상이면 -12
                if (tempTime.hour === 12) {
                  newHour = 0; // 오전 12시는 0시로 변환
                } else if (tempTime.hour > 12) {
                  newHour = tempTime.hour - 12;
                } else {
                  newHour = tempTime.hour; // 이미 오전(0-11)
                }

                onTimeChange({ ...tempTime, hour: newHour });
              }}
              className={`min-w-[48px] flex-1 rounded-t px-3 text-sm transition-colors ${
                isAmSelected
                  ? "bg-orange-500 text-white hover:bg-orange-600"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              오전
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAmSelected(false);
                console.log("오후 Clicked!!---tempTime.hour: ", tempTime.hour);

                // 시간 값이 이미 12인 경우에도 동일한 값을 사용하되, 새 객체를 생성하여 변경을 트리거합니다
                let newHour = tempTime.hour;
                if (tempTime.hour < 12) {
                  newHour = tempTime.hour + 12;
                }
                // 12인 경우는 그대로 유지하지만, 새 객체를 만들어 변경 감지

                let t = { hour: newHour, minute: tempTime.minute };
                console.log("오후 Clicked!!---t: ", t);
                onTimeChange(t);
              }}
              className={`min-w-[48px] flex-1 rounded-b px-3 text-sm transition-colors ${
                !isAmSelected
                  ? "bg-orange-500 text-white hover:bg-orange-600"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              오후
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default TimeDisplaySection;
