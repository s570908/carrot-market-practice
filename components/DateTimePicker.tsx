import React, { FC } from "react"; // Ensure React is imported for JSX
import DatePicker from "react-datepicker";
import { cls } from "@libs/utils";
import { ko } from "date-fns/locale"; // 한국어 로케일 추가

interface DateTimePickerProps {
  label?: string;
  error?: string;
  wrapperClassName?: string;
  variant?: "date" | "time";
  selected: Date | null;
  onChange: (date: Date | null) => void;
  placeholderText?: string;
  required?: boolean;
  minDate?: Date;
  locale?: string;
  dateFormat?: string;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({
  label,
  error,
  wrapperClassName,
  variant = "date",
  selected,
  onChange,
  placeholderText,
  required,
  minDate,
  locale = "ko",
  dateFormat,
  ...props
}) => {
  // 기본 dateFormat 설정
  const defaultDateFormat = variant === "time" ? "aa h:mm" : "yyyy년 MM월 dd일 (eee)";

  return (
    <>
      <div className={cls("space-y-2", wrapperClassName || "")}>
        {label && <label className="block mb-1 text-sm font-medium text-gray-700">{label}</label>}
        <div className="relative">
          <DatePicker
            selected={selected}
            onChange={onChange}
            locale={locale === "ko" ? ko : undefined}
            dateFormat={dateFormat || defaultDateFormat}
            placeholderText={placeholderText}
            required={required}
            minDate={minDate}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            calendarClassName="shadow-lg border border-gray-200 rounded-lg p-2 bg-white"
            dayClassName={(date) =>
              date.getDate() === new Date().getDate() &&
              date.getMonth() === new Date().getMonth() &&
              date.getFullYear() === new Date().getFullYear()
                ? "bg-orange-500 text-white rounded-full"
                : "hover:bg-gray-100"
            }
            popperClassName="shadow-lg"
            popperModifiers={[
              {
                name: "offset",
                options: {
                  offset: [0, 10],
                },
                fn: (state) => state,
              },
              {
                name: "preventOverflow",
                options: {
                  rootBoundary: "viewport",
                  tether: false,
                  altAxis: true,
                },
                fn: (state) => state, // Add a no-op function for the 'fn' property
              },
            ]}
            timeClassName={() => "text-orange-500 py-1 hover:bg-gray-100"}
            renderCustomHeader={({
              date,
              decreaseMonth,
              increaseMonth,
              prevMonthButtonDisabled,
              nextMonthButtonDisabled,
            }) => (
              <div className="flex items-center justify-between px-2 py-2">
                <button
                  onClick={decreaseMonth}
                  disabled={prevMonthButtonDisabled}
                  type="button"
                  className="p-1 text-gray-600 transition-colors rounded-full hover:bg-gray-100 disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <div className="text-base font-semibold text-gray-800">
                  {date.toLocaleString("ko-KR", { month: "long", year: "numeric" })}
                </div>
                <button
                  onClick={increaseMonth}
                  disabled={nextMonthButtonDisabled}
                  type="button"
                  className="p-1 text-gray-600 transition-colors rounded-full hover:bg-gray-100 disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            )}
            showPopperArrow={false}
            {...(variant === "time"
              ? {
                  timeFormat: "HH:mm",
                  timeCaption: "시간",
                  timeIntervals: 15,
                  showTimeSelect: true,
                  showTimeSelectOnly: true,
                }
              : {})}
          />

          {variant === "date" && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}

          {variant === "time" && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    </>
  );
};

export default DateTimePicker;
