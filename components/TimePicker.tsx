import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface TimePickerProps {
  onChange?: (time: string) => void;
  value?: string;
}

const TimePicker: React.FC<TimePickerProps> = ({ onChange, value }) => {
  // Track whether the time is default or user-selected
  const [isDefaultTime, setIsDefaultTime] = useState(!value);
  const [selectedTime, setSelectedTime] = useState(value || "");
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside the time picker modal
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle time selection
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setIsDefaultTime(false); // Mark as user-selected
    setIsOpen(false);
    onChange?.(time);
  };

  // Generate time options in 30-minute intervals
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute of [0, 30]) {
        const formattedHour = String(hour).padStart(2, "0");
        const formattedMinute = String(minute).padStart(2, "0");
        options.push(`${formattedHour}:${formattedMinute}`);
      }
    }
    return options;
  };

  return (
    <>
      <div className="flex items-center justify-between w-full">
        <span className="font-medium text-gray-700">시간</span>
        <div className="flex items-center">
          <span 
            className={`${isDefaultTime ? 'text-gray-400' : 'text-gray-700'}`}
            onClick={() => setIsOpen(!isOpen)}
          >
            {selectedTime || "시간 선택"}
          </span>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="ml-2 text-gray-400 hover:text-gray-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        </div>
      </div>

      {isOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsOpen(false)}></div>
            <div
              ref={modalRef}
              className="z-50 w-64 overflow-y-auto bg-white rounded-lg shadow-xl max-h-80"
            >
              <div className="p-4 font-medium text-white bg-orange-500">시간 선택</div>
              <div className="p-2">
                {generateTimeOptions().map((time) => (
                  <div
                    key={time}
                    className={`p-2 cursor-pointer hover:bg-gray-100 rounded ${
                      time === selectedTime ? "bg-orange-100" : ""
                    }`}
                    onClick={() => handleTimeSelect(time)}
                  >
                    {time}
                  </div>
                ))}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default TimePicker;
